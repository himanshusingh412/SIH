import { AudienceProfile, ContentSpineData, InputCategory, OutputType, ValidationIssue } from '../../types';

export type ProviderType = 'MOCK' | 'GEMINI' | 'OPENAI' | 'LLAMA';

export interface AIProviderInstance {
  name: string;
  type: ProviderType;
  extractContentSpine(rawText: string, category: InputCategory): Promise<ContentSpineData>;
  generateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    audience: AudienceProfile
  ): Promise<{ title: string; content: string }>;
  validateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    content: string
  ): Promise<ValidationIssue[]>;
}
