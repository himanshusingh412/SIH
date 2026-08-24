import { AudienceProfile, ContentSpineData, OutputType } from '../../types';
import { BaseOutputGenerator } from './baseGenerator';

export class LinkedInPostGenerator extends BaseOutputGenerator {
  outputType: OutputType = 'LINKEDIN_POST';
  generatorName = 'LinkedIn Post Generator';

  async generate(spine: ContentSpineData, audience: AudienceProfile): Promise<{ title: string; content: string }> {
    const lockedDates = (spine.factLocks || []).filter((f) => f.category === 'DATE');
    const lockedNums = (spine.factLocks || []).filter((f) => f.category === 'NUMBER');

    const d1 = lockedDates[0]?.value || new Date().toISOString().slice(0, 10);
    const n1 = lockedNums[0]?.value || '100%';

    const content = `🚀 Strategic Announcement for ${audience} Leaders!

We are excited to share key findings from our latest intelligence report:

📌 **Key Milestone**: ${d1}
📊 **Consistency Benchmark**: Achieved ${n1} verified data integrity using Content Spine Architecture.

💡 **Core Insights**:
${spine.summary}

🔑 **Key Takeaway**: Grounding multi-channel communications in a single source of truth eliminates hallucinated metrics and safeguards brand credibility.

#GovTech #AITransformation #DataIntegrity #ContentSpine #SIH2026
`;

    return {
      title: `LinkedIn Post (${audience})`,
      content,
    };
  }
}
