import { config } from '../../config';
import { AudienceProfile, ContentSpineData, InputCategory, OutputType, ValidationIssue } from '../../types';
import { MockProvider } from './mockProvider';
import { AIProviderInstance, ProviderType } from './types';

export class OpenAIProvider implements AIProviderInstance {
  name = 'OpenAI Provider (GPT-4o)';
  type: ProviderType = 'OPENAI';
  private fallbackMock = new MockProvider();

  async extractContentSpine(rawText: string, category: InputCategory): Promise<ContentSpineData> {
    if (!config.openaiApiKey) {
      console.log('OpenAI API key unconfigured; using MockProvider fallback.');
      return this.fallbackMock.extractContentSpine(rawText, category);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are an AI extraction engine. Analyze the source text and return extracted summary and key facts.',
            },
            {
              role: 'user',
              content: `Source Category: ${category}\n\n${rawText.slice(0, 4000)}`,
            },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned HTTP ${response.status}`);
      }

      const json: any = await response.json();
      const text = json.choices?.[0]?.message?.content || '';
      return this.fallbackMock.extractContentSpine(text || rawText, category);
    } catch (err) {
      console.warn('OpenAI extraction fallback:', err);
      return this.fallbackMock.extractContentSpine(rawText, category);
    }
  }

  async generateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    audience: AudienceProfile
  ): Promise<{ title: string; content: string }> {
    if (!config.openaiApiKey) {
      return this.fallbackMock.generateOutput(spine, outputType, audience);
    }

    try {
      const lockedFacts = (spine.factLocks || [])
        .filter((f) => f.isLocked)
        .map((f) => `${f.key}: ${f.value}`)
        .join(', ');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an AI deliverable generator. Generate a ${outputType} for audience ${audience}. HARD CONSTRAINTS: Never change locked facts: ${lockedFacts}. Content Spine summary: ${spine.summary}.`,
            },
            {
              role: 'user',
              content: `Generate ${outputType} deliverable.`,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned HTTP ${response.status}`);
      }

      const json: any = await response.json();
      const content = json.choices?.[0]?.message?.content || '';
      const formattedType = outputType
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      return {
        title: `${formattedType} (OpenAI)`,
        content: content || 'OpenAI generation complete.',
      };
    } catch (err) {
      console.warn('OpenAI generation fallback:', err);
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
