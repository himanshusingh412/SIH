import { AudienceProfile, ContentSpineData, InputCategory, OutputType } from '../types';
import { getAIProviderInstance } from './providers/factory';
import { ProviderType } from './providers/types';
import { providerHealthTracker } from '../services/providerHealthService';
import { parseGeminiError } from '../utils/geminiErrorHandler';

export interface NormalizedAIResponse {
  success: boolean;
  provider: string;
  model: string;
  content: string;
  title?: string;
  usage?: any;
  error?: string;
  isFallback?: boolean;
}

export interface CircuitBreakerStatus {
  gemini: { status: string; remainingSeconds?: number; message?: string };
  openai: { status: string; remainingSeconds?: number; message?: string };
  mock: { status: string; message?: string };
  activeProvider: string;
}

export class AIProviderManager {
  private static activeDeduplications = new Map<string, Promise<any>>();

  /**
   * Returns current health & circuit breaker status across providers
   */
  static getStatus(preferredProvider = 'GEMINI'): CircuitBreakerStatus {
    const geminiHealth = providerHealthTracker.getHealth('gemini');
    const openAIHealth = providerHealthTracker.getHealth('openai');
    const mockHealth = providerHealthTracker.getHealth('mock');

    let active = preferredProvider.toUpperCase();
    if (active === 'GEMINI' && geminiHealth.status === 'rate_limited') {
      active = openAIHealth.configured && openAIHealth.status !== 'rate_limited' ? 'OPENAI' : 'MOCK';
    }

    return {
      gemini: {
        status: geminiHealth.status,
        remainingSeconds: geminiHealth.remainingRetrySeconds,
        message: geminiHealth.message,
      },
      openai: {
        status: openAIHealth.status,
        remainingSeconds: openAIHealth.remainingRetrySeconds,
        message: openAIHealth.message,
      },
      mock: {
        status: mockHealth.status,
        message: mockHealth.message,
      },
      activeProvider: active,
    };
  }

