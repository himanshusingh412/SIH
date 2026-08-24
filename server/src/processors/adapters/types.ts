import { InputCategory } from '../../types';

export interface ExtractedDocumentData {
  text: string;
  pageCount: number;
  fileSize: number;
  metadata: Record<string, any>;
}

export interface InputAdapter {
  name: string;
  canHandle(category: InputCategory, filename: string): boolean;
  extract(buffer: Buffer, filename: string): Promise<ExtractedDocumentData>;
}
