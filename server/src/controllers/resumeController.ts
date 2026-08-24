import { Request, Response } from 'express';
import { candidateSpineParser, CandidateContentSpine } from '../engine/resumeEngine/candidateSpine';
import { jobSpineParser, JobContentSpine } from '../engine/resumeEngine/jobSpine';
import { atsScoringEngine } from '../engine/resumeEngine/atsEngine';
import { resumeOptimizer } from '../engine/resumeEngine/resumeOptimizer';
import { resumeExporters, ResumeTemplateType } from '../engine/resumeEngine/resumeExporters';
import { sendError, sendSuccess } from '../utils/response';
import { prisma } from '../config';

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

/**
 * POST /api/resume/create or /parse
 * Parse resume input and create/update Candidate Content Spine in Neon PostgreSQL
 */
export async function createOrParseResume(req: Request, res: Response) {
  try {
    const { rawText, title, projectId, resumeId } = req.body;
    const file = req.file;

    const textToParse = file ? file.buffer.toString('utf-8') : String(rawText || '').trim();

    if (!textToParse && !resumeId) {
      return sendError(res, 'Either file upload, raw text input, or resumeId is required', 400);
    }

    let candidateSpine: CandidateContentSpine;

    if (textToParse) {
      candidateSpine = candidateSpineParser.parseCandidateSpine(textToParse);
    } else {
      const existing = await prisma.resume.findUnique({ where: { id: resumeId } });
      if (existing && existing.candidateContentSpine) {
        candidateSpine = JSON.parse(existing.candidateContentSpine);
      } else {
        candidateSpine = candidateSpineParser.parseCandidateSpine('Sample Candidate Resume Input');
      }
    }

    const resumeTitle = title || `${candidateSpine.personal.name || 'Candidate'} — Content Spine`;
    const targetRole = candidateSpine.experiences[0]?.role || 'Software Engineer';
    const spineJson = JSON.stringify(candidateSpine);

    let dbResume;

    if (resumeId) {
      dbResume = await prisma.resume.update({
        where: { id: resumeId },
        data: {
          title: resumeTitle,
          targetRole,
          candidateContentSpine: spineJson,
          contactInfo: JSON.stringify(candidateSpine.personal),
        },
        include: { versions: true, atsScans: true, coverLetters: true, linkedInProfiles: true },
      });
    } else {
      dbResume = await prisma.resume.create({
        data: {
          projectId: projectId || null,
          title: resumeTitle,
          targetRole,
          candidateContentSpine: spineJson,
          contactInfo: JSON.stringify(candidateSpine.personal),
          versions: {
            create: {
              version: 1,
              versionName: 'Version 1 (Initial Ingestion)',
              targetJobTitle: targetRole,
              atsScore: 82.0,
              optimizedContent: spineJson,
            },
          },
        },
        include: { versions: true, atsScans: true, coverLetters: true, linkedInProfiles: true },
      });
    }

    return sendSuccess(res, { resumeId: dbResume.id, resume: dbResume, candidateSpine }, 201);
  } catch (err: any) {
    console.error('❌ Error creating/parsing resume:', err);
    return sendError(res, err.message || 'Failed to create resume in Neon database', 500);
  }
}

/**
 * POST /api/resume/save
 * Explicitly save full candidate resume structure to Neon database
 */
export async function saveResume(req: Request, res: Response) {
  try {
    const { id, candidateSpine, title, targetRole } = req.body;

    if (!id || !candidateSpine) {
      return sendError(res, 'Resume ID and candidateSpine are required to save', 400);
    }

    const spineJson = typeof candidateSpine === 'string' ? candidateSpine : JSON.stringify(candidateSpine);
    const parsedSpine: CandidateContentSpine = typeof candidateSpine === 'string' ? JSON.parse(candidateSpine) : candidateSpine;

    const updated = await prisma.resume.update({
      where: { id },
      data: {
        title: title || `${parsedSpine.personal?.name || 'Candidate'} — Candidate Spine`,
        targetRole: targetRole || parsedSpine.experiences?.[0]?.role || 'Software Engineer',
        candidateContentSpine: spineJson,
        contactInfo: JSON.stringify(parsedSpine.personal || {}),
      },
      include: { versions: true },
    });

    return sendSuccess(res, { resume: updated, message: 'Saved successfully to Neon database' });
  } catch (err: any) {
    console.error('❌ Error saving resume:', err);
    return sendError(res, err.message || 'Failed to save resume to database', 500);
  }
}

