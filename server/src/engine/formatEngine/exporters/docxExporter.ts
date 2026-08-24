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
  async generateDocxBuffer(input: StructuredDocumentInput, styleConfig: StyleConfig = STYLE_PRESETS.PROFESSIONAL): Promise<Buffer> {
    const children: any[] = [];

    // Title
    children.push(
      new Paragraph({
        text: input.title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.LEFT,
        spacing: { after: 200 },
      })
    );

    // Subtitle / Metadata
    if (input.subtitle) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: input.subtitle,
              italics: true,
              color: '4B5563',
              size: 24,
            }),
          ],
          spacing: { after: 300 },
        })
      );
    }

    if (input.metadata && Object.keys(input.metadata).length > 0) {
      const metaRuns: TextRun[] = [];
      for (const [key, val] of Object.entries(input.metadata)) {
        metaRuns.push(
          new TextRun({ text: `${key}: `, bold: true, size: 18, color: '1E3A8A' }),
          new TextRun({ text: `${val}   `, size: 18, color: '374151' })
        );
      }
      children.push(
        new Paragraph({
          children: metaRuns,
          spacing: { after: 300 },
        })
      );
    }

    // Process Sections
    for (const sec of input.sections) {
      if (sec.heading) {
        children.push(
          new Paragraph({
            text: sec.heading,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          })
        );
      }

      if (sec.paragraphs) {
        for (const p of sec.paragraphs) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: p,
                  size: styleConfig.fontSizeBody * 2, // docx uses half-points
                }),
              ],
              spacing: { after: 160 },
            })
          );
        }
      }

      if (sec.bulletPoints) {
        for (const bp of sec.bulletPoints) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: ` ${bp}`,
                  size: styleConfig.fontSizeBody * 2,
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
          new Paragraph({
            children: [
              new TextRun({
                text: `📌 ${sec.callout}`,
                bold: true,
                color: '1E3A8A',
                size: styleConfig.fontSizeBody * 2,
              }),
            ],
            spacing: { before: 200, after: 200 },
          })
        );
      }

      if (sec.tableData && sec.tableData.headers.length > 0) {
        const tableRows: TableRow[] = [];

        // Header Row
        tableRows.push(
          new TableRow({
            children: sec.tableData.headers.map(
              (h) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: h, bold: true, color: 'FFFFFF' })],
                    }),
                  ],
                  shading: { fill: '1E3A8A' },
                  width: { size: 100 / sec.tableData!.headers.length, type: WidthType.PERCENTAGE },
                })
            ),
          })
        );

        // Data Rows
        for (const row of sec.tableData.rows) {
          tableRows.push(
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    children: [new Paragraph({ text: cell })],
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
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }
}

export const docxExporter = new DocxExporter();
