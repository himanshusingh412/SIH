import { Request, Response } from 'express';
import { agentService } from '../services/agentService';
import { prisma } from '../config';

export const askAgentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, query, sessionId } = req.body;
    if (!projectId || !query) {
      res.status(400).json({ success: false, error: 'projectId and query are required' });
      return;
    }

    const result = await agentService.askAgent(projectId, query, sessionId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const askVoiceAgentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, voiceId, queryText } = req.body;
    if (!projectId) {
      res.status(400).json({ success: false, error: 'projectId is required' });
      return;
    }

    const result = await agentService.askVoiceAgent(projectId, voiceId, queryText);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const testAgentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { agentId, testCases } = req.body;
    if (!agentId || !Array.isArray(testCases)) {
      res.status(400).json({ success: false, error: 'agentId and testCases array are required' });
      return;
    }

    const result = await agentService.runAgentTest(agentId, testCases);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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

    res.json({
      success: true,
      analytics: {
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
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
