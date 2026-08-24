import { OutputType, ValidationIssue } from '../types';

export type FactCategory =
  | 'DATE'
  | 'NUMBER'
  | 'PERSON'
  | 'ORGANIZATION'
  | 'LOCATION'
  | 'CLAIM'
  | 'RISK'
  | 'RECOMMENDATION';

export interface LockedFact {
  key: string;
  value: string;
  category: string;
  sourceSnippet?: string;
  pageNumber?: number;
}

export interface ValidationCheckResult {
  factKey: string;
  factValue: string;
  category: string;
  status: 'PASS' | 'WARNING' | 'ERROR';
  issue?: ValidationIssue;
}

export interface DetailedValidationReport {
  consistencyScore: number;
  factsChecked: number;
  passedCount: number;
  warningsCount: number;
  errorsCount: number;
  passed: boolean;
  humanReviewRequired: boolean;
  issues: ValidationIssue[];
  checkResults: ValidationCheckResult[];
}

// ─────────────────────────────────────────────────────────────
// Regex Helpers
// ─────────────────────────────────────────────────────────────
const DATE_PATTERNS = [
  // ISO: 2026-08-24
  /\b\d{4}-\d{2}-\d{2}\b/g,
  // Natural: 24 August 2026, 24 Aug 2026
  /\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/gi,
  // Quarter: Q3 2026
  /\bQ[1-4]\s+\d{4}\b/gi,
  // Slash: 24/08/2026
  /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
];

const NUMBER_PATTERNS = [
  // Percentage: 99.9%, 99%
  /\b\d+(?:\.\d+)?%\b/g,
  // Large abbreviations: 500k, 2.5M, 1B
  /\b\d+(?:\.\d+)?[kKmMbB]\b/g,
  // Standalone significant numbers (4+ digits): 2026, 1500
  /\b\d{4,}\b/g,
  // Decimal: 3.14
  /\b\d+\.\d+\b/g,
];

function extractAllDates(text: string): string[] {
  const found = new Set<string>();
  for (const pattern of DATE_PATTERNS) {
    const matches = text.match(pattern) || [];
    matches.forEach((m: string) => found.add(m.trim()));
  }
  return Array.from(found);
}

function extractAllNumbers(text: string): string[] {
  const found = new Set<string>();
  for (const pattern of NUMBER_PATTERNS) {
    const matches = text.match(pattern) || [];
    matches.forEach((m: string) => found.add(m.trim()));
  }
  return Array.from(found).filter((n) => n !== '1' && n !== '0');
}

