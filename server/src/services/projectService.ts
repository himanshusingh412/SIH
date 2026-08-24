import { getAIProvider } from '../ai/provider';
import { DocumentProcessor } from '../processors/documentProcessor';
import { ProjectRepository } from '../repositories/projectRepository';
import { AudienceProfile, InputCategory, OutputType } from '../types';
import { ConsistencyValidator, LockedFact } from '../validators/consistencyValidator';
import { FactLockEngine } from '../validators/factLockEngine';

export class ProjectService {
  private repo = new ProjectRepository();
  private docProcessor = new DocumentProcessor();
  private factLockEngine = new FactLockEngine();
  private validator = new ConsistencyValidator();

  async createProject(title: string, description?: string, userId?: string) {
    return this.repo.createProject(title, description, userId);
  }

  async getProject(projectId: string) {
    return this.repo.findProjectById(projectId);
  }

  async seedDemoProject() {
    const demoText = `SIH 2026 Cyber Threat Intelligence & AI Platform Report.
Executive Summary: In Q3 2026, Smart India Hackathon introduced the AI Content Transformation Engine. The platform achieved 99.9% factual consistency across 500+ generated documents. Key milestone target date set for 2026-08-24. Ministry of Education and AI Innovation Cell verified zero fact drift across Executive Summaries, Advisories, Presentations, and Video Packages.`;

    const project = await this.createProject(
      'Demo: Cyber Threat Intelligence & AI Transformation',
      'SIH 2026 Official Demo Benchmark Dataset'
    );

    const ingestResult = await this.ingestDocument(
      project.id,
      undefined,
      'THREAT_INTEL',
      demoText
    );

    return { projectId: project.id, ingestResult };
  }

  async listProjects() {
    return this.repo.listProjects();
  }

  async getDashboardStats() {
    return this.repo.getDashboardStats();
  }

  async ingestDocument(
    projectId: string,
    file: Express.Multer.File | undefined,
    category: InputCategory,
    promptText?: string
  ) {
    let buffer = file ? file.buffer : Buffer.from(promptText || '', 'utf-8');
    let filename = file ? file.originalname : 'Free-form Prompt / Document Excerpt';

    const processed = await this.docProcessor.processBuffer(buffer, filename, category);

    const doc = await this.repo.createSourceDocument({
      projectId,
      filename,
      fileType: file ? file.mimetype : 'text/plain',
      inputCategory: category,
      rawText: processed.rawText,
      fileSize: processed.fileSize,
      pageCount: processed.pageCount,
    });

    // Build Content Spine via AI Provider
    const provider = getAIProvider();
    const spineData = await provider.extractContentSpine(processed.rawText, category);

    // Auto-identify & lock critical facts using FactLockEngine
    const classifiedFacts = this.factLockEngine.classifyAndLockFacts(processed.rawText, processed.chunks);

    const allFacts = [
      ...classifiedFacts.map((f) => ({
        key: f.key,
        value: f.value,
        category: f.category,
        isLocked: f.isLocked,
        confidence: f.confidence,
        sourceSnippet: f.sourceSnippet,
        pageNumber: f.pageNumber,
        sourceDocumentId: doc.id,
      })),
      ...spineData.dates.map((d, i) => ({
        key: d.key || `Milestone Date #${i + 1}`,
        value: d.value,
        category: 'DATE',
        isLocked: true,
        confidence: 0.98,
        sourceSnippet: d.sourceSnippet || processed.chunks[0]?.text || '',
        pageNumber: d.pageNumber || 1,
        sourceDocumentId: doc.id,
      })),
      ...spineData.numbers.map((n, i) => ({
        key: n.key || `Metric #${i + 1}`,
        value: n.value,
        category: 'NUMBER',
        isLocked: true,
        confidence: 0.99,
        sourceSnippet: n.sourceSnippet || processed.chunks[0]?.text || '',
        pageNumber: n.pageNumber || 1,
        sourceDocumentId: doc.id,
      })),
    ];

    // Remove duplicates
    const uniqueFactsMap = new Map();
    allFacts.forEach((f) => uniqueFactsMap.set(`${f.category}-${f.value}`, f));
    const uniqueFacts = Array.from(uniqueFactsMap.values());

    const updatedProject = await this.repo.saveContentSpine(
      projectId,
      spineData.summary,
      uniqueFacts,
      spineData.entities
    );

    return {
      documentId: doc.id,
      project: updatedProject,
      spine: spineData,
    };
  }

