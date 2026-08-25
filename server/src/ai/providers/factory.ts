import { config } from '../../config';
import { BedrockProvider } from './bedrockProvider';
import { GeminiProvider } from './geminiProvider';
import { LlamaProvider } from './llamaProvider';
import { MockProvider } from './mockProvider';
import { OpenAIProvider } from './openAIProvider';
import { AIProviderInstance, ProviderType } from './types';

let currentProviderType: ProviderType = (config.aiProvider?.toUpperCase() as ProviderType) || 'GEMINI';

const instances: Record<ProviderType, AIProviderInstance> = {
  MOCK: new MockProvider(),
  GEMINI: new GeminiProvider(),
  OPENAI: new OpenAIProvider(),
  BEDROCK: new BedrockProvider(),
  LLAMA: new LlamaProvider(),
};

export function getAIProviderInstance(type?: ProviderType): AIProviderInstance {
  const selectedType = type ? (type.toUpperCase() as ProviderType) : currentProviderType;
  if (!instances[selectedType]) {
    throw new Error(`INVALID_PROVIDER: Unknown AI provider '${type}' requested.`);
  }
  return instances[selectedType];
}

export function setAIProviderInstance(type: ProviderType): AIProviderInstance {
  const upper = type.toUpperCase() as ProviderType;
  if (!instances[upper]) {
    throw new Error(`INVALID_PROVIDER: Unknown AI provider '${type}' requested.`);
  }
  currentProviderType = upper;
  return instances[currentProviderType];
}
