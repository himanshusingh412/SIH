import { Request, Response } from 'express';
import { agentService } from '../services/agentService';
import { prisma } from '../config';
import { sendSuccess, sendError } from '../utils/response';

export const askAgentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, query, sessionId } = req.body;
    if (!projectId || !query) {
      sendError(res, 'projectId and query are required', 400, 'INVALID_REQUEST');
      return;
    }

    const result = await agentService.askAgent(projectId, query, sessionId);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'Agent query failed', 500, 'AGENT_QUERY_FAILED');
  }
};

export const askVoiceAgentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, voiceId, queryText } = req.body;
    if (!projectId) {
      sendError(res, 'projectId is required', 400, 'INVALID_REQUEST');
      return;
    }

    const result = await agentService.askVoiceAgent(projectId, voiceId, queryText);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'Voice agent interaction failed', 500, 'VOICE_AGENT_FAILED');
  }
};

export const testAgentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { agentId = 'demo-agent-id', projectId, testCases } = req.body;

    const result = await agentService.runAgentTest(agentId, testCases, projectId);
    sendSuccess(res, result);
  } catch (error: any) {
    console.error('❌ Agent Test Handler Failure:', error);
    sendError(
      res,
      error.message || 'The hallucination and fact test could not be completed.',
      500,
      'AGENT_TEST_FAILED'
    );
  }
};

export const getAnalyticsHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalProjects = await prisma.project.count();
    const totalContentSpines = await prisma.contentSpine.count();
    const totalFactsLocked = await prisma.fact.count({ where: { isLocked: true } });
    const totalOutputsGenerated = await prisma.outputVersion.count();
    const totalVoiceGenerations = await prisma.voiceGeneration.count();
    const totalTranscriptions = await prisma.transcript.count();
    const totalDubbingJobs = await prisma.dubbingProject.count();
    const totalAgentSessions = await prisma.agentSession.count();
    const totalMediaAssets = await prisma.mediaAsset.count();

    const validationScoreAvg = await prisma.validationResult.aggregate({
      _avg: { consistencyScore: true },
    });

    sendSuccess(res, {
      totalProjects,
      totalContentSpines,
      totalFactsLocked,
      totalOutputsGenerated,
      totalVoiceGenerations,
      totalTranscriptions,
      totalDubbingJobs,
      totalAgentSessions,
      totalMediaAssets,
      avgConsistencyScore: Math.round(validationScoreAvg._avg.consistencyScore || 100),
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve analytics', 500, 'ANALYTICS_FAILED');
  }
};
