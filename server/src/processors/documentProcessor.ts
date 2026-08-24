import { InputCategory } from '../types';
import { DocxAdapter } from './adapters/docxAdapter';
import { ImageAdapter } from './adapters/imageAdapter';
import { PdfAdapter } from './adapters/pdfAdapter';
import { InputAdapter } from './adapters/types';
import { TxtAdapter } from './adapters/txtAdapter';

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
    let currentPage = 1;

    paragraphs.forEach((p, idx) => {
      let cleanParagraph = p.trim();

      // Parse explicit [Page X] marker if present
      const pageMatch = cleanParagraph.match(/^\[Page\s+(\d+)\]/i);
      if (pageMatch) {
        currentPage = parseInt(pageMatch[1], 10);
        cleanParagraph = cleanParagraph.replace(/^\[Page\s+\d+\]\s*/i, '').trim();
      }

      if (!cleanParagraph) return;

      const pageNumber = Math.min(pageCount, Math.max(1, currentPage));
      const startCharIndex = currentOffset;
      const endCharIndex = startCharIndex + cleanParagraph.length;
      currentOffset = endCharIndex + 2;

      let sectionTitle = `Page ${pageNumber} — Section ${idx + 1}`;
      const firstLine = cleanParagraph.split('\n')[0].trim();
      if (firstLine.length < 60 && !firstLine.endsWith('.')) {
        sectionTitle = firstLine;
      }

      chunks.push({
        chunkIndex: chunks.length + 1,
        pageNumber,
        sectionTitle,
        text: cleanParagraph,
        startCharIndex,
        endCharIndex,
      });
    });

    return chunks;
  }
}
