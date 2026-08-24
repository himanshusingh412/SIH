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
} from 'docx';
import PDFDocument from 'pdfkit';
import { CandidateContentSpine } from './candidateSpine';

export type ResumeTemplateType =
  | 'ATS_CLASSIC'
  | 'MODERN_PROFESSIONAL'
  | 'TECHNICAL'
  | 'EXECUTIVE'
  | 'FRESH_GRADUATE'
  | 'ONE_PAGE'
  | 'TWO_PAGE';

export class ResumeExporters {
  /**
   * Export native DOCX Resume Buffer
   */
  async exportDocx(candidate: CandidateContentSpine, template: ResumeTemplateType = 'ATS_CLASSIC'): Promise<{ buffer: Buffer; mimeType: string }> {
    const children: Paragraph[] = [];

    // Header: Name & Contact
    children.push(
      new Paragraph({
        text: candidate.personal.name.toUpperCase(),
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 100 },
      })
    );

    const contactStr = `${candidate.personal.email}  |  ${candidate.personal.phone}  |  ${candidate.personal.location}  |  ${candidate.personal.linkedIn}`;
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactStr, size: 18, color: '4B5563' })],
        spacing: { after: 240 },
      })
    );

    // Section: Professional Summary
    children.push(
      new Paragraph({
        text: 'PROFESSIONAL SUMMARY',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: candidate.summary, size: 20 })],
        spacing: { after: 240 },
      })
    );

    // Section: Technical Skills
    children.push(
      new Paragraph({
        text: 'TECHNICAL SKILLS',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );
    const skillList = candidate.skills.map((s) => s.name).join(', ');
    children.push(
      new Paragraph({
        children: [new TextRun({ text: skillList, size: 20 })],
        spacing: { after: 240 },
      })
    );

    // Section: Work Experience
    children.push(
      new Paragraph({
        text: 'PROFESSIONAL EXPERIENCE',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    candidate.experiences.forEach((exp) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${exp.role} — ${exp.company}`, bold: true, size: 22 }),
            new TextRun({ text: `  (${exp.startDate} - ${exp.endDate})`, italics: true, size: 18, color: '6B7280' }),
          ],
          spacing: { before: 120, after: 80 },
        })
      );

      exp.responsibilities.forEach((resp) => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${resp}`, size: 20 })],
            spacing: { after: 60 },
          })
        );
      });
    });

    // Section: Education
    children.push(
      new Paragraph({
        text: 'EDUCATION',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    candidate.education.forEach((edu) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.degree} in ${edu.field}`, bold: true, size: 20 }),
            new TextRun({ text: ` — ${edu.institution} (${edu.endDate})`, size: 20 }),
          ],
          spacing: { after: 60 },
        })
      );
    });

    const doc = new Document({
      sections: [{ properties: {}, children }],
    });

    const buffer = await Packer.toBuffer(doc);
    return {
      buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
  }

  /**
   * Export native PDF Resume Buffer using PDFKit
   */
  async exportPdf(candidate: CandidateContentSpine, template: ResumeTemplateType = 'ATS_CLASSIC'): Promise<{ buffer: Buffer; mimeType: string }> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => {
          const buffer = Buffer.concat(buffers);
          resolve({ buffer, mimeType: 'application/pdf' });
        });

        // Title / Header
        doc.fillColor('#1E3A8A').fontSize(22).font('Helvetica-Bold').text(candidate.personal.name.toUpperCase());
        doc.moveDown(0.2);

        const contact = `${candidate.personal.email} | ${candidate.personal.phone} | ${candidate.personal.location}`;
        doc.fillColor('#4B5563').fontSize(9).font('Helvetica').text(contact);
        doc.moveDown(0.8);

        // Section: Summary
        doc.fillColor('#1E3A8A').fontSize(12).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY');
        doc.moveDown(0.2);
        doc.fillColor('#1F2937').fontSize(9.5).font('Helvetica').text(candidate.summary, { lineGap: 3 });
        doc.moveDown(0.8);

        // Section: Skills
        doc.fillColor('#1E3A8A').fontSize(12).font('Helvetica-Bold').text('TECHNICAL SKILLS');
        doc.moveDown(0.2);
        const skillStr = candidate.skills.map((s) => s.name).join(' • ');
        doc.fillColor('#1F2937').fontSize(9.5).font('Helvetica').text(skillStr);
        doc.moveDown(0.8);

        // Section: Experience
        doc.fillColor('#1E3A8A').fontSize(12).font('Helvetica-Bold').text('WORK EXPERIENCE');
        doc.moveDown(0.4);

        candidate.experiences.forEach((exp) => {
          doc.fillColor('#111827').fontSize(10.5).font('Helvetica-Bold').text(`${exp.role} — ${exp.company}`);
          doc.fillColor('#6B7280').fontSize(8.5).font('Helvetica-Oblique').text(`${exp.startDate} - ${exp.endDate} | ${exp.location || ''}`);
          doc.moveDown(0.3);

          exp.responsibilities.forEach((b) => {
            doc.fillColor('#1F2937').fontSize(9).font('Helvetica').text(`• ${b}`, { indent: 10 });
          });
          doc.moveDown(0.6);
        });

        // Section: Education
        doc.fillColor('#1E3A8A').fontSize(12).font('Helvetica-Bold').text('EDUCATION');
        doc.moveDown(0.2);
        candidate.education.forEach((edu) => {
          doc.fillColor('#111827').fontSize(9.5).font('Helvetica-Bold').text(`${edu.degree} in ${edu.field}`);
          doc.fillColor('#4B5563').fontSize(9).font('Helvetica').text(`${edu.institution} (${edu.endDate || ''})`);
        });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export const resumeExporters = new ResumeExporters();