function normalise(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function partialKeywordMatch(content: string, expected: string): boolean {
  const words = normalise(expected)
    .split(/\s+/)
    .filter((w) => w.length > 3);
  if (words.length === 0) return false;
  const hits = words.filter((w) => normalise(content).includes(w));
  return hits.length / words.length >= 0.5;
}

// ─────────────────────────────────────────────────────────────
// Main Validator Class
// ─────────────────────────────────────────────────────────────
export class ConsistencyValidator {
  validateOutputAgainstFacts(
    outputType: OutputType,
    content: string,
    lockedFacts: LockedFact[]
  ): DetailedValidationReport {
    const issues: ValidationIssue[] = [];
    const checkResults: ValidationCheckResult[] = [];

    let factsChecked = 0;
    let passedCount = 0;
    let warningsCount = 0;
    let errorsCount = 0;

    for (const fact of lockedFacts) {
      factsChecked++;
      const result = this.checkFact(outputType, content, fact);
      checkResults.push(result);

      if (result.status === 'PASS') {
        passedCount++;
      } else if (result.status === 'WARNING') {
        warningsCount++;
        if (result.issue) issues.push(result.issue);
      } else {
        errorsCount++;
        if (result.issue) issues.push(result.issue);
      }
    }

    // Proportional scoring: start at 100, deduct proportionally
    // Each ERROR costs up to 15 points; each WARNING costs up to 5 points
    const errorDeduction = factsChecked > 0 ? (errorsCount / factsChecked) * 60 : 0;
    const warnDeduction = factsChecked > 0 ? (warningsCount / factsChecked) * 20 : 0;
    const consistencyScore = Math.max(0, Math.round(100 - errorDeduction - warnDeduction));

    return {
      consistencyScore,
      factsChecked,
      passedCount,
      warningsCount,
      errorsCount,
      passed: errorsCount === 0,
      humanReviewRequired: false,
      issues,
      checkResults,
    };
  }

  // ─── Aggregate across all outputs ───────────────────────────
  validateAllOutputs(
    outputs: Array<{ outputType: OutputType; content: string }>,
    lockedFacts: LockedFact[]
  ): DetailedValidationReport {
    let totalFactsChecked = 0;
    let totalPassed = 0;
    let totalWarnings = 0;
    let totalErrors = 0;
    const allIssues: ValidationIssue[] = [];
    const allCheckResults: ValidationCheckResult[] = [];

    for (const output of outputs) {
      const report = this.validateOutputAgainstFacts(
        output.outputType,
        output.content,
        lockedFacts
      );
      totalFactsChecked += report.factsChecked;
      totalPassed += report.passedCount;
      totalWarnings += report.warningsCount;
      totalErrors += report.errorsCount;
      allIssues.push(...report.issues);
      allCheckResults.push(...report.checkResults);
    }

    const errorDeduction = totalFactsChecked > 0 ? (totalErrors / totalFactsChecked) * 60 : 0;
    const warnDeduction = totalFactsChecked > 0 ? (totalWarnings / totalFactsChecked) * 20 : 0;
    const consistencyScore = Math.max(0, Math.round(100 - errorDeduction - warnDeduction));

    return {
      consistencyScore,
      factsChecked: totalFactsChecked,
      passedCount: totalPassed,
      warningsCount: totalWarnings,
      errorsCount: totalErrors,
      passed: totalErrors === 0,
      humanReviewRequired: false,
      issues: allIssues,
      checkResults: allCheckResults,
    };
  }

  // ─── Per-fact checker (dispatches by category) ───────────────
  private checkFact(
    outputType: OutputType,
    content: string,
    fact: LockedFact
  ): ValidationCheckResult {
    const cat = (fact.category || '').toUpperCase() as FactCategory;

    switch (cat) {
      case 'DATE':
        return this.checkDateFact(outputType, content, fact);
      case 'NUMBER':
        return this.checkNumberFact(outputType, content, fact);
      case 'PERSON':
        return this.checkEntityFact(outputType, content, fact, 'person name');
      case 'ORGANIZATION':
        return this.checkEntityFact(outputType, content, fact, 'organization');
      case 'LOCATION':
        return this.checkEntityFact(outputType, content, fact, 'location');
      case 'CLAIM':
      case 'RISK':
      case 'RECOMMENDATION':
        return this.checkTextualFact(outputType, content, fact);
      default:
        return this.checkTextualFact(outputType, content, fact);
    }
  }

  // ─── DATE checker ────────────────────────────────────────────
  private checkDateFact(
    outputType: OutputType,
    content: string,
    fact: LockedFact
  ): ValidationCheckResult {
    const expected = fact.value;

    // Verbatim PASS
    if (content.includes(expected)) {
      return { factKey: fact.key, factValue: fact.value, category: fact.category, status: 'PASS' };
    }

    // Find a different date in the content → ERROR (contradiction)
    const datesInContent = extractAllDates(content);
    const contradictingDate = datesInContent.find(
      (d) => d !== expected && !expected.includes(d) && !d.includes(expected)
    );

    if (contradictingDate) {
      const issue: ValidationIssue = {
        id: `err-date-${this.shortId()}`,
        outputType,
        factKey: fact.key,
        expectedValue: expected,
        foundValue: contradictingDate,
        severity: 'CRITICAL',
        description: `Date contradiction: source locks "${expected}" but output contains "${contradictingDate}".`,
        autoFixAvailable: true,
        suggestedFix: `Replace "${contradictingDate}" → "${expected}"`,
      };
      return { factKey: fact.key, factValue: fact.value, category: fact.category, status: 'ERROR', issue };
    }

    // No contradicting date, but expected date is absent → WARNING (may be in different format)
    if (partialKeywordMatch(content, expected)) {
      const issue: ValidationIssue = {
        id: `warn-date-${this.shortId()}`,
        outputType,
        factKey: fact.key,
        expectedValue: expected,
        severity: 'WARNING',
        description: `Date "${expected}" appears paraphrased or in a different format.`,
        autoFixAvailable: true,
        suggestedFix: `Enforce exact date string "${expected}".`,
      };
      return { factKey: fact.key, factValue: fact.value, category: fact.category, status: 'WARNING', issue };
    }

    // Completely missing → ERROR
    const issue: ValidationIssue = {
      id: `err-date-missing-${this.shortId()}`,
      outputType,
      factKey: fact.key,
      expectedValue: expected,
      foundValue: 'OMITTED',
      severity: 'CRITICAL',
      description: `Locked date "${expected}" is completely absent from ${outputType}.`,
      autoFixAvailable: true,
      suggestedFix: `Inject "${fact.key}: ${expected}" into output.`,
    };
    return { factKey: fact.key, factValue: fact.value, category: fact.category, status: 'ERROR', issue };
  }

  // ─── NUMBER checker ──────────────────────────────────────────
  private checkNumberFact(
    outputType: OutputType,
    content: string,
    fact: LockedFact
  ): ValidationCheckResult {
    const expected = fact.value;

    if (content.includes(expected)) {
      return { factKey: fact.key, factValue: fact.value, category: fact.category, status: 'PASS' };
    }

    const numbersInContent = extractAllNumbers(content);

    // Unit-aware contradiction: a year (4-digit, no suffix) should not contradict a percentage
    const expectedIsPercent = expected.endsWith('%');
    const expectedIsAbbrev = /[kKmMbB]$/.test(expected);
    const expectedIsYear = /^\d{4}$/.test(expected);

    const contradicting = numbersInContent.find((n) => {
      if (n === expected || expected.includes(n) || n.includes(expected)) return false;

      const nIsPercent = n.endsWith('%');
      const nIsAbbrev = /[kKmMbB]$/.test(n);
      const nIsYear = /^\d{4}$/.test(n);

      // Only flag if they are the same unit "class"
      if (expectedIsPercent && !nIsPercent) return false;
      if (expectedIsAbbrev && !nIsAbbrev) return false;
      if (expectedIsYear && !nIsYear) return false;
      if (!expectedIsPercent && !expectedIsAbbrev && !expectedIsYear && (nIsPercent || nIsAbbrev)) return false;

      return true;
    });

    if (contradicting) {
      const issue: ValidationIssue = {
        id: `err-num-${this.shortId()}`,
        outputType,
        factKey: fact.key,
        expectedValue: expected,
        foundValue: contradicting,
        severity: 'CRITICAL',
        description: `Numeric contradiction: source locks "${expected}" but output contains "${contradicting}".`,
        autoFixAvailable: true,
        suggestedFix: `Replace "${contradicting}" → "${expected}"`,
      };
      return { factKey: fact.key, factValue: fact.value, category: fact.category, status: 'ERROR', issue };
    }

    if (partialKeywordMatch(content, expected)) {
      const issue: ValidationIssue = {
        id: `warn-num-${this.shortId()}`,
        outputType,
        factKey: fact.key,
        expectedValue: expected,
        severity: 'WARNING',
        description: `Metric "${expected}" appears in approximate or alternate form.`,
        autoFixAvailable: true,
        suggestedFix: `Enforce exact value "${expected}".`,
      };
      return { factKey: fact.key, factValue: fact.value, category: fact.category, status: 'WARNING', issue };
    }

    const issue: ValidationIssue = {
      id: `err-num-missing-${this.shortId()}`,
      outputType,
      factKey: fact.key,
      expectedValue: expected,
      foundValue: 'OMITTED',
      severity: 'CRITICAL',
      description: `Locked metric "${expected}" is absent from ${outputType}.`,
      autoFixAvailable: true,
      suggestedFix: `Inject "${fact.key}: ${expected}" into output.`,
    };
    return { factKey: fact.key, factValue: fact.value, category: fact.category, status: 'ERROR', issue };
  }

  // ─── ENTITY checker (PERSON / ORGANIZATION / LOCATION) ───────
  private checkEntityFact(
    outputType: OutputType,
    content: string,
    fact: LockedFact,
    label: string
  ): ValidationCheckResult {
    const expected = fact.value;
    const normContent = normalise(content);
    const normExpected = normalise(expected);

    // Verbatim (case-insensitive) PASS
    if (normContent.includes(normExpected)) {
      return { factKey: fact.key, factValue: fact.value, category: fact.category, status: 'PASS' };
    }

    // Partial keyword match → WARNING
    if (partialKeywordMatch(content, expected)) {
      const issue: ValidationIssue = {
        id: `warn-entity-${this.shortId()}`,
        outputType,
        factKey: fact.key,
        expectedValue: expected,
        severity: 'WARNING',
        description: `${label} "${expected}" is referenced partially or abbreviated.`,
        autoFixAvailable: true,
        suggestedFix: `Use full ${label} name: "${expected}".`,
      };
      return { factKey: fact.key, factValue: fact.value, category: fact.category, status: 'WARNING', issue };
    }

    // Missing entirely → ERROR
    const issue: ValidationIssue = {
      id: `err-entity-${this.shortId()}`,
      outputType,
      factKey: fact.key,
      expectedValue: expected,
      foundValue: 'OMITTED',
      severity: 'CRITICAL',
      description: `Locked ${label} "${expected}" is absent from ${outputType}.`,
      autoFixAvailable: true,
      suggestedFix: `Inject ${label}: "${expected}".`,
    };
    return { factKey: fact.key, factValue: fact.value, category: fact.category, status: 'ERROR', issue };
  }

  // ─── TEXTUAL checker (CLAIM / RISK / RECOMMENDATION) ─────────
  private checkTextualFact(
    outputType: OutputType,
    content: string,
    fact: LockedFact
  ): ValidationCheckResult {
    const expected = fact.value;

    if (normalise(content).includes(normalise(expected))) {
      return { factKey: fact.key, factValue: fact.value, category: fact.category, status: 'PASS' };
    }

    if (partialKeywordMatch(content, expected)) {
      const issue: ValidationIssue = {
        id: `warn-text-${this.shortId()}`,
        outputType,
        factKey: fact.key,
        expectedValue: expected,
        severity: 'WARNING',
        description: `Content Spine fact paraphrased: "${expected.substring(0, 80)}…"`,
        autoFixAvailable: false,
        suggestedFix: 'Review and align phrasing with source document.',
      };
      return { factKey: fact.key, factValue: fact.value, category: fact.category, status: 'WARNING', issue };
    }

    // Only flag as ERROR if the fact value is substantive (more than 3 words)
    const wordCount = expected.split(/\s+/).length;
    if (wordCount <= 3) {
      // Short fact values are checked differently — treat absence as warning
      const issue: ValidationIssue = {
        id: `warn-short-${this.shortId()}`,
        outputType,
        factKey: fact.key,
        expectedValue: expected,
        severity: 'WARNING',
        description: `Short fact "${expected}" not found verbatim in ${outputType}.`,
        autoFixAvailable: true,
        suggestedFix: `Ensure "${expected}" appears in output.`,
      };
      return { factKey: fact.key, factValue: fact.value, category: fact.category, status: 'WARNING', issue };
    }

    const issue: ValidationIssue = {
      id: `err-text-${this.shortId()}`,
      outputType,
      factKey: fact.key,
      expectedValue: expected,
      foundValue: 'OMITTED',
      severity: 'CRITICAL',
      description: `Content Spine fact omitted from ${outputType}: "${expected.substring(0, 80)}…"`,
      autoFixAvailable: true,
      suggestedFix: `Inject or reference: "${expected.substring(0, 60)}…"`,
    };
    return { factKey: fact.key, factValue: fact.value, category: fact.category, status: 'ERROR', issue };
  }

  private shortId(): string {
    return Math.random().toString(36).substring(2, 8);
  }
}
