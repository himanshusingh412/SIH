export interface AdvisoryInput {
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  date: string;
  affectedOrganizations: string[];
  affectedSystems: string[];
  executiveSummary: string;
  technicalDetails: string;
  indicatorsOfCompromise: string[];
  riskAssessment: string;
  recommendations: string[];
  references: string[];
}

export interface IncidentReportInput {
  incidentId: string;
  dateTime: string;
  severity: string;
  affectedSystems: string[];
  organization: string;
  summary: string;
  timeline: Array<{ timestamp: string; event: string }>;
  rootCause: string;
  responseActions: string[];
  recommendations: string[];
}

export class CommunicationFormatters {
  /**
   * Format Advisory Template
   */
  formatAdvisory(input: AdvisoryInput): string {
    return `CYBERSECURITY ADVISORY: ${input.title.toUpperCase()}
======================================================
SEVERITY: ${input.severity}  |  DATE: ${input.date}
======================================================

AFFECTED ORGANIZATIONS: ${input.affectedOrganizations.join(', ')}
AFFECTED SYSTEMS: ${input.affectedSystems.join(', ')}

1. EXECUTIVE SUMMARY
---------------------
${input.executiveSummary}

2. TECHNICAL DETAILS
--------------------
${input.technicalDetails}

3. INDICATORS OF COMPROMISE (IOCs)
----------------------------------
${input.indicatorsOfCompromise.map((ioc) => `• ${ioc}`).join('\n')}

4. RISK ASSESSMENT & IMPACT
---------------------------
${input.riskAssessment}

5. MANDATORY RECOMMENDATIONS & MITIGATION
----------------------------------------
${input.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

REFERENCES:
${input.references.map((ref) => `- ${ref}`).join('\n')}`;
  }

  /**
   * Format Incident Report Template
   */
  formatIncidentReport(input: IncidentReportInput): string {
    return `INCIDENT REPORT: [${input.incidentId}] ${input.organization.toUpperCase()}
======================================================
DATE/TIME: ${input.dateTime}  |  SEVERITY: ${input.severity}
======================================================

AFFECTED SYSTEMS: ${input.affectedSystems.join(', ')}

SUMMARY:
${input.summary}

TIMELINE OF EVENTS:
${input.timeline.map((t) => `[${t.timestamp}] — ${t.event}`).join('\n')}

ROOT CAUSE ANALYSIS:
${input.rootCause}

RESPONSE & CONTAINMENT ACTIONS:
${input.responseActions.map((act) => `✓ ${act}`).join('\n')}

LESSONS LEARNED & PREVENTATIVE RECOMMENDATIONS:
${input.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}`;
  }
}

export const communicationFormatters = new CommunicationFormatters();
