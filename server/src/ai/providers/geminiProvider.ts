import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config';
import { AudienceProfile, ContentSpineData, InputCategory, OutputType, ValidationIssue } from '../../types';
import { parseGeminiError } from '../../utils/geminiErrorHandler';
import {
  geminiThrottle,
  isExpired,
  PROVIDER_CALL_BUDGET_MS,
  remainingMs,
  withTimeout,
} from '../../utils/aiThrottle';
import { providerHealthTracker } from '../../services/providerHealthService';
import { AICallOptions, AIProviderInstance, ProviderType } from './types';

const MAX_RETRIES = Math.max(1, Number(process.env.GEMINI_MAX_RETRIES) || 3);
const MAX_BACKOFF_MS = Math.max(1000, Number(process.env.GEMINI_MAX_BACKOFF_MS) || 8000);

/** Strips ASCII control characters that break JSON.parse, without embedding any literal control bytes. */
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F-\\u009F]', 'g');

/**
 * Model ids attempted in order. The configured model always goes first; the
 * rest exist purely so a wrong/retired model id degrades to a working one
 * instead of failing every request with a 404.
 */
const MODEL_FALLBACKS = [
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

/**
 * Deliverables the Review Workspace renders as real artefacts (a slide deck, an
 * infographic layout, a storyboard) rather than prose. For these we ask Gemini
 * for JSON in the exact shape the UI already knows how to draw, so a live
 * generation looks identical to the offline generator's output.
 */
const STRUCTURED_SPECS: Partial<Record<OutputType, { schema: string; rules: string }>> = {
  PRESENTATION: {
    schema: `[
  {
    "slideNumber": 1,
    "title": "Short slide headline",
    "bulletPoints": ["Concise bullet under 16 words", "Second bullet"],
    "speakerNotes": "What the presenter says on this slide.",
    "visualPrompt": "Optional description of the supporting visual."
  }
]`,
    rules: `- Return a JSON ARRAY of 5 to 7 slide objects and nothing else.
- Slide 1 is the title slide; the final slide states recommendations or next steps.
- 3 to 5 bulletPoints per slide, each a single line under 16 words. Never write paragraphs.
- Put full sentences in speakerNotes, not in bulletPoints.
- Do not use markdown syntax, tables, or pipe characters inside any string.`,
  },
  INFOGRAPHIC: {
    schema: `{
  "header": { "title": "INFOGRAPHIC HEADLINE", "subtitle": "One-line context" },
  "heroMetrics": [{ "label": "Metric name", "value": "30" }],
  "sectionCallouts": [{ "title": "Panel heading", "text": "One or two sentences." }],
  "footerNotes": "Optional source line."
}`,
    rules: `- Return a single JSON OBJECT and nothing else.
- heroMetrics: 3 to 6 entries drawn ONLY from the locked facts. label under 40 characters, value under 30 characters (a number, date, or short phrase).
- sectionCallouts: 2 to 4 panels of supporting narrative.
- Do not use markdown syntax, tables, or pipe characters inside any string.`,
  },
  VIDEO_PACKAGE: {
    schema: `{
  "title": "Video package title",
  "targetDurationSeconds": 60,
  "storyboard": [
    {
      "sceneNumber": 1,
      "timecode": "0:00 - 0:15",
      "title": "Scene headline",
      "visual": "What is on screen.",
      "voiceover": "Exact narration line.",
      "onScreenText": "Text overlay."
    }
  ],
  "callToAction": "Closing line."
}`,
    rules: `- Return a single JSON OBJECT and nothing else.
- storyboard: 3 to 5 scenes with consecutive sceneNumbers and non-overlapping timecodes that add up to targetDurationSeconds.
- Every scene needs visual, voiceover and onScreenText.
- Any figure or date in onScreenText must be a locked fact, copied exactly.
- Do not use markdown syntax, tables, or pipe characters inside any string.`,
  },
};

export class GeminiProvider implements AIProviderInstance {
  name = 'Google Gemini AI Provider';
  type: ProviderType = 'GEMINI';

  /** Model id proven to work with this key — avoids re-probing on every call. */
  private resolvedModel: string | null = null;
  private deadModels = new Set<string>();

  private getApiKey(): string {
    return config.aiApiKey || config.geminiApiKey || '';
  }

  getModelName(): string {
    return this.resolvedModel || config.aiModel || MODEL_FALLBACKS[0];
  }

  isConfigured(): boolean {
    return Boolean(this.getApiKey());
  }

  private modelCandidates(): string[] {
    const configured = (config.aiModel || '').trim();
    const ordered = [this.resolvedModel, configured, ...MODEL_FALLBACKS].filter(Boolean) as string[];
    return Array.from(new Set(ordered)).filter((m) => !this.deadModels.has(m));
  }

  private client(): GoogleGenerativeAI {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      const err: any = new Error('Gemini API key is missing on server.');
      err.code = 'GEMINI_NOT_CONFIGURED';
      err.status = 401;
      throw err;
    }
    return new GoogleGenerativeAI(apiKey);
  }

  /**
   * Single entry point for every upstream call:
   *   throttled -> retried with honest backoff -> model-failover on 404.
   * Throws a classified error; it never silently returns fake content (that
   * decision belongs to AIProviderManager's fallback chain).
   */
  private async callModel(
    prompt: string,
    options?: AICallOptions,
    generationConfig?: Record<string, unknown>
  ): Promise<string> {
    const genAI = this.client();
    const deadlineAt = options?.deadlineAt;
    let lastError: any;

    for (const modelName of this.modelCandidates()) {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (isExpired(deadlineAt)) {
          const err: any = new Error('Request budget exhausted before Gemini could respond.');
          err.code = 'AI_BUDGET_EXCEEDED';
          err.status = 429;
          throw err;
        }

        try {
          const callBudget = Math.min(PROVIDER_CALL_BUDGET_MS, Math.max(5000, remainingMs(deadlineAt)));
          const text = await geminiThrottle.run(async () => {
            const model = genAI.getGenerativeModel(
              generationConfig ? { model: modelName, generationConfig } : { model: modelName }
            );
            const result = await withTimeout(model.generateContent(prompt), callBudget, `Gemini (${modelName})`);
            return result.response.text();
          }, deadlineAt);

          if (!text || !text.trim()) {
            throw new Error('Gemini returned an empty response.');
          }

          if (this.resolvedModel !== modelName) {
            if (this.resolvedModel) {
              console.warn(`[GeminiProvider] Switched active model to "${modelName}".`);
            }
            this.resolvedModel = modelName;
          }
          geminiThrottle.reward();
          providerHealthTracker.recordSuccess('gemini');
          return text;
        } catch (err: any) {
          lastError = err;
          const info = parseGeminiError(err);

          if (info.isAuthError) throw err;

          if (info.isModelNotFound) {
            console.warn(`[GeminiProvider] Model "${modelName}" unavailable for this key - trying next candidate.`);
            this.deadModels.add(modelName);
            if (this.resolvedModel === modelName) this.resolvedModel = null;
            break; // move to the next model, do not burn retries
          }

          if (info.isRateLimited) {
            geminiThrottle.penalize(info.retryAfterSeconds);
            providerHealthTracker.recordRateLimit('gemini', info.retryAfterSeconds, info.message);
          }

          const isLastAttempt = attempt >= MAX_RETRIES;
          if (!info.isRetryable || isLastAttempt) {
            if (info.isRateLimited || !info.isRetryable) throw err;
            break;
          }

          const suggested = info.retryAfterSeconds > 0 ? info.retryAfterSeconds * 1000 : 2 ** attempt * 500;
          const backoffMs = Math.min(suggested, MAX_BACKOFF_MS);
          if (deadlineAt && Date.now() + backoffMs > deadlineAt) throw err;

          console.warn(
            `[GeminiProvider] ${info.code} on "${modelName}". Retry ${attempt}/${MAX_RETRIES} in ${backoffMs}ms.`
          );
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    throw lastError || new Error('Gemini is currently unavailable.');
  }

  /** Normalises any thrown error into the shape the manager/controllers expect. */
  private rethrow(err: any): never {
    const info = parseGeminiError(err);
    if (info.isRateLimited) {
      providerHealthTracker.recordRateLimit('gemini', info.retryAfterSeconds, info.message);
    } else {
      providerHealthTracker.recordError('gemini', info.message);
    }
    const wrapped: any = new Error(info.message);
    wrapped.code = err?.code === 'AI_BUDGET_EXCEEDED' ? 'AI_BUDGET_EXCEEDED' : info.code;
    wrapped.status = info.status;
    wrapped.retryAfterSeconds = info.retryAfterSeconds;
    wrapped.isRateLimited = info.isRateLimited;
    throw wrapped;
  }

  /**
   * Health/Connectivity Test (fired only when a user explicitly tests the provider)
   */
  async testConnection(): Promise<{
    success: boolean;
    model: string;
    message?: string;
    status?: string;
    retryAfterSeconds?: number;
  }> {
    if (!this.isConfigured()) {
      providerHealthTracker.recordError('gemini', 'Gemini API key is not configured on the server.');
      return {
        success: false,
        model: this.getModelName(),
        status: 'not_configured',
        message: 'Gemini API key is not configured on the server.',
      };
    }

    try {
      await this.callModel('ping');
      return { success: true, model: this.getModelName(), status: 'connected' };
    } catch (err: any) {
      const info = parseGeminiError(err);
      if (info.isRateLimited) {
        providerHealthTracker.recordRateLimit('gemini', info.retryAfterSeconds, info.message);
        return {
          success: false,
          model: this.getModelName(),
          status: 'rate_limited',
          retryAfterSeconds: info.retryAfterSeconds,
          message: info.message,
        };
      }
      providerHealthTracker.recordError('gemini', info.message);
      return {
        success: false,
        model: this.getModelName(),
        status: info.isAuthError ? 'not_configured' : 'unavailable',
        message: info.message,
      };
    }
  }

  async generateText(prompt: string, options?: AICallOptions): Promise<string> {
    try {
      return await this.callModel(prompt, options);
    } catch (err: any) {
      return this.rethrow(err);
    }
  }

  /** Tolerant JSON reader: handles code fences, prose padding and trailing commas. */
  private parseJsonReply(text: string): any | null {
    const cleaned = String(text || '').replace(/```(?:json)?/gi, '').trim();
    const candidates: string[] = [cleaned];

    const firstArray = cleaned.match(/\[[\s\S]*\]/);
    const firstObject = cleaned.match(/\{[\s\S]*\}/);
    if (firstArray) candidates.push(firstArray[0]);
    if (firstObject) candidates.push(firstObject[0]);

    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        return JSON.parse(candidate);
      } catch {
        try {
          return JSON.parse(candidate.replace(/,\s*([\]}])/g, '$1').replace(CONTROL_CHARS, ' '));
        } catch {
          /* try the next candidate */
        }
      }
    }
    return null;
  }

  async extractContentSpine(
    rawText: string,
    category: InputCategory,
    options?: AICallOptions
  ): Promise<ContentSpineData> {
    const prompt = `System Guardrail: You are ContentSpine AI Extraction Engine. Extract structured Content Spine from this ${category} text.
Return ONLY valid JSON matching this schema:
{
  "summary": "High-level executive summary...",
  "entities": [{ "id": "e1", "name": "...", "type": "ORGANIZATION", "confidence": 0.95 }],
  "dates": [{ "id": "f1", "key": "Date Key", "value": "2026-08-24", "category": "DATE", "isLocked": true, "sourceSnippet": "..." }],
  "numbers": [{ "id": "f2", "key": "Metric Key", "value": "11", "category": "NUMBER", "isLocked": true, "sourceSnippet": "..." }],
  "events": ["Event or timeline point 1"],
  "claims": ["Key factual claim 1"],
  "systemsAffected": ["System or component 1"],
  "risks": ["Risk assessment point 1"],
  "recommendations": ["Core recommendation point 1"],
  "factLocks": []
}

Source Content (${category}):
${rawText.slice(0, 8000)}`;

    try {
      const text = await this.callModel(prompt, options, { responseMimeType: 'application/json' });
      const parsed = this.parseJsonReply(text);
      if (!parsed) {
        throw new Error('Gemini output could not be parsed into valid Content Spine JSON format.');
      }

      const usable =
        parsed.summary ||
        (Array.isArray(parsed.dates) && parsed.dates.length > 0) ||
        (Array.isArray(parsed.numbers) && parsed.numbers.length > 0);
      if (!usable) {
        throw new Error('Gemini returned a Content Spine with no usable summary or facts.');
      }

      const lockedFacts = [
        ...(parsed.dates || []),
        ...(parsed.numbers || []),
        ...(parsed.events || []).map((ev: string, idx: number) => ({ id: `ev-${idx}`, key: `Event #${idx + 1}`, value: ev, category: 'EVENT', isLocked: true })),
        ...(parsed.claims || []).map((cl: string, idx: number) => ({ id: `cl-${idx}`, key: `Claim #${idx + 1}`, value: cl, category: 'CLAIM', isLocked: true })),
        ...(parsed.risks || []).map((rk: string, idx: number) => ({ id: `rk-${idx}`, key: `Risk #${idx + 1}`, value: rk, category: 'RISK', isLocked: true })),
        ...(parsed.recommendations || []).map((rc: string, idx: number) => ({ id: `rc-${idx}`, key: `Recommendation #${idx + 1}`, value: rc, category: 'RECOMMENDATION', isLocked: true })),
        ...(parsed.systemsAffected || []).map((sys: string, idx: number) => ({ id: `sys-${idx}`, key: `System Affected #${idx + 1}`, value: sys, category: 'SYSTEM', isLocked: true })),
      ].map((f: any) => ({ ...f, isLocked: true }));

      return {
        summary: parsed.summary || 'Structured Content Spine summary extracted.',
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
    } catch (err: any) {
      return this.rethrow(err);
    }
  }

  async generateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    audience: AudienceProfile,
    options?: AICallOptions
  ): Promise<{ title: string; content: string }> {
    const lockedFacts = (spine.factLocks || [])
      .filter((f) => f.isLocked)
      .map((f) => `${f.key}: ${f.value}`)
      .join('\n');

    const formattedType = outputType
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const spec = STRUCTURED_SPECS[outputType];

    const factBlock = `IMMUTABLE FACT LOCK RULES:
You MUST preserve all locked facts exactly as written. Never alter, round, or contradict these values:
${lockedFacts || 'None specified'}

SOURCE CONTENT SUMMARY:
${spine.summary}`;

    const prompt = spec
      ? `System Role: ContentSpine AI Deliverable Generator (${this.getModelName()}).
Task: Produce the ${formattedType} deliverable for target audience: ${audience}.

${factBlock}

OUTPUT SCHEMA - return JSON matching this shape exactly:
${spec.schema}

STRUCTURE RULES:
${spec.rules}
- Return raw JSON only. No commentary, no code fences, no disclaimers.`
      : `System Role: ContentSpine AI Deliverable Generator (${this.getModelName()}).
Task: Generate a ${outputType} deliverable for target audience: ${audience}.

${factBlock}

FORMATTING INSTRUCTIONS:
- Return clear, professional, production-ready markdown content.
- Do NOT add disclaimers or meta commentary.`;

    try {
      const text = await this.callModel(
        prompt,
        options,
        spec ? { responseMimeType: 'application/json' } : undefined
      );

      if (spec) {
        // Re-serialise so the stored deliverable is always clean, fence-free JSON.
        // If the reply cannot be parsed, keep the raw text - the Review Workspace
        // parses prose too, so a malformed reply still renders rather than failing.
        const parsed = this.parseJsonReply(text);
        if (parsed) {
          return { title: `${formattedType} (Gemini)`, content: JSON.stringify(parsed, null, 2) };
        }
        console.warn(`[GeminiProvider] ${outputType} did not return valid JSON - storing raw response.`);
      }

      return {
        title: `${formattedType} (Gemini)`,
        content: text || 'Gemini output generation completed.',
      };
    } catch (err: any) {
      return this.rethrow(err);
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
