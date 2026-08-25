import { config } from '../config';
import { AudienceProfile, ContentSpineData, InputCategory, OutputType } from '../types';
import { getAIProviderInstance } from './providers/factory';
import { AICallOptions, AIProviderInstance, ProviderType } from './providers/types';
import { providerHealthTracker } from '../services/providerHealthService';
import { parseGeminiError } from '../utils/geminiErrorHandler';
import { createDeadline, geminiThrottle, isExpired, PIPELINE_BUDGET_MS } from '../utils/aiThrottle';

export interface NormalizedAIResponse {
  success: boolean;
  provider: string;
  model: string;
  content: string;
  title?: string;
  usage?: any;
  error?: string;
  /** True when the content came from a provider other than the preferred one. */
  isFallback: boolean;
  /** Human-readable reason the preferred provider was skipped/failed. */
  degradedReason?: string;
  rateLimited?: boolean;
  retryAfterSeconds?: number;
}

export interface SpineExtractionResult {
  spine: ContentSpineData;
  provider: string;
  model: string;
  isFallback: boolean;
  degradedReason?: string;
  rateLimited?: boolean;
  retryAfterSeconds?: number;
}

export interface CircuitBreakerStatus {
  gemini: { status: string; remainingSeconds?: number; message?: string };
  activeProvider: string;
  fallbackEnabled: boolean;
  chain: string[];
}

/** Fallback is on by default; set AI_ALLOW_FALLBACK=false to fail loudly instead. */
const FALLBACK_ENABLED = process.env.AI_ALLOW_FALLBACK !== 'false';

/**
 * How long we are willing to sit inside an active provider cooldown before
 * skipping to the next provider. Short blips are worth waiting out; a 30s
 * quota window is not.
 */
const MAX_COOLDOWN_WAIT_MS = Math.max(0, Number(process.env.AI_MAX_COOLDOWN_WAIT_MS) || 5000);

type ChainEntry = { type: ProviderType; instance: AIProviderInstance };

export class AIProviderManager {
  private static activeDeduplications = new Map<string, Promise<any>>();

  private static normalize(preferred?: string | ProviderType | null): ProviderType | null {
    if (!preferred) return null;
    const upper = String(preferred).toUpperCase();
    const known: ProviderType[] = ['MOCK', 'GEMINI', 'OPENAI', 'BEDROCK', 'LLAMA'];
    return known.includes(upper as ProviderType) ? (upper as ProviderType) : null;
  }

  /** A provider is usable only when its credentials/endpoint actually exist. */
  private static isConfigured(type: ProviderType): boolean {
    switch (type) {
      case 'MOCK':
        return true;
      case 'GEMINI':
        return Boolean(config.aiApiKey || config.geminiApiKey);
      case 'OPENAI':
        return Boolean(config.openaiApiKey);
      case 'BEDROCK':
        return Boolean(config.bedrockApiKey);
      case 'LLAMA':
        return Boolean(process.env.LLAMA_BASE_URL || process.env.OLLAMA_BASE_URL);
      default:
        return false;
    }
  }

  /** Seconds left on an active cooldown for this provider (0 when healthy). */
  private static cooldownSeconds(type: ProviderType): number {
    if (type === 'MOCK') return 0;
    const health = providerHealthTracker.getHealth(type.toLowerCase());
    if (health.status !== 'rate_limited') return 0;
    return health.remainingRetrySeconds ?? 0;
  }

  /**
   * Ordered provider chain: preferred → Gemini → other configured providers →
   * deterministic offline engine. MOCK is always last so the pipeline can
   * always produce a deliverable rather than dropping the user's upload.
   */
  private static buildChain(preferred?: string | ProviderType | null): ChainEntry[] {
    const wanted = this.normalize(preferred);
    const order: ProviderType[] = [];
    const push = (type: ProviderType | null) => {
      if (type && !order.includes(type)) order.push(type);
    };

    push(wanted);
    push('GEMINI');
    push('BEDROCK');
    push('OPENAI');
    push('LLAMA');

    const chain = order
      .filter((type) => this.isConfigured(type))
      .map((type) => ({ type, instance: getAIProviderInstance(type) }));

    if (FALLBACK_ENABLED || chain.length === 0) {
      chain.push({ type: 'MOCK' as ProviderType, instance: getAIProviderInstance('MOCK') });
    }

    return chain;
  }

