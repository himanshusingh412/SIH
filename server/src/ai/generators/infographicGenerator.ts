import { AudienceProfile, ContentSpineData, OutputType } from '../../types';
import { BaseOutputGenerator } from './baseGenerator';

export class InfographicGenerator extends BaseOutputGenerator {
  outputType: OutputType = 'INFOGRAPHIC';
  generatorName = 'Infographic Spec Generator';

  async generate(spine: ContentSpineData, audience: AudienceProfile): Promise<{ title: string; content: string }> {
    const lockedDates = (spine.factLocks || []).filter((f) => f.category === 'DATE');
    const lockedNums = (spine.factLocks || []).filter((f) => f.category === 'NUMBER');

    const d1 = lockedDates[0]?.value || new Date().toISOString().slice(0, 10);
    const n1 = lockedNums[0]?.value || '100%';

    const layoutSpec = {
      header: {
        title: 'CONTENT SPINE DATA ARCHITECTURE',
        subtitle: `Fact-Locked Infographic Spec for ${audience}`,
      },
      heroMetrics: [
        { label: 'Milestone Date', value: d1 },
        { label: 'Factual Accuracy Metric', value: n1 },
      ],
      sectionCallouts: [
        { title: 'Summary Overview', text: spine.summary.slice(0, 140) },
        { title: 'Entities Tracked', text: spine.entities.map((e) => e.name).join(', ') },
      ],
    };

    return {
      title: `Infographic Spec (${audience})`,
      content: JSON.stringify(layoutSpec, null, 2),
    };
  }
}