  /**
   * Process/re-process a project's source documents to rebuild the Content Spine
   */
  async processProjectSource(projectId: string) {
    const project = await this.repo.findProjectById(projectId);
    if (!project) throw new Error('Project not found');

    const docs = await this.repo.findSourceDocumentsByProjectId(projectId);
    if (docs.length === 0) throw new Error('No source documents uploaded for project');

    const combinedText = docs.map((d) => d.rawText).join('\n\n');
    const category = (docs[0]?.inputCategory as InputCategory) || 'PROMPT';

    const provider = getAIProvider();
    const spineData = await provider.extractContentSpine(combinedText, category);
    const classifiedFacts = this.factLockEngine.classifyAndLockFacts(combinedText, []);

    const allFacts = [
      ...classifiedFacts.map((f) => ({
        key: f.key,
        value: f.value,
        category: f.category,
        isLocked: f.isLocked,
        confidence: f.confidence,
        sourceSnippet: f.sourceSnippet,
        pageNumber: f.pageNumber,
        sourceDocumentId: docs[0]?.id,
      })),
    ];

    const updatedProject = await this.repo.saveContentSpine(
      projectId,
      spineData.summary,
      allFacts,
      spineData.entities
    );

    return { project: updatedProject, spine: spineData };
  }

  async getContentSpine(projectId: string) {
    const spine = await this.repo.findContentSpineByProjectId(projectId);
    if (!spine) throw new Error('Content Spine not found for project');
    return spine;
  }

  async toggleFactLock(factId: string, isLocked: boolean) {
    return this.repo.toggleFactLock(factId, isLocked);
  }

  async generateOutputs(
    projectId: string,
    outputTypes: OutputType[],
    audience: AudienceProfile,
    providerName?: string
  ) {
    const project = await this.repo.findProjectById(projectId);
    if (!project) throw new Error('Project not found');

    const job = await this.repo.createGenerationJob(projectId, outputTypes);

    try {
      const latestSpine = project.contentSpines[0];
      const facts = latestSpine ? latestSpine.facts : [];
      const entities = latestSpine ? latestSpine.entities : [];

      const spineData = this.buildSpineData(latestSpine, facts, entities);

      const provider = getAIProvider(providerName);
      const generatedResults = [];

      for (const type of outputTypes) {
        const res = await provider.generateOutput(spineData, type, audience);
        const saved = await this.repo.saveOutput({
          projectId,
          outputType: type,
          audienceProfileName: audience,
          title: res.title,
          content: res.content,
        });
        generatedResults.push(saved);
      }

      const valResult = await this.validateProjectOutputs(projectId);
      await this.repo.updateGenerationJob(job.id, 'COMPLETED');

      return {
        outputs: generatedResults,
        validationResult: valResult,
        jobId: job.id,
      };
    } catch (err: any) {
      await this.repo.updateGenerationJob(job.id, 'FAILED', err.message);
      throw err;
    }
  }

  async getProjectOutputs(projectId: string) {
    return this.repo.findOutputsByProjectId(projectId);
  }

  async getOutputById(outputId: string) {
    const output = await this.repo.findOutputById(outputId);
    if (!output) throw new Error('Output not found');
    return output;
  }

  async validateSingleOutput(outputId: string) {
    const output = await this.repo.findOutputById(outputId);
    if (!output) throw new Error('Output not found');

    const latestSpine = await this.repo.findContentSpineByProjectId(output.projectId);
    const lockedFacts: LockedFact[] = latestSpine
      ? latestSpine.facts
          .filter((f) => f.isLocked)
          .map((f) => ({
            key: f.factKey,
            value: f.factValue,
            category: f.category,
            sourceSnippet: f.references[0]?.snippetText ?? undefined,
            pageNumber: f.references[0]?.pageNumber ?? undefined,
          }))
      : [];

    const currentVersion = output.versions[0];
    if (!currentVersion) throw new Error('Output version not found');

    const report = this.validator.validateOutputAgainstFacts(
      output.outputType as OutputType,
      currentVersion.content,
      lockedFacts
    );

    return report;
  }

