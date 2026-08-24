import { Request, Response } from 'express';
import { ProjectService } from '../services/projectService';
import { sendError, sendSuccess } from '../utils/response';
import { AudienceProfile, InputCategory, OutputType } from '../types';

const service = new ProjectService();

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

/**
 * POST /api/projects
 * Create a new transformation project
 */
export async function createProject(req: Request, res: Response) {
  try {
    const { title, description, userId } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return sendError(res, 'Project title is required', 400);
    }

    const project = await service.createProject(
      title.trim(),
      description ? String(description).trim() : 'SIH 2026 Transformation Project',
      userId ? String(userId).trim() : undefined
    );
    return sendSuccess(res, { project }, 201);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to create project', 500);
  }
}

/**
 * GET /api/projects
 * List all projects
 */
export async function listProjects(_req: Request, res: Response) {
  try {
    const projects = await service.listProjects();
    return sendSuccess(res, { projects });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to list projects', 500);
  }
}

/**
 * GET /api/projects/:id
 * Get single project details by ID
 */
export async function getProject(req: Request, res: Response) {
  try {
    const projectId = getParam(req.params.id || req.params.projectId);
    if (!projectId) return sendError(res, 'Project ID is required', 400);

    const project = await service.getProject(projectId);
    if (!project) return sendError(res, 'Project not found', 404);

    return sendSuccess(res, { project });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch project', 500);
  }
}

/**
 * POST /api/projects/:id/source or /ingest
 * Ingest/add source document or raw text prompt to project
 */
export async function ingestDocument(req: Request, res: Response) {
  try {
    const projectId = getParam(req.params.id || req.params.projectId);
    if (!projectId) return sendError(res, 'Project ID is required', 400);

    const { category, rawText } = req.body;
    const file = req.file;

    if (!file && (!rawText || !String(rawText).trim())) {
      return sendError(res, 'Either a document file or raw text input is required', 400);
    }

    const result = await service.ingestDocument(
      projectId,
      file,
      (category as InputCategory) || 'PROMPT',
      rawText ? String(rawText).trim() : undefined
    );

    return sendSuccess(res, result, 201);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to ingest source document', 500);
  }
}

/**
 * POST /api/projects/:id/process
 * Process uploaded sources and generate/rebuild Content Spine
 */
export async function processProjectSource(req: Request, res: Response) {
  try {
    const projectId = getParam(req.params.id || req.params.projectId);
    if (!projectId) return sendError(res, 'Project ID is required', 400);

    const result = await service.processProjectSource(projectId);
    return sendSuccess(res, result);
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 500;
    return sendError(res, err.message || 'Failed to process project source', status);
  }
}

/**
 * GET /api/projects/:id/content-spine
 * Get Content Spine for project
 */
export async function getContentSpine(req: Request, res: Response) {
  try {
    const projectId = getParam(req.params.id || req.params.projectId);
    if (!projectId) return sendError(res, 'Project ID is required', 400);

    const spine = await service.getContentSpine(projectId);
    return sendSuccess(res, { spine });
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 500;
    return sendError(res, err.message || 'Failed to fetch Content Spine', status);
  }
}

/**
 * PATCH /api/fact-locks/:factId
 * Toggle lock status of a specific fact
 */
export async function updateFactLock(req: Request, res: Response) {
  try {
    const factId = getParam(req.params.factId);
    if (!factId) return sendError(res, 'Fact ID is required', 400);

    const { isLocked } = req.body;
    const updated = await service.toggleFactLock(factId, Boolean(isLocked));
    return sendSuccess(res, { fact: updated });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to update fact lock', 500);
  }
}

/**
 * POST /api/projects/:id/generate
 * Generate outputs for requested format types & audience profile
 */
export async function generateOutputs(req: Request, res: Response) {
  try {
    const projectId = getParam(req.params.id || req.params.projectId);
    if (!projectId) return sendError(res, 'Project ID is required', 400);

    const { outputTypes, audience } = req.body;

    const types: OutputType[] = Array.isArray(outputTypes) && outputTypes.length > 0
      ? outputTypes
      : [
          'EXECUTIVE_SUMMARY',
          'LINKEDIN_POST',
          'X_THREAD',
          'ADVISORY',
          'PRESENTATION',
          'INFOGRAPHIC',
          'VIDEO_PACKAGE',
        ];
    const audienceProfile: AudienceProfile = audience?.name || audience || 'EXECUTIVE';

    const result = await service.generateOutputs(projectId, types, audienceProfile);
    return sendSuccess(res, result);
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 500;
    return sendError(res, err.message || 'Failed to generate outputs', status);
  }
}

/**
 * GET /api/projects/:id/outputs
 * Get all generated outputs for a project
 */
export async function getProjectOutputs(req: Request, res: Response) {
  try {
    const projectId = getParam(req.params.id || req.params.projectId);
    if (!projectId) return sendError(res, 'Project ID is required', 400);

    const outputs = await service.getProjectOutputs(projectId);
    return sendSuccess(res, { outputs });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch project outputs', 500);
  }
}

/**
 * GET /api/outputs/:id
 * Get single output by ID
 */
export async function getOutputById(req: Request, res: Response) {
  try {
    const outputId = getParam(req.params.id || req.params.outputId);
    if (!outputId) return sendError(res, 'Output ID is required', 400);

    const output = await service.getOutputById(outputId);
    return sendSuccess(res, { output });
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 500;
    return sendError(res, err.message || 'Failed to fetch output', status);
  }
}

/**
 * POST /api/outputs/:id/validate
 * Run consistency check on a single output
 */
