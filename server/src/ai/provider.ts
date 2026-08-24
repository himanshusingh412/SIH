import { config } from '../config';
import { AIProvider } from '../types';
import { getAIProviderInstance, setAIProviderInstance } from './providers/factory';
import { ProviderType } from './providers/types';

export function getAIProvider(providerName?: string): AIProvider {
  let type: ProviderType = (config.aiProvider?.toUpperCase() as ProviderType) || 'GEMINI';
  if (providerName) {
    const upper = providerName.trim().toUpperCase();
    if (['MOCK', 'GEMINI', 'OPENAI', 'LLAMA'].includes(upper)) {
      type = upper as ProviderType;
    } else {
      throw new Error(`INVALID_PROVIDER: Unknown AI provider '${providerName}'. Valid options: gemini, openai, mock.`);
    }
  }

  return getAIProviderInstance(type) as unknown as AIProvider;
}

export { getAIProviderInstance, setAIProviderInstance };
