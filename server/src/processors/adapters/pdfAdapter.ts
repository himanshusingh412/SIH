import pdfParse from 'pdf-parse';
import { InputCategory } from '../../types';
import { ExtractedDocumentData, InputAdapter } from './types';

export class PdfAdapter implements InputAdapter {
  name = 'PDF Extractor Adapter';

  canHandle(category: InputCategory, filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return category === 'PDF' || ext === 'pdf';
  }

  async extract(buffer: Buffer, filename: string): Promise<ExtractedDocumentData> {
    try {
      const parsed = await pdfParse(buffer);
      return {
        text: parsed.text && parsed.text.trim().length > 0 ? parsed.text : `Extracted text from PDF file ${filename}`,
        pageCount: parsed.numpages || 1,
        fileSize: buffer.length,
        metadata: { info: parsed.info || {}, version: parsed.version },
      };
    } catch (err) {
      console.warn('PDF parsing fallback:', err);
      return {
        text: buffer.toString('utf-8') || `Raw buffer extracted from ${filename}`,
        pageCount: 1,
        fileSize: buffer.length,
        metadata: { fallback: true },
      };
    }
  }
}