  /**
   * Execute Content Spine extraction using fallback chain (Preferred -> Gemini -> OpenAI -> Mock)
   */
  static async extractContentSpine(
    rawText: string,
    category: InputCategory,
    preferredProvider?: string
  ): Promise<{ spine: ContentSpineData; provider: string; model: string }> {
    const dedupeKey = `spine:${category}:${rawText.slice(0, 80)}`;
    if (this.activeDeduplications.has(dedupeKey)) {
      console.log(`[ProviderManager] Deduplicating spine extraction request`);
      return this.activeDeduplications.get(dedupeKey)!;
    }

    const executionPromise = (async () => {
      const providersToTry = this.getFallbackChain(preferredProvider);
      let lastError: any = null;

      for (const pType of providersToTry) {
        // Skip if provider is circuit-broken by active rate limit
        const health = providerHealthTracker.getHealth(pType.toLowerCase());
        if (health.status === 'rate_limited') {
          console.warn(`[CircuitBreaker] Skipping ${pType} (Rate limited for ${health.remainingRetrySeconds}s)`);
          continue;
        }

        try {
          console.log(`[ProviderManager] Attempting Content Spine extraction with provider: ${pType}`);
          const instance = getAIProviderInstance(pType);
          const spine = await instance.extractContentSpine(rawText, category);
          providerHealthTracker.recordSuccess(pType.toLowerCase());

          return {
            spine,
            provider: pType,
            model: instance.name,
          };
        } catch (err: any) {
          lastError = err;
          const rateInfo = parseGeminiError(err);
          if (rateInfo.isRateLimited || err.status === 429 || err.code === 'GEMINI_RATE_LIMITED') {
            console.warn(`[CircuitBreaker] ${pType} hit 429 rate limit (${rateInfo.retryAfterSeconds}s). Switching to next provider.`);
            providerHealthTracker.recordRateLimit(pType.toLowerCase(), rateInfo.retryAfterSeconds, rateInfo.message);
          } else {
            console.warn(`[ProviderManager] ${pType} error: ${err.message}. Trying next fallback provider.`);
            providerHealthTracker.recordError(pType.toLowerCase(), err.message);
          }
        }
      }

      // Final deterministic fallback (Mock)
      console.warn(`[ProviderManager] All primary providers unavailable. Executing deterministic Mock provider fallback.`);
      const mockInstance = getAIProviderInstance('MOCK');
      const spine = await mockInstance.extractContentSpine(rawText, category);
      return {
        spine,
        provider: 'MOCK',
        model: 'Mock AI Deterministic Engine',
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
   * Execute single output generation using fallback chain
   */
  static async generateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    audience: AudienceProfile,
    preferredProvider?: string
  ): Promise<NormalizedAIResponse> {
    const dedupeKey = `output:${outputType}:${audience}:${spine.summary.slice(0, 40)}`;
    if (this.activeDeduplications.has(dedupeKey)) {
      console.log(`[ProviderManager] Deduplicating output generation for ${outputType}`);
      return this.activeDeduplications.get(dedupeKey)!;
    }

    const executionPromise = (async (): Promise<NormalizedAIResponse> => {
      const providersToTry = this.getFallbackChain(preferredProvider);
      let lastError: any = null;

      for (const pType of providersToTry) {
        const health = providerHealthTracker.getHealth(pType.toLowerCase());
        if (health.status === 'rate_limited') {
          console.warn(`[CircuitBreaker] Skipping ${pType} for ${outputType} (Rate limited for ${health.remainingRetrySeconds}s)`);
          continue;
        }

        try {
          console.log(`[ProviderManager] Generating ${outputType} with provider: ${pType}`);
          const instance = getAIProviderInstance(pType);
          const res = await instance.generateOutput(spine, outputType, audience);
          providerHealthTracker.recordSuccess(pType.toLowerCase());

          return {
            success: true,
            provider: pType,
            model: instance.name,
            title: res.title,
            content: res.content,
            isFallback: pType !== (preferredProvider || 'GEMINI').toUpperCase(),
          };
        } catch (err: any) {
          lastError = err;
          const rateInfo = parseGeminiError(err);
          if (rateInfo.isRateLimited || err.status === 429 || err.code === 'GEMINI_RATE_LIMITED') {
            console.warn(`[CircuitBreaker] ${pType} hit 429 during ${outputType} (${rateInfo.retryAfterSeconds}s). Switching to fallback.`);
            providerHealthTracker.recordRateLimit(pType.toLowerCase(), rateInfo.retryAfterSeconds, rateInfo.message);
          } else {
            console.warn(`[ProviderManager] ${pType} error on ${outputType}: ${err.message}. Trying next fallback.`);
            providerHealthTracker.recordError(pType.toLowerCase(), err.message);
          }
        }
      }

      // Final deterministic fallback (Mock)
      console.warn(`[ProviderManager] Using Mock provider for ${outputType}`);
      const mockInstance = getAIProviderInstance('MOCK');
      const res = await mockInstance.generateOutput(spine, outputType, audience);
      return {
        success: true,
        provider: 'MOCK',
        model: 'Mock AI Deterministic Engine',
        title: res.title,
        content: res.content,
        isFallback: true,
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
   * Determine provider attempt chain based on user preference and health status
   */
  private static getFallbackChain(preferredProvider?: string): ProviderType[] {
    const chain: ProviderType[] = [];
    const prefUpper = (preferredProvider || 'GEMINI').toUpperCase() as ProviderType;

    if (['GEMINI', 'OPENAI', 'LLAMA', 'MOCK'].includes(prefUpper)) {
      chain.push(prefUpper);
    }

    if (!chain.includes('GEMINI')) chain.push('GEMINI');
    if (!chain.includes('OPENAI')) chain.push('OPENAI');
    if (!chain.includes('MOCK')) chain.push('MOCK');

    return chain;
  }
}
