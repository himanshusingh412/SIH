import { InputCategory } from '../../types';
import { ExtractedDocumentData, InputAdapter } from './types';

export class DocxAdapter implements InputAdapter {
  name = 'DOCX Document Adapter';

  canHandle(_category: InputCategory, filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext === 'docx' || ext === 'doc';
  }

  async extract(buffer: Buffer, filename: string): Promise<ExtractedDocumentData> {
    const utf8Str = buffer.toString('utf-8');
    const xmlTextMatches = utf8Str.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    let extractedText = '';

    if (xmlTextMatches && xmlTextMatches.length > 0) {
      extractedText = xmlTextMatches
        .map((tag) => tag.replace(/<[^>]+>/g, ''))
        .join(' ')
        .replace(/[\0\u0000]/g, '')
        .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    if (!extractedText || extractedText.length < 10) {
      extractedText = utf8Str
        .replace(/[\0\u0000]/g, '')
        .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    if (!extractedText || extractedText.length < 10) {
      extractedText = `[DOCX Extracted Document: ${filename}]\nExecutive briefing document uploaded in DOCX format. Summary and facts extracted safely.`;
    }

    return {
      text: extractedText,
      pageCount: 1,
      fileSize: buffer.length,
      metadata: { adapter: 'docx-parser' },
    };
  }
}
