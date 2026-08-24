import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AIProvider,
  AudienceProfile,
  ContentSpineData,
  InputCategory,
  OutputType,
  ValidationIssue,
} from '../types';
import { MockAIProvider } from './mockProvider';

export class GeminiAIProvider implements AIProvider {
  name = 'Google Gemini AI';
  private genAI: GoogleGenerativeAI | null = null;
  private fallbackMock = new MockAIProvider();

  constructor(apiKey?: string) {
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async extractContentSpine(
    rawText: string,
    category: InputCategory
  ): Promise<ContentSpineData> {
    if (!this.genAI) {
      return this.fallbackMock.extractContentSpine(rawText, category);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are a Content Spine extraction engine. Extract facts from this text into JSON:
Summary, Entities (name, type, confidence), Dates (key, value, category, isLocked), Numbers (key, value, category, isLocked), Locations, Events, Risks, Recommendations, Claims, Relationships.

Text to analyze:
${rawText.slice(0, 4000)}

Respond strictly with valid JSON.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (err) {
      console.warn('Gemini extraction failed or no API key, using mock fallback:', err);
      return this.fallbackMock.extractContentSpine(rawText, category);
    }
  }

  async generateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    audience: AudienceProfile
  ): Promise<{ title: string; content: string }> {
    if (!this.genAI) {
      return this.fallbackMock.generateOutput(spine, outputType, audience);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Generate a ${outputType} for audience "${audience}" based strictly on this Content Spine JSON:
${JSON.stringify(spine, null, 2)}

Do NOT alter any locked numbers or dates. Keep strict fidelity to facts.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return { title: `${outputType} (${audience})`, content: text };
    } catch (err) {
      console.warn('Gemini generation failed, using mock fallback:', err);
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
