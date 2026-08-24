import PptxGenJS from 'pptxgenjs';
import { StyleConfig, STYLE_PRESETS } from '../styleEngine';

export interface SlideInput {
  title: string;
  bulletPoints?: string[];
  callout?: string;
  tableData?: { headers: string[]; rows: string[][] };
  speakerNotes?: string;
}

export interface PresentationInput {
  title: string;
  subtitle?: string;
  author?: string;
  slides: SlideInput[];
}

export class PptxExporter {
  async generatePptxBuffer(input: PresentationInput, styleConfig: StyleConfig = STYLE_PRESETS.PROFESSIONAL): Promise<Buffer> {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    // Slide 1: Title Slide
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: '0F172A' };

    titleSlide.addText(input.title, {
      x: 0.8,
      y: 2.2,
      w: '85%',
      h: 1.5,
      fontSize: 36,
      bold: true,
      color: 'FFFFFF',
      fontFace: 'Helvetica',
    });

    if (input.subtitle) {
      titleSlide.addText(input.subtitle, {
        x: 0.8,
        y: 3.8,
        w: '85%',
        h: 0.8,
        fontSize: 20,
        color: '94A3B8',
        fontFace: 'Helvetica',
      });
    }

    titleSlide.addText('ContentSpine AI — Fact Lock Verified Presentation', {
      x: 0.8,
      y: 6.5,
      w: '85%',
      h: 0.4,
      fontSize: 12,
      color: '64748B',
    });

    // Content Slides
    for (const slideData of input.slides) {
      const slide = pptx.addSlide();
      slide.background = { color: 'F8FAFC' };

      // Header Bar
      slide.addText(slideData.title, {
        x: 0.6,
        y: 0.5,
        w: '90%',
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: '1E3A8A',
        fontFace: 'Helvetica',
      });

      let currentY = 1.6;

      // Bullet Points
      if (slideData.bulletPoints && slideData.bulletPoints.length > 0) {
        const bullets = slideData.bulletPoints.map((bp) => ({
          text: bp,
          options: { fontSize: 16, color: '334155', bullet: true, spaceAfter: 12 },
        }));

        slide.addText(bullets, {
          x: 0.8,
          y: currentY,
          w: '85%',
          h: 3.5,
          fontFace: 'Helvetica',
        });
        currentY += 3.2;
      }

      // Callout Box
      if (slideData.callout) {
        slide.addText(`📌 ${slideData.callout}`, {
          x: 0.8,
          y: Math.min(currentY, 4.8),
          w: '85%',
          h: 0.9,
          fontSize: 14,
          bold: true,
          color: '1E40AF',
          fill: { color: 'EFF6FF' },
          line: { color: '93C5FD', width: 1 },
          align: 'left',
        });
      }

      // Table Data
      if (slideData.tableData && slideData.tableData.headers.length > 0) {
        const tableRows = [
          slideData.tableData.headers.map((h) => ({
            text: h,
            options: { fill: '1E3A8A', color: 'FFFFFF', bold: true, fontSize: 13 },
          })),
          ...slideData.tableData.rows.map((r) =>
            r.map((c) => ({
              text: c,
              options: { fill: 'FFFFFF', color: '334155', fontSize: 12 },
            }))
          ),
        ];

        slide.addTable(tableRows as any, {
          x: 0.8,
          y: 2.0,
          w: 8.4,
          colW: [2.8, 2.8, 2.8],
        });
      }

      // Speaker Notes
      if (slideData.speakerNotes) {
        slide.addNotes(slideData.speakerNotes);
      }
    }

    const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
    return buffer;
  }
}

export const pptxExporter = new PptxExporter();
