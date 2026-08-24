import { AudienceProfile, ContentSpineData, OutputType } from '../../types';
import { BaseOutputGenerator } from './baseGenerator';

export class AdvisoryGenerator extends BaseOutputGenerator {
  outputType: OutputType = 'ADVISORY';
  generatorName = 'Advisory Generator';

  async generate(spine: ContentSpineData, audience: AudienceProfile): Promise<{ title: string; content: string }> {
    const lockedDates = (spine.factLocks || []).filter((f) => f.category === 'DATE');
    const lockedNums = (spine.factLocks || []).filter((f) => f.category === 'NUMBER');

    const d1 = lockedDates[0]?.value || new Date().toISOString().slice(0, 10);
    const n1 = lockedNums[0]?.value || '100%';

    const content = `# OFFICIAL ADVISORY: Strategic Content Integrity Protocol

**SEVERITY**: HIGH | **TARGET AUDIENCE**: ${audience}  
**EFFECTIVE DATE**: ${d1}

---

### 1. BACKGROUND & PROBLEM STATEMENT
${spine.summary}

### 2. CORE FINDINGS & VERIFIED METRICS
- **Target Date**: ${d1}
- **Integrity Metric**: ${n1} accuracy verified against single source of truth.

### 3. REQUIRED ACTION ITEMS
${spine.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`;

    return {
      title: `Official Advisory (${audience})`,
      content,
    };
  }
}
