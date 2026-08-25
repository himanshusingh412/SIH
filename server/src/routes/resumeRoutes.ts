import { Router } from 'express';
import multer from 'multer';
import {
  createOrParseResume,
  importExistingResume,
  saveResume,
  getResume,
  parseJobDescription,
  runATSScan,
  optimizeResume,
  getResumeVersions,
  createResumeVersion,
  restoreResumeVersion,
  deleteResumeVersion,
  generateCoverLetter,
  generateLinkedInProfile,
  getResumeAnalytics,
  exportResumeDocx,
  exportResumePdf,
} from '../controllers/resumeController';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

// Resume Core Endpoints
router.post('/resume/create', upload.single('file'), createOrParseResume);
router.post('/resume/parse', upload.single('file'), createOrParseResume);
router.post('/resume/import', upload.single('file'), importExistingResume);
router.post('/resume/upload', upload.single('file'), importExistingResume);
router.post('/resume/save', saveResume);
router.get('/resume/:id', getResume);

// ATS & Optimization Endpoints
router.post('/resume/ats-scan', runATSScan);
router.post('/resume/job-match', runATSScan);
router.post('/resume/optimize', optimizeResume);

// Resume Version Management Endpoints
router.get('/resume/:id/versions', getResumeVersions);
router.post('/resume/:id/versions', createResumeVersion);
router.post('/resume/:id/versions/restore', restoreResumeVersion);
router.delete('/resume/:id/versions/:vId', deleteResumeVersion);

// AI Generated Assets
router.post('/resume/cover-letter', generateCoverLetter);
router.post('/resume/linkedin', generateLinkedInProfile);

// Analytics & Exports
router.get('/resume/:id/analytics', getResumeAnalytics);
router.get('/resume/:id/export/docx', exportResumeDocx);
router.get('/resume/:id/export/pdf', exportResumePdf);

// Job Description Endpoints
router.post('/job/parse', upload.single('file'), parseJobDescription);
router.post('/job/match', runATSScan);

export default router;