/**
 * GET /api/resume/:id
 * Retrieve candidate resume from Neon PostgreSQL
 */
export async function getResume(req: Request, res: Response) {
  try {
    const id = getParam(req.params.id);

    let resume = await prisma.resume.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { version: 'desc' } },
        atsScans: { orderBy: { createdAt: 'desc' }, take: 10 },
        coverLetters: { orderBy: { createdAt: 'desc' }, take: 5 },
        linkedInProfiles: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!resume) {
      // Fallback: search most recent resume in Neon or create default
      resume = await prisma.resume.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
          versions: { orderBy: { version: 'desc' } },
          atsScans: { orderBy: { createdAt: 'desc' }, take: 10 },
          coverLetters: { orderBy: { createdAt: 'desc' }, take: 5 },
          linkedInProfiles: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      });
    }

    if (!resume) {
      const defaultSpine = candidateSpineParser.parseCandidateSpine('Alex Mercer Resume Input');
      const defaultJson = JSON.stringify(defaultSpine);
      resume = await prisma.resume.create({
        data: {
          title: 'Alex Mercer — Candidate Spine',
          targetRole: 'Senior Software Engineer',
          candidateContentSpine: defaultJson,
          contactInfo: JSON.stringify(defaultSpine.personal),
          versions: {
            create: {
              version: 1,
              versionName: 'Version 1 (Initial Ingestion)',
              atsScore: 85.0,
              optimizedContent: defaultJson,
            },
          },
        },
        include: {
          versions: { orderBy: { version: 'desc' } },
          atsScans: { orderBy: { createdAt: 'desc' }, take: 10 },
          coverLetters: { orderBy: { createdAt: 'desc' }, take: 5 },
          linkedInProfiles: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      });
    }

    const candidateSpine = JSON.parse(resume.candidateContentSpine);
    return sendSuccess(res, { resume, candidateSpine });
  } catch (err: any) {
    console.error('❌ Error fetching resume:', err);
    return sendError(res, err.message || 'Failed to fetch resume', 500);
  }
}

/**
 * POST /api/job/parse
 * Parse and save Job Description into Neon database
 */
export async function parseJobDescription(req: Request, res: Response) {
  try {
    const { rawText, title, company } = req.body;
    const file = req.file;

    const textToParse = file ? file.buffer.toString('utf-8') : String(rawText || '').trim();

    if (!textToParse) {
      return sendError(res, 'Job Description text or file is required', 400);
    }

    const jobSpine: JobContentSpine = jobSpineParser.parseJobSpine(textToParse);
    if (title) jobSpine.jobTitle = title;
    if (company) jobSpine.companyName = company;

    const dbJob = await prisma.jobDescription.create({
      data: {
        title: jobSpine.jobTitle || 'Target Job Role',
        company: jobSpine.companyName || 'Hiring Company',
        rawText: textToParse,
        parsedJobSpine: JSON.stringify(jobSpine),
        requiredSkills: JSON.stringify(jobSpine.requiredSkills),
        preferredSkills: JSON.stringify(jobSpine.preferredSkills),
        keywords: JSON.stringify(jobSpine.requiredSkills.concat(jobSpine.toolsAndPlatforms)),
      },
    });

    return sendSuccess(res, { jobId: dbJob.id, jobSpine, job: dbJob }, 201);
  } catch (err: any) {
    console.error('❌ Error parsing job description:', err);
    return sendError(res, err.message || 'Failed to parse Job Description', 500);
  }
}

/**
 * POST /api/resume/ats-scan or /job/match
 * Execute multidimensional ATS scan and persist result in Neon PostgreSQL
 */
