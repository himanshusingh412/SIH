import assert from 'assert';
import { candidateSpineParser, CandidateContentSpine } from '../engine/resumeEngine/candidateSpine';
import { jobSpineParser } from '../engine/resumeEngine/jobSpine';
import { atsScoringEngine } from '../engine/resumeEngine/atsEngine';
import { resumeOptimizer } from '../engine/resumeEngine/resumeOptimizer';
import { resumeFactLockEngine } from '../engine/resumeEngine/resumeFactLock';
import { resumeExporters } from '../engine/resumeEngine/resumeExporters';

async function runResumeTestSuite() {
  console.log('🧪 Starting Part 15 — Resume Intelligence & ATS Engine Test Suite...');

  // 1. Test Candidate Content Spine Parsing
  console.log('  Testing Candidate Content Spine Parsing...');
  const sampleResume = `
    Alex Mercer
    Senior Software Engineer
    alex.mercer@example.com | +1 (555) 019-2834 | San Francisco, CA
    LinkedIn: linkedin.com/in/alexmercer | GitHub: github.com/alexmercer

    SUMMARY
    Senior Software Engineer with 4+ years of experience in Python, FastAPI, and Cloud microservices.

    EXPERIENCE
    Apex Tech Solutions — Senior Software Engineer (2024 - Present)
    • Engineered microservices backend handling high throughput data requests.
    • Reduced API latency by 35% using Redis caching.

    EDUCATION
    BS Computer Science — UC Berkeley (2018 - 2022)
  `;

  const candidateSpine = candidateSpineParser.parseCandidateSpine(sampleResume);
  assert.strictEqual(candidateSpine.personal.name, 'Alex Mercer');
  assert.strictEqual(candidateSpine.personal.email, 'alex.mercer@example.com');
  assert(candidateSpine.skills.some((s) => s.name === 'Python'), 'Python skill missing');
  assert(candidateSpine.experiences.length > 0, 'Experiences missing');
  console.log('  ✅ Candidate Content Spine Parsed Successfully');

  // 2. Test Fact Lock Engine
  console.log('  Testing Candidate Fact Lock Engine...');
  const lockedFacts = resumeFactLockEngine.lockCandidateFacts(candidateSpine);
  assert(lockedFacts.some((f) => f.factValue === 'Apex Tech Solutions'), 'Employer fact lock missing');
  assert(lockedFacts.some((f) => f.factValue === 'Senior Software Engineer'), 'Role fact lock missing');
  assert(lockedFacts.some((f) => f.factValue === '35%'), 'Metric fact lock missing');

  // Test Fact Lock Drift Protection
  const verifyValid = resumeFactLockEngine.verifyOptimizedContent(candidateSpine, JSON.stringify(candidateSpine));
  assert.strictEqual(verifyValid.passed, true, 'Fact check should pass for original content');

  const verifyDrift = resumeFactLockEngine.verifyOptimizedContent(candidateSpine, 'Apex Tech Solutions — Senior Software Engineer (Reduced latency by 99%)');
  assert.strictEqual(verifyDrift.passed, false, 'Fact check should fail when metric 35% is altered');
  console.log('  ✅ Fact Lock Engine & Drift Verification Verified');

  // 3. Test Job Content Spine Extraction
  console.log('  Testing Job Content Spine Extraction...');
  const sampleJob = `
    Senior Python & Cloud Engineer — Enterprise Corp
    Looking for Senior Software Engineer proficient in Python, FastAPI, PostgreSQL, AWS, Docker, and Kubernetes.
    Requirements:
    - 4+ years experience with Python, FastAPI, PostgreSQL
    - Hands-on experience with AWS, Docker, Kubernetes
  `;

  const jobSpine = jobSpineParser.parseJobSpine(sampleJob);
  assert.strictEqual(jobSpine.jobTitle, 'Senior Python & Cloud Engineer — Enterprise Corp');
  assert(jobSpine.requiredSkills.includes('Python'), 'Required skill Python missing');
  assert(jobSpine.requiredSkills.includes('FastAPI'), 'Required skill FastAPI missing');
  console.log('  ✅ Job Content Spine Parsed Successfully');

  // 4. Test Real ATS Scoring Engine across 8 Dimensions
  console.log('  Testing Real Multidimensional ATS Scoring Engine...');
  const atsReport = atsScoringEngine.evaluateResumeAgainstJob(candidateSpine, jobSpine);

  assert(typeof atsReport.overallScore === 'number', 'Overall score missing');
  assert(atsReport.overallScore >= 0 && atsReport.overallScore <= 100, 'Invalid overall score bounds');
  assert(atsReport.dimensions.keywordMatch >= 0, 'Keyword match dimension missing');
  assert(atsReport.dimensions.skillsMatch >= 0, 'Skills match dimension missing');
  assert(atsReport.dimensions.experienceMatch >= 0, 'Experience match dimension missing');
  assert(atsReport.dimensions.educationMatch >= 0, 'Education match dimension missing');
  assert(atsReport.dimensions.structure >= 0, 'Structure dimension missing');
  assert(atsReport.dimensions.formatting >= 0, 'Formatting dimension missing');
  assert(atsReport.dimensions.contactInfo >= 0, 'Contact info dimension missing');
  assert(atsReport.dimensions.contentQuality >= 0, 'Content quality dimension missing');
  assert(atsReport.keywordTable.length > 0, 'Keyword match table empty');
  assert(atsReport.honestyDisclaimer.includes('Estimated ATS compatibility'), 'Honesty disclaimer missing');
  console.log(`  ✅ Real ATS Engine Score Computed: ${atsReport.overallScore}%`);

  // 5. Test Adversarial ATS Score Differentiation (Resume A vs Resume B vs Resume C)
  console.log('  Testing Adversarial ATS Score Progression (A < B < C)...');

  // Resume A: Missing experiences, missing required keywords, missing skills
  const poorResumeSpine: CandidateContentSpine = {
    personal: { name: 'Unqualified Candidate', email: 'test@example.com', phone: '', location: '' },
    summary: 'Junior candidate seeking entry level role.',
    experiences: [],
    education: [],
    skills: [{ name: 'HTML', category: 'TECHNICAL' }],
    projects: [],
    certifications: [],
    achievements: [],
    publications: [],
    rawSourceText: 'Unqualified Candidate Resume',
  };

  // Resume C: Fully optimized resume with all required keywords
  const optimizedSpine = resumeOptimizer.optimizeResume(candidateSpine, jobSpine).candidateSpine;

  const scoreA = atsScoringEngine.evaluateResumeAgainstJob(poorResumeSpine, jobSpine).overallScore;
  const scoreB = atsReport.overallScore;
  const scoreC = atsScoringEngine.evaluateResumeAgainstJob(optimizedSpine, jobSpine).overallScore;

  assert(scoreA < scoreB, `Score A (${scoreA}) should be less than Score B (${scoreB})`);
  assert(scoreB <= scoreC, `Score B (${scoreB}) should be <= Score C (${scoreC})`);
  console.log(`  ✅ Adversarial ATS Score Progression Verified: Score A (${scoreA}%) < Score B (${scoreB}%) <= Score C (${scoreC}%)`);

  // 6. Test Exporters (DOCX & PDF)
  console.log('  Testing Resume Exporters (DOCX & PDF)...');
  const docxExport = await resumeExporters.exportDocx(candidateSpine);
  assert(docxExport.buffer.length > 500, 'DOCX Buffer too small');
  assert.strictEqual(docxExport.mimeType, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

  const pdfExport = await resumeExporters.exportPdf(candidateSpine);
  assert(pdfExport.buffer.length > 500, 'PDF Buffer too small');
  assert.strictEqual(pdfExport.mimeType, 'application/pdf');
  console.log('  ✅ Native DOCX & PDF Resume Binary Files Generated');

  console.log('🎉 ALL PART 15 RESUME INTELLIGENCE & ATS ENGINE TESTS PASSED!');
}

runResumeTestSuite().catch((err) => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
