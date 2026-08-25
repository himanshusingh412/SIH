import { StyleEngine, StylePresetName, STYLE_PRESETS } from './styleEngine';
import { docxExporter, StructuredDocumentInput, StructuredContentSection } from './exporters/docxExporter';
import { pdfExporter } from './exporters/pdfExporter';
import { pptxExporter, PresentationInput, SlideInput } from './exporters/pptxExporter';
import { dataExporters } from './exporters/dataExporters';
import { socialFormatters, LinkedInPostInput, EmailInput } from './formatters/socialFormatters';
import { communicationFormatters, AdvisoryInput, IncidentReportInput } from './formatters/communicationFormatters';
import { formatValidator, ValidationCheckResult } from './formatValidator';
import { ContentSpineData } from '../../types';
import {
  safeJson,
  stripInline,
  parseSlides,
  parseInfographic,
  parseVideoPackage,
  Slide,
  InfographicMetric,
  InfographicCallout,
  VideoScene,
} from './deliverableParsers';

function parseMarkdownToSections(content: string): StructuredContentSection[] {
  const lines = String(content || '').replace(/\r\n/g, '\n').split('\n');
  const sections: StructuredContentSection[] = [];
  let currentSection: StructuredContentSection = { paragraphs: [], bulletPoints: [] };

  const pushCurrent = () => {
    if (
      currentSection.heading ||
      (currentSection.paragraphs && currentSection.paragraphs.length > 0) ||
      (currentSection.bulletPoints && currentSection.bulletPoints.length > 0) ||
      currentSection.tableData
    ) {
      sections.push(currentSection);
      currentSection = { paragraphs: [], bulletPoints: [] };
    }
  };

  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed === '---' || trimmed === '***') {
      if (inTable && tableHeaders.length > 0) {
        currentSection.tableData = { headers: tableHeaders, rows: tableRows };
        inTable = false;
        tableHeaders = [];
        tableRows = [];
      }
      continue;
    }

    // Markdown Table Row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .split('|')
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        .map((c) => stripInline(c));

      if (cells.every((c) => c.match(/^[-:]+$/))) {
        // Separator row
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
        tableRows = [];
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      currentSection.tableData = { headers: tableHeaders, rows: tableRows };
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    }

    // Heading (#, ##, ###)
    const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      pushCurrent();
      currentSection = {
        heading: stripInline(headingMatch[1]),
        paragraphs: [],
        bulletPoints: [],
      };
      continue;
    }

    // Bullet point (- , * , • , 1. )
    const bulletMatch = trimmed.match(/^(?:[-*•]|\d+\.)\s+(.+)$/);
    if (bulletMatch) {
      const cleanBp = stripInline(bulletMatch[1]);
      if (!currentSection.bulletPoints) currentSection.bulletPoints = [];
      currentSection.bulletPoints.push(cleanBp);
      continue;
    }

    // Paragraph text
    const cleanPara = stripInline(trimmed);
    if (cleanPara) {
      if (!currentSection.paragraphs) currentSection.paragraphs = [];
      currentSection.paragraphs.push(cleanPara);
    }
  }

  if (inTable && tableHeaders.length > 0) {
    currentSection.tableData = { headers: tableHeaders, rows: tableRows };
  }
  pushCurrent();

  if (sections.length === 0) {
    sections.push({ paragraphs: [stripInline(content)] });
  }

  return sections;
}

export class FormatEngine {
  private styleEngine: StyleEngine;

  constructor(preset: StylePresetName = 'PROFESSIONAL') {
    this.styleEngine = new StyleEngine(preset);
  }

  setStylePreset(preset: StylePresetName) {
    this.styleEngine.setPreset(preset);
  }