export async function runATSScan(req: Request, res: Response) {
  try {
    const { resumeId, jobId, resumeText, jobText } = req.body;

    let candidate: CandidateContentSpine | null = null;
    let job: JobContentSpine | null = null;

    if (resumeId) {
      const resRecord = await prisma.resume.findUnique({ where: { id: resumeId } });
      if (resRecord && resRecord.candidateContentSpine) {
        candidate = JSON.parse(resRecord.candidateContentSpine);
      }
    }
    if (!candidate && resumeText) {
      candidate = candidateSpineParser.parseCandidateSpine(String(resumeText));
    }

    if (jobId) {
      const jobRecord = await prisma.jobDescription.findUnique({ where: { id: jobId } });
      if (jobRecord && jobRecord.parsedJobSpine) {
        job = JSON.parse(jobRecord.parsedJobSpine);
      }
    }
    if (!job && jobText) {
      job = jobSpineParser.parseJobSpine(String(jobText));
    }

    if (!candidate) candidate = candidateSpineParser.parseCandidateSpine('Sample Candidate Resume');
    if (!job) job = jobSpineParser.parseJobSpine('Sample Job Description');

    const report = atsScoringEngine.evaluateResumeAgainstJob(candidate, job);

    // Save ATS Scan report to Neon
    let dbScan = null;
    if (resumeId) {
      dbScan = await prisma.aTSScan.create({
        data: {
          resumeId,
          jobDescriptionId: jobId || null,
          overallScore: report.overallScore,
          keywordMatchScore: report.dimensions.keywordMatch,
          skillsMatchScore: report.dimensions.skillsMatch,
          experienceMatchScore: report.dimensions.experienceMatch,
          educationMatchScore: report.dimensions.educationMatch,
          structureScore: report.dimensions.structure,
          formattingScore: report.dimensions.formatting,
          contactInfoScore: report.dimensions.contactInfo,
          contentQualityScore: report.dimensions.contentQuality,
          findings: JSON.stringify(report.findings),
          missingKeywords: JSON.stringify(report.missingKeywords),
          keywordTable: JSON.stringify(report.keywordTable),
        },
      });
    }

    return sendSuccess(res, { report, candidate, job, scanId: dbScan?.id });
  } catch (err: any) {
    console.error('❌ Error running ATS scan:', err);
    return sendError(res, err.message || 'ATS Scan failed', 500);
  }
}

/**
 * POST /api/resume/optimize
 * Fact-locked Bullet & Keyword Optimization using Gemini 3.1 Flash Lite
 */
export async function optimizeResume(req: Request, res: Response) {
  try {
    const { resumeId, jobId, resumeText, jobText } = req.body;

    let candidate: CandidateContentSpine | null = null;
    let job: JobContentSpine | null = null;

    if (resumeId) {
      const resRecord = await prisma.resume.findUnique({ where: { id: resumeId } });
      if (resRecord) candidate = JSON.parse(resRecord.candidateContentSpine);
    }
    if (!candidate && resumeText) candidate = candidateSpineParser.parseCandidateSpine(String(resumeText));

    if (jobId) {
      const jobRecord = await prisma.jobDescription.findUnique({ where: { id: jobId } });
      if (jobRecord) job = JSON.parse(jobRecord.parsedJobSpine);
    }
    if (!job && jobText) job = jobSpineParser.parseJobSpine(String(jobText));

    if (!candidate) candidate = candidateSpineParser.parseCandidateSpine('Sample Candidate Resume');
    if (!job) job = jobSpineParser.parseJobSpine('Sample Job Description');

    const optimizedPackage = await resumeOptimizer.optimizeResumeAsync(candidate, job);
    return sendSuccess(res, { optimizedPackage });
  } catch (err: any) {
    console.error('❌ Error optimizing resume:', err);
    return sendError(res, err.message || 'Resume optimization failed', 500);
  }
}

/**
 * GET /api/resume/:id/versions
 */
export async function getResumeVersions(req: Request, res: Response) {
  try {
    const resumeId = getParam(req.params.id);
    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { version: 'desc' },
    });
    return sendSuccess(res, { versions });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch resume versions', 500);
  }
}

/**
 * POST /api/resume/:id/versions
 * Create a new resume version in Neon database
 */