  /**
   * Current health & the provider that would actually serve the next request.
   */
  static getStatus(preferred?: string | ProviderType): CircuitBreakerStatus {
    const geminiHealth = providerHealthTracker.getHealth('gemini');
    const chain = this.buildChain(preferred);
    const active =
      chain.find((entry) => this.cooldownSeconds(entry.type) <= 0) || chain[chain.length - 1];

    return {
      gemini: {
        status: geminiHealth.status,
        remainingSeconds: geminiHealth.remainingRetrySeconds,
        message: geminiHealth.message,
      },
      activeProvider: active ? active.type : 'MOCK',
      fallbackEnabled: FALLBACK_ENABLED,
      chain: chain.map((entry) => entry.type),
    };
  }

  /** Clears a stale Gemini cooldown so a recovered key is retried promptly. */
  static resetGeminiCircuit(): void {
    providerHealthTracker.recordSuccess('gemini');
    geminiThrottle.reset();
  }

  /**
   * Classifies a provider failure. The classifier is Gemini-shaped but its
   * status/quota detection is generic, so only the *wording* is provider-specific.
   */
  private static describeError(
    err: any,
    provider: ProviderType
  ): { message: string; rateLimited: boolean; retryAfterSeconds: number } {
    const info = parseGeminiError(err);
    let message: string;

    if (err?.code === 'AI_BUDGET_EXCEEDED') {
      message = 'Upstream time budget exhausted.';
    } else if (provider === 'GEMINI') {
      message = info.message;
    } else if (info.isRateLimited) {
      message = `${provider} is temporarily rate-limited.`;
    } else {
      message = String(err?.message || `${provider} request could not be completed.`)
        .replace(/https?:\/\/[^\s]+/g, '[API Endpoint]')
        .replace(/key=[\w-]+/gi, 'key=[redacted]')
        .slice(0, 180);
    }

    return {
      message,
      rateLimited: info.isRateLimited || err?.status === 429,
      retryAfterSeconds: info.retryAfterSeconds || err?.retryAfterSeconds || 0,
    };
  }

  /**
   * Walks the provider chain until one succeeds. Only throws when fallback is
   * explicitly disabled and every provider failed.
   */
  private static async runChain<T>(
    label: string,
    preferred: string | ProviderType | undefined,
    options: AICallOptions | undefined,
    run: (entry: ChainEntry, opts: AICallOptions) => Promise<T>
  ): Promise<{ value: T; entry: ChainEntry; isFallback: boolean; degradedReason?: string; rateLimited: boolean; retryAfterSeconds: number }> {
    const chain = this.buildChain(preferred);
    const deadlineAt = options?.deadlineAt ?? createDeadline(PIPELINE_BUDGET_MS);
    const primary = chain[0]?.type;

    let degradedReason: string | undefined;
    let rateLimited = false;
    let retryAfterSeconds = 0;
    let lastError: any;

    for (const entry of chain) {
      const cooldown = this.cooldownSeconds(entry.type);
      if (cooldown > 0 && cooldown * 1000 > MAX_COOLDOWN_WAIT_MS) {
        const reason = `${entry.type} is rate-limited (retry in ${cooldown}s).`;
        console.warn(`[ProviderManager] ${label}: skipping ${entry.type} — ${reason}`);
        degradedReason = degradedReason || reason;
        rateLimited = true;
        retryAfterSeconds = Math.max(retryAfterSeconds, cooldown);
        continue;
      }

      if (entry.type !== 'MOCK' && isExpired(deadlineAt)) {
        const reason = 'Request time budget exhausted before the AI provider responded.';
        console.warn(`[ProviderManager] ${label}: ${reason} Falling back.`);
        degradedReason = degradedReason || reason;
        continue;
      }

      try {
        console.log(`[ProviderManager] ${label} via ${entry.type}...`);
        const value = await run(entry, { deadlineAt });
        if (entry.type !== 'MOCK') providerHealthTracker.recordSuccess(entry.type.toLowerCase());

        const isFallback = entry.type !== primary;
        if (isFallback) {
          console.warn(`[ProviderManager] ${label} served by fallback provider ${entry.type}. ${degradedReason || ''}`);
        }
        return { value, entry, isFallback, degradedReason, rateLimited, retryAfterSeconds };
      } catch (err: any) {
        lastError = err;
        const described = this.describeError(err, entry.type);
        degradedReason = degradedReason || `${entry.type}: ${described.message}`;
        if (described.rateLimited) {
          rateLimited = true;
          retryAfterSeconds = Math.max(retryAfterSeconds, described.retryAfterSeconds);
          providerHealthTracker.recordRateLimit(
            entry.type.toLowerCase(),
            described.retryAfterSeconds || 30,
            described.message
          );
        } else {
          providerHealthTracker.recordError(entry.type.toLowerCase(), described.message);
        }
        console.warn(`[ProviderManager] ${label}: ${entry.type} failed — ${described.message}`);
      }
    }

    const err: any = new Error(
      rateLimited
        ? `All AI providers are rate-limited. Retry in ${retryAfterSeconds || 30} seconds.`
        : `AI generation failed: ${degradedReason || lastError?.message || 'no provider available'}.`
    );
    err.status = rateLimited ? 429 : 503;
    err.code = rateLimited ? 'GEMINI_RATE_LIMITED' : 'AI_UNAVAILABLE';
    err.retryAfterSeconds = retryAfterSeconds || undefined;
    throw err;
  }

