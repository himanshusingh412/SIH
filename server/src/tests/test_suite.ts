import { getAIProvider } from '../ai/provider';
import { FactLockEngine } from '../validators/factLockEngine';
import { ConsistencyValidator } from '../validators/consistencyValidator';

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 SIH 2026 AI PLATFORM — UNIT, INTEGRATION & E2E SUITE');
  console.log('======================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failedTests++;
    }
  }

  // ─── 1. UNIT TESTS ──────────────────────────────────
  console.log('📦 1. UNIT TESTS');

  // 1.1 AI Provider Selection
  try {
    const provider = getAIProvider();
    assert(
      provider.name.includes('Mock') || provider.name.includes('Gemini') || provider.name.includes('OpenAI'),
      'AI Provider Abstraction Layer',
      `Provider: ${provider.name}`
    );
  } catch (err: any) {
    assert(false, 'AI Provider Abstraction Layer', err.message);
  }

  // 1.2 Content Spine Extraction
  try {
    const provider = getAIProvider();
    const spine = await provider.extractContentSpine(
      'Smart India Hackathon 2026 introduced AI Content Engine. Key target date: 2026-08-24. Budget: 500k.',
      'THREAT_INTEL'
    );
    assert(
      Boolean(spine.summary && spine.dates && spine.numbers),
      'Content Spine Extraction Engine',
      `Dates: ${spine.dates.length}, Numbers: ${spine.numbers.length}`
    );
  } catch (err: any) {
    assert(false, 'Content Spine Extraction Engine', err.message);
  }

  // 1.3 Fact Locking Engine
  try {
    const engine = new FactLockEngine();
    const sampleText = 'Ministry of Education verified system uptime of 99.9% on 2026-08-24.';
    const classified = engine.classifyAndLockFacts(sampleText, []);
    const dateFact = classified.find((f) => f.category === 'DATE');
    const numFact = classified.find((f) => f.category === 'NUMBER');
    assert(
      Boolean(dateFact?.isLocked && numFact?.isLocked),
      'Fact Lock Classification & Protection Default',
      `Fact count: ${classified.length}`
    );
  } catch (err: any) {
    assert(false, 'Fact Lock Classification & Protection Default', err.message);
  }

  // 1.4 Consistency Validator — All Pass
  try {
    const validator = new ConsistencyValidator();
    const content = 'Milestone achieved on 2026-08-24. Uptime was 99.9%. Verified by Ministry of Education.';
    const lockedFacts = [
      { key: 'Target Date', value: '2026-08-24', category: 'DATE' },
      { key: 'System Uptime', value: '99.9%', category: 'NUMBER' },
      { key: 'Authority', value: 'Ministry of Education', category: 'ORGANIZATION' },
    ];
    const report = validator.validateOutputAgainstFacts('EXECUTIVE_SUMMARY', content, lockedFacts);
    assert(report.passed && report.consistencyScore === 100, 'Consistency Validator — 100% Immutable Pass', `Score: ${report.consistencyScore}%`);
  } catch (err: any) {
    assert(false, 'Consistency Validator — 100% Immutable Pass', err.message);
  }

  // 1.5 Consistency Validator — Fact Contradiction Detection
  try {
    const validator = new ConsistencyValidator();
    const badContent = 'Milestone achieved on 2026-09-15. Uptime was 99.9%.';
    const lockedFacts = [
      { key: 'Target Date', value: '2026-08-24', category: 'DATE' },
    ];
    const report = validator.validateOutputAgainstFacts('EXECUTIVE_SUMMARY', badContent, lockedFacts);
    assert(!report.passed && report.issues.length > 0 && report.issues[0].severity === 'CRITICAL', 'Consistency Validator — Discrepancy Contradiction Detection', `Found: ${report.issues[0]?.foundValue}`);
  } catch (err: any) {
    assert(false, 'Consistency Validator — Discrepancy Contradiction Detection', err.message);
  }

  // 1.6 Output Generation Engine
  try {
    const provider = getAIProvider();
    const mockSpine = {
      summary: 'Test summary',
      entities: [],
      dates: [],
      numbers: [],
      locations: [],
      events: [],
      risks: [],
      recommendations: [],
      claims: [],
      relationships: [],
      factLocks: [],
    };
    const out = await provider.generateOutput(mockSpine, 'EXECUTIVE_SUMMARY', 'EXECUTIVE');
    assert(Boolean(out.title && out.content), 'AI Output Generation Engine', `Title: ${out.title.substring(0, 30)}`);
  } catch (err: any) {
    assert(false, 'AI Output Generation Engine', err.message);
  }

  // ─── 2. INTEGRATION TESTS ───────────────────────────
  console.log('\n🔗 2. INTEGRATION TESTS (API Server)');
  const baseUrl = 'http://localhost:5001/api';

  let testProjectId = '';
  let testDocId = '';

  // 2.1 Project Creation Integration
  try {
    const res = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Integration Test Suite Project', description: 'Testing API Integration' }),
    });
    const json = await res.json();
    testProjectId = json.data?.project?.id;
    assert(res.status === 201 && Boolean(testProjectId), 'Integration — Create Project', `Status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Integration — Create Project', err.message);
  }

  // 2.2 Upload & Ingestion Integration
  try {
    const res = await fetch(`${baseUrl}/projects/${testProjectId}/source`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'THREAT_INTEL',
        rawText: 'SIH 2026 Integration Threat Report. Summary: Smart India Hackathon verified 99.9% accuracy on 2026-08-24.',
      }),
    });
    const json = await res.json();
    testDocId = json.data?.documentId;
    assert(res.status === 201 && Boolean(testDocId), 'Integration — Document Upload & Ingestion', `DocID: ${testDocId}`);
  } catch (err: any) {
    assert(false, 'Integration — Document Upload & Ingestion', err.message);
  }

  // 2.3 Process & Content Spine Integration
  try {
    const res = await fetch(`${baseUrl}/projects/${testProjectId}/process`, { method: 'POST' });
    const json = await res.json();
    assert(res.status === 200 && Boolean(json.data?.spine), 'Integration — Process & Build Content Spine');
  } catch (err: any) {
    assert(false, 'Integration — Process & Build Content Spine', err.message);
  }

  // 2.4 Multi-Output Generation Integration
  try {
    const res = await fetch(`${baseUrl}/projects/${testProjectId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outputTypes: ['EXECUTIVE_SUMMARY', 'LINKEDIN_POST', 'X_THREAD', 'ADVISORY', 'PRESENTATION', 'INFOGRAPHIC', 'VIDEO_PACKAGE'],
        audience: 'EXECUTIVE',
      }),
    });
    const json = await res.json();
    assert(res.status === 200 && json.data?.outputs?.length === 7, 'Integration — Multi-Output Generation (7 Deliverables)', `Count: ${json.data?.outputs?.length}`);
  } catch (err: any) {
    assert(false, 'Integration — Multi-Output Generation (7 Deliverables)', err.message);
  }

  // 2.5 Validation Integration
  try {
    const res = await fetch(`${baseUrl}/projects/${testProjectId}/validation`);
    const json = await res.json();
    assert(res.status === 200 && json.data?.report?.consistencyScore !== undefined, 'Integration — Project Validation Report');
  } catch (err: any) {
    assert(false, 'Integration — Project Validation Report', err.message);
  }

  // ─── 3. E2E FULL FLOW TEST ───────────────────────────
  console.log('\n🔄 3. END-TO-END FULL WORKFLOW TEST');
  console.log('  Flow: Create Project → Upload → Process → Content Spine → Select Formats → Generate → Validate → Review → Export Package');

  try {
    // Export endpoint test
    const expRes = await fetch(`${baseUrl}/projects/${testProjectId}/export`);
    const expJson = await expRes.json();
    const validExport = expRes.status === 200 && expJson.data?.jsonPackage?.deliverables?.length === 7;
    assert(validExport, 'E2E — Full Lifecycle Complete & Export Bundle Generated', `Deliverables: ${expJson.data?.jsonPackage?.deliverables?.length}`);
  } catch (err: any) {
    assert(false, 'E2E — Full Lifecycle Complete & Export Bundle Generated', err.message);
  }

  console.log('\n======================================================');
  console.log(`SUMMARY: ${passedTests} PASSED | ${failedTests} FAILED`);
  console.log('======================================================\n');
}

runTestSuite().catch((err) => console.error('TEST SUITE FATAL:', err));
