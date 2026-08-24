import { getAIProvider } from '../ai/provider';
import { FactLockEngine } from '../validators/factLockEngine';
import { ConsistencyValidator } from '../validators/consistencyValidator';
import { formatEngine } from '../engine/formatEngine';

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 CONTENTSPINE AI — FORMAT ENGINE & INTEGRATION SUITE');
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
  console.log('📦 1. UNIT TESTS & AI PROVIDER ABSTRACTION');

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

  // ─── 2. REAL FORMAT ENGINE EXPORTERS & VALIDATORS ────────
  console.log('\n📄 2. REAL FORMAT ENGINE EXPORTERS & VALIDATION');

  // 2.1 Native DOCX Exporter
  try {
    const sampleInput = {
      title: 'Incident Briefing Report',
      subtitle: 'Verified Cyber Advisory',
      sections: [{ heading: 'Summary', paragraphs: ['11 systems compromised on 21 October 2026.'] }],
    };
    const { buffer, mimeType } = await formatEngine.exportDocx(sampleInput);
    const isDocxZip = buffer.slice(0, 2).toString('ascii') === 'PK';
    assert(
      isDocxZip && mimeType.includes('document'),
      'FormatEngine — Real DOCX Binary Exporter',
      `Size: ${buffer.length} bytes, Header: ${buffer.slice(0, 4).toString('hex')}`
    );
  } catch (err: any) {
    assert(false, 'FormatEngine — Real DOCX Binary Exporter', err.message);
  }

  // 2.2 Native PDF Exporter
  try {
    const sampleInput = {
      title: 'Incident Briefing Report',
      subtitle: 'Verified Cyber Advisory',
      sections: [{ heading: 'Summary', paragraphs: ['11 systems compromised on 21 October 2026.'] }],
    };
    const { buffer, mimeType } = await formatEngine.exportPdf(sampleInput);
    const isPdfMagic = buffer.slice(0, 4).toString('ascii') === '%PDF';
    assert(
      isPdfMagic && mimeType === 'application/pdf',
      'FormatEngine — Real PDF Binary Exporter',
      `Size: ${buffer.length} bytes, Header: ${buffer.slice(0, 4).toString('ascii')}`
    );
  } catch (err: any) {
    assert(false, 'FormatEngine — Real PDF Binary Exporter', err.message);
  }

  // 2.3 Native PPTX Exporter
  try {
    const sampleInput = {
      title: 'Incident Presentation',
      slides: [{ title: 'Overview', bulletPoints: ['11 credentials compromised', 'Zero data exfiltrated'] }],
    };
    const { buffer, mimeType } = await formatEngine.exportPptx(sampleInput);
    const isPptxZip = buffer.slice(0, 2).toString('ascii') === 'PK';
    assert(
      isPptxZip && mimeType.includes('presentation'),
      'FormatEngine — Real PPTX Binary Exporter',
      `Size: ${buffer.length} bytes`
    );
  } catch (err: any) {
    assert(false, 'FormatEngine — Real PPTX Binary Exporter', err.message);
  }

  // 2.4 Data Exporters (JSON, CSV, XML, YAML)
  try {
    const jsonRes = formatEngine.exportJson({ title: 'Test', count: 11 });
    const csvRes = formatEngine.exportCsv(['Metric', 'Value'], [['Impacted', '11']]);
    const xmlRes = await formatEngine.exportXml('Report', { Impacted: '11' });
    const yamlRes = formatEngine.exportYaml({ Impacted: '11' });

    const allValid = jsonRes.isValid && csvRes.isValid && xmlRes.isValid && yamlRes.isValid;
    assert(allValid, 'FormatEngine — Data Exporters (JSON, CSV, XML, YAML)', `All valid parsing checks passed`);
  } catch (err: any) {
    assert(false, 'FormatEngine — Data Exporters (JSON, CSV, XML, YAML)', err.message);
  }

  // 2.5 FormatValidator Binary & Syntax Validation
  try {
    const samplePdf = await formatEngine.exportPdf({ title: 'Test', sections: [] });
    const valResult = await formatEngine.validateFormat({
      format: 'PDF',
      content: samplePdf.buffer,
      lockedFacts: [],
    });
    assert(valResult.passed && valResult.fileIntegrityPassed, 'FormatValidator — Binary PDF Integrity Check');
  } catch (err: any) {
    assert(false, 'FormatValidator — Binary PDF Integrity Check', err.message);
  }

  console.log('\n======================================================');
  console.log(`SUMMARY: ${passedTests} PASSED | ${failedTests} FAILED`);
  console.log('======================================================\n');
}

runTestSuite().catch((err) => console.error('TEST SUITE FATAL:', err));
