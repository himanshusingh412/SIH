import { AudienceProfile, ContentSpineData, InputCategory, OutputType, ValidationIssue } from '../../types';
import { MockProvider } from './mockProvider';
import { AIProviderInstance, ProviderType } from './types';

export class LlamaProvider implements AIProviderInstance {
  name = 'Llama 3 Local / Ollama Provider';
  type: ProviderType = 'LLAMA';
  private fallbackMock = new MockProvider();
  private ollamaEndpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate';

  async extractContentSpine(rawText: string, category: InputCategory): Promise<ContentSpineData> {
    try {
      const response = await fetch(this.ollamaEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          prompt: `Extract summary and facts from text:\n\n${rawText.slice(0, 3000)}`,
          stream: false,
        }),
      });

      if (!response.ok) throw new Error('Ollama endpoint unavailable');
      const json: any = await response.json();
      return this.fallbackMock.extractContentSpine(json.response || rawText, category);
    } catch {
      return this.fallbackMock.extractContentSpine(rawText, category);
    }
  }

  async generateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    audience: AudienceProfile
  ): Promise<{ title: string; content: string }> {
    try {
      const lockedFacts = (spine.factLocks || [])
        .filter((f) => f.isLocked)
        .map((f) => `${f.key}: ${f.value}`)
        .join(', ');

      const response = await fetch(this.ollamaEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          prompt: `Generate ${outputType} for ${audience}. Locked facts: ${lockedFacts}. Summary: ${spine.summary}`,
          stream: false,
        }),
      });

      if (!response.ok) throw new Error('Ollama endpoint unavailable');
      const json: any = await response.json();
      return {
        title: `${outputType.replace(/_/g, ' ')} (${audience}) — Llama 3`,
        content: json.response || 'Llama 3 generation complete.',
      };
    } catch {
      return this.fallbackMock.generateOutput(spine, outputType, audience);
    }
  }

  async validateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    content: string
  ): Promise<ValidationIssue[]> {
    return this.fallbackMock.validateOutput(spine, outputType, content);
  }
}