  async regenerateSingleOutput(outputId: string, audience: AudienceProfile) {
    const output = await this.repo.findOutputById(outputId);
    if (!output) throw new Error('Output not found');

    const project = await this.repo.findProjectById(output.projectId);
    if (!project) throw new Error('Project not found');

    const latestSpine = project.contentSpines[0];
    const facts = latestSpine ? latestSpine.facts : [];
    const entities = latestSpine ? latestSpine.entities : [];

    const spineData = this.buildSpineData(latestSpine, facts, entities);

    const provider = getAIProvider();
    const res = await provider.generateOutput(
      spineData,
      output.outputType as OutputType,
      audience
    );

    const savedOutput = await this.repo.saveOutput({
      projectId: output.projectId,
      outputType: output.outputType,
      audienceProfileName: audience,
      title: res.title,
      content: res.content,
      createdReason: 'RE_GENERATION',
    });

    await this.validateProjectOutputs(output.projectId);

    return this.repo.findOutputById(savedOutput.id);
  }

  async getProjectValidation(projectId: string) {
    const val = await this.repo.findLatestValidationResult(projectId);
    if (!val) throw new Error('No validation results found for project');

    let parsedIssues: any = [];
    let summary = { factsChecked: 0, passedCount: 0, warningsCount: 0, errorsCount: 0 };

    try {
      const envelope = JSON.parse(val.issuesFound || 'null');
      if (envelope && envelope._summary) {
        summary = envelope._summary;
        parsedIssues = envelope.issues || [];
      } else if (Array.isArray(envelope)) {
        parsedIssues = envelope;
      }
    } catch {
      parsedIssues = [];
    }

    return {
      id: val.id,
      projectId: val.projectId,
      consistencyScore: val.consistencyScore,
      passed: val.passed,
      autoCorrected: val.autoCorrected,
      factsChecked: summary.factsChecked,
      passedCount: summary.passedCount,
      warningsCount: summary.warningsCount,
      errorsCount: summary.errorsCount,
      issues: parsedIssues,
      createdAt: val.createdAt,
    };
  }

  async exportProjectPackage(projectId: string) {
    const project = await this.repo.findProjectById(projectId);
    if (!project) throw new Error('Project not found');

    const latestSpine = project.contentSpines[0];
    const validation = project.validationResults[0];

    const packageData = {
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt,
      },
      contentSpineSummary: latestSpine?.summary || '',
      factLocks: (latestSpine?.facts || []).map((f) => ({
        key: f.factKey,
        value: f.factValue,
        category: f.category,
        isLocked: f.isLocked,
      })),
      validationSummary: {
        score: validation?.consistencyScore || 100,
        passed: validation?.passed ?? true,
      },
      deliverables: project.outputs.map((out) => {
        const ver = out.versions.find((v) => v.id === out.currentVersionId) || out.versions[0];
        return {
          id: out.id,
          outputType: out.outputType,
          title: ver?.title || out.outputType,
          audienceProfile: out.audienceProfile?.name || 'EXECUTIVE',
          isConsistent: out.isConsistent,
          content: ver?.content || '',
        };
      }),
      exportedAt: new Date().toISOString(),
    };

    const markdownText = `# ${project.title}\n*SIH 2026 Fact-Locked Multi-Channel Deliverables Report*\n\n` +
      packageData.deliverables
        .map((d) => `## Format: ${d.outputType.replace(/_/g, ' ')}\n**Audience**: ${d.audienceProfile}\n\n### ${d.title}\n\n${d.content}\n\n---\n`)
        .join('\n');

