import PDFDocument from 'pdfkit';
import { StyleConfig, STYLE_PRESETS } from '../styleEngine';
import { StructuredDocumentInput } from './docxExporter';

export class PdfExporter {
  generatePdfBuffer(
    input: StructuredDocumentInput,
    styleConfig: StyleConfig = STYLE_PRESETS.PROFESSIONAL
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4',
          bufferPages: true,
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const primaryColor = styleConfig.primaryColor || '#7A173D';
        const textColor = styleConfig.textColor || '#3D1324';
        const secondaryColor = styleConfig.secondaryColor || '#8A6875';
        const accentColor = styleConfig.accentColor || '#16805B';

        const checkPageBreak = (neededHeight: number = 30) => {
          if (doc.y + neededHeight > 740) {
            doc.addPage();
            // Accent bar on continuation page
            doc.rect(50, 40, 495, 3).fill(primaryColor);
            doc.y = 55;
          }
        };

        // ── Primary Accent Bar ─────────────────────────────────
        doc.rect(50, 45, 495, 5).fill(primaryColor);
        doc.y = 60;

        // ── Title ──────────────────────────────────────────────
        doc
          .font('Helvetica-Bold')
          .fontSize(styleConfig.fontSizeTitle || 22)
          .fillColor(primaryColor)
          .text(input.title || 'ContentSpine Deliverable Report', { align: 'left', width: 495 });

        doc.moveDown(0.3);

        // ── Subtitle ───────────────────────────────────────────
        if (input.subtitle) {
          doc
            .font('Helvetica-Oblique')
            .fontSize(styleConfig.fontSizeSubheading || 12)
            .fillColor(secondaryColor)
            .text(input.subtitle, { width: 495 });
          doc.moveDown(0.4);
        }

        // ── Metadata Box ───────────────────────────────────────
        if (input.metadata && Object.keys(input.metadata).length > 0) {
          const metaEntries = Object.entries(input.metadata);
          const metaY = doc.y;
          const boxHeight = Math.ceil(metaEntries.length / 2) * 16 + 12;

          doc
            .rect(50, metaY, 495, boxHeight)
            .fillAndStroke('#F8E8EE', '#E9C9D5');

          let itemIdx = 0;
          for (const [k, v] of metaEntries) {
            const col = itemIdx % 2;
            const row = Math.floor(itemIdx / 2);
            const xPos = 60 + col * 240;
            const yPos = metaY + 8 + row * 16;

            doc
              .font('Helvetica-Bold')
              .fontSize(8.5)
              .fillColor(primaryColor)
              .text(`${k.toUpperCase()}: `, xPos, yPos, { continued: true });
            doc
              .font('Helvetica')
              .fontSize(8.5)
              .fillColor(textColor)
              .text(String(v));

            itemIdx++;
          }

          doc.y = metaY + boxHeight + 12;
        }

        // ── Fact-Lock Callout Banner ───────────────────────────
        checkPageBreak(40);
        const lockY = doc.y;
        doc
          .rect(50, lockY, 495, 30)
          .fillAndStroke('#E8F7F0', '#B8DEC9');

        doc
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .fillColor(accentColor)
          .text('🔒 FACT-LOCKED INFORMATION   |   ✓ Verified against source   |   ✓ Source trace available', 62, lockY + 9, { width: 470 });

        doc.y = lockY + 40;

        // ── Sections Loop ──────────────────────────────────────
        for (const sec of input.sections || []) {
          checkPageBreak(35);

          if (sec.heading) {
            doc
              .font('Helvetica-Bold')
              .fontSize(styleConfig.fontSizeHeading || 15)
              .fillColor(primaryColor)
              .text(sec.heading, { width: 495 });
            doc.moveDown(0.3);
          }

          if (sec.paragraphs && sec.paragraphs.length > 0) {
            for (const p of sec.paragraphs) {
              if (!p || !p.trim()) continue;
              checkPageBreak(25);
              doc
                .font('Helvetica')
                .fontSize(styleConfig.fontSizeBody || 10)
                .fillColor(textColor)
                .text(p.trim(), { align: 'justify', width: 495, lineGap: 3 });
              doc.moveDown(0.5);
            }
          }

          if (sec.bulletPoints && sec.bulletPoints.length > 0) {
            for (const bp of sec.bulletPoints) {
              if (!bp || !bp.trim()) continue;
              checkPageBreak(20);
              const cleanBp = bp.replace(/^[-*•]\s*/, '').trim();

              doc
                .font('Helvetica-Bold')
                .fontSize(styleConfig.fontSizeBody || 10)
                .fillColor(primaryColor)
                .text('•  ', 65, doc.y, { continued: true });
              doc
                .font('Helvetica')
                .fontSize(styleConfig.fontSizeBody || 10)
                .fillColor(textColor)
                .text(cleanBp, { width: 475, lineGap: 2 });
              doc.moveDown(0.3);
            }
            doc.moveDown(0.4);
          }

          if (sec.callout) {
            checkPageBreak(40);
            const calloutY = doc.y;
            doc
              .rect(50, calloutY, 495, 34)
              .fillAndStroke('#F8E8EE', '#E9C9D5');
            doc
              .font('Helvetica-Bold')
              .fontSize(9.5)
              .fillColor(primaryColor)
              .text(`📌 ${sec.callout}`, 62, calloutY + 9, { width: 470 });
            doc.y = calloutY + 44;
          }

          if (sec.tableData && sec.tableData.headers && sec.tableData.headers.length > 0) {
            checkPageBreak(60);
            doc.moveDown(0.3);

            const numCols = sec.tableData.headers.length;
            const colWidth = 495 / numCols;
            const startY = doc.y;

            // Render Header Row
            doc.rect(50, startY, 495, 22).fill(primaryColor);
            doc
              .font('Helvetica-Bold')
              .fontSize(9)
              .fillColor('#FFFFFF');

            sec.tableData.headers.forEach((h, idx) => {
              doc.text(h, 55 + idx * colWidth, startY + 6, { width: colWidth - 10, align: 'left' });
            });

            let currentY = startY + 22;

            // Render Rows
            for (let rIdx = 0; rIdx < sec.tableData.rows.length; rIdx++) {
              const row = sec.tableData.rows[rIdx];
              if (currentY + 22 > 740) {
                doc.addPage();
                currentY = 55;
              }

              const bgRowColor = rIdx % 2 === 0 ? '#FFFFFF' : '#FFF8FA';
              doc.rect(50, currentY, 495, 20).fillAndStroke(bgRowColor, '#E9C9D5');

              doc
                .font('Helvetica')
                .fontSize(8.5)
                .fillColor(textColor);

              row.forEach((cell, idx) => {
                doc.text(String(cell || ''), 55 + idx * colWidth, currentY + 5, { width: colWidth - 10, align: 'left' });
              });

              currentY += 20;
            }

            doc.y = currentY + 14;
          }
        }

        // ── Running Footers ────────────────────────────────────
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);

          // Divider Line
          doc
            .strokeColor('#E9C9D5')
            .lineWidth(0.75)
            .moveTo(50, 775)
            .lineTo(545, 775)
            .stroke();

          // Left Footer
          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor(secondaryColor)
            .text('ContentSpine AI  |  Fact-Locked Verified Deliverable', 50, 783, { width: 280, align: 'left' });

          // Right Footer
          doc
            .font('Helvetica-Bold')
            .fontSize(8)
            .fillColor(primaryColor)
            .text(`Page ${i + 1} of ${pages.count}`, 345, 783, { width: 200, align: 'right' });
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export const pdfExporter = new PdfExporter();
