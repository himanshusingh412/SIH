import { Request, Response } from 'express';
import { agentService } from '../services/agentService';
import { prisma } from '../config';
import { sendSuccess, sendError } from '../utils/response';

/**
 * POST /api/agents/knowledge and POST /api/agents/ask
 */
export const knowledgeAgentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.body.projectId;
    const message = req.body.message || req.body.query;
    const conversationId = req.body.conversationId || req.body.sessionId;
    const provider = req.body.provider;

    if (!projectId || typeof projectId !== 'string') {
      sendError(res, 'projectId is required and must be a string.', 400, 'INVALID_REQUEST');
      return;
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      sendError(res, 'message is required and must be a non-empty string.', 400, 'INVALID_REQUEST');
      return;
    }

    const result = await agentService.askKnowledgeAgent(projectId, message, conversationId, provider);

    if (result.success === false) {
      if (result.error?.code === 'GEMINI_RATE_LIMITED') {
        res.status(429).json(result);
        return;
      }
      res.status(400).json(result);
      return;
    }

    sendSuccess(res, result.data);
  } catch (error: any) {
    if (error.code === 'GEMINI_RATE_LIMITED' || error.status === 429) {
      res.status(429).json({
        success: false,
        error: {
          code: 'GEMINI_RATE_LIMITED',
          message: 'Gemini is temporarily rate-limited.',
          retryAfterSeconds: error.retryAfterSeconds || 45,
        },
      });
      return;
    }
    console.error('❌ Knowledge Agent Query Error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AGENT_QUERY_FAILED',
        message: error.message || 'Gemini could not answer right now.',
      },
    });
  }
};

/**
 * POST /api/agents/test
 */
export const testAgentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { agentId = 'demo-agent-id', projectId, testCases, provider } = req.body;

    const result = await agentService.runAgentTest(agentId, testCases, projectId, provider);
    sendSuccess(res, result);
  } catch (error: any) {
    if (error.code === 'GEMINI_RATE_LIMITED' || error.status === 429) {
      res.status(429).json({
        success: false,
        error: {
          code: 'GEMINI_RATE_LIMITED',
          message: 'Gemini is temporarily rate-limited.',
          retryAfterSeconds: error.retryAfterSeconds || 45,
        },
      });
      return;
    }
    console.error('❌ Agent Test Handler Failure:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AGENT_TEST_FAILED',
        message: error.message || 'The hallucination and fact test could not be completed.',
      },
    });
  }
};

/**
 * GET /api/agents/analytics
 */
export const getAnalyticsHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalProjects = await prisma.project.count();
    const totalContentSpines = await prisma.contentSpine.count();
    const totalFactsLocked = await prisma.fact.count({ where: { isLocked: true } });
    const totalOutputsGenerated = await prisma.outputVersion.count();
    const totalAgentSessions = await prisma.agentSession.count();

    const validationScoreAvg = await prisma.validationResult.aggregate({
      _avg: { consistencyScore: true },
    });

    sendSuccess(res, {
      analytics: {
        totalProjects,
        totalContentSpines,
        totalFactsLocked,
        totalOutputsGenerated,
        totalAgentSessions,
        avgConsistencyScore: Math.round(validationScoreAvg._avg.consistencyScore || 100),
      },
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve analytics', 500, 'ANALYTICS_FAILED');
  }
};
