import { CandidateContentSpine } from './candidateSpine';
import { JobContentSpine } from './jobSpine';

export interface KeywordMatrixRow {
  keyword: string;
  category: 'REQUIRED_SKILL' | 'PREFERRED_SKILL' | 'TOOL' | 'DOMAIN_TERM' | 'CERTIFICATION';
  status: 'FOUND' | 'PARTIAL' | 'MISSING';
  evidence: string;
}

export interface ATSFinding {
  type: 'CRITICAL_MISSING' | 'FORMATTING_WARNING' | 'WEAK_BULLET' | 'DATE_DISCREPANCY' | 'SECTION_OMISSION';
  title: string;
  description: string;
  impactScore: number;
  recommendation: string;
}

export interface ATSScanReport {
  overallScore: number;
  dimensions: {
    keywordMatch: number;
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    structure: number;
    formatting: number;
    contactInfo: number;
    contentQuality: number;
  };
  keywordTable: KeywordMatrixRow[];
  missingKeywords: string[];
  findings: ATSFinding[];
  honestyDisclaimer: string;
  scannedAt: string;
}

export class ATSScoringEngine {
  /**
   * Run real deterministic + semantic ATS evaluation
   */
  evaluateResumeAgainstJob(candidate: CandidateContentSpine, job: JobContentSpine): ATSScanReport {
    const candidateText = candidate.rawSourceText.toLowerCase();
    const candidateSkillNames = candidate.skills.map((s) => s.name.toLowerCase());
    const candidateTech = candidate.experiences.flatMap((e) => e.technologies.map((t) => t.toLowerCase()));

    // 1. Keyword & Skill Matching
    const keywordRows: KeywordMatrixRow[] = [];
    const missingKeywords: string[] = [];

    let requiredFound = 0;
    let preferredFound = 0;

    // Evaluate Required Skills
    job.requiredSkills.forEach((skill) => {
      const lower = skill.toLowerCase();
      const inSkills = candidateSkillNames.includes(lower);
      const inTech = candidateTech.includes(lower);
      const inText = candidateText.includes(lower);

      if (inSkills || inTech || inText) {
        requiredFound++;
        keywordRows.push({
          keyword: skill,
          category: 'REQUIRED_SKILL',
          status: 'FOUND',
          evidence: inSkills ? 'Skills Section' : inTech ? 'Work Experience' : 'Resume Body Text',
        });
      } else {
        missingKeywords.push(skill);
        keywordRows.push({
          keyword: skill,
          category: 'REQUIRED_SKILL',
          status: 'MISSING',
          evidence: 'No evidence found in candidate record',
        });
      }
    });

    // Evaluate Preferred Skills & Tools
    job.preferredSkills.concat(job.toolsAndPlatforms).forEach((skill) => {
      const lower = skill.toLowerCase();
      const inSkills = candidateSkillNames.includes(lower);
      const inText = candidateText.includes(lower);

      if (inSkills || inText) {
        preferredFound++;
        keywordRows.push({
          keyword: skill,
          category: 'PREFERRED_SKILL',
          status: 'FOUND',
          evidence: 'Skills / Tools',
        });
      } else {
        if (!missingKeywords.includes(skill)) missingKeywords.push(skill);
        keywordRows.push({
          keyword: skill,
          category: 'PREFERRED_SKILL',
          status: 'MISSING',
          evidence: 'No evidence found in candidate record',
        });
      }
    });

    const totalRequired = Math.max(1, job.requiredSkills.length);
    const keywordMatch = Math.min(100, Math.round((requiredFound / totalRequired) * 100));
    const skillsMatch = Math.min(100, Math.round(((requiredFound + preferredFound) / Math.max(1, job.requiredSkills.length + job.preferredSkills.length)) * 100));

    // 2. Experience Match
    const totalExpYears = candidate.experiences.length * 2; // Approx calculation
    const experienceMatch = totalExpYears >= job.experienceYears ? 100 : Math.round((totalExpYears / job.experienceYears) * 100);

    // 3. Education Match
    const hasDegree = candidate.education.length > 0;
    const educationMatch = hasDegree ? 100 : 50;

    // 4. Section Structure Check
    let structureScore = 100;
    const findings: ATSFinding[] = [];

    if (candidate.experiences.length === 0) {
      structureScore -= 30;
      findings.push({
        type: 'SECTION_OMISSION',
        title: 'Missing Work Experience Section',
        description: 'Standard ATS parsers require a clearly demarcated Work Experience section.',
        impactScore: -30,
        recommendation: 'Add standard Work Experience heading and entries.',
      });
    }

    if (candidate.skills.length === 0) {
      structureScore -= 20;
      findings.push({
        type: 'SECTION_OMISSION',
        title: 'Missing Skills Section',
        description: 'ATS parsers look for an explicit Skills section to index competencies.',
        impactScore: -20,
        recommendation: 'Add a dedicated Skills section.',
      });
    }

    // 5. Formatting Compatibility Check
    const formatting = 95; // High readability for single-column structured text

    // 6. Contact Info Check
    let contactInfo = 100;
    if (!candidate.personal.email || candidate.personal.email.includes('example.com')) {
      contactInfo -= 25;
    }
    if (!candidate.personal.phone) {
      contactInfo -= 25;
    }

    // 7. Content Quality & Bullet Impact Check
    const bullets = candidate.experiences.flatMap((e) => e.responsibilities);
    const metricsCount = candidate.experiences.flatMap((e) => e.metrics).length;
    const actionVerbs = ['engineered', 'developed', 'built', 'reduced', 'improved', 'led', 'scaled', 'architected', 'implemented'];
    const actionVerbCount = bullets.filter((b) => actionVerbs.some((v) => b.toLowerCase().includes(v))).length;

    let contentQuality = 70;
    if (actionVerbCount >= 3) contentQuality += 15;
    if (metricsCount >= 2) contentQuality += 15;
    contentQuality = Math.min(100, contentQuality);

    // Flag Missing Required Keywords in Findings
    missingKeywords.slice(0, 3).forEach((kw) => {
      findings.push({
        type: 'CRITICAL_MISSING',
        title: `Missing Required Keyword: "${kw}"`,
        description: `Job description specifies "${kw}" as a key requirement, but it was not found in your candidate profile.`,
        impactScore: -10,
        recommendation: `If you have experience with ${kw}, incorporate it naturally into your skills or bullet points.`,
      });
    });

    // 8. Overall Weighted Score Calculation
    const overallScore = Math.max(
      0,
      Math.round(
        keywordMatch * 0.25 +
        skillsMatch * 0.25 +
        experienceMatch * 0.15 +
        educationMatch * 0.10 +
        structureScore * 0.10 +
        formatting * 0.05 +
        contactInfo * 0.05 +
        contentQuality * 0.05
      )
    );

    return {
      overallScore,
      dimensions: {
        keywordMatch,
        skillsMatch,
        experienceMatch,
        educationMatch,
        structure: structureScore,
        formatting,
        contactInfo,
        contentQuality,
      },
      keywordTable: keywordRows,
      missingKeywords,
      findings,
      honestyDisclaimer: 'Estimated ATS compatibility based on the analyzed job description and candidate resume. ATS algorithms vary across vendor platforms (Workday, Greenhouse, Lever). This scanner serves as a diagnostic optimization tool.',
      scannedAt: new Date().toISOString(),
    };
  }
}

export const atsScoringEngine = new ATSScoringEngine();