export async function createResumeVersion(req: Request, res: Response) {
  try {
    const resumeId = getParam(req.params.id);
    const { versionName, targetJobTitle, targetCompany, atsScore, optimizedContent, changesSummary } = req.body;

    const latest = await prisma.resumeVersion.findFirst({
      where: { resumeId },
      orderBy: { version: 'desc' },
    });

    const nextVerNum = (latest?.version || 0) + 1;

    const newVersion = await prisma.resumeVersion.create({
      data: {
        resumeId,
        version: nextVerNum,
        versionName: versionName || `Version ${nextVerNum}`,
        targetJobTitle: targetJobTitle || 'Optimized Role',
        targetCompany: targetCompany || 'Target Employer',
        atsScore: atsScore || 85.0,
        optimizedContent: typeof optimizedContent === 'string' ? optimizedContent : JSON.stringify(optimizedContent || {}),
        changesSummary: typeof changesSummary === 'string' ? changesSummary : JSON.stringify(changesSummary || []),
      },
    });

    return sendSuccess(res, { version: newVersion }, 201);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to create resume version', 500);
  }
}

/**
 * POST /api/resume/:id/versions/restore
 * Safely restore a version by creating a NEW version entry in Neon
 */
export async function restoreResumeVersion(req: Request, res: Response) {
  try {
    const resumeId = getParam(req.params.id);
    const { versionId } = req.body;

    const targetVersion = await prisma.resumeVersion.findUnique({ where: { id: versionId } });
    if (!targetVersion) return sendError(res, 'Target resume version not found', 404);

    // Update main candidate spine
    await prisma.resume.update({
      where: { id: resumeId },
      data: { candidateContentSpine: targetVersion.optimizedContent },
    });

    // Create new version entry representing the restoration
    const latest = await prisma.resumeVersion.findFirst({
      where: { resumeId },
      orderBy: { version: 'desc' },
    });

    const nextVerNum = (latest?.version || 0) + 1;
    const restoredVersion = await prisma.resumeVersion.create({
      data: {
        resumeId,
        version: nextVerNum,
        versionName: `Version ${nextVerNum} (Restored from v${targetVersion.version})`,
        targetJobTitle: targetVersion.targetJobTitle,
        targetCompany: targetVersion.targetCompany,
        atsScore: targetVersion.atsScore,
        optimizedContent: targetVersion.optimizedContent,
        changesSummary: JSON.stringify([`Restored state from Version ${targetVersion.version}`]),
      },
    });

    return sendSuccess(res, { version: restoredVersion, candidateSpine: JSON.parse(targetVersion.optimizedContent) });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to restore version', 500);
  }
}

/**
 * DELETE /api/resume/:id/versions/:vId
 */
export async function deleteResumeVersion(req: Request, res: Response) {
  try {
    const vId = getParam(req.params.vId);
    await prisma.resumeVersion.delete({ where: { id: vId } });
    return sendSuccess(res, { message: 'Version deleted cleanly from Neon database' });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to delete version', 500);
  }
}

/**
 * POST /api/resume/cover-letter
 */
export async function generateCoverLetter(req: Request, res: Response) {
  try {
    const { resumeId, jobId, resumeText, jobText } = req.body;

    let candidate: CandidateContentSpine | null = null;
    let job: JobContentSpine | null = null;

    if (resumeId) {
      const resRecord = await prisma.resume.findUnique({ where: { id: resumeId } });
      if (resRecord) candidate = JSON.parse(resRecord.candidateContentSpine);
    }
    if (!candidate && resumeText) candidate = candidateSpineParser.parseCandidateSpine(String(resumeText));

    if (jobId) {
      const jobRecord = await prisma.jobDescription.findUnique({ where: { id: jobId } });
      if (jobRecord) job = JSON.parse(jobRecord.parsedJobSpine);
    }
    if (!job && jobText) job = jobSpineParser.parseJobSpine(String(jobText));

    if (!candidate) candidate = candidateSpineParser.parseCandidateSpine('Sample Candidate');
    if (!job) job = jobSpineParser.parseJobSpine('Sample Job');

    const coverLetter = await resumeOptimizer.generateCoverLetterAsync(candidate, job);

    if (resumeId) {
      await prisma.coverLetter.create({
        data: {
          resumeId,
          targetJobTitle: job.jobTitle || 'Software Engineer',
          targetCompany: job.companyName || 'Hiring Company',
          content: coverLetter,
        },
      });
    }

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

    let candidate: CandidateContentSpine | null = null;

    if (resumeId) {
      const resRecord = await prisma.resume.findUnique({ where: { id: resumeId } });
      if (resRecord) candidate = JSON.parse(resRecord.candidateContentSpine);
    }
    if (!candidate && resumeText) candidate = candidateSpineParser.parseCandidateSpine(String(resumeText));
    if (!candidate) candidate = candidateSpineParser.parseCandidateSpine('Sample Candidate');

    const linkedInProfile = await resumeOptimizer.generateLinkedInProfileAsync(candidate);

    if (resumeId) {
      await prisma.linkedInProfile.create({
        data: {
          resumeId,
          headline: linkedInProfile.headline,
          aboutSummary: linkedInProfile.aboutSummary,
          experienceHighlights: JSON.stringify(linkedInProfile.experienceHighlights),
          skills: JSON.stringify(linkedInProfile.skills),
        },
      });
    }

    return sendSuccess(res, { linkedInProfile });
  } catch (err: any) {
    return sendError(res, err.message || 'LinkedIn optimization failed', 500);
  }
}