export async function validateSingleOutput(req: Request, res: Response) {
  try {
    const outputId = getParam(req.params.id || req.params.outputId);
    if (!outputId) return sendError(res, 'Output ID is required', 400);

    const report = await service.validateSingleOutput(outputId);
    return sendSuccess(res, { report });
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 500;
    return sendError(res, err.message || 'Failed to validate output', status);
  }
}

/**
 * POST /api/outputs/:id/regenerate
 * Regenerate a single output deliverable
 */
export async function regenerateSingleOutput(req: Request, res: Response) {
  try {
    const outputId = getParam(req.params.id || req.params.outputId);
    if (!outputId) return sendError(res, 'Output ID is required', 400);

    const { audience } = req.body;
    const audienceProfile: AudienceProfile = audience?.name || audience || 'EXECUTIVE';

    const output = await service.regenerateSingleOutput(outputId, audienceProfile);
    return sendSuccess(res, { output });
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 500;
    return sendError(res, err.message || 'Failed to regenerate output', status);
  }
}

/**
 * POST /api/projects/:id/validate
 * Runs project-wide consistency check and returns detailed report
 */
export async function validateProject(req: Request, res: Response) {
  try {
    const projectId = getParam(req.params.id || req.params.projectId);
    if (!projectId) return sendError(res, 'Project ID is required', 400);

    const result = await service.validateProjectOutputs(projectId);
    if (!result) return sendError(res, 'No outputs to validate for project', 404);

    let issues: any = [];
    let summary = { factsChecked: 0, passedCount: 0, warningsCount: 0, errorsCount: 0 };

    try {
      const envelope = JSON.parse(result.issuesFound || 'null');
      if (envelope && envelope._summary) {
        summary = envelope._summary;
        issues = envelope.issues || [];
      } else if (Array.isArray(envelope)) {
        issues = envelope;
      }
    } catch {
      issues = [];
    }

    const report = {
      consistencyScore: result.consistencyScore,
      passed: result.passed,
      factsChecked: summary.factsChecked,
      passedCount: summary.passedCount,
      warningsCount: summary.warningsCount,
      errorsCount: summary.errorsCount,
      autoCorrected: result.autoCorrected,
      issues,
      verifiedAt: result.createdAt,
    };

    return sendSuccess(res, { report });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to validate project', 500);
  }
}

/**
 * GET /api/projects/:id/validation
 * Fetch latest validation report for project
 */
export async function getProjectValidation(req: Request, res: Response) {
  try {
    const projectId = getParam(req.params.id || req.params.projectId);
    if (!projectId) return sendError(res, 'Project ID is required', 400);

    const report = await service.getProjectValidation(projectId);
    return sendSuccess(res, { report });
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 500;
    return sendError(res, err.message || 'Failed to fetch project validation', status);
  }
}

/**
 * GET /api/projects/:id/export
 * Return structured export bundle (JSON + Markdown) for project deliverables
 */
export async function exportProjectPackage(req: Request, res: Response) {
  try {
    const projectId = getParam(req.params.id || req.params.projectId);
    if (!projectId) return sendError(res, 'Project ID is required', 400);

    const packageData = await service.exportProjectPackage(projectId);
    return sendSuccess(res, packageData);
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 500;
    return sendError(res, err.message || 'Failed to export project package', status);
  }
}

/**
 * POST /api/projects/:id/auto-correct
 * Auto-correct discrepancies via Fact Protection loop
 */
export async function autoCorrect(req: Request, res: Response) {
  try {
    const projectId = getParam(req.params.id || req.params.projectId);
    if (!projectId) return sendError(res, 'Project ID is required', 400);

    const project = await service.autoCorrectOutputs(projectId);
    return sendSuccess(res, { project });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to auto-correct outputs', 500);
  }
}

/**
 * POST /api/projects/:id/test-inject
 * Test harness: Inject deliberate fact error
 */
export async function injectTestErrors(req: Request, res: Response) {
  try {
    const projectId = getParam(req.params.id || req.params.projectId);
    if (!projectId) return sendError(res, 'Project ID is required', 400);

    const { injections } = req.body;
    if (!Array.isArray(injections) || injections.length === 0) {
      return sendError(res, 'injections array is required in request body', 400);
    }

    const result = await service.injectTestErrors(projectId, injections);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to inject test errors', 500);
  }
}

/**
 * POST /api/projects/seed-demo
 * Seed benchmark SIH demo dataset
 */
export async function seedDemoProject(_req: Request, res: Response) {
  try {
    const demoText = `SIH 2026 Cyber Threat Intelligence & AI Platform Report.
Executive Summary: In Q3 2026, Smart India Hackathon introduced the AI Content Transformation Engine. The platform achieved 99.9% factual consistency across 500+ generated documents. Key milestone target date set for 2026-08-24. Ministry of Education and AI Innovation Cell verified zero fact drift across Executive Summaries, Advisories, Presentations, and Video Packages.`;

    const project = await service.createProject(
      'Demo: Cyber Threat Intelligence & AI Transformation',
      'SIH 2026 Official Demo Benchmark Dataset'
    );

    const ingestResult = await service.ingestDocument(
      project.id,
      undefined,
      'THREAT_INTEL',
      demoText
    );

    const genResult = await service.generateOutputs(
      project.id,
      [
        'EXECUTIVE_SUMMARY',
        'LINKEDIN_POST',
        'X_THREAD',
        'ADVISORY',
        'PRESENTATION',
        'INFOGRAPHIC',
        'VIDEO_PACKAGE',
      ],
      'EXECUTIVE'
    );

    const fullProject = await service.getProject(project.id);

    return sendSuccess(res, {
      projectId: project.id,
      project: fullProject,
      spine: ingestResult.spine,
      outputs: genResult.outputs,
      validationResult: genResult.validationResult,
    });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to seed demo project', 500);
  }
}
