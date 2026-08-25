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
  activeProvider: string;
}

export class AIProviderManager {
  private static activeDeduplications = new Map<string, Promise<any>>();

  /**
   * Returns current health & status of authoritative Google Gemini API provider
   */
  static getStatus(): CircuitBreakerStatus {
    const geminiHealth = providerHealthTracker.getHealth('gemini');

    return {
      gemini: {
        status: geminiHealth.status,
        remainingSeconds: geminiHealth.remainingRetrySeconds,
        message: geminiHealth.message,
      },
      activeProvider: 'GEMINI',
    };
  }

  /**
   * Execute Content Spine extraction using authoritative Live Google Gemini API
   */
  static async extractContentSpine(
    rawText: string,
    category: InputCategory
  ): Promise<{ spine: ContentSpineData; provider: string; model: string }> {
    const dedupeKey = `spine:${category}:${rawText.slice(0, 80)}`;
    if (this.activeDeduplications.has(dedupeKey)) {
      console.log(`[ProviderManager] Deduplicating spine extraction request`);
      return this.activeDeduplications.get(dedupeKey)!;
    }

    const executionPromise = (async () => {
      const pType: ProviderType = 'GEMINI';
      const health = providerHealthTracker.getHealth('gemini');

      if (health.status === 'rate_limited' && health.remainingRetrySeconds > 0) {
        const msg = `Gemini is temporarily rate-limited. Retry in ${health.remainingRetrySeconds}s.`;
        console.warn(`[ProviderManager] ${msg}`);
        const err: any = new Error(msg);
        err.status = 429;
        err.code = 'GEMINI_RATE_LIMITED';
        err.retryAfterSeconds = health.remainingRetrySeconds;
        throw err;
      }

      try {
        console.log(`[ProviderManager] Executing Content Spine extraction via Live Gemini API...`);
        const instance = getAIProviderInstance(pType);
        const spine = await instance.extractContentSpine(rawText, category);
        providerHealthTracker.recordSuccess('gemini');

        return {
          spine,
          provider: pType,
          model: instance.name,
        };
      } catch (err: any) {
        const rateInfo = parseGeminiError(err);
        if (rateInfo.isRateLimited || err.status === 429 || err.code === 'GEMINI_RATE_LIMITED') {
          providerHealthTracker.recordRateLimit('gemini', rateInfo.retryAfterSeconds, rateInfo.message);
          const rateErr: any = new Error(`Gemini is temporarily rate-limited. Retry in ${rateInfo.retryAfterSeconds || 30} seconds.`);
          rateErr.status = 429;
          rateErr.code = 'GEMINI_RATE_LIMITED';
          rateErr.retryAfterSeconds = rateInfo.retryAfterSeconds;
          throw rateErr;
        }

        providerHealthTracker.recordError('gemini', err.message);
        throw new Error(`Gemini request failed: ${err.message || 'Unable to process document'}. Please retry.`);
      }
    })();

    this.activeDeduplications.set(dedupeKey, executionPromise);
    try {
      return await executionPromise;
    } finally {
      this.activeDeduplications.delete(dedupeKey);
    }
  }

  /**
   * Execute deliverable output generation using authoritative Live Google Gemini API
   */
  static async generateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    audience: AudienceProfile
  ): Promise<NormalizedAIResponse> {
    const dedupeKey = `output:${outputType}:${audience}:${spine.summary.slice(0, 40)}`;
    if (this.activeDeduplications.has(dedupeKey)) {
      console.log(`[ProviderManager] Deduplicating output generation for ${outputType}`);
      return this.activeDeduplications.get(dedupeKey)!;
    }

    const executionPromise = (async (): Promise<NormalizedAIResponse> => {
      const pType: ProviderType = 'GEMINI';
      const health = providerHealthTracker.getHealth('gemini');

      if (health.status === 'rate_limited' && health.remainingRetrySeconds > 0) {
        const msg = `Gemini is temporarily rate-limited. Retry in ${health.remainingRetrySeconds}s.`;
        console.warn(`[ProviderManager] ${msg}`);
        const err: any = new Error(msg);
        err.status = 429;
        err.code = 'GEMINI_RATE_LIMITED';
        err.retryAfterSeconds = health.remainingRetrySeconds;
        throw err;
      }

      try {
        console.log(`[ProviderManager] Generating ${outputType} via Live Gemini API...`);
        const instance = getAIProviderInstance(pType);
        const res = await instance.generateOutput(spine, outputType, audience);
        providerHealthTracker.recordSuccess('gemini');

        return {
          success: true,
          provider: pType,
          model: instance.name,
          title: res.title,
          content: res.content,
          isFallback: false,
        };
      } catch (err: any) {
        const rateInfo = parseGeminiError(err);
        if (rateInfo.isRateLimited || err.status === 429 || err.code === 'GEMINI_RATE_LIMITED') {
          providerHealthTracker.recordRateLimit('gemini', rateInfo.retryAfterSeconds, rateInfo.message);
          const rateErr: any = new Error(`Gemini is temporarily rate-limited. Retry in ${rateInfo.retryAfterSeconds || 30} seconds.`);
          rateErr.status = 429;
          rateErr.code = 'GEMINI_RATE_LIMITED';
          rateErr.retryAfterSeconds = rateInfo.retryAfterSeconds;
          throw rateErr;
        }

        providerHealthTracker.recordError('gemini', err.message);
        throw new Error(`Gemini generation failed for ${outputType}: ${err.message || 'AI request failed'}. Please retry.`);
      }
    })();

    this.activeDeduplications.set(dedupeKey, executionPromise);
    try {
      return await executionPromise;
    } finally {
      this.activeDeduplications.delete(dedupeKey);
    }
  }
}