    return {
      jsonPackage: packageData,
      markdownReport: markdownText,
    };
  }

  async validateProjectOutputs(projectId: string) {
    const project = await this.repo.findProjectById(projectId);
    if (!project) return null;

    const latestSpine = project.contentSpines[0];
    const lockedFacts: LockedFact[] = latestSpine
      ? latestSpine.facts
          .filter((f) => f.isLocked)
          .map((f) => ({
            key: f.factKey,
            value: f.factValue,
            category: f.category,
            sourceSnippet: f.references[0]?.snippetText ?? undefined,
            pageNumber: f.references[0]?.pageNumber ?? undefined,
          }))
      : [];

    const outputContents = project.outputs
      .map((out) => {
        const currentVersion =
          out.versions.find((v) => v.id === out.currentVersionId) || out.versions[0];
        if (!currentVersion) return null;
        return { outputType: out.outputType as OutputType, content: currentVersion.content };
      })
      .filter(Boolean) as Array<{ outputType: OutputType; content: string }>;

    const aggregateReport = this.validator.validateAllOutputs(outputContents, lockedFacts);

    return this.repo.saveValidationResult({
      projectId,
      consistencyScore: aggregateReport.consistencyScore,
      passed: aggregateReport.passed,
      issuesFound: aggregateReport.issues,
      autoCorrected: false,
      factsChecked: aggregateReport.factsChecked,
      passedCount: aggregateReport.passedCount,
      warningsCount: aggregateReport.warningsCount,
      errorsCount: aggregateReport.errorsCount,
    });
  }

  async autoCorrectOutputs(projectId: string) {
    const maxRetries = 3;
    let attempt = 0;
    let fullyFixed = false;
    let lastReport: any = null;

    while (attempt < maxRetries && !fullyFixed) {
      attempt++;

      const project = await this.repo.findProjectById(projectId);
      if (!project) break;

      const latestSpine = project.contentSpines[0];
      const lockedFacts = latestSpine ? latestSpine.facts.filter((f) => f.isLocked) : [];

      for (const out of project.outputs) {
        const currentVersion =
          out.versions.find((v) => v.id === out.currentVersionId) || out.versions[0];
        if (!currentVersion) continue;

        const perOutputFacts: LockedFact[] = lockedFacts.map((f) => ({
          key: f.factKey,
          value: f.factValue,
          category: f.category,
          sourceSnippet: f.references[0]?.snippetText ?? undefined,
          pageNumber: f.references[0]?.pageNumber ?? undefined,
        }));

        const report = this.validator.validateOutputAgainstFacts(
          out.outputType as OutputType,
          currentVersion.content,
          perOutputFacts
        );

        if (!report.passed) {
          let fixedContent = currentVersion.content;
          let modified = false;

          // Targeted replacement for issues identified by ConsistencyValidator
          for (const issue of report.issues) {
            if (issue.foundValue && issue.expectedValue && issue.foundValue !== issue.expectedValue) {
              if (fixedContent.includes(issue.foundValue)) {
                fixedContent = fixedContent.split(issue.foundValue).join(issue.expectedValue);
                modified = true;
              }
            }
          }

          // Append lock annotation for any missing locked facts
          for (const fact of lockedFacts) {
            if (!fixedContent.includes(fact.factValue)) {
              const label = `[Fact Lock — Attempt ${attempt}/${maxRetries}]`;
              fixedContent += `\n\n> **${label}** ${fact.factKey}: ${fact.factValue}`;
              modified = true;
            }
          }

          if (modified) {
            await this.repo.saveOutput({
              projectId,
              outputType: out.outputType,
              audienceProfileName: out.audienceProfile?.name || 'EXECUTIVE',
              title: currentVersion.title,
              content: fixedContent,
              isConsistent: false,
              createdReason: 'AUTO_CORRECTION',
            });
          }
        }
      }

      lastReport = await this.validateProjectOutputs(projectId);
      if (lastReport?.passed) {
        fullyFixed = true;
      }
    }

    if (fullyFixed) {
      await this.repo.saveValidationResult({
        projectId,
        consistencyScore: 100,
        passed: true,
        issuesFound: [],
        autoCorrected: true,
        factsChecked: lastReport?.factsChecked || 0,
        passedCount: lastReport?.passedCount || 0,
        warningsCount: 0,
        errorsCount: 0,
      });
    } else {
      await this.repo.saveValidationResult({
        projectId,
        consistencyScore: lastReport?.consistencyScore || 0,
        passed: false,
        issuesFound: [
          {
            id: 'human-review-required',
            outputType: 'EXECUTIVE_SUMMARY' as OutputType,
            factKey: 'Multiple Locked Facts',
            expectedValue: 'Exact Match Required',
            severity: 'CRITICAL' as const,
            description: `Auto-fix loop completed ${maxRetries} attempts but could not resolve all discrepancies. Human review required.`,
            autoFixAvailable: false,
            suggestedFix: 'Manually review and correct the flagged outputs against the Content Spine.',
          },
        ],
        autoCorrected: false,
        factsChecked: lastReport?.factsChecked || 0,
        passedCount: lastReport?.passedCount || 0,
        warningsCount: lastReport?.warningsCount || 0,
        errorsCount: 1,
      });
    }

    return this.repo.findProjectById(projectId);
  }

  async injectTestErrors(
    projectId: string,
    injections: Array<{ outputType: OutputType; find: string; replace: string }>
  ) {
    const project = await this.repo.findProjectById(projectId);
    if (!project) throw new Error('Project not found');

    const results = [];

    for (const injection of injections) {
      const out = project.outputs.find((o) => o.outputType === injection.outputType);
      if (!out) continue;

      const currentVersion =
        out.versions.find((v) => v.id === out.currentVersionId) || out.versions[0];
      if (!currentVersion) continue;

      if (!currentVersion.content.includes(injection.find)) {
        results.push({
          outputType: injection.outputType,
          status: 'NOT_FOUND',
          message: `String "${injection.find}" not found in ${injection.outputType}`,
        });
        continue;
      }

      const corruptedContent = currentVersion.content
        .split(injection.find)
        .join(injection.replace);

      await this.repo.saveOutput({
        projectId,
        outputType: injection.outputType,
        audienceProfileName: out.audienceProfile?.name || 'EXECUTIVE',
        title: currentVersion.title + ' [TEST — INJECTED ERROR]',
        content: corruptedContent,
        isConsistent: false,
        createdReason: 'TEST_INJECTION',
      });

      results.push({
        outputType: injection.outputType,
        status: 'INJECTED',
        find: injection.find,
        replace: injection.replace,
      });
    }

    const validationResult = await this.validateProjectOutputs(projectId);

    return { results, validationResult };
  }

  private buildSpineData(latestSpine: any, facts: any[], entities: any[]) {
    return {
      summary: latestSpine?.summary || 'Project Content Spine Summary',
      entities: entities.map((e) => ({
        id: e.id,
        name: e.name,
        type: e.type as any,
        confidence: e.confidence,
        sourceReference: 'Ingested Source Document',
      })),
      dates: facts
        .filter((f) => f.category === 'DATE')
        .map((f) => ({
          id: f.id,
          key: f.factKey,
          value: f.factValue,
          category: 'DATE' as any,
          isLocked: f.isLocked,
          sourceSnippet: f.references[0]?.snippetText || '',
          pageNumber: f.references[0]?.pageNumber || 1,
        })),
      numbers: facts
        .filter((f) => f.category === 'NUMBER')
        .map((f) => ({
          id: f.id,
          key: f.factKey,
          value: f.factValue,
          category: 'NUMBER' as any,
          isLocked: f.isLocked,
          sourceSnippet: f.references[0]?.snippetText || '',
          pageNumber: f.references[0]?.pageNumber || 1,
        })),
      locations: [],
      events: [
        'Source Document Ingestion & Adapter Parsing',
        'Fact Lock Engine Classification',
        'Multi-Output Generation',
      ],
      risks: [
        'Fact drift occurring when generating multiple outputs independently',
        'Lack of source traceability in standard zero-shot LLM prompts',
      ],
      recommendations: [
        'Establish Content Spine as single immutable source of truth',
        'Enforce mandatory Fact Locking on dates & metrics',
      ],
      claims: ['Content Spine eliminates fact drift across deliverables.'],
      relationships: [
        {
          subject: 'Content Spine',
          relation: 'serves as Single Source of Truth for',
          object: 'Output Generators',
        },
      ],
      factLocks: facts.map((f) => ({
        id: f.id,
        key: f.factKey,
        value: f.factValue,
        category: f.category as any,
        isLocked: f.isLocked,
        sourceSnippet: f.references[0]?.snippetText || '',
        pageNumber: f.references[0]?.pageNumber || 1,
      })),
    };
  }
}
