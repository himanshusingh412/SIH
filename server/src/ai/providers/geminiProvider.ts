import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config';
import { AudienceProfile, ContentSpineData, InputCategory, OutputType, ValidationIssue } from '../../types';
import { MockProvider } from './mockProvider';
import { AIProviderInstance, ProviderType } from './types';

export class GeminiProvider implements AIProviderInstance {
  name = 'Google Gemini AI Provider';
  type: ProviderType = 'GEMINI';
  private fallbackMock = new MockProvider();

  private getModelName(): string {
    return config.aiModel || 'gemini-3.1-flash-lite';
  }

  async generateText(prompt: string): Promise<string> {
    const apiKey = config.aiApiKey || config.geminiApiKey;
    if (!apiKey || config.demoMode) {
      return this.fallbackMock.generateText(prompt);
    }

    try {
      const modelName = this.getModelName();
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text() || 'Gemini text response generated.';
    } catch (err: any) {
      if (!config.demoMode && apiKey) {
        throw new Error(`Gemini generateText API Error (${this.getModelName()}): ${err.message || err}`);
      }
      return this.fallbackMock.generateText(prompt);
    }
  }

  async extractContentSpine(rawText: string, category: InputCategory): Promise<ContentSpineData> {
    const apiKey = config.aiApiKey || config.geminiApiKey;
    if (!apiKey || config.demoMode) {
      return this.fallbackMock.extractContentSpine(rawText, category);
    }

    try {
      const modelName = this.getModelName();
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `Extract a Content Spine JSON from this text:\n\n${rawText.slice(0, 4000)}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return this.fallbackMock.extractContentSpine(text || rawText, category);
    } catch (err: any) {
      if (!config.demoMode && apiKey) {
        throw new Error(`Gemini Provider API Error (${this.getModelName()}): ${err.message || err}`);
      }
      return this.fallbackMock.extractContentSpine(rawText, category);
    }
  }

  async generateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    audience: AudienceProfile
  ): Promise<{ title: string; content: string }> {
    const apiKey = config.aiApiKey || config.geminiApiKey;
    if (!apiKey || config.demoMode) {
      return this.fallbackMock.generateOutput(spine, outputType, audience);
    }

    try {
      const modelName = this.getModelName();
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const lockedFacts = (spine.factLocks || [])
        .filter((f) => f.isLocked)
        .map((f) => `${f.key}: ${f.value}`)
        .join(', ');

      const prompt = `You are an AI deliverable generator for SIH 2026. Generate a ${outputType} for audience ${audience}.
HARD CONSTRAINTS:
- Do NOT change locked facts: ${lockedFacts}
- Content Spine summary: ${spine.summary}

Provide formatted deliverable content.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return {
        title: `${outputType.replace(/_/g, ' ')} (${audience}) — Gemini (${modelName})`,
        content: text || 'Gemini output generation completed.',
      };
    } catch (err: any) {
      if (!config.demoMode && apiKey) {
        throw new Error(`Gemini Generation API Error (${this.getModelName()}): ${err.message || err}`);
      }
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
