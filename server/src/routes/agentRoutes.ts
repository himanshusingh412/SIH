import { Router } from 'express';
import {
  askAgentHandler,
  testAgentHandler,
  getAnalyticsHandler,
} from '../controllers/agentController';

const router = Router();

router.post('/ask', askAgentHandler);
router.post('/test', testAgentHandler);
router.get('/analytics', getAnalyticsHandler);

export default router;
