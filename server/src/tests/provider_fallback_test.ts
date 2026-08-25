import { AIProviderManager } from '../ai/providerManager';
import { providerHealthTracker } from '../services/providerHealthService';
import { ContentSpineData } from '../types';

async function runFallbackTest() {
  console.log('\n======================================================');
  console.log('🧪 AI PROVIDER FALLBACK & CIRCUIT BREAKER TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Initial Circuit Breaker Status
  const status1 = AIProviderManager.getStatus();
  assert(Boolean(status1.activeProvider), 'Circuit Breaker Status Check', `Active: ${status1.activeProvider}`);

  // 2. Simulate Gemini 429 Rate Limit
  providerHealthTracker.recordRateLimit('gemini', 45, 'Simulated 429 Rate Limit Trigger');
  const status2 = AIProviderManager.getStatus('GEMINI');
  assert(
    status2.gemini.status === 'rate_limited' && status2.activeProvider !== 'GEMINI',
    'Gemini 429 Rate Limit Detection & Bypass',
    `Gemini Status: ${status2.gemini.status}, Fallback Active: ${status2.activeProvider}`
  );

  // 3. Fallback Extraction Test (Must NOT call Gemini while Rate Limited)
  const mockSpine: ContentSpineData = {
    summary: 'Test Content Spine for Circuit Breaker Fallback',
    entities: [{ id: 'e1', name: 'SIH Platform', type: 'ORGANIZATION', confidence: 0.99, sourceReference: 'ref' }],
    dates: [{ id: 'd1', key: 'Target Date', value: '2026-08-24', category: 'DATE', isLocked: true, sourceSnippet: 'Target Date 2026-08-24' }],
    numbers: [{ id: 'n1', key: 'Accuracy', value: '99.9%', category: 'NUMBER', isLocked: true, sourceSnippet: 'Accuracy 99.9%' }],
    locations: [],
    events: [],
    risks: [],
    recommendations: [],
    claims: ['Factual accuracy verified across all deliverables.'],
    relationships: [],
    factLocks: [{ id: 'd1', key: 'Target Date', value: '2026-08-24', category: 'DATE', isLocked: true, sourceSnippet: 'Target Date 2026-08-24' }],
  };

  const outputRes = await AIProviderManager.generateOutput(mockSpine, 'EXECUTIVE_SUMMARY', 'EXECUTIVE', 'GEMINI');
  assert(
    outputRes.success && outputRes.provider !== 'GEMINI',
    'Automatic Fallback Generation during Gemini 429',
    `Generated via: ${outputRes.provider}`
  );

  // Reset health tracker
  providerHealthTracker.recordSuccess('gemini');
  const status3 = AIProviderManager.getStatus('GEMINI');
  assert(status3.gemini.status === 'connected', 'Circuit Breaker Recovery on Success', `Status: ${status3.gemini.status}`);

  console.log('\n======================================================');
  console.log(`SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFallbackTest().catch((err) => {
  console.error('FALLBACK TEST FATAL:', err);
  process.exit(1);
});
