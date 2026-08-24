import { Router } from 'express';
import {
  uploadMiddleware,
  uploadSourceMedia,
  convertMedia,
  getConversionStatus,
  cancelConversion,
  streamMediaFile,
  downloadMediaFile,
  listMediaAssets,
  deleteMediaAsset,
} from '../controllers/mediaController';

const router = Router();

router.post('/upload', uploadMiddleware.single('file'), uploadSourceMedia);
router.post('/convert', convertMedia);
router.get('/conversions/:id', getConversionStatus);
router.post('/conversions/:id/cancel', cancelConversion);
router.get('/stream/:id', streamMediaFile);
router.get('/download/:id', downloadMediaFile);
router.get('/library', listMediaAssets);
router.delete('/:id', deleteMediaAsset);

export default router;
