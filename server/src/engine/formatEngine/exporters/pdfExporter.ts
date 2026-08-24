import PDFDocument from 'pdfkit';
import { StyleConfig, STYLE_PRESETS } from '../styleEngine';
import { StructuredDocumentInput } from './docxExporter';

export class PdfExporter {
  generatePdfBuffer(input: StructuredDocumentInput, styleConfig: StyleConfig = STYLE_PRESETS.PROFESSIONAL): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4',
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Title
        doc
          .font('Helvetica-Bold')
          .fontSize(styleConfig.fontSizeTitle)
          .fillColor(styleConfig.primaryColor)
          .text(input.title, { align: 'left' });

        doc.moveDown(0.5);

        // Subtitle
        if (input.subtitle) {
          doc
            .font('Helvetica-Oblique')
            .fontSize(styleConfig.fontSizeSubheading)
            .fillColor('#4B5563')
            .text(input.subtitle);
          doc.moveDown(0.5);
        }

        // Metadata Header Box
        if (input.metadata && Object.keys(input.metadata).length > 0) {
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor('#64748B')
            .text(
              Object.entries(input.metadata)
                .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
                .join('   |   ')
            );
          doc.moveDown(1);
        }

        doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);

        // Sections
        for (const sec of input.sections) {
          if (sec.heading) {
            doc
              .font('Helvetica-Bold')
              .fontSize(styleConfig.fontSizeHeading)
              .fillColor(styleConfig.primaryColor)
              .text(sec.heading);
            doc.moveDown(0.4);
          }

          if (sec.paragraphs) {
            for (const p of sec.paragraphs) {
              doc
                .font('Helvetica')
                .fontSize(styleConfig.fontSizeBody)
                .fillColor(styleConfig.textColor)
                .text(p, { align: 'justify', lineGap: 3 });
              doc.moveDown(0.6);
            }
          }

          if (sec.bulletPoints) {
            for (const bp of sec.bulletPoints) {
              doc
                .font('Helvetica')
                .fontSize(styleConfig.fontSizeBody)
                .fillColor(styleConfig.textColor)
                .text(`${styleConfig.bulletChar}  ${bp}`, { indent: 15 });
              doc.moveDown(0.3);
            }
            doc.moveDown(0.5);
          }

          if (sec.callout) {
            doc
              .rect(50, doc.y, 495, 36)
              .fillAndStroke('#EFF6FF', '#93C5FD');
            doc
              .font('Helvetica-Bold')
              .fontSize(10)
              .fillColor('#1E40AF')
              .text(`📌 ${sec.callout}`, 60, doc.y - 26, { width: 475 });
            doc.moveDown(1);
          }

          if (sec.tableData && sec.tableData.headers.length > 0) {
            doc.moveDown(0.5);
            // Render Table Header
            const startY = doc.y;
            doc.rect(50, startY, 495, 20).fill('#1E3A8A');
            doc
              .font('Helvetica-Bold')
              .fontSize(9)
              .fillColor('#FFFFFF');

            const colWidth = 495 / sec.tableData.headers.length;
            sec.tableData.headers.forEach((h, idx) => {
              doc.text(h, 55 + idx * colWidth, startY + 5, { width: colWidth - 10 });
            });

            doc.moveDown(1.5);

            // Render Rows
            for (const row of sec.tableData.rows) {
              const rowY = doc.y;
              doc
                .font('Helvetica')
                .fontSize(8.5)
                .fillColor('#334155');

              row.forEach((cell, idx) => {
                doc.text(cell, 55 + idx * colWidth, rowY, { width: colWidth - 10 });
              });
              doc.moveDown(0.8);
            }
            doc.moveDown(0.8);
          }
        }

        // Footer
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor('#94A3B8')
            .text(
              `ContentSpine AI Verified Artifact  |  Page ${i + 1} of ${pages.count}`,
              50,
              790,
              { align: 'center' }
            );
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export const pdfExporter = new PdfExporter();
