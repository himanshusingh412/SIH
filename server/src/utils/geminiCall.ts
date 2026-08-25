import { parseGeminiError } from './geminiErrorHandler';
import { geminiThrottle, PROVIDER_CALL_BUDGET_MS, withTimeout } from './aiThrottle';
import { providerHealthTracker } from '../services/providerHealthService';

const MAX_RETRIES = Math.max(1, Number(process.env.GEMINI_MAX_RETRIES) || 3);
const MAX_BACKOFF_MS = Math.max(1000, Number(process.env.GEMINI_MAX_BACKOFF_MS) || 8000);

/**
 * Shared gate for Gemini calls made outside the provider chain (chat agent,
 * resume extraction, resume optimizer). Every upstream call in the process goes
 * through the same throttle, so one feature's burst cannot exhaust the quota
 * that the ingestion pipeline depends on.
 *
 * Paces, retries transient/429 failures with honest backoff, and keeps the
 * shared provider-health state accurate. Throws a classified error on give-up.
 */
export async function callGemini<T>(
  fn: () => Promise<T>,
  label = 'Gemini request',
  options?: { deadlineAt?: number; maxRetries?: number }
): Promise<T> {
  const maxRetries = Math.max(1, options?.maxRetries || MAX_RETRIES);
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const value = await geminiThrottle.run(
        () => withTimeout(fn(), PROVIDER_CALL_BUDGET_MS, label),
        options?.deadlineAt
      );
      geminiThrottle.reward();
      providerHealthTracker.recordSuccess('gemini');
      return value;
    } catch (err: any) {
      lastError = err;
      const info = parseGeminiError(err);

      if (info.isRateLimited) {
        geminiThrottle.penalize(info.retryAfterSeconds);
        providerHealthTracker.recordRateLimit('gemini', info.retryAfterSeconds, info.message);
      } else if (!info.isRetryable) {
        providerHealthTracker.recordError('gemini', info.message);
      }

      if (!info.isRetryable || attempt >= maxRetries) break;

      const suggested = info.retryAfterSeconds > 0 ? info.retryAfterSeconds * 1000 : 2 ** attempt * 500;
      const backoffMs = Math.min(suggested, MAX_BACKOFF_MS);
      if (options?.deadlineAt && Date.now() + backoffMs > options.deadlineAt) break;

      console.warn(`[Gemini] ${label}: ${info.code}. Retry ${attempt}/${maxRetries} in ${backoffMs}ms.`);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError || new Error('Gemini is currently unavailable.');
}
