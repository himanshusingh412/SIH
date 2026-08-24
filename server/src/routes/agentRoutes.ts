import { Router } from 'express';
import {
  knowledgeAgentHandler,
  testAgentHandler,
  getAnalyticsHandler,
} from '../controllers/agentController';

const router = Router();

router.post('/knowledge', knowledgeAgentHandler);
router.post('/ask', knowledgeAgentHandler);
router.post('/test', testAgentHandler);
router.get('/analytics', getAnalyticsHandler);
router.post('/', knowledgeAgentHandler);

export default router;
