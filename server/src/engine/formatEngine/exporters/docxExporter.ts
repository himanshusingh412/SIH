import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  ShadingType,
  BorderStyle,
} from 'docx';
import { StyleConfig, STYLE_PRESETS } from '../styleEngine';

export interface StructuredContentSection {
  heading?: string;
  subheadings?: Array<{ title: string; content: string }>;
  paragraphs?: string[];
  bulletPoints?: string[];
  tableData?: { headers: string[]; rows: string[][] };
  callout?: string;
}

export interface StructuredDocumentInput {
  title: string;
  subtitle?: string;
  metadata?: Record<string, string>;
  sections: StructuredContentSection[];
}

export class DocxExporter {
  async generateDocxBuffer(
    input: StructuredDocumentInput,
    styleConfig: StyleConfig = STYLE_PRESETS.PROFESSIONAL
  ): Promise<Buffer> {
    const children: any[] = [];
    const primaryColor = '7A173D';
    const textColor = '3D1324';
    const secondaryColor = '8A6875';
    const accentColor = '16805B';

    // ── Title ──────────────────────────────────────────────
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: input.title || 'ContentSpine Deliverable Report',
            bold: true,
            size: 48, // 24pt
            color: primaryColor,
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 120 },
      })
    );

    // ── Subtitle ───────────────────────────────────────────
    if (input.subtitle) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: input.subtitle,
              italics: true,
              color: secondaryColor,
              size: 24, // 12pt
              font: 'Arial',
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // ── Metadata Header ────────────────────────────────────
    if (input.metadata && Object.keys(input.metadata).length > 0) {
      const metaRuns: TextRun[] = [];
      for (const [key, val] of Object.entries(input.metadata)) {
        metaRuns.push(
          new TextRun({ text: `${key.toUpperCase()}: `, bold: true, size: 18, color: primaryColor, font: 'Arial' }),
          new TextRun({ text: `${val}   |   `, size: 18, color: textColor, font: 'Arial' })
        );
      }
      children.push(
        new Paragraph({
          children: metaRuns,
          spacing: { after: 240 },
        })
      );
    }

    // ── Fact Lock Callout Banner ───────────────────────────
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: 'E8F7F0', type: ShadingType.CLEAR },
                margins: { top: 120, bottom: 120, left: 180, right: 180 },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'B8DEC9' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'B8DEC9' },
                  left: { style: BorderStyle.SINGLE, size: 12, color: accentColor },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'B8DEC9' },
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: '🔒 FACT-LOCKED INFORMATION  |  ✓ Verified against source  |  ✓ Source trace available',
                        bold: true,
                        size: 20, // 10pt
                        color: accentColor,
                        font: 'Arial',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    children.push(new Paragraph({ text: '', spacing: { after: 240 } }));

    // ── Process Sections ───────────────────────────────────
    for (const sec of input.sections || []) {
      if (sec.heading) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: sec.heading,
                bold: true,
                size: 32, // 16pt
                color: primaryColor,
                font: 'Arial',
              }),
            ],
            spacing: { before: 280, after: 120 },
          })
        );
      }

      if (sec.paragraphs && sec.paragraphs.length > 0) {
        for (const p of sec.paragraphs) {
          if (!p || !p.trim()) continue;
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: p.trim(),
                  size: 22, // 11pt
                  color: textColor,
                  font: 'Arial',
                }),
              ],
              spacing: { after: 140, line: 276 },
            })
          );
        }
      }

      if (sec.bulletPoints && sec.bulletPoints.length > 0) {
        for (const bp of sec.bulletPoints) {
          if (!bp || !bp.trim()) continue;
          const cleanBp = bp.replace(/^[-*•]\s*/, '').trim();
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cleanBp,
                  size: 22,
                  color: textColor,
                  font: 'Arial',
                }),
              ],
              bullet: { level: 0 },
              spacing: { after: 100 },
            })
          );
        }
      }

      if (sec.callout) {
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'F8E8EE', type: ShadingType.CLEAR },
                    margins: { top: 120, bottom: 120, left: 180, right: 180 },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'E9C9D5' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E9C9D5' },
                      left: { style: BorderStyle.SINGLE, size: 12, color: primaryColor },
                      right: { style: BorderStyle.SINGLE, size: 4, color: 'E9C9D5' },
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `📌 ${sec.callout}`,
                            bold: true,
                            size: 20,
                            color: primaryColor,
                            font: 'Arial',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );
        children.push(new Paragraph({ text: '', spacing: { after: 180 } }));
      }

      if (sec.tableData && sec.tableData.headers && sec.tableData.headers.length > 0) {
        const tableRows: TableRow[] = [];

        // Header Row
        tableRows.push(
          new TableRow({
            children: sec.tableData.headers.map(
              (h) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 19, font: 'Arial' })],
                      alignment: AlignmentType.LEFT,
                    }),
                  ],
                  shading: { fill: primaryColor, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  width: { size: 100 / sec.tableData!.headers.length, type: WidthType.PERCENTAGE },
                })
            ),
          })
        );

        // Data Rows
        for (let rIdx = 0; rIdx < sec.tableData.rows.length; rIdx++) {
          const row = sec.tableData.rows[rIdx];
          const bgShading = rIdx % 2 === 0 ? 'FFFFFF' : 'FFF8FA';

          tableRows.push(
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: String(cell || ''), size: 18, color: textColor, font: 'Arial' })],
                      }),
                    ],
                    shading: { fill: bgShading, type: ShadingType.CLEAR },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 2, color: 'E9C9D5' },
                      bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E9C9D5' },
                      left: { style: BorderStyle.SINGLE, size: 2, color: 'E9C9D5' },
                      right: { style: BorderStyle.SINGLE, size: 2, color: 'E9C9D5' },
                    },
                    margins: { top: 80, bottom: 80, left: 140, right: 140 },
                    width: { size: 100 / row.length, type: WidthType.PERCENTAGE },
                  })
              ),
            })
          );
        }

        children.push(
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );

        children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
      }
    }

    // ── Build Document ─────────────────────────────────────
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 1 inch
            },
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'ContentSpine AI  |  Fact-Locked Verified Deliverable   |   Page ',
                      size: 16,
                      color: secondaryColor,
                      font: 'Arial',
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      size: 16,
                      color: primaryColor,
                      font: 'Arial',
                      bold: true,
                    }),
                    new TextRun({
                      text: ' of ',
                      size: 16,
                      color: secondaryColor,
                      font: 'Arial',
                    }),
                    new TextRun({
                      children: [PageNumber.TOTAL_PAGES],
                      size: 16,
                      color: primaryColor,
                      font: 'Arial',
                      bold: true,
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
            }),
          },
          children,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }
}

export const docxExporter = new DocxExporter();
