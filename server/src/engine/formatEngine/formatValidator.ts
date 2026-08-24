import { ConsistencyValidator, LockedFact } from '../../validators/consistencyValidator';
import yaml from 'js-yaml';
import { parseStringPromise as parseXml } from 'xml2js';
import { OutputType } from '../../types';

export interface ValidationCheckResult {
  passed: boolean;
  factsCheckPassed: boolean;
  formatSyntaxPassed: boolean;
  lengthCheckPassed: boolean;
  fileIntegrityPassed: boolean;
  issues: string[];
}

export class FormatValidator {
  private consistencyValidator = new ConsistencyValidator();

  /**
   * Validate any output buffer/content against locked facts and format rules
   */
  async validateOutput(options: {
    format: string;
    content: string | Buffer;
    lockedFacts: Array<{ key: string; value: string; category?: string }>;
    maxCharLimit?: number;
  }): Promise<ValidationCheckResult> {
    const issues: string[] = [];
    let factsCheckPassed = true;
    let formatSyntaxPassed = true;
    let lengthCheckPassed = true;
    let fileIntegrityPassed = true;

    const textContent =
      typeof options.content === 'string'
        ? options.content
        : options.content.toString('utf-8');

    // 1. Fact Lock Protection Check using ConsistencyValidator
    if (options.lockedFacts && options.lockedFacts.length > 0) {
      const lockedFactList: LockedFact[] = options.lockedFacts.map((f) => ({
        key: f.key,
        value: f.value,
        category: f.category || 'CLAIM',
      }));

      const report = this.consistencyValidator.validateOutputAgainstFacts(
        'EXECUTIVE_SUMMARY' as OutputType,
        textContent,
        lockedFactList
      );

      factsCheckPassed = report.passed;
      if (!factsCheckPassed) {
        report.issues.forEach((iss) => issues.push(`${iss.severity}: ${iss.description}`));
      }
    }

    // 2. Format Syntax Validation
    const formatUpper = options.format.toUpperCase();

    if (formatUpper === 'JSON') {
      try {
        JSON.parse(textContent);
      } catch (err: any) {
        formatSyntaxPassed = false;
        issues.push(`Invalid JSON syntax: ${err.message}`);
      }
    } else if (formatUpper === 'XML') {
      try {
        await parseXml(textContent);
      } catch (err: any) {
        formatSyntaxPassed = false;
        issues.push(`Invalid XML syntax: ${err.message}`);
      }
    } else if (formatUpper === 'YAML') {
      try {
        yaml.load(textContent);
      } catch (err: any) {
        formatSyntaxPassed = false;
        issues.push(`Invalid YAML syntax: ${err.message}`);
      }
    }

    // 3. Length Validation (for X / Twitter)
    if (options.maxCharLimit && textContent.length > options.maxCharLimit) {
      lengthCheckPassed = false;
      issues.push(`Exceeded maximum character limit (${textContent.length} > ${options.maxCharLimit})`);
    }

    // 4. Binary File Integrity Validation
    if (Buffer.isBuffer(options.content)) {
      const buf = options.content;
      if (buf.length === 0) {
        fileIntegrityPassed = false;
        issues.push('Empty 0-byte file buffer generated');
      } else if (formatUpper === 'PDF') {
        const header = buf.slice(0, 4).toString('ascii');
        if (!header.startsWith('%PDF')) {
          fileIntegrityPassed = false;
          issues.push('Invalid PDF magic header bytes');
        }
      } else if (formatUpper === 'DOCX' || formatUpper === 'PPTX') {
        const header = buf.slice(0, 4).toString('ascii');
        if (!header.startsWith('PK\x03\x04') && !header.startsWith('PK')) {
          fileIntegrityPassed = false;
          issues.push(`Invalid ${formatUpper} ZIP container magic header bytes`);
        }
      }
    }

    const passed = factsCheckPassed && formatSyntaxPassed && lengthCheckPassed && fileIntegrityPassed;

    return {
      passed,
      factsCheckPassed,
      formatSyntaxPassed,
      lengthCheckPassed,
      fileIntegrityPassed,
      issues,
    };
  }
}

export const formatValidator = new FormatValidator();