  /**
   * Build structured document input for PDF/DOCX from a reviewed deliverable output
   */
  buildStructuredInputFromOutput(
    output: { outputType?: string; title?: string; content?: string; audienceProfile?: string; isConsistent?: boolean } | null,
    spine: any,
    projectTitle: string
  ): StructuredDocumentInput {
    if (!output || !output.content) {
      return this.buildStructuredInputFromSpine(spine || ({ summary: '' } as any), projectTitle);
    }

    const typeStr = (output.outputType || 'DELIVERABLE').replace(/_/g, ' ');
    const title = output.title || `${projectTitle} — ${typeStr}`;
    const subtitle = `${typeStr} — ContentSpine AI Fact-Locked Deliverable`;
    const metadata: Record<string, string> = {
      'Project': projectTitle,
      'Audience': output.audienceProfile || 'Executive / Stakeholders',
      'Fact Lock': output.isConsistent !== false ? '✓ 100% Zero Fact Drift' : 'Reviewed',
      'Date': new Date().toISOString().split('T')[0],
    };

    const sections: StructuredContentSection[] = [];
    const contentStr = output.content;

    if (output.outputType === 'PRESENTATION') {
      const slides = parseSlides(contentStr);
      sections.push({
        heading: 'Presentation Slide Deck Overview',
        paragraphs: [`Total Slides: ${slides.length}`],
      });
      slides.forEach((s: Slide) => {
        sections.push({
          heading: `Slide ${s.slideNumber}: ${s.title}`,
          bulletPoints: s.bulletPoints,
          callout: s.speakerNotes ? `Speaker Notes: ${s.speakerNotes}` : undefined,
        });
      });
    } else if (output.outputType === 'INFOGRAPHIC') {
      const info = parseInfographic(contentStr);
      if (info) {
        if (info.heroMetrics && info.heroMetrics.length > 0) {
          sections.push({
            heading: 'Key Facts & Verified Metrics Grid',
            tableData: {
              headers: ['Metric / KPI', 'Verified Value'],
              rows: info.heroMetrics.map((m: InfographicMetric) => [m.label, m.value]),
            },
          });
        }
        if (info.sectionCallouts && info.sectionCallouts.length > 0) {
          info.sectionCallouts.forEach((c: InfographicCallout) => {
            sections.push({
              heading: c.title,
              paragraphs: [c.text],
            });
          });
        }
      } else {
        sections.push(...parseMarkdownToSections(contentStr));
      }
    } else if (output.outputType === 'VIDEO_PACKAGE') {
      const video = parseVideoPackage(contentStr);
      if (video) {
        if (video.storyboard && video.storyboard.length > 0) {
          sections.push({
            heading: 'Video Scene Storyboard & Narration Script',
            tableData: {
              headers: ['Scene', 'Timecode', 'Visual Description', 'Voiceover Script', 'On-Screen Caption'],
              rows: video.storyboard.map((s: VideoScene) => [
                `Scene #${s.sceneNumber}`,
                s.timecode || '00:00',
                s.visual || '',
                s.voiceover || '',
                s.onScreenText || '',
              ]),
            },
          });
        }
        if (video.callToAction) {
          sections.push({
            heading: 'Call to Action Directive',
            paragraphs: [video.callToAction],
          });
        }
      } else {
        sections.push(...parseMarkdownToSections(contentStr));
      }
    } else if (output.outputType === 'X_THREAD') {
      sections.push({
        heading: 'X Thread (Multi-Post Sequence)',
        paragraphs: ['Each post below is fact-locked and ready for publication.'],
      });

      const posts = contentStr
        .split(/(?=\b\d+\/)/g)
        .map((p) => p.trim())
        .filter(Boolean);

      if (posts.length > 1) {
        posts.forEach((p, idx) => {
          const lines = p.split('\n').map((l) => stripInline(l)).filter(Boolean);
          sections.push({
            heading: `Post ${idx + 1}`,
            paragraphs: lines,
          });
        });
      } else {
        sections.push(...parseMarkdownToSections(contentStr));
      }
    } else {
      // General Markdown parsing (EXECUTIVE_SUMMARY, LINKEDIN_POST, ADVISORY, etc.)
      sections.push(...parseMarkdownToSections(contentStr));
    }

    // Append Fact Locks section if spine exists
    const factList = spine?.facts || spine?.factLocks || [];
    if (factList.length > 0) {
      sections.push({
        heading: 'Verified Fact Lock Layer & Traceability',
        bulletPoints: factList.slice(0, 10).map((f: any) => `🔒 ${f.key || f.factKey}: ${f.value || f.factValue}`),
      });
    }

    return {
      title,
      subtitle,
      metadata,
      sections,
    };
  }