  /**
   * Content Spine extraction with the full fallback chain.
   */
  static async extractContentSpine(
    rawText: string,
    category: InputCategory,
    preferred?: string | ProviderType,
    options?: AICallOptions
  ): Promise<SpineExtractionResult> {
    const dedupeKey = `spine:${category}:${preferred || 'auto'}:${rawText.slice(0, 80)}`;
    const inFlight = this.activeDeduplications.get(dedupeKey);
    if (inFlight) {
      console.log('[ProviderManager] Deduplicating in-flight spine extraction request');
      return inFlight;
    }

    const executionPromise = (async (): Promise<SpineExtractionResult> => {
      const result = await this.runChain(
        'Content Spine extraction',
        preferred,
        options,
        (entry, opts) => entry.instance.extractContentSpine(rawText, category, opts)
      );

      return {
        spine: result.value,
        provider: result.entry.type,
        model: result.entry.instance.name,
        isFallback: result.isFallback,
        degradedReason: result.isFallback ? result.degradedReason : undefined,
        rateLimited: result.rateLimited,
        retryAfterSeconds: result.retryAfterSeconds || undefined,
      };
    })();

    this.activeDeduplications.set(dedupeKey, executionPromise);
    try {
      return await executionPromise;
    } finally {
      this.activeDeduplications.delete(dedupeKey);
    }
  }

  /**
   * Deliverable generation with the full fallback chain.
   */
  static async generateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    audience: AudienceProfile,
    preferred?: string | ProviderType,
    options?: AICallOptions
  ): Promise<NormalizedAIResponse> {
    const dedupeKey = `output:${outputType}:${audience}:${preferred || 'auto'}:${(spine.summary || '').slice(0, 40)}`;
    const inFlight = this.activeDeduplications.get(dedupeKey);
    if (inFlight) {
      console.log(`[ProviderManager] Deduplicating in-flight output generation for ${outputType}`);
      return inFlight;
    }

    const executionPromise = (async (): Promise<NormalizedAIResponse> => {
      const result = await this.runChain(
        `Deliverable ${outputType}`,
        preferred,
        options,
        (entry, opts) => entry.instance.generateOutput(spine, outputType, audience, opts)
      );

      return {
        success: true,
        provider: result.entry.type,
        model: result.entry.instance.name,
        title: result.value.title,
        content: result.value.content,
        isFallback: result.isFallback,
        degradedReason: result.isFallback ? result.degradedReason : undefined,
        rateLimited: result.rateLimited,
        retryAfterSeconds: result.retryAfterSeconds || undefined,
      };
    })();

    this.activeDeduplications.set(dedupeKey, executionPromise);
    try {
      return await executionPromise;
    } finally {
      this.activeDeduplications.delete(dedupeKey);
    }
  }
}
