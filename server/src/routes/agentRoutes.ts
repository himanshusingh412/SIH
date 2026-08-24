import { Router } from 'express';
import {
  askAgentHandler,
  askVoiceAgentHandler,
  testAgentHandler,
  getAnalyticsHandler,
} from '../controllers/agentController';

const router = Router();

router.post('/ask', askAgentHandler);
router.post('/voice-ask', askVoiceAgentHandler);
router.post('/test', testAgentHandler);
router.get('/analytics', getAnalyticsHandler);

export default router;
