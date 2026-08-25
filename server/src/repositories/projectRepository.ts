import { prisma } from '../config';
import { ensureDbSchema } from '../config/dbInit';

export class ProjectRepository {
  async createProject(title: string, description?: string, userId?: string) {
    await ensureDbSchema();
    return prisma.project.create({
      data: {
        title,
        description,
        userId,
      },
    });
  }

  async findProjectById(projectId: string) {
    await ensureDbSchema();
    return prisma.project.findUnique({
      where: { id: projectId },
      include: {
        sourceDocuments: true,
        contentSpines: {
          orderBy: { version: 'desc' },
          include: {
            facts: { include: { references: true } },
            entities: { include: { references: true } },
          },
        },
        outputs: { include: { versions: { orderBy: { version: 'desc' } }, audienceProfile: true } },
        validationResults: { orderBy: { createdAt: 'desc' }, take: 1 },
        generationJobs: { orderBy: { createdAt: 'desc' }, take: 5 },
        audienceProfiles: true,
      },
    });
  }

  async listProjects() {
    await ensureDbSchema();
    return prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sourceDocuments: true,
        outputs: true,
        validationResults: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  async getDashboardStats() {
    await ensureDbSchema();

    // 1. Active Projects Count
    const activeProjectsCount = await prisma.project.count({
      where: { status: { not: 'DELETED' } },
    });

    // 2. Fact Locks Enforced Count
    const factLocksCount = await prisma.fact.count({
      where: { isLocked: true },
    });

    // 3. Deliverables Built Count
    const deliverablesCount = await prisma.output.count();

    // 4. Factual Consistency Rate
    const validationResults = await prisma.validationResult.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    let consistencyRate = 100;
    if (validationResults.length > 0) {
      const avgScore =
        validationResults.reduce((acc, v) => acc + (v.consistencyScore || 100), 0) /
        validationResults.length;
      consistencyRate = Math.round(avgScore * 10) / 10;
    }

    // 5. Recent Projects
    const recentProjects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        sourceDocuments: true,
        outputs: true,
        validationResults: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    return {
      activeProjectsCount,
      factLocksCount,
      deliverablesCount,
      consistencyRate,
      recentProjects,
    };
  }

  async createSourceDocument(data: {
    projectId: string;
    filename: string;
    fileType: string;
    inputCategory: string;
    rawText: string;
    fileSize?: number;
    pageCount?: number;
  }) {
    const doc = await prisma.sourceDocument.create({
      data,
    });

    // Update project status to INGESTED
    await prisma.project.update({
      where: { id: data.projectId },
      data: { status: 'INGESTED' },
    });

    return doc;
  }

  async findSourceDocumentsByProjectId(projectId: string) {
    return prisma.sourceDocument.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findContentSpineByProjectId(projectId: string) {
    return prisma.contentSpine.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
      include: {
        facts: { include: { references: true } },
        entities: { include: { references: true } },
      },
    });
  }

  async saveContentSpine(projectId: string, summary: string, facts: any[], entities: any[]) {
    // Delete existing spines for project
    await prisma.contentSpine.deleteMany({ where: { projectId } });

    const spine = await prisma.contentSpine.create({
      data: {
        projectId,
        summary,
        version: 1,
      },
    });

    // Create Facts
    for (const f of (facts || [])) {
      const factKey = String(f.key || f.factKey || 'Extracted Fact').trim();
      const factValue = String(f.value || f.factValue || '').trim();
      if (!factValue) continue;

      const createdFact = await prisma.fact.create({
        data: {
          contentSpineId: spine.id,
          factKey: factKey || 'Fact Anchor',
          factValue,
          category: f.category || 'CLAIM',
          isLocked: f.isLocked !== undefined ? f.isLocked : true,
          confidence: f.confidence || 1.0,
        },
      });

      if (f.sourceSnippet && f.sourceDocumentId) {
        await prisma.sourceReference.create({
          data: {
            sourceDocumentId: f.sourceDocumentId,
            factId: createdFact.id,
            snippetText: String(f.sourceSnippet),
            pageNumber: f.pageNumber || 1,
          },
        });
      }
    }

    // Create Entities
    for (const e of (entities || [])) {
      const entityName = typeof e === 'string' ? e.trim() : (e?.name || e?.value || String(e || '')).trim();
      if (!entityName) continue;

      const entityType = typeof e === 'string' ? 'ORGANIZATION' : (e?.type || 'ORGANIZATION');
      const confidence = typeof e === 'number' ? e : (typeof e === 'object' && e?.confidence ? e.confidence : 1.0);

      await prisma.entity.create({
        data: {
          contentSpineId: spine.id,
          name: entityName,
          type: entityType,
          confidence: confidence,
        },
      });
    }

    return this.findProjectById(projectId);
  }

