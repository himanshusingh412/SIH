import { InputCategory } from '../../types';
import { ExtractedDocumentData, InputAdapter } from './types';

export class TxtAdapter implements InputAdapter {
  name = 'TXT / Text File Extractor Adapter';

  canHandle(category: InputCategory, filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    // Exclude binary formats so specialized adapters (PdfAdapter, DocxAdapter, ImageAdapter) take precedence
    if (['pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg', 'webp', 'tiff', 'bmp'].includes(ext || '')) {
      return false;
    }
    return (
      category === 'PROMPT' ||
      category === 'REPORT' ||
      category === 'THREAT_INTEL' ||
      category === 'POLICY' ||
      category === 'ARTICLE' ||
      category === 'RESEARCH_PAPER' ||
      ['txt', 'md', 'json', 'csv'].includes(ext || '')
    );
  }

  async extract(buffer: Buffer, _filename: string): Promise<ExtractedDocumentData> {
    const text = buffer.toString('utf-8').replace(/[\0\u0000]/g, '');
    const estimatedPages = Math.max(1, Math.ceil(text.length / 2500));
    return {
      text,
      pageCount: estimatedPages,
      fileSize: buffer.length,
      metadata: { encoding: 'utf-8' },
    };
  }
}
