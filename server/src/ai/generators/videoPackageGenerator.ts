import { AudienceProfile, ContentSpineData, OutputType } from '../../types';
import { BaseOutputGenerator } from './baseGenerator';

export class VideoPackageGenerator extends BaseOutputGenerator {
  outputType: OutputType = 'VIDEO_PACKAGE';
  generatorName = 'Video Production Package Generator';

  async generate(spine: ContentSpineData, audience: AudienceProfile): Promise<{ title: string; content: string }> {
    const lockedDates = (spine.factLocks || []).filter((f) => f.category === 'DATE');
    const lockedNums = (spine.factLocks || []).filter((f) => f.category === 'NUMBER');

    const d1 = lockedDates[0]?.value || new Date().toISOString().slice(0, 10);
    const n1 = lockedNums[0]?.value || '100%';

    const content = `# Video Production Package: Content Spine Overview

**TARGET AUDIENCE**: ${audience} | **DURATION**: 60 Seconds

---

### SCENE BREAKDOWN & STORYBOARD

**Scene 1 (0:00 - 0:15)**:
- **Visual**: Kinetic typography over dark glassmorphism dashboard.
- **Voiceover**: "In an era of rapid AI generation, fact integrity is paramount. Welcome to Content Spine AI."
- **On-Screen Text**: Target Milestone Date: ${d1}

**Scene 2 (0:15 - 0:35)**:
- **Visual**: Interactive 3-Pane Review Workspace showing 4-Tier Source Lineage.
- **Voiceover**: "Achieving ${n1} consistency, our single source of truth anchors every deliverable."
- **On-Screen Text**: ${n1} Verified Accuracy

**Scene 3 (0:35 - 0:60)**:
- **Visual**: Multi-channel output icons lighting up simultaneously.
- **Voiceover**: "One upload, zero fact drift, instant multi-channel deployment."
- **Call To Action**: Transform your content with Content Spine AI.
`;

    return {
      title: `Video Package (${audience})`,
      content,
    };
  }
}