  async updateProjectTitle(projectId: string, title: string) {
    await ensureDbSchema();
    return prisma.project.update({
      where: { id: projectId },
      data: { title },
    });
  }

  async toggleFactLock(factId: string, isLocked: boolean) {
    return prisma.fact.update({
      where: { id: factId },
      data: { isLocked },
    });
  }

  async findOutputById(outputId: string) {
    return prisma.output.findUnique({
      where: { id: outputId },
      include: {
        project: true,
        versions: { orderBy: { version: 'desc' } },
        audienceProfile: true,
      },
    });
  }

  async findOutputsByProjectId(projectId: string) {
    return prisma.output.findMany({
      where: { projectId },
      include: {
        versions: { orderBy: { version: 'desc' } },
        audienceProfile: true,
      },
    });
  }

  async saveOutput(data: {
    projectId: string;
    outputType: string;
    audienceProfileName: string;
    title: string;
    content: string;
    isConsistent?: boolean;
    createdReason?: string;
  }) {
    // Ensure AudienceProfile exists
    let audience = await prisma.audienceProfile.findFirst({
      where: { projectId: data.projectId, name: data.audienceProfileName },
    });

    if (!audience) {
      audience = await prisma.audienceProfile.create({
        data: {
          projectId: data.projectId,
          name: data.audienceProfileName,
        },
      });
    }

    const existingOutput = await prisma.output.findFirst({
      where: {
        projectId: data.projectId,
        outputType: data.outputType,
      },
      include: { versions: true },
    });

    if (existingOutput) {
      const nextVerNumber = existingOutput.versions.length + 1;
      const updatedOutput = await prisma.output.update({
        where: { id: existingOutput.id },
        data: {
          audienceProfileId: audience.id,
          isConsistent: data.isConsistent !== undefined ? data.isConsistent : true,
        },
      });

      const version = await prisma.outputVersion.create({
        data: {
          outputId: existingOutput.id,
          version: nextVerNumber,
          title: data.title,
          content: data.content,
          createdReason: data.createdReason || 'RE_GENERATION',
        },
      });

      await prisma.output.update({
        where: { id: existingOutput.id },
        data: { currentVersionId: version.id },
      });

      // Update project status to GENERATED
      await prisma.project.update({
        where: { id: data.projectId },
        data: { status: 'GENERATED' },
      });

      return updatedOutput;
    } else {
      const newOutput = await prisma.output.create({
        data: {
          projectId: data.projectId,
          outputType: data.outputType,
          audienceProfileId: audience.id,
          isConsistent: data.isConsistent !== undefined ? data.isConsistent : true,
        },
      });

      const version = await prisma.outputVersion.create({
        data: {
          outputId: newOutput.id,
          version: 1,
          title: data.title,
          content: data.content,
          createdReason: data.createdReason || 'INITIAL_GENERATION',
        },
      });

      await prisma.output.update({
        where: { id: newOutput.id },
        data: { currentVersionId: version.id },
      });

      await prisma.project.update({
        where: { id: data.projectId },
        data: { status: 'GENERATED' },
      });

      return newOutput;
    }
  }

  async saveValidationResult(data: {
    projectId: string;
    consistencyScore: number;
    passed: boolean;
    issuesFound: any[];
    autoCorrected?: boolean;
    factsChecked?: number;
    passedCount?: number;
    warningsCount?: number;
    errorsCount?: number;
  }) {
    const envelope = {
      _summary: {
        factsChecked: data.factsChecked ?? 0,
        passedCount: data.passedCount ?? 0,
        warningsCount: data.warningsCount ?? 0,
        errorsCount: data.errorsCount ?? 0,
      },
      issues: data.issuesFound,
    };

    const val = await prisma.validationResult.create({
      data: {
        projectId: data.projectId,
        consistencyScore: data.consistencyScore,
        passed: data.passed,
        issuesFound: JSON.stringify(envelope),
        autoCorrected: data.autoCorrected || false,
      },
    });

    await prisma.project.update({
      where: { id: data.projectId },
      data: { status: 'VALIDATED' },
    });

    return val;
  }

  async findLatestValidationResult(projectId: string) {
    return prisma.validationResult.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGenerationJob(projectId: string, outputTypes: string[]) {
    return prisma.generationJob.create({
      data: {
        projectId,
        status: 'PROCESSING',
        outputTypes: JSON.stringify(outputTypes),
      },
    });
  }

  async updateGenerationJob(
    jobId: string,
    status: 'COMPLETED' | 'PARTIAL' | 'FAILED',
    errorMessage?: string
  ) {
    return prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status,
        errorMessage,
        completedAt: new Date(),
      },
    });
  }
}
