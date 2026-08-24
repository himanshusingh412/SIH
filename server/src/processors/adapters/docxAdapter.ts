import { InputCategory } from '../../types';
import { ExtractedDocumentData, InputAdapter } from './types';

export class DocxAdapter implements InputAdapter {
  name = 'DOCX Document Adapter';

  canHandle(_category: InputCategory, filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext === 'docx' || ext === 'doc';
  }

  async extract(buffer: Buffer, filename: string): Promise<ExtractedDocumentData> {
    const rawText = buffer.toString('utf-8') || `[DOCX Extracted Document ${filename}]`;
    return {
      text: rawText,
      pageCount: 1,
      fileSize: buffer.length,
      metadata: { adapter: 'docx-parser' },
    };
  }
}
