import { AudienceProfile, ContentSpineData, OutputType } from '../../types';

export abstract class BaseOutputGenerator {
  abstract outputType: OutputType;
  abstract generatorName: string;

  buildFactLockSystemInstruction(spine: ContentSpineData, audience: AudienceProfile): string {
    const lockedFacts = (spine.factLocks || []).filter((f) => f.isLocked);
    const lockedDates = lockedFacts.filter((f) => f.category === 'DATE').map((f) => `${f.key}: ${f.value}`).join('\n');
    const lockedNumbers = lockedFacts.filter((f) => f.category === 'NUMBER').map((f) => `${f.key}: ${f.value}`).join('\n');

    return `
SYSTEM INSTRUCTION — MANDATORY FACT LOCK CONSTRAINTS:
You are an enterprise Content Transformation Generator.
Your generation MUST be grounded strictly in the provided Content Spine.

CRITICAL HARD CONSTRAINTS:
1. NEVER change locked numbers under any circumstances.
2. NEVER change locked dates under any circumstances.
3. NEVER invent people names or organizations not present in the Content Spine.
4. NEVER contradict any facts present in the Content Spine.
5. Clearly distinguish inferences or context from source facts.

LOCKED DATES (VERBATIM ENFORCEMENT):
${lockedDates || 'None'}

LOCKED NUMERIC METRICS (VERBATIM ENFORCEMENT):
${lockedNumbers || 'None'}

TARGET AUDIENCE PROFILE: ${audience}
SUMMARY ANCHOR: ${spine.summary}
`;
  }

  abstract generate(spine: ContentSpineData, audience: AudienceProfile): Promise<{ title: string; content: string }>;
}
