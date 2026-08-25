import { AudienceProfile, ContentSpineData, InputCategory, OutputType, ValidationIssue } from '../../types';

export type ProviderType = 'MOCK' | 'GEMINI' | 'OPENAI' | 'BEDROCK' | 'LLAMA';

/**
 * Per-call execution hints. `deadlineAt` is an epoch-ms budget so a provider can
 * bail out early instead of blocking a serverless request past its timeout.
 */
export interface AICallOptions {
  deadlineAt?: number;
}

export interface AIProviderInstance {
  name: string;
  type: ProviderType;
  extractContentSpine(
    rawText: string,
    category: InputCategory,
    options?: AICallOptions
  ): Promise<ContentSpineData>;
  generateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    audience: AudienceProfile,
    options?: AICallOptions
  ): Promise<{ title: string; content: string }>;
  validateOutput(
    spine: ContentSpineData,
    outputType: OutputType,
    content: string
  ): Promise<ValidationIssue[]>;
  generateText?(prompt: string): Promise<string>;
}
