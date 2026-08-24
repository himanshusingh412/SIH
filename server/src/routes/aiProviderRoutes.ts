import { Router } from 'express';
import {
  getProvidersInfo,
  testProviderConnection,
  generateAIOutput,
} from '../controllers/aiProviderController';

const router = Router();

router.get('/providers', getProvidersInfo);
router.post('/providers/test', testProviderConnection);
router.post('/generate', generateAIOutput);

export default router;
