import { Router } from 'express';
import multer from 'multer';
import {
  autoCorrect,
  createProject,
  exportProjectPackage,
  generateOutputs,
  getContentSpine,
  getOutputById,
  getProject,
  getProjectOutputs,
  getProjectValidation,
  ingestDocument,
  injectTestErrors,
  listProjects,
  processProjectSource,
  regenerateSingleOutput,
  seedDemoProject,
  updateFactLock,
  validateProject,
  validateSingleOutput,
} from '../controllers/projectController';
import { validateUploadFile } from '../middleware/security';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Projects
router.get('/projects', listProjects);
router.post('/projects', createProject);
router.post('/projects/seed-demo', seedDemoProject);
router.get('/projects/:id', getProject);

// Source Document Ingestion & Processing
router.post('/projects/:id/source', upload.single('file'), validateUploadFile, ingestDocument);
router.post('/projects/:id/ingest', upload.single('file'), validateUploadFile, ingestDocument);
router.post('/projects/:id/process', processProjectSource);
router.get('/projects/:id/content-spine', getContentSpine);
router.patch('/fact-locks/:factId', updateFactLock);

// Deliverable Generation & Outputs
router.post('/projects/:id/generate', generateOutputs);
router.get('/projects/:id/outputs', getProjectOutputs);
router.get('/outputs/:id', getOutputById);
router.post('/outputs/:id/validate', validateSingleOutput);
router.post('/outputs/:id/regenerate', regenerateSingleOutput);

// Validation, Auto-Correction & Export
router.post('/projects/:id/validate', validateProject);
router.get('/projects/:id/validation', getProjectValidation);
router.post('/projects/:id/auto-correct', autoCorrect);
router.post('/projects/:id/test-inject', injectTestErrors);
router.get('/projects/:id/export', exportProjectPackage);

export default router;
