import { Router } from 'express';
import {
  getVoicesHandler,
  ttsHandler,
  cloneVoiceHandler,
  transcribeHandler,
  musicHandler,
  sfxHandler,
  dubbingHandler,
  getMediaAssetsHandler,
} from '../controllers/audioController';

const router = Router();

router.get('/voices', getVoicesHandler);
router.post('/tts', ttsHandler);
router.post('/clone', cloneVoiceHandler);
router.post('/transcribe', transcribeHandler);
router.post('/music', musicHandler);
router.post('/sfx', sfxHandler);
router.post('/dub', dubbingHandler);
router.get('/media/:projectId?', getMediaAssetsHandler);

export default router;
