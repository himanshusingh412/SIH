import { config } from '../../config';
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
  LLAMA: new LlamaProvider(),
};

export function getAIProviderInstance(type?: ProviderType): AIProviderInstance {
  const selectedType = type || currentProviderType;
  return instances[selectedType] || instances.GEMINI;
}

export function setAIProviderInstance(type: ProviderType): AIProviderInstance {
  currentProviderType = type;
  return instances[currentProviderType];
}
