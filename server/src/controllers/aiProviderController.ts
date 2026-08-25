import { Request, Response } from 'express';
import { config, prisma } from '../config';
import { GeminiProvider } from '../ai/providers/geminiProvider';
import { OpenAIProvider } from '../ai/providers/openAIProvider';
import { MockProvider } from '../ai/providers/mockProvider';
import { getAIProvider } from '../ai/provider';
import { AIProviderManager } from '../ai/providerManager';
import { sendSuccess, sendError } from '../utils/response';
import { formatValidator } from '../engine/formatEngine/formatValidator';
import { providerHealthTracker } from '../services/providerHealthService';

const geminiInst = new GeminiProvider();
const openAIInst = new OpenAIProvider();
const mockInst = new MockProvider();

/**
 * GET /api/ai/providers
 * Returns public configuration and availability status of AI providers using cached health state (NO EXTRA API QUOTA CONSUMED)
 */
export const getProvidersInfo = async (_req: Request, res: Response): Promise<void> => {
  try {
    const geminiHealth = providerHealthTracker.getHealth('gemini');
    const openAIHealth = providerHealthTracker.getHealth('openai');
    const mockHealth = providerHealthTracker.getHealth('mock');

    sendSuccess(res, {
      providers: {
        gemini: {
          id: 'gemini',
          name: 'Google Gemini',
          model: config.aiModel || 'gemini-3.1-flash-lite',
          configured: geminiHealth.configured,
          status: geminiHealth.status,
          message: geminiHealth.message,
          retryAfterSeconds: geminiHealth.retryAfterSeconds,
          remainingRetrySeconds: geminiHealth.remainingRetrySeconds,
        },
        openai: {
          id: 'openai',
          name: 'OpenAI',
          model: config.openaiModel || 'gpt-4o',
          configured: openAIHealth.configured,
          status: openAIHealth.status,
          message: openAIHealth.message,
          retryAfterSeconds: openAIHealth.retryAfterSeconds,
          remainingRetrySeconds: openAIHealth.remainingRetrySeconds,
        },
        mock: {
          id: 'mock',
          name: 'Mock AI',
          model: 'Demo / Testing Only',
          configured: true,
          status: 'connected',
          message: 'Mock AI — Demo / Testing Only',
        },
      },
      defaultProvider: config.aiProvider || 'gemini',
    });
  } catch (err: any) {
    sendError(res, err.message || 'Failed to retrieve AI providers info', 500, 'PROVIDERS_INFO_FAILED');
  }
};

/**
 * POST /api/ai/providers/test
 * Explicit connectivity test requested by user
 */
export const testProviderConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.body;
    if (!provider || typeof provider !== 'string') {
      sendError(res, 'Provider parameter is required.', 400, 'INVALID_PROVIDER');
      return;
    }

    const norm = provider.trim().toLowerCase();

    if (norm === 'gemini') {
      const result = await geminiInst.testConnection();
      if (result.success) {
        sendSuccess(res, {
          provider: 'gemini',
          status: 'connected',
          model: result.model,
        });
      } else if (result.status === 'rate_limited') {
        res.status(429).json({
          success: false,
          provider: 'gemini',
          status: 'rate_limited',
          error: {
            code: 'GEMINI_RATE_LIMITED',
            message: 'Gemini is temporarily rate-limited.',
            retryAfterSeconds: result.retryAfterSeconds || 45,
          },
        });
      } else {
        res.status(503).json({
          success: false,
          provider: 'gemini',
          status: result.status || 'unavailable',
          error: {
            code: result.status === 'not_configured' ? 'NOT_CONFIGURED' : 'PROVIDER_UNAVAILABLE',
            message: result.message || 'Google Gemini is currently unavailable.',
          },
        });
      }
      return;
    }

    if (norm === 'openai') {
      const result = await openAIInst.testConnection();
      if (result.success) {
        sendSuccess(res, {
          provider: 'openai',
          status: 'connected',
          model: result.model,
        });
      } else {
        res.status(503).json({
          success: false,
          provider: 'openai',
          status: 'unavailable',
          error: {
            code: 'PROVIDER_UNAVAILABLE',
            message: result.message || 'OpenAI is currently unavailable.',
          },
        });
      }
      return;
    }

    if (norm === 'mock') {
      sendSuccess(res, {
        provider: 'mock',
        status: 'connected',
        model: 'Demo / Testing Only',
      });
      return;
    }

    sendError(res, `Unknown provider '${provider}'. Valid providers: gemini, openai, mock`, 400, 'INVALID_PROVIDER');
  } catch (err: any) {
    sendError(res, err.message || 'Provider connection test failed', 500, 'PROVIDER_TEST_FAILED');
  }
};

