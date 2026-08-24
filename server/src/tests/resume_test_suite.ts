import { candidateSpineParser } from '../engine/resumeEngine/candidateSpine';
import { jobSpineParser } from '../engine/resumeEngine/jobSpine';
import { atsScoringEngine } from '../engine/resumeEngine/atsEngine';
import { resumeOptimizer } from '../engine/resumeEngine/resumeOptimizer';
import { resumeExporters } from '../engine/resumeEngine/resumeExporters';
import { prisma } from '../config';

async function runResumeStudioTestSuite() {
  console.log('🧪 Starting Resume Intelligence & ATS Studio Test Suite...\n');

  // 1. Candidate Content Spine Parsing
  console.log('1. Testing Candidate Content Spine Parsing...');
  const sampleRawResume = `Alex Mercer
Senior Software Engineer
San Francisco, CA | alex@example.com | +1 (555) 019-2834

SUMMARY
Senior Software Engineer with 4+ years of experience with Python, FastAPI, and PostgreSQL.

EXPERIENCE
Senior Software Engineer — Apex Tech (2024 - Present)
• Engineered microservices backend handling high throughput data requests.
• Reduced API latency by 35% using Redis caching.

EDUCATION
BS in Computer Science — UC Berkeley (2022)`;

  const candidateSpine = candidateSpineParser.parseCandidateSpine(sampleRawResume);
  if (!candidateSpine.personal.name || candidateSpine.skills.length === 0) {
    throw new Error('❌ Failed to parse Candidate Content Spine');
  }
  console.log(`  ✅ Parsed candidate: "${candidateSpine.personal.name}", Skills: ${candidateSpine.skills.map((s) => s.name).join(', ')}`);

  // 2. Job Description Spine Parsing
  console.log('\n2. Testing Job Description Spine Parsing...');
  const sampleRawJob = `Senior Python & Cloud Engineer — Enterprise Corp
Requirements: Python, FastAPI, PostgreSQL, AWS, Docker, Kubernetes.
Responsibilities: Build microservices and manage AWS infrastructure.`;

  const jobSpine = jobSpineParser.parseJobSpine(sampleRawJob);
  if (!jobSpine.jobTitle || jobSpine.requiredSkills.length === 0) {
    throw new Error('❌ Failed to parse Job Content Spine');
  }
  console.log(`  ✅ Parsed job: "${jobSpine.jobTitle}", Required Skills: ${jobSpine.requiredSkills.join(', ')}`);

  // 3. ATS Scan Evaluation
  console.log('\n3. Testing 8-Dimension ATS Scan Evaluation...');
  const atsReport = atsScoringEngine.evaluateResumeAgainstJob(candidateSpine, jobSpine);
  if (typeof atsReport.overallScore !== 'number' || !atsReport.dimensions) {
    throw new Error('❌ Failed: ATS Scan Report invalid');
  }
  console.log(`  ✅ ATS Score: ${atsReport.overallScore}/100 across ${Object.keys(atsReport.dimensions).length} dimensions`);
  console.log(`  ✅ Keyword Matrix rows: ${atsReport.keywordTable.length}, Missing: ${atsReport.missingKeywords.join(', ')}`);

  // 4. Fact-Locked Optimization
  console.log('\n4. Testing Fact-Locked Resume Bullet Optimization...');
  const optPackage = resumeOptimizer.optimizeResume(candidateSpine, jobSpine);
  if (!optPackage.factCheckPassed) {
    throw new Error('❌ Failed: Fact Check failed during optimization');
  }
  console.log(`  ✅ Optimization complete: ${optPackage.bulletChanges.length} bullet(s) improved. Fact Check Passed = true.`);

  // 5. Cover Letter Generation
  console.log('\n5. Testing Fact-Locked Cover Letter Generation...');
  const coverLetter = resumeOptimizer.generateCoverLetter(candidateSpine, jobSpine);
  if (!coverLetter.includes('Alex Mercer') || !coverLetter.includes('Enterprise Corp')) {
    throw new Error('❌ Failed to generate Cover Letter');
  }
  console.log('  ✅ Cover Letter generated successfully');

  // 6. LinkedIn Profile Generation
  console.log('\n6. Testing LinkedIn Profile Asset Generation...');
  const linkedIn = resumeOptimizer.generateLinkedInProfile(candidateSpine);
  if (!linkedIn.headline || !linkedIn.aboutSummary) {
    throw new Error('❌ Failed to generate LinkedIn profile');
  }
  console.log(`  ✅ LinkedIn Headline: "${linkedIn.headline}"`);

  // 7. Native DOCX Export Generation
  console.log('\n7. Testing Native DOCX Export Generation...');
  const docxRes = await resumeExporters.exportDocx(candidateSpine, 'ATS_CLASSIC');
  if (!docxRes.buffer || docxRes.buffer.length < 500) {
    throw new Error('❌ Failed to generate valid DOCX buffer');
  }
  console.log(`  ✅ DOCX buffer generated cleanly (${docxRes.buffer.length} bytes)`);

  // 8. Native PDF Export Generation
  console.log('\n8. Testing Native PDF Export Generation...');
  const pdfRes = await resumeExporters.exportPdf(candidateSpine, 'ATS_CLASSIC');
  if (!pdfRes.buffer || pdfRes.buffer.length < 500) {
    throw new Error('❌ Failed to generate valid PDF buffer');
  }
  console.log(`  ✅ PDF buffer generated cleanly (${pdfRes.buffer.length} bytes)`);

  console.log('\n🎉 ALL RESUME STUDIO ENGINE TESTS PASSED SUCCESSFULLY!');
}

runResumeStudioTestSuite().catch((err) => {
  console.error('❌ Resume Studio Test Suite Failed:', err);
  process.exit(1);
});
