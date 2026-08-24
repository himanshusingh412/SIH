import { CandidateContentSpine } from './candidateSpine';

export interface LockedCandidateFact {
  id: string;
  category: 'EMPLOYER' | 'ROLE' | 'DATE' | 'DEGREE' | 'CERTIFICATION' | 'METRIC' | 'PROJECT' | 'TECHNOLOGY';
  factKey: string;
  factValue: string;
  isLocked: boolean;
}

export class ResumeFactLockEngine {
  /**
   * Classify and lock all candidate immutable facts
   */
  lockCandidateFacts(spine: CandidateContentSpine): LockedCandidateFact[] {
    const facts: LockedCandidateFact[] = [];
    let counter = 1;

    // 1. Lock Employers
    spine.experiences.forEach((exp) => {
      facts.push({
        id: `c-fact-${counter++}`,
        category: 'EMPLOYER',
        factKey: 'Company Name',
        factValue: exp.company,
        isLocked: true,
      });
      facts.push({
        id: `c-fact-${counter++}`,
        category: 'ROLE',
        factKey: 'Job Title',
        factValue: exp.role,
        isLocked: true,
      });
      facts.push({
        id: `c-fact-${counter++}`,
        category: 'DATE',
        factKey: 'Start Date',
        factValue: exp.startDate,
        isLocked: true,
      });
      facts.push({
        id: `c-fact-${counter++}`,
        category: 'DATE',
        factKey: 'End Date',
        factValue: exp.endDate,
        isLocked: true,
      });
      exp.metrics.forEach((m) => {
        facts.push({
          id: `c-fact-${counter++}`,
          category: 'METRIC',
          factKey: 'Achievement Metric',
          factValue: m,
          isLocked: true,
        });
      });
    });

    // 2. Lock Education
    spine.education.forEach((edu) => {
      facts.push({
        id: `c-fact-${counter++}`,
        category: 'DEGREE',
        factKey: 'Degree',
        factValue: edu.degree,
        isLocked: true,
      });
      facts.push({
        id: `c-fact-${counter++}`,
        category: 'DEGREE',
        factKey: 'Field',
        factValue: edu.field,
        isLocked: true,
      });
      facts.push({
        id: `c-fact-${counter++}`,
        category: 'EMPLOYER',
        factKey: 'Institution',
        factValue: edu.institution,
        isLocked: true,
      });
    });

    // 3. Lock Certifications
    spine.certifications.forEach((cert) => {
      facts.push({
        id: `c-fact-${counter++}`,
        category: 'CERTIFICATION',
        factKey: 'Certification Name',
        factValue: cert.certification,
        isLocked: true,
      });
    });

    // 4. Lock Projects
    spine.projects.forEach((proj) => {
      facts.push({
        id: `c-fact-${counter++}`,
        category: 'PROJECT',
        factKey: 'Project Name',
        factValue: proj.projectName,
        isLocked: true,
      });
    });

    return facts;
  }

  /**
   * Verify optimized content against locked candidate facts.
   * Returns passed status and list of any detected fact drift violations.
   */
  verifyOptimizedContent(originalSpine: CandidateContentSpine, optimizedText: string): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    const facts = this.lockCandidateFacts(originalSpine);

    // 1. Check for missing locked employers, titles, or degrees
    facts.forEach((fact) => {
      if (fact.category === 'EMPLOYER' || fact.category === 'ROLE' || fact.category === 'DEGREE') {
        if (!optimizedText.toLowerCase().includes(fact.factValue.toLowerCase())) {
          violations.push(`CRITICAL FACT DRIFT: Immutable ${fact.factKey} "${fact.factValue}" was altered or removed.`);
        }
      }
    });

    // 2. Check for metric alterations (e.g. 35% changed to 50%)
    const originalMetrics = facts.filter((f) => f.category === 'METRIC').map((f) => f.factValue);
    originalMetrics.forEach((m) => {
      if (!optimizedText.includes(m)) {
        violations.push(`METRIC ALTERATION: Original locked metric "${m}" missing or changed in optimized text.`);
      }
    });

    return {
      passed: violations.length === 0,
      violations,
    };
  }
}

export const resumeFactLockEngine = new ResumeFactLockEngine();
