import { InputCategory } from '../types';
import { DocxAdapter } from './adapters/docxAdapter';
import { ImageAdapter } from './adapters/imageAdapter';
import { PdfAdapter } from './adapters/pdfAdapter';
import { InputAdapter } from './adapters/types';
import { TxtAdapter } from './adapters/txtAdapter';
import { VideoAdapter } from './adapters/videoAdapter';

export interface NormalizedChunk {
  chunkIndex: number;
  pageNumber: number;
  sectionTitle: string;
  text: string;
  startCharIndex: number;
  endCharIndex: number;
}

export class DocumentProcessor {
  private adapters: InputAdapter[] = [
    new PdfAdapter(),
    new ImageAdapter(),
    new DocxAdapter(),
    new VideoAdapter(),
    new TxtAdapter(), // fallback for text/prompts
  ];

  async processBuffer(
    buffer: Buffer,
    filename: string,
    category: InputCategory
  ) {
    const adapter = this.adapters.find((a) => a.canHandle(category, filename)) || this.adapters[this.adapters.length - 1];
    const extracted = await adapter.extract(buffer, filename);

    // Normalize text
    const normalizedText = this.normalizeContent(extracted.text);

    // Generate chunk paragraph mappings for source references
    const chunks = this.createSourceParagraphChunks(normalizedText, extracted.pageCount);

    return {
      rawText: normalizedText,
      pageCount: extracted.pageCount,
      fileSize: extracted.fileSize,
      adapterName: adapter.name,
      metadata: extracted.metadata,
      chunks,
    };
  }

  normalizeContent(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  createSourceParagraphChunks(text: string, pageCount: number): NormalizedChunk[] {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const chunks: NormalizedChunk[] = [];
    let currentOffset = 0;

    const paragraphsPerPage = Math.max(1, Math.ceil(paragraphs.length / pageCount));

    paragraphs.forEach((p, idx) => {
      const pageNumber = Math.min(pageCount, Math.floor(idx / paragraphsPerPage) + 1);
      const startCharIndex = currentOffset;
      const endCharIndex = startCharIndex + p.length;
      currentOffset = endCharIndex + 2; // account for newline

      let sectionTitle = `Section ${idx + 1}`;
      const firstLine = p.split('\n')[0].trim();
      if (firstLine.length < 60 && !firstLine.endsWith('.')) {
        sectionTitle = firstLine;
      }

      chunks.push({
        chunkIndex: idx + 1,
        pageNumber,
        sectionTitle,
        text: p.trim(),
        startCharIndex,
        endCharIndex,
      });
    });

    return chunks;
  }
}
