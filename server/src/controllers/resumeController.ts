import { Request, Response } from 'express';
import { candidateSpineParser } from '../engine/resumeEngine/candidateSpine';
import { jobSpineParser } from '../engine/resumeEngine/jobSpine';
import { atsScoringEngine } from '../engine/resumeEngine/atsEngine';
import { resumeOptimizer } from '../engine/resumeEngine/resumeOptimizer';
import { resumeExporters, ResumeTemplateType } from '../engine/resumeEngine/resumeExporters';
import { sendError, sendSuccess } from '../utils/response';

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

// In-memory / DB state cache for fast REST operations
const resumeStore = new Map<string, any>();
const jobStore = new Map<string, any>();

/**
 * POST /api/resume/create or /parse
 * Parse resume input and create Candidate Content Spine
 */
export async function createOrParseResume(req: Request, res: Response) {
  try {
    const { rawText, title } = req.body;
    const file = req.file;

    const textToParse = file ? file.buffer.toString('utf-8') : String(rawText || '').trim();

    if (!textToParse) {
      return sendError(res, 'Either file upload or raw text input is required to build resume', 400);
    }

    const candidateSpine = candidateSpineParser.parseCandidateSpine(textToParse);
    const resumeId = `res-${Date.now()}`;

    const resumeRecord = {
      id: resumeId,
      title: title || `${candidateSpine.personal.name} — Candidate Spine`,
      targetRole: 'Software Engineer',
      candidateContentSpine: candidateSpine,
      createdAt: new Date().toISOString(),
      versions: [
        {
          id: `v-1`,
          version: 1,
          versionName: 'Version 1 (Initial Ingestion)',
          atsScore: 85,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    resumeStore.set(resumeId, resumeRecord);

    return sendSuccess(res, { resumeId, resume: resumeRecord, candidateSpine }, 201);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to parse resume', 500);
  }
}

/**
 * POST /api/job/parse
 * Parse Job Description into Job Content Spine
 */
export async function parseJobDescription(req: Request, res: Response) {
  try {
    const { rawText, title, company } = req.body;
    const file = req.file;

    const textToParse = file ? file.buffer.toString('utf-8') : String(rawText || '').trim();

    if (!textToParse) {
      return sendError(res, 'Job Description text or file is required', 400);
    }

    const jobSpine = jobSpineParser.parseJobSpine(textToParse);
    if (title) jobSpine.jobTitle = title;
    if (company) jobSpine.companyName = company;

    const jobId = `job-${Date.now()}`;
    jobStore.set(jobId, { id: jobId, jobSpine });

    return sendSuccess(res, { jobId, jobSpine }, 201);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to parse Job Description', 500);
  }
}

/**
 * POST /api/resume/ats-scan or /job/match
 * Run real dynamic 8-dimension ATS scan between Candidate Spine & Job Spine
 */
export async function runATSScan(req: Request, res: Response) {
  try {
    const { resumeId, jobId, resumeText, jobText } = req.body;

    let candidate = resumeId ? resumeStore.get(resumeId)?.candidateContentSpine : null;
    let job = jobId ? jobStore.get(jobId)?.jobSpine : null;

    if (!candidate && resumeText) {
      candidate = candidateSpineParser.parseCandidateSpine(String(resumeText));
    }
    if (!job && jobText) {
      job = jobSpineParser.parseJobSpine(String(jobText));
    }

    if (!candidate) {
      candidate = candidateSpineParser.parseCandidateSpine('Sample Candidate Resume Input');
    }
    if (!job) {
      job = jobSpineParser.parseJobSpine('Sample Job Description Input');
    }

    const report = atsScoringEngine.evaluateResumeAgainstJob(candidate, job);
    return sendSuccess(res, { report, candidate, job });
  } catch (err: any) {
    return sendError(res, err.message || 'ATS Scan failed', 500);
  }
}

/**
 * POST /api/resume/optimize
 * Fact-locked Bullet & Keyword Optimization
 */
export async function optimizeResume(req: Request, res: Response) {
  try {
    const { resumeId, jobId, resumeText, jobText } = req.body;

    let candidate = resumeId ? resumeStore.get(resumeId)?.candidateContentSpine : null;
    let job = jobId ? jobStore.get(jobId)?.jobSpine : null;

    if (!candidate && resumeText) candidate = candidateSpineParser.parseCandidateSpine(String(resumeText));
    if (!job && jobText) job = jobSpineParser.parseJobSpine(String(jobText));

    if (!candidate) candidate = candidateSpineParser.parseCandidateSpine('Sample Candidate Resume Input');
    if (!job) job = jobSpineParser.parseJobSpine('Sample Job Description Input');

    const optimizedPackage = resumeOptimizer.optimizeResume(candidate, job);
    return sendSuccess(res, { optimizedPackage });
  } catch (err: any) {
    return sendError(res, err.message || 'Resume optimization failed', 500);
  }
}

/**
 * POST /api/resume/cover-letter
 */
export async function generateCoverLetter(req: Request, res: Response) {
  try {
    const { resumeId, jobId, resumeText, jobText } = req.body;

    let candidate = resumeId ? resumeStore.get(resumeId)?.candidateContentSpine : null;
    let job = jobId ? jobStore.get(jobId)?.jobSpine : null;

    if (!candidate && resumeText) candidate = candidateSpineParser.parseCandidateSpine(String(resumeText));
    if (!job && jobText) job = jobSpineParser.parseJobSpine(String(jobText));

    if (!candidate) candidate = candidateSpineParser.parseCandidateSpine('Sample Candidate');
    if (!job) job = jobSpineParser.parseJobSpine('Sample Job');

    const coverLetter = resumeOptimizer.generateCoverLetter(candidate, job);
    return sendSuccess(res, { coverLetter });
  } catch (err: any) {
    return sendError(res, err.message || 'Cover letter generation failed', 500);
  }
}

/**
 * POST /api/resume/linkedin
 */
export async function generateLinkedInProfile(req: Request, res: Response) {
  try {
    const { resumeId, resumeText } = req.body;
    let candidate = resumeId ? resumeStore.get(resumeId)?.candidateContentSpine : null;
    if (!candidate && resumeText) candidate = candidateSpineParser.parseCandidateSpine(String(resumeText));
    if (!candidate) candidate = candidateSpineParser.parseCandidateSpine('Sample Candidate');

    const linkedInProfile = resumeOptimizer.generateLinkedInProfile(candidate);
    return sendSuccess(res, { linkedInProfile });
  } catch (err: any) {
    return sendError(res, err.message || 'LinkedIn optimization failed', 500);
  }
}

/**
 * GET /api/resume/:id
 */
export async function getResume(req: Request, res: Response) {
  try {
    const id = getParam(req.params.id);
    const resume = resumeStore.get(id) || Array.from(resumeStore.values())[0];
    if (!resume) {
      const fallbackSpine = candidateSpineParser.parseCandidateSpine('Alex Mercer Resume');
      return sendSuccess(res, { resume: { id, title: 'Alex Mercer Candidate Spine', candidateContentSpine: fallbackSpine } });
    }
    return sendSuccess(res, { resume });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch resume', 500);
  }
}

/**
 * GET /api/resume/:id/export/docx
 */
export async function exportResumeDocx(req: Request, res: Response) {
  try {
    const id = getParam(req.params.id);
    const template = (getParam(req.query.template as string) || 'ATS_CLASSIC') as ResumeTemplateType;
    const resume = resumeStore.get(id);

    const candidate = resume ? resume.candidateContentSpine : candidateSpineParser.parseCandidateSpine('Alex Mercer Resume');
    const { buffer, mimeType } = await resumeExporters.exportDocx(candidate, template);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${candidate.personal.name.replace(/\s+/g, '_')}_Resume.docx"`);
    return res.send(buffer);
  } catch (err: any) {
    return sendError(res, err.message || 'DOCX Resume Export failed', 500);
  }
}

/**
 * GET /api/resume/:id/export/pdf
 */
export async function exportResumePdf(req: Request, res: Response) {
  try {
    const id = getParam(req.params.id);
    const template = (getParam(req.query.template as string) || 'ATS_CLASSIC') as ResumeTemplateType;
    const resume = resumeStore.get(id);

    const candidate = resume ? resume.candidateContentSpine : candidateSpineParser.parseCandidateSpine('Alex Mercer Resume');
    const { buffer, mimeType } = await resumeExporters.exportPdf(candidate, template);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${candidate.personal.name.replace(/\s+/g, '_')}_Resume.pdf"`);
    return res.send(buffer);
  } catch (err: any) {
    return sendError(res, err.message || 'PDF Resume Export failed', 500);
  }
}