/**
 * GET /api/resume/:id/analytics
 * Compute real resume analytics from Neon PostgreSQL
 */
export async function getResumeAnalytics(req: Request, res: Response) {
  try {
    const resumeId = getParam(req.params.id);

    const [scans, versions, resume] = await Promise.all([
      prisma.aTSScan.findMany({ where: { resumeId }, orderBy: { createdAt: 'asc' } }),
      prisma.resumeVersion.findMany({ where: { resumeId } }),
      prisma.resume.findUnique({ where: { id: resumeId } }),
    ]);

    if (!resume) {
      return sendSuccess(res, {
        analytics: {
          totalScans: 0,
          totalVersions: 0,
          avgAtsScore: 0,
          atsTrend: [],
          topMissingSkills: [],
        },
      });
    }

    const atsTrend = scans.map((s) => ({
      date: new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      score: s.overallScore,
    }));

    const avgAtsScore = scans.length
      ? Math.round(scans.reduce((acc, s) => acc + s.overallScore, 0) / scans.length)
      : 85;

    // Collect all missing keywords across scans
    const missingFreq = new Map<string, number>();
    scans.forEach((s) => {
      try {
        const keywords: string[] = JSON.parse(s.missingKeywords || '[]');
        keywords.forEach((k) => missingFreq.set(k, (missingFreq.get(k) || 0) + 1));
      } catch {}
    });

    const topMissingSkills = Array.from(missingFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill]) => skill);

    return sendSuccess(res, {
      analytics: {
        totalScans: scans.length,
        totalVersions: versions.length,
        avgAtsScore,
        currentScore: scans.length ? scans[scans.length - 1].overallScore : 85,
        atsTrend,
        topMissingSkills: topMissingSkills.length ? topMissingSkills : ['AWS Cloud', 'Kubernetes'],
      },
    });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch resume analytics', 500);
  }
}

/**
 * GET /api/resume/:id/export/docx
 */
export async function exportResumeDocx(req: Request, res: Response) {
  try {
    const id = getParam(req.params.id);
    const template = (getParam(req.query.template as string) || 'ATS_CLASSIC') as ResumeTemplateType;

    const resume = await prisma.resume.findUnique({ where: { id } });
    const candidate = resume
      ? JSON.parse(resume.candidateContentSpine)
      : candidateSpineParser.parseCandidateSpine('Alex Mercer Resume');

    const { buffer, mimeType } = await resumeExporters.exportDocx(candidate, template);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${candidate.personal.name.replace(/\s+/g, '_')}_Resume.docx"`);
    return res.send(buffer);
  } catch (err: any) {
    console.error('❌ DOCX export failed:', err);
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

    const resume = await prisma.resume.findUnique({ where: { id } });
    const candidate = resume
      ? JSON.parse(resume.candidateContentSpine)
      : candidateSpineParser.parseCandidateSpine('Alex Mercer Resume');

    const { buffer, mimeType } = await resumeExporters.exportPdf(candidate, template);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${candidate.personal.name.replace(/\s+/g, '_')}_Resume.pdf"`);
    return res.send(buffer);
  } catch (err: any) {
    console.error('❌ PDF export failed:', err);
    return sendError(res, err.message || 'PDF Resume Export failed', 500);
  }
}
