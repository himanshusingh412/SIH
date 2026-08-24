import { Router } from 'express';
import {
  listConversationsHandler,
  getConversationByIdHandler,
  createConversationHandler,
  renameConversationHandler,
  deleteConversationHandler,
} from '../controllers/historyController';

const router = Router();

router.get('/conversations', listConversationsHandler);
router.get('/history', listConversationsHandler);

router.get('/conversations/:id', getConversationByIdHandler);
router.get('/history/:id', getConversationByIdHandler);

router.post('/conversations', createConversationHandler);
router.post('/history', createConversationHandler);

router.patch('/conversations/:id', renameConversationHandler);
router.patch('/history/:id', renameConversationHandler);

router.delete('/conversations/:id', deleteConversationHandler);
router.delete('/history/:id', deleteConversationHandler);

export default router;
