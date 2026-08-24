import { StyleEngine, StylePresetName, STYLE_PRESETS } from './styleEngine';
import { docxExporter, StructuredDocumentInput } from './exporters/docxExporter';
import { pdfExporter } from './exporters/pdfExporter';
import { pptxExporter, PresentationInput } from './exporters/pptxExporter';
import { dataExporters } from './exporters/dataExporters';
import { socialFormatters, LinkedInPostInput, EmailInput } from './formatters/socialFormatters';
import { communicationFormatters, AdvisoryInput, IncidentReportInput } from './formatters/communicationFormatters';
import { formatValidator, ValidationCheckResult } from './formatValidator';
import { ContentSpineData } from '../../types';

import { probeVideo, convertMovToMp4, validateMp4Output, VideoMetadata, ConversionOptions } from './converters/videoConverter';

export class FormatEngine {
  private styleEngine: StyleEngine;

  constructor(preset: StylePresetName = 'PROFESSIONAL') {
    this.styleEngine = new StyleEngine(preset);
  }

  setStylePreset(preset: StylePresetName) {
    this.styleEngine.setPreset(preset);
  }

  /**
   * Video Format Converters
   */
  async probeVideoMetadata(filePath: string): Promise<VideoMetadata> {
    return await probeVideo(filePath);
  }

  convertMovToMp4(
    inputPath: string,
    outputPath: string,
    options?: ConversionOptions,
    onProgress?: (percent: number) => void
  ) {
    return convertMovToMp4(inputPath, outputPath, options, onProgress);
  }

  async validateMp4(outputPath: string, sourceMeta: VideoMetadata): Promise<VideoMetadata> {
    return await validateMp4Output(outputPath, sourceMeta);
  }

  /**
   * Convert ContentSpineData into structured document input
   */
  buildStructuredInputFromSpine(spine: ContentSpineData, title: string): StructuredDocumentInput {
    const lockedFactList = spine.factLocks || [];

    const sections = [
      {
        heading: 'Executive Summary',
        paragraphs: [spine.summary],
      },
      {
        heading: 'Verified Facts & Lock Layer',
        bulletPoints: lockedFactList.map((f) => `🔒 ${f.key}: ${f.value}`),
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
