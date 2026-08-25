import { Router } from 'express';
import {
  knowledgeAgentHandler,
  testAgentHandler,
  getAnalyticsHandler,
} from '../controllers/agentController';
import { prototypeAgentHandler } from '../controllers/prototypeAgentController';

const router = Router();

router.post('/knowledge', knowledgeAgentHandler);
router.post('/ask', knowledgeAgentHandler);
router.post('/test', testAgentHandler);
router.get('/analytics', getAnalyticsHandler);
router.post('/prototype', prototypeAgentHandler);
router.post('/', knowledgeAgentHandler);

export default router;
