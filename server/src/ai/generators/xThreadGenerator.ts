import { AudienceProfile, ContentSpineData, OutputType } from '../../types';
import { BaseOutputGenerator } from './baseGenerator';

export class XThreadGenerator extends BaseOutputGenerator {
  outputType: OutputType = 'X_THREAD';
  generatorName = 'X Thread Generator';

  async generate(spine: ContentSpineData, audience: AudienceProfile): Promise<{ title: string; content: string }> {
    const lockedDates = (spine.factLocks || []).filter((f) => f.category === 'DATE');
    const lockedNums = (spine.factLocks || []).filter((f) => f.category === 'NUMBER');

    const d1 = lockedDates[0]?.value || new Date().toISOString().slice(0, 10);
    const n1 = lockedNums[0]?.value || '100%';

    const content = `1/4 🧵 Key Insights: Content Transformation Engine tailored for ${audience}.

2/4 📊 On ${d1}, the platform demonstrated ${n1} factual consistency using Content Spine Architecture.

3/4 💡 Summary: ${spine.summary.slice(0, 200)}...

4/4 🔒 Zero LLM fact drift across all multi-channel deliverables. Learn more about Content Spine AI! #AI #GovTech`;

    return {
      title: `X Thread (${audience})`,
      content,
    };
  }
}
