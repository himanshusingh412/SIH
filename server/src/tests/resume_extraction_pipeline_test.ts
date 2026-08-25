import { resumeExtractionService } from '../engine/resumeEngine/resumeExtractionService';

async function runResumeExtractionTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 RESUME AI EXTRACTION PIPELINE TEST SUITE');
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

  // Test 1: Plain Text Resume Extraction
  const sampleTxtResume = `Priya Sharma
Email: priya.sharma@techcorp.io | Phone: +91 98765 43210
Location: Bengaluru, Karnataka | LinkedIn: linkedin.com/in/priyasharma
GitHub: github.com/priyasharma

PROFESSIONAL SUMMARY
Senior Cloud & Backend Engineer with 5+ years of experience building distributed systems in Python, FastAPI, and PostgreSQL. Reduced query latency by 42% and scaled microservices to 250,000 active users.

WORK EXPERIENCE
Senior Software Engineer | CloudTech Solutions
2023-01 - Present | Bengaluru, India
- Architected high-throughput REST APIs handling 5,000 requests/sec with FastAPI and Redis.
- Reduced database query latency by 42% through PostgreSQL index optimization.
- Led migration of 12 microservices to Docker and Kubernetes on AWS.

Backend Engineer | DataCorp Systems
2021-03 - 2022-12 | Hyderabad, India
- Developed automated ETL data pipelines in Python and SQL processing 10GB daily.
- Improved unit test coverage from 45% to 88%.

EDUCATION
Bachelor of Technology in Computer Science & Engineering
Indian Institute of Technology, Madras | 2017 - 2021 | GPA: 8.9/10

SKILLS
Programming: Python, JavaScript, TypeScript, SQL, C++
Frameworks: FastAPI, React, Node.js, Express
Databases: PostgreSQL, Redis, MongoDB
Cloud & DevOps: AWS, Docker, Kubernetes, CI/CD, Git

PROJECTS
Smart Content Transformation Engine
- Built multimodal AI document processor using TypeScript, Prisma, and Gemini AI.
- Achieved 99.8% fact retention rate across 1,000 test documents.

CERTIFICATIONS
AWS Certified Solutions Architect – Associate (2023-08)
`;

  const txtBuffer = Buffer.from(sampleTxtResume, 'utf-8');
  const txtResult = await resumeExtractionService.processResumeUpload(txtBuffer, 'priya_sharma_resume.txt', 'text/plain');

  assert(
    Boolean(txtResult.candidateSpine && txtResult.candidateSpine.personal.name.includes('Priya')),
    'Text Resume Personal Name Extraction',
    `Name: ${txtResult.candidateSpine?.personal?.name}`
  );

  assert(
    txtResult.candidateSpine.personal.email === 'priya.sharma@techcorp.io',
    'Email Address Preservation',
    `Email: ${txtResult.candidateSpine?.personal?.email}`
  );

  assert(
    txtResult.candidateSpine.experiences.length > 0 &&
      txtResult.candidateSpine.experiences[0].company.includes('CloudTech'),
    'Work Experience Company Extraction',
    `Company: ${txtResult.candidateSpine?.experiences?.[0]?.company}`
  );

  assert(
    txtResult.candidateSpine.skills.some((s) => s.name.toLowerCase() === 'python'),
    'Skills Keyword Scanning & Classification',
    `Skills count: ${txtResult.candidateSpine?.skills?.length}`
  );

  // Test 2: Scanned PDF / Empty Text Detection Triggering Multimodal Fallback
  const scannedPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000062 00000 n\n0000000125 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n218\n%%EOF', 'utf-8');
  const scannedResult = await resumeExtractionService.processResumeUpload(scannedPdfBuffer, 'scanned_resume.pdf', 'application/pdf');

  assert(
    Boolean(scannedResult.candidateSpine && scannedResult.extractionMethod),
    'Scanned / Image PDF Fallback Execution',
    `Method: ${scannedResult.extractionMethod}, Provider: ${scannedResult.providerUsed}`
  );

  console.log('\n======================================================');
  console.log(`SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runResumeExtractionTestSuite().catch((err) => {
  console.error('RESUME SUITE FATAL:', err);
  process.exit(1);
});
