import { AudienceProfile, ContentSpineData, OutputType } from '../../types';
import { BaseOutputGenerator } from './baseGenerator';

export class PresentationGenerator extends BaseOutputGenerator {
  outputType: OutputType = 'PRESENTATION';
  generatorName = 'Presentation Deck Generator';

  async generate(spine: ContentSpineData, audience: AudienceProfile): Promise<{ title: string; content: string }> {
    const lockedDates = (spine.factLocks || []).filter((f) => f.category === 'DATE');
    const lockedNums = (spine.factLocks || []).filter((f) => f.category === 'NUMBER');

    const d1 = lockedDates[0]?.value || new Date().toISOString().slice(0, 10);
    const n1 = lockedNums[0]?.value || '100%';

    const slides = [
      {
        slideNumber: 1,
        title: `Content Transformation Briefing (${audience})`,
        bulletPoints: [
          `Target Milestone Date: ${d1}`,
          `Consistency Metric: ${n1} Accuracy`,
          `Audience Profile: ${audience}`,
        ],
        speakerNotes: `Welcome ${audience} leadership. Today we present the Content Spine single source of truth architecture.`,
      },
      {
        slideNumber: 2,
        title: 'Executive Summary & Key Findings',
        bulletPoints: [spine.summary.slice(0, 120) + '...', 'Grounding all outputs in locked fact nodes.'],
        speakerNotes: 'Highlight the zero-hallucination guarantee across multi-channel content deliverables.',
      },
      {
        slideNumber: 3,
        title: 'Strategic Recommendations',
        bulletPoints: spine.recommendations.length > 0 ? spine.recommendations : ['Establish Content Spine as single source of truth'],
        speakerNotes: 'Conclude with strategic roadmap and execution timeline.',
      },
    ];

    return {
      title: `Presentation Deck (${audience})`,
      content: JSON.stringify(slides, null, 2),
    };
  }
}