  /**
   * Build structured presentation input for PPTX from a reviewed deliverable output
   */
  buildPresentationInputFromOutput(
    output: { outputType?: string; title?: string; content?: string; audienceProfile?: string } | null,
    spine: any,
    projectTitle: string
  ): PresentationInput {
    const title = output?.title || `${projectTitle} Presentation`;
    const subtitle = `${output?.outputType ? output.outputType.replace(/_/g, ' ') : 'Verified Presentation'} — ContentSpine AI Engine`;

    if (output && output.content) {
      const slides = parseSlides(output.content);
      if (slides && slides.length > 0) {
        return {
          title,
          subtitle,
          slides: slides.map((s: Slide) => ({
            title: s.title,
            bulletPoints: s.bulletPoints,
            speakerNotes: s.speakerNotes,
            callout: s.visualPrompt ? `Visual: ${s.visualPrompt}` : undefined,
          })),
        };
      }
    }

    // Fallback if no output content: create slide deck from Spine summary & facts
    const spineSlides: SlideInput[] = [
      {
        title: 'Executive Summary',
        bulletPoints: spine?.summary ? [spine.summary] : ['Project Summary'],
      },
      {
        title: 'Verified Fact Lock Layer',
        bulletPoints: (spine?.facts || spine?.factLocks || []).slice(0, 6).map((f: any) => `${f.key || f.factKey}: ${f.value || f.factValue}`),
      },
    ];

    if (spine?.recommendations && spine.recommendations.length > 0) {
      spineSlides.push({
        title: 'Action Directives & Recommendations',
        bulletPoints: spine.recommendations.slice(0, 5),
      });
    }

    return {
      title,
      subtitle,
      slides: spineSlides,
    };
  }

  /**
   * Convert ContentSpineData into structured document input (fallback)
   */
  buildStructuredInputFromSpine(spine: any, title: string): StructuredDocumentInput {
    const lockedFactList = spine?.facts || spine?.factLocks || [];

    const sections = [
      {
        heading: 'Executive Summary',
        paragraphs: [spine?.summary || ''],
      },
      {
        heading: 'Verified Facts & Lock Layer',
        bulletPoints: lockedFactList.map((f: any) => `🔒 ${f.key || f.factKey}: ${f.value || f.factValue}`),
      },
    ];

    if (spine.risks && spine.risks.length > 0) {
      sections.push({
        heading: 'Identified Risk Assessment',
        bulletPoints: spine.risks,
      });
    }

    if (spine.recommendations && spine.recommendations.length > 0) {
      sections.push({
        heading: 'Action Directives & Mitigation Recommendations',
        bulletPoints: spine.recommendations,
      });
    }

    return {
      title,
      subtitle: 'Verified Multimodal Artifact — ContentSpine AI Engine',
      metadata: {
        'Facts Locked': String(lockedFactList.length),
        'Generated At': new Date().toISOString().split('T')[0],
      },
      sections,
    };
  }

  /**
   * Real Exporters
   */
  async exportDocx(input: StructuredDocumentInput): Promise<{ buffer: Buffer; mimeType: string }> {
    const buffer = await docxExporter.generateDocxBuffer(input, this.styleEngine.getStyleConfig());
    return { buffer, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  }

  async exportPdf(input: StructuredDocumentInput): Promise<{ buffer: Buffer; mimeType: string }> {
    const buffer = await pdfExporter.generatePdfBuffer(input, this.styleEngine.getStyleConfig());
    return { buffer, mimeType: 'application/pdf' };
  }

  async exportPptx(input: PresentationInput): Promise<{ buffer: Buffer; mimeType: string }> {
    const buffer = await pptxExporter.generatePptxBuffer(input, this.styleEngine.getStyleConfig());
    return { buffer, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
  }

  exportJson(data: any) {
    return dataExporters.exportJson(data);
  }

  exportCsv(headers: string[], rows: string[][]) {
    return dataExporters.exportCsv(headers, rows);
  }

  async exportXml(rootName: string, data: any) {
    return await dataExporters.exportXml(rootName, data);
  }

  exportYaml(data: any) {
    return dataExporters.exportYaml(data);
  }

  formatLinkedInPost(input: LinkedInPostInput) {
    return socialFormatters.formatLinkedInPost(input, this.styleEngine.getStyleConfig());
  }

  formatXThread(posts: string[]) {
    return socialFormatters.formatXThread(posts);
  }

  formatEmail(input: EmailInput) {
    return socialFormatters.formatEmail(input);
  }

  formatAdvisory(input: AdvisoryInput) {
    return communicationFormatters.formatAdvisory(input);
  }

  formatIncidentReport(input: IncidentReportInput) {
    return communicationFormatters.formatIncidentReport(input);
  }

  async validateFormat(options: {
    format: string;
    content: string | Buffer;
    lockedFacts: Array<{ key: string; value: string }>;
    maxCharLimit?: number;
  }): Promise<ValidationCheckResult> {
    return await formatValidator.validateOutput(options);
  }
}

export const formatEngine = new FormatEngine();
