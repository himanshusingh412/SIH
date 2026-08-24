import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config';
import { AudienceProfile, ContentSpineData, InputCategory, OutputType, ValidationIssue } from '../../types';
import { parseGeminiError } from '../../utils/geminiErrorHandler';
import { providerHealthTracker } from '../../services/providerHealthService';
import { AIProviderInstance, ProviderType } from './types';

export class GeminiProvider implements AIProviderInstance {
  name = 'Google Gemini AI Provider';
  type: ProviderType = 'GEMINI';

  private getApiKey(): string {
    return config.aiApiKey || config.geminiApiKey || '';
  }

  private getModelName(): string {
    return config.aiModel || 'gemini-3.1-flash-lite';
  }

  /**
   * Health/Connectivity Test (Fired ONLY when user explicitly tests provider)
   */
  async testConnection(): Promise<{ success: boolean; model: string; message?: string; status?: string; retryAfterSeconds?: number }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      providerHealthTracker.recordError('gemini', 'Gemini API key is not configured on the server.');
      return {
        success: false,
        model: this.getModelName(),
        status: 'not_configured',
        message: 'Gemini API key is not configured on the server.',
      };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: this.getModelName() });
      await model.generateContent('ping');
      providerHealthTracker.recordSuccess('gemini');
      return {
        success: true,
        model: this.getModelName(),
        status: 'connected',
      };
    } catch (err: any) {
      const rateInfo = parseGeminiError(err);
      if (rateInfo.isRateLimited) {
        providerHealthTracker.recordRateLimit('gemini', rateInfo.retryAfterSeconds, rateInfo.message);
        return {
          success: false,
          model: this.getModelName(),
          status: 'rate_limited',
          retryAfterSeconds: rateInfo.retryAfterSeconds,
          message: rateInfo.message,
        };
      }
      providerHealthTracker.recordError('gemini', rateInfo.message);
      return {
        success: false,
        model: this.getModelName(),
        status: 'unavailable',
        message: rateInfo.message,
      };
    }
  }

  async generateText(prompt: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini is currently unavailable. (AI_API_KEY is missing on server)');
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: this.getModelName() });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text) {
        throw new Error('Gemini returned an empty text response.');
      }
      providerHealthTracker.recordSuccess('gemini');
      return text;
    } catch (err: any) {
      const rateInfo = parseGeminiError(err);
      if (rateInfo.isRateLimited) {
        providerHealthTracker.recordRateLimit('gemini', rateInfo.retryAfterSeconds, rateInfo.message);
        const rateErr: any = new Error(rateInfo.message);
        rateErr.code = 'GEMINI_RATE_LIMITED';
        rateErr.status = 429;
        rateErr.retryAfterSeconds = rateInfo.retryAfterSeconds;
        throw rateErr;
      }
      providerHealthTracker.recordError('gemini', rateInfo.message);
      throw new Error(rateInfo.message);
    }
  }

  async extractContentSpine(rawText: string, category: InputCategory): Promise<ContentSpineData> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini is currently unavailable. (AI_API_KEY is missing on server)');
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: this.getModelName() });
      const prompt = `System Guardrail: You are ContentSpine AI Extraction Engine. Extract structured Content Spine from this ${category} text.
Return ONLY valid JSON matching this schema:
{
  "summary": "High-level executive summary...",
  "entities": [{ "id": "e1", "name": "...", "type": "ORGANIZATION", "confidence": 0.95, "sourceReference": "p. 1" }],
  "dates": [{ "id": "f1", "key": "Date", "value": "2026-08-24", "category": "DATE", "isLocked": true, "sourceSnippet": "2026-08-24" }],
  "numbers": [{ "id": "f2", "key": "Affected Systems", "value": "11", "category": "NUMBER", "isLocked": true, "sourceSnippet": "11 systems" }],
  "locations": [],
  "events": [],
  "risks": ["Risk assessment point"],
  "recommendations": ["Recommendation point"],
  "claims": [],
  "relationships": [],
  "factLocks": []
}

Source Content (${category}):
${rawText.slice(0, 5000)}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && parsed.summary) {
          const lockedFacts = [...(parsed.dates || []), ...(parsed.numbers || [])].map((f) => ({ ...f, isLocked: true }));
          providerHealthTracker.recordSuccess('gemini');
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
      throw new Error('Gemini output could not be parsed into valid Content Spine JSON format.');
    } catch (err: any) {
      const rateInfo = parseGeminiError(err);
      if (rateInfo.isRateLimited) {
        providerHealthTracker.recordRateLimit('gemini', rateInfo.retryAfterSeconds, rateInfo.message);
        const rateErr: any = new Error(rateInfo.message);
        rateErr.code = 'GEMINI_RATE_LIMITED';
        rateErr.status = 429;
        rateErr.retryAfterSeconds = rateInfo.retryAfterSeconds;
        throw rateErr;
      }
      providerHealthTracker.recordError('gemini', rateInfo.message);
      throw new Error(rateInfo.message);
    }
  }

  async generateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    audience: AudienceProfile
  ): Promise<{ title: string; content: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini is currently unavailable. (AI_API_KEY is missing on server)');
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: this.getModelName() });
      const lockedFacts = (spine.factLocks || [])
        .filter((f) => f.isLocked)
        .map((f) => `${f.key}: ${f.value}`)
        .join('\n');

      const prompt = `System Role: ContentSpine AI Deliverable Generator (${this.getModelName()}).
Task: Generate a ${outputType} deliverable for target audience: ${audience}.

IMMUTABLE FACT LOCK RULES:
You MUST preserve all locked facts exactly as written. Never alter, round, or contradict these values:
${lockedFacts || 'None specified'}

SOURCE CONTENT SUMMARY:
${spine.summary}

FORMATTING INSTRUCTIONS:
- Return clear, professional, production-ready markdown content.
- Do NOT add disclaimers or meta commentary.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const formattedType = outputType
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      providerHealthTracker.recordSuccess('gemini');
      return {
        title: `${formattedType} (Gemini)`,
        content: text || 'Gemini output generation completed.',
      };
    } catch (err: any) {
      const rateInfo = parseGeminiError(err);
      if (rateInfo.isRateLimited) {
        providerHealthTracker.recordRateLimit('gemini', rateInfo.retryAfterSeconds, rateInfo.message);
        const rateErr: any = new Error(rateInfo.message);
        rateErr.code = 'GEMINI_RATE_LIMITED';
        rateErr.status = 429;
        rateErr.retryAfterSeconds = rateInfo.retryAfterSeconds;
        throw rateErr;
      }
      providerHealthTracker.recordError('gemini', rateInfo.message);
      throw new Error(rateInfo.message);
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