/**
 * POST /api/ai/generate
 * Generate output deliverable with strict provider routing, rate limit awareness, and validation
 */
export const generateAIOutput = async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider, prompt, contentSpineId, projectId, outputType = 'EXECUTIVE_SUMMARY', audience = 'EXECUTIVE' } = req.body;

    if (!provider || typeof provider !== 'string') {
      sendError(res, 'Provider parameter is required.', 400, 'INVALID_PROVIDER');
      return;
    }

    const normProvider = provider.trim().toLowerCase();
    if (!['gemini', 'openai', 'mock'].includes(normProvider)) {
      sendError(res, `Invalid provider '${provider}'. Supported providers: gemini, openai, mock`, 400, 'INVALID_PROVIDER');
      return;
    }

    // Resolve Content Spine
    let spineData: any = null;
    let targetProjectId = projectId;

    if (contentSpineId) {
      const spineRecord = await prisma.contentSpine.findUnique({
        where: { id: contentSpineId },
        include: { facts: true, entities: true },
      });
      if (spineRecord) {
        targetProjectId = spineRecord.projectId;
        spineData = {
          summary: spineRecord.summary,
          entities: spineRecord.entities,
          factLocks: spineRecord.facts,
          risks: [],
          recommendations: [],
        };
      }
    }

    if (!spineData && targetProjectId) {
      const spineRecord = await prisma.contentSpine.findFirst({
        where: { projectId: targetProjectId },
        include: { facts: true, entities: true },
      });
      if (spineRecord) {
        spineData = {
          summary: spineRecord.summary,
          entities: spineRecord.entities,
          factLocks: spineRecord.facts,
          risks: [],
          recommendations: [],
        };
      }
    }

    if (!spineData) {
      const summaryText = prompt || 'ContentSpine AI Single Source of Truth Summary';
      spineData = await mockInst.extractContentSpine(summaryText, 'PROMPT');
    }

    // Select provider and generate deliverable with AIProviderManager Fallback Chain
    const generated = await AIProviderManager.generateOutput(spineData, outputType, audience, normProvider);

    const lockedFacts = (spineData.factLocks || []).map((f: any) => ({
      key: f.key || f.factKey,
      value: f.value || f.factValue,
    }));

    const valResult = await formatValidator.validateOutput({
      format: outputType,
      content: generated.content,
      lockedFacts,
    });

    const modelName =
      normProvider === 'gemini'
        ? config.aiModel || 'gemini-3.1-flash-lite'
        : normProvider === 'openai'
        ? config.openaiModel || 'gpt-4o'
        : 'Demo / Testing Only';

    sendSuccess(res, {
      provider: normProvider,
      model: modelName,
      title: generated.title,
      content: generated.content,
      outputType,
      audience,
      validation: {
        consistencyScore: valResult.passed ? 100 : 80,
        passed: valResult.passed,
        issues: valResult.issues,
      },
    });
  } catch (err: any) {
    if (err.code === 'GEMINI_RATE_LIMITED' || err.status === 429) {
      res.status(429).json({
        success: false,
        error: {
          code: 'GEMINI_RATE_LIMITED',
          message: 'Gemini is temporarily rate-limited.',
          retryAfterSeconds: err.retryAfterSeconds || 45,
        },
      });
      return;
    }
    sendError(res, err.message || 'AI deliverable generation failed', 500, 'AI_GENERATION_FAILED');
  }
};
