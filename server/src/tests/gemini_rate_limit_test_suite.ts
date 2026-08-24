import { parseGeminiError } from '../utils/geminiErrorHandler';
import { providerHealthTracker } from '../services/providerHealthService';
import { agentService } from '../services/agentService';

async function runGeminiRateLimitTestSuite() {
  console.log('🧪 Starting Gemini 429 Quota & Rate Limit Handling Test Suite...\n');

  // Test 1: Rate limit error parsing with regex seconds extraction
  console.log('1. Testing parseGeminiError helper...');
  const sample429GoogleErr = new Error(
    '[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent: [429 Too Many Requests] You have exceeded your rate limit. Please retry in 43.123s.'
  );

  const parsedRateLimit = parseGeminiError(sample429GoogleErr);
  if (!parsedRateLimit.isRateLimited || parsedRateLimit.code !== 'GEMINI_RATE_LIMITED') {
    throw new Error('❌ Failed: parseGeminiError did not detect GEMINI_RATE_LIMITED.');
  }
  if (parsedRateLimit.retryAfterSeconds !== 44 && parsedRateLimit.retryAfterSeconds !== 43) {
    throw new Error(`❌ Failed: Expected retryAfterSeconds ~43-44, got ${parsedRateLimit.retryAfterSeconds}`);
  }
  if (parsedRateLimit.message.includes('generativelanguage.googleapis.com')) {
    throw new Error('❌ Failed: Raw Google internal URL was not sanitized from message.');
  }
  console.log(`  ✅ 429 Error parsed cleanly: code="${parsedRateLimit.code}", retryAfterSeconds=${parsedRateLimit.retryAfterSeconds}s\n`);

  // Test 2: Provider health tracker state management
  console.log('2. Testing ProviderHealthTracker state transitions...');
  const initialHealth = providerHealthTracker.getHealth('gemini');
  console.log(`  Initial state: status="${initialHealth.status}", model="${initialHealth.model}"`);

  providerHealthTracker.recordRateLimit('gemini', 43, 'Gemini is temporarily rate-limited.');
  const rateLimitedHealth = providerHealthTracker.getHealth('gemini');
  if (rateLimitedHealth.status !== 'rate_limited' || !rateLimitedHealth.remainingRetrySeconds) {
    throw new Error(`❌ Failed: Expected rate_limited status, got ${rateLimitedHealth.status}`);
  }
  console.log(`  ✅ Rate Limited state verified: status="${rateLimitedHealth.status}", remainingSeconds=${rateLimitedHealth.remainingRetrySeconds}s`);

  providerHealthTracker.recordSuccess('gemini');
  const connectedHealth = providerHealthTracker.getHealth('gemini');
  if (connectedHealth.status !== 'connected') {
    throw new Error(`❌ Failed: Expected connected status after success, got ${connectedHealth.status}`);
  }
  console.log(`  ✅ Connected state verified: status="${connectedHealth.status}"\n`);

  // Test 3: Zero-Facts Guardrail Check (Requirement 22 & 23)
  console.log('3. Testing Zero-Facts Guardrail (No Gemini API call when 0 facts exist)...');
  const emptyRes = await agentService.askKnowledgeAgent('non-existent-empty-project-id-12345', 'What is the date?');
  const errCode = (emptyRes as any)?.error?.code || (emptyRes as any)?.code;
  if (emptyRes.success !== false || errCode !== 'NO_KNOWLEDGE_CONTEXT') {
    console.log('Diagnostic emptyRes:', JSON.stringify(emptyRes, null, 2));
    throw new Error(`❌ Failed: Zero-facts query should return NO_KNOWLEDGE_CONTEXT. Got: ${JSON.stringify(emptyRes)}`);
  }
  console.log(`  ✅ Zero-Facts guardrail passed: code="${errCode}", message="${(emptyRes as any).error?.message}"\n`);

  console.log('🎉 ALL GEMINI RATE LIMIT & QUOTA HANDLING TESTS PASSED SUCCESSFULLY!');
}

runGeminiRateLimitTestSuite().catch((err) => {
  console.error('❌ Gemini Rate Limit Test Suite Failed:', err);
  process.exit(1);
});
