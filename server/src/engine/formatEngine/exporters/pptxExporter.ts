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
  async generatePptxBuffer(
    input: PresentationInput,
    styleConfig: StyleConfig = STYLE_PRESETS.PROFESSIONAL
  ): Promise<Buffer> {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    const primaryColor = '7A173D';
    const textColor = '3D1324';
    const accentColor = '16805B';

    // ── Slide 1: Title Slide ──────────────────────────────────
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: '7A173D' };

    titleSlide.addText(input.title || 'ContentSpine Presentation', {
      x: 0.8,
      y: 2.0,
      w: '85%',
      h: 1.6,
      fontSize: 34,
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
        fontSize: 18,
        color: 'F8E8EE',
        fontFace: 'Helvetica',
      });
    }

    titleSlide.addText('🔒 ContentSpine AI — Fact-Locked Verified Presentation', {
      x: 0.8,
      y: 6.4,
      w: '85%',
      h: 0.4,
      fontSize: 12,
      color: 'E9C9D5',
      fontFace: 'Helvetica',
    });

    // ── Process Content Slides (With Auto-Splitting) ─────────
    const MAX_BULLETS_PER_SLIDE = 5;

    for (const rawSlide of input.slides || []) {
      const bullets = rawSlide.bulletPoints || [];
      const totalChunks = Math.max(1, Math.ceil(bullets.length / MAX_BULLETS_PER_SLIDE));

      for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        const slide = pptx.addSlide();
        slide.background = { color: 'FFFFFF' };

        const isContinuation = chunkIdx > 0;
        const slideTitle = isContinuation ? `${rawSlide.title} (cont.)` : rawSlide.title;

        // Top Header Accent Line
        slide.addShape('rect' as any, {
          x: 0.6,
          y: 0.4,
          w: 12.1,
          h: 0.05,
          fill: { color: primaryColor },
        });

        // Header Title
        slide.addText(slideTitle, {
          x: 0.6,
          y: 0.55,
          w: '75%',
          h: 0.8,
          fontSize: 22,
          bold: true,
          color: primaryColor,
          fontFace: 'Helvetica',
        });

        // Verified Badge Top Right
        slide.addText('🔒 Fact-Locked', {
          x: 10.2,
          y: 0.6,
          w: 2.5,
          h: 0.4,
          fontSize: 11,
          bold: true,
          color: accentColor,
          fill: { color: 'E8F7F0' },
          align: 'center',
          fontFace: 'Helvetica',
        });

        let currentY = 1.6;

        // Bullet Points Chunk
        const bulletChunk = bullets.slice(
          chunkIdx * MAX_BULLETS_PER_SLIDE,
          (chunkIdx + 1) * MAX_BULLETS_PER_SLIDE
        );

        if (bulletChunk.length > 0) {
          const formattedBullets = bulletChunk.map((bp) => ({
            text: bp.replace(/^[-*•]\s*/, ''),
            options: { fontSize: 15, color: textColor, bullet: { code: '2022' }, spaceAfter: 10 },
          }));

          slide.addText(formattedBullets, {
            x: 0.8,
            y: currentY,
            w: '88%',
            h: 3.6,
            fontFace: 'Helvetica',
          });
          currentY += 3.4;
        }

        // Callout Box (Only on first chunk slide)
        if (rawSlide.callout && !isContinuation) {
          slide.addText(`📌 ${rawSlide.callout}`, {
            x: 0.8,
            y: Math.min(currentY, 5.0),
            w: '88%',
            h: 0.8,
            fontSize: 13,
            bold: true,
            color: primaryColor,
            fill: { color: 'F8E8EE' },
            line: { color: 'E9C9D5', width: 1 },
            align: 'left',
            fontFace: 'Helvetica',
          });
        }

        // Table Data (Only on first chunk slide)
        if (rawSlide.tableData && rawSlide.tableData.headers && rawSlide.tableData.headers.length > 0 && !isContinuation) {
          const tableRows = [
            rawSlide.tableData.headers.map((h) => ({
              text: h,
              options: { fill: primaryColor, color: 'FFFFFF', bold: true, fontSize: 12 },
            })),
            ...rawSlide.tableData.rows.map((r) =>
              r.map((c) => ({
                text: String(c || ''),
                options: { fill: 'FFFFFF', color: textColor, fontSize: 11 },
              }))
            ),
          ];

          slide.addTable(tableRows as any, {
            x: 0.8,
            y: 2.0,
            w: 11.5,
            colW: Array(rawSlide.tableData.headers.length).fill(11.5 / rawSlide.tableData.headers.length),
          });
        }

        // Speaker Notes
        if (rawSlide.speakerNotes) {
          slide.addNotes(rawSlide.speakerNotes);
        }
      }
    }

    const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
    return buffer;
  }
}

export const pptxExporter = new PptxExporter();
