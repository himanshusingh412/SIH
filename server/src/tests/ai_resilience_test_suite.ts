/**
 * AI Resilience Test Suite — network-free.
 *
 * Covers the pieces that decide whether an upload survives a bad Gemini day:
 * error classification, the pacing gate, provider health transitions, and the
 * composition of the fallback chain.
 *
 *   npm run test:resilience
 */
import { parseGeminiError } from '../utils/geminiErrorHandler';
import { RequestThrottle } from '../utils/aiThrottle';
import { providerHealthTracker } from '../services/providerHealthService';
import { AIProviderManager } from '../ai/providerManager';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

async function run() {
  console.log('\n======================================================');
  console.log('🧪 AI RESILIENCE — RATE LIMIT & FALLBACK TEST SUITE');
  console.log('======================================================\n');

  console.log('1. Error classification');
  const rl = parseGeminiError(
    new Error('[GoogleGenerativeAI Error]: [429 Too Many Requests] You have exceeded your rate limit. Please retry in 43.123s.')
  );
  assert(rl.isRateLimited && rl.code === 'GEMINI_RATE_LIMITED', '429 detected');
  assert(rl.retryAfterSeconds === 44, 'retry delay parsed from prose', String(rl.retryAfterSeconds));

  const structured = parseGeminiError(new Error('RESOURCE_EXHAUSTED {"retryDelay":"12s"}'));
  assert(structured.isRateLimited && structured.retryAfterSeconds === 12, 'retryDelay parsed from RetryInfo block');

  const notFound = parseGeminiError(
    new Error('[404 Not Found] models/gemini-3.1-flash-lite is not found for API version v1beta')
  );
  assert(
    notFound.isModelNotFound && !notFound.isRateLimited && !notFound.isRetryable,
    'unknown model is not misreported as a rate limit'
  );

  const auth = parseGeminiError(new Error('[400] API key not valid. Please pass a valid API key.'));
  assert(auth.isAuthError && !auth.isRetryable, 'invalid key classified as configuration error');

  const overloaded = parseGeminiError(new Error('[503 Service Unavailable] The model is overloaded.'));
  assert(overloaded.isRetryable && !overloaded.isRateLimited, '503 retryable but not rate-limited');

  const network = parseGeminiError(new Error('fetch failed'));
  assert(network.isRetryable, 'network failure is retryable');

  const leaky = parseGeminiError(
    new Error('failed https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyFAKE')
  );
  assert(!leaky.message.includes('AIzaSyFAKE') && !leaky.message.includes('googleapis.com'), 'secrets/URLs sanitized');

  console.log('\n2. Request pacing gate');
  const throttle = new RequestThrottle('test', 200, 5000);
  const starts: number[] = [];
  await Promise.all([1, 2, 3].map(() => throttle.run(async () => void starts.push(Date.now()))));
  const gaps = starts.slice(1).map((v, i) => v - starts[i]);
  assert(gaps.every((g) => g >= 190), 'concurrent callers are spaced apart', JSON.stringify(gaps));

  throttle.penalize(1);
  assert(throttle.isCoolingDown() && throttle.intervalMs > 200, 'a 429 widens spacing and starts a cooldown');

  const budgetErr: any = await throttle.run(async () => 'never', Date.now() + 50).catch((e) => e);
  assert(budgetErr?.code === 'AI_BUDGET_EXCEEDED', 'pacing respects the caller time budget');

  console.log('\n3. Provider health transitions');
  providerHealthTracker.recordRateLimit('gemini', 43, 'simulated 429');
  const limited = providerHealthTracker.getHealth('gemini');
  assert(limited.status === 'rate_limited' && (limited.remainingRetrySeconds || 0) > 0, 'rate-limited state recorded');

  console.log('\n4. Fallback chain composition');
  const limitedStatus = AIProviderManager.getStatus();
  assert(limitedStatus.gemini.status === 'rate_limited', 'status surfaces the Gemini cooldown');
  assert(limitedStatus.activeProvider !== 'GEMINI', 'a rate-limited Gemini is bypassed', limitedStatus.activeProvider);
  assert(
    limitedStatus.chain[limitedStatus.chain.length - 1] === 'MOCK',
    'the offline deterministic engine is always the last resort',
    limitedStatus.chain.join(' → ')
  );

  AIProviderManager.resetGeminiCircuit();
  const recovered = AIProviderManager.getStatus();
  assert(recovered.gemini.status === 'connected', 'circuit reset clears the cooldown');

  console.log('\n======================================================');
  console.log(`SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('AI RESILIENCE TEST FATAL:', err);
  process.exit(1);
});
