import { config } from '../../config';
import { AudienceProfile, ContentSpineData, InputCategory, OutputType, ValidationIssue } from '../../types';
import { AIProviderInstance, ProviderType } from './types';

export class OpenAIProvider implements AIProviderInstance {
  name = 'OpenAI Provider (GPT-4o)';
  type: ProviderType = 'OPENAI';

  private getApiKey(): string {
    return config.openaiApiKey || '';
  }

  private getModelName(): string {
    return config.openaiModel || 'gpt-4o';
  }

  /**
   * Health/Connectivity Test
   */
  async testConnection(): Promise<{ success: boolean; model: string; message?: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        model: this.getModelName(),
        message: 'OpenAI API key (OPENAI_API_KEY) is not configured on the server.',
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.getModelName(),
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        }),
      });

      if (!response.ok) {
        const errJson: any = await response.json().catch(() => ({}));
        return {
          success: false,
          model: this.getModelName(),
          message: errJson.error?.message || `OpenAI API returned HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        model: this.getModelName(),
      };
    } catch (err: any) {
      return {
        success: false,
        model: this.getModelName(),
        message: err.message || 'Failed to connect to OpenAI API.',
      };
    }
  }

  async generateText(prompt: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenAI is currently unavailable. (OPENAI_API_KEY is missing on server)');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.getModelName(),
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errJson: any = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `OpenAI API returned HTTP ${response.status}`);
      }

      const json: any = await response.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI returned an empty response.');
      }
      return content;
    } catch (err: any) {
      throw new Error(`OpenAI is currently unavailable: ${err.message || err}`);
    }
  }

  async extractContentSpine(rawText: string, category: InputCategory): Promise<ContentSpineData> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenAI is currently unavailable. (OPENAI_API_KEY is missing on server)');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.getModelName(),
          messages: [
            {
              role: 'system',
              content:
                'You are ContentSpine AI Extraction Engine. Extract structured Content Spine JSON. Return ONLY JSON matching schema: { summary, entities, dates, numbers, locations, events, risks, recommendations, claims, relationships, factLocks }.',
            },
            {
              role: 'user',
              content: `Source Category: ${category}\n\n${rawText.slice(0, 5000)}`,
            },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errJson: any = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `OpenAI API returned HTTP ${response.status}`);
      }

      const json: any = await response.json();
      const text = json.choices?.[0]?.message?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && parsed.summary) {
          const lockedFacts = [...(parsed.dates || []), ...(parsed.numbers || [])].map((f) => ({ ...f, isLocked: true }));
          return {
            summary: parsed.summary,
            entities: parsed.entities || [],
            dates: parsed.dates || [],
            numbers: parsed.numbers || [],
            locations: parsed.locations || [],
            events: parsed.events || [],
            risks: parsed.risks || [],
            recommendations: parsed.recommendations || [],
            claims: parsed.claims || [],
            relationships: parsed.relationships || [],
            factLocks: lockedFacts,
          };
        }
      }
      throw new Error('OpenAI output could not be parsed into valid Content Spine JSON format.');
    } catch (err: any) {
      throw new Error(`OpenAI is currently unavailable: ${err.message || err}`);
    }
  }

  async generateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    audience: AudienceProfile
  ): Promise<{ title: string; content: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenAI is currently unavailable. (OPENAI_API_KEY is missing on server)');
    }

    try {
      const lockedFacts = (spine.factLocks || [])
        .filter((f) => f.isLocked)
        .map((f) => `${f.key}: ${f.value}`)
        .join('\n');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.getModelName(),
          messages: [
            {
              role: 'system',
              content: `System Role: ContentSpine AI Deliverable Generator (${this.getModelName()}). Task: Generate a ${outputType} deliverable for target audience: ${audience}. IMMUTABLE FACT LOCK RULES: Preserve all locked facts exactly as written: ${lockedFacts || 'None'}. SOURCE SUMMARY: ${spine.summary}. Return production-ready markdown without meta commentary.`,
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
        const errJson: any = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `OpenAI API returned HTTP ${response.status}`);
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
    } catch (err: any) {
      throw new Error(`OpenAI is currently unavailable: ${err.message || err}`);
    }
  }

  async validateOutput(
    _spine: ContentSpineData,
    _outputType: OutputType,
    _content: string
  ): Promise<ValidationIssue[]> {
    return [];
  }
}
