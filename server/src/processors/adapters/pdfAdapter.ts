import pdfParse from 'pdf-parse';
import { InputCategory } from '../../types';
import { ExtractedDocumentData, InputAdapter } from './types';

const PDF_SYNTAX_PATTERNS = [
  /\/MediaBox/i,
  /\/Resources/i,
  /\/ProcSet/i,
  /\/Font\b/i,
  /\bendobj\b/i,
  /\bendstream\b/i,
  /\bxref\b/i,
  /\btrailer\b/i,
  /\/Type\s*\/Page/i,
  /\/Length\s+\d+/i,
  /\bstream\r?\n/i,
];

/**
 * Detects if a text string contains raw internal PDF object syntax
 */
export function containsPdfRawSyntax(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  let matches = 0;
  for (const pattern of PDF_SYNTAX_PATTERNS) {
    if (pattern.test(text)) matches++;
  }
  return matches >= 2;
}

/**
 * Safely strips internal PDF syntax tokens and binary artifacts
 */
export function cleanPdfRawSyntax(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text
    .replace(/\/MediaBox\s*\[[^\]]*\]/gi, '')
    .replace(/\/Resources\s*<<[^>]*>>/gi, '')
    .replace(/\/ProcSet\s*\[[^\]]*\]/gi, '')
    .replace(/\/Font\s*<<[^>]*>>/gi, '')
    .replace(/\/Type\s*\/[A-Za-z0-9]+/gi, '')
    .replace(/\/Length\s+\d+/gi, '')
    .replace(/\/Filter\s*\/[A-Za-z0-9]+/gi, '')
    .replace(/\bstream[\s\S]*?endstream\b/gi, '')
    .replace(/\b\d+\s+\d+\s+obj[\s\S]*?endobj\b/gi, '')
    .replace(/\bxref[\s\S]*?trailer\b/gi, '')
    .replace(/\bstartxref[\s\S]*?%%EOF\b/gi, '')
    .replace(/<<\s*\/[A-Za-z0-9]+\s+[^>]*>>/gi, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, ' ') // Strip binary non-printable controls
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Page-by-page PDF Text Extractor Callback for pdf-parse
 */
function pageRender(pageData: any): Promise<string> {
  return pageData.getTextContent().then((textContent: any) => {
    let lastY: number | null = null;
    let text = `[Page ${pageData.pageIndex + 1}]\n`;
    for (const item of textContent.items) {
      if (lastY === item.transform[5] || lastY === null) {
        text += item.str;
      } else {
        text += '\n' + item.str;
      }
      lastY = item.transform[5];
    }
    return text + '\n\n';
  });
}

export class PdfAdapter implements InputAdapter {
  name = 'PDF Extractor Adapter';

  canHandle(category: InputCategory, filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return category === 'PDF' || ext === 'pdf';
  }

  async extract(buffer: Buffer, filename: string): Promise<ExtractedDocumentData> {
    // 1. Validate PDF magic bytes header
    const header = buffer.slice(0, 8).toString('ascii');
    if (!header.startsWith('%PDF-')) {
      return {
        text: `Unable to extract text from ${filename}: Invalid file format. PDF magic bytes header (%PDF-) missing.`,
        pageCount: 1,
        fileSize: buffer.length,
        metadata: { error: 'INVALID_PDF_HEADER' },
      };
    }

    try {
      // 2. Parse PDF page-by-page using pdf-parse
      let parsed: any;
      try {
        parsed = await pdfParse(buffer, { pagerender: pageRender });
      } catch {
        parsed = await pdfParse(buffer);
      }

      let extractedText = parsed.text || '';

      // 3. Clean raw PDF syntax contamination
      extractedText = cleanPdfRawSyntax(extractedText);

      // 4. Sanity check: Ensure clean human-readable text was recovered
      const cleanReadableLength = extractedText.replace(/\[Page \d+\]/g, '').trim().length;

      if (cleanReadableLength < 15) {
        return {
          text: `[Scanned / Image PDF Document: ${filename}]\nUnable to extract plain text layer from this PDF. The document may consist of scanned images or vector graphics. Please use OCR or upload a text-based PDF document.`,
          pageCount: parsed.numpages || 1,
          fileSize: buffer.length,
          metadata: { isScanned: true, info: parsed.info || {} },
        };
      }

      return {
        text: extractedText,
        pageCount: parsed.numpages || 1,
        fileSize: buffer.length,
        metadata: {
          info: parsed.info || {},
          version: parsed.version,
          pageCount: parsed.numpages,
        },
      };
    } catch (err: any) {
      console.warn('⚠️ PDF parsing warning:', err.message);

      // Fallback: Clean string without raw binary dump
      const rawAscii = buffer.toString('ascii');
      const cleanedFallback = cleanPdfRawSyntax(rawAscii);
      const readableLength = cleanedFallback.replace(/\[Page \d+\]/g, '').trim().length;

      if (readableLength > 30 && !containsPdfRawSyntax(cleanedFallback)) {
        return {
          text: cleanedFallback,
          pageCount: 1,
          fileSize: buffer.length,
          metadata: { fallbackCleaned: true },
        };
      }

      return {
        text: `Unable to extract readable text from PDF file ${filename}. The document structure could not be parsed safely. Please verify the PDF or try another document.`,
        pageCount: 1,
        fileSize: buffer.length,
        metadata: { error: err.message },
      };
    }
  }
}
