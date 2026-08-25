import { config } from '../config';

export type ProviderStatusType =
  | 'connected'
  | 'ready'
  | 'rate_limited'
  | 'unavailable'
  | 'not_configured'
  | 'error';

export interface ProviderHealthState {
  provider: string;
  status: ProviderStatusType;
  model: string;
  configured: boolean;
  lastSuccessfulRequestAt?: string;
  last429At?: string;
  retryAfterSeconds?: number;
  remainingRetrySeconds?: number;
  message?: string;
}

class ProviderHealthTracker {
  private geminiState: {
    lastSuccessAt?: Date;
    last429At?: Date;
    retryAfterSeconds?: number;
    lastErrorMessage?: string;
  } = {};

  private openAIState: {
    lastSuccessAt?: Date;
    last429At?: Date;
    retryAfterSeconds?: number;
    lastErrorMessage?: string;
  } = {};

  private bedrockState: {
    lastSuccessAt?: Date;
    last429At?: Date;
    retryAfterSeconds?: number;
    lastErrorMessage?: string;
  } = {};

  recordSuccess(provider: string) {
    const norm = provider.toLowerCase();
    if (norm === 'gemini') {
      this.geminiState.lastSuccessAt = new Date();
      this.geminiState.last429At = undefined;
      this.geminiState.retryAfterSeconds = undefined;
      this.geminiState.lastErrorMessage = undefined;
    } else if (norm === 'openai') {
      this.openAIState.lastSuccessAt = new Date();
      this.openAIState.last429At = undefined;
      this.openAIState.retryAfterSeconds = undefined;
      this.openAIState.lastErrorMessage = undefined;
    } else if (norm === 'bedrock') {
      this.bedrockState.lastSuccessAt = new Date();
      this.bedrockState.last429At = undefined;
      this.bedrockState.retryAfterSeconds = undefined;
      this.bedrockState.lastErrorMessage = undefined;
    }
  }

  recordRateLimit(provider: string, retryAfterSeconds: number, errorMessage?: string) {
    const norm = provider.toLowerCase();
    if (norm === 'gemini') {
      this.geminiState.last429At = new Date();
      this.geminiState.retryAfterSeconds = retryAfterSeconds;
      this.geminiState.lastErrorMessage = errorMessage || 'Gemini is temporarily rate-limited.';
    } else if (norm === 'openai') {
      this.openAIState.last429At = new Date();
      this.openAIState.retryAfterSeconds = retryAfterSeconds;
      this.openAIState.lastErrorMessage = errorMessage || 'OpenAI is temporarily rate-limited.';
    } else if (norm === 'bedrock') {
      this.bedrockState.last429At = new Date();
      this.bedrockState.retryAfterSeconds = retryAfterSeconds;
      this.bedrockState.lastErrorMessage = errorMessage || 'Bedrock is temporarily rate-limited.';
    }
  }

  recordError(provider: string, message: string) {
    const norm = provider.toLowerCase();
    if (norm === 'gemini') {
      this.geminiState.lastErrorMessage = message;
    } else if (norm === 'openai') {
      this.openAIState.lastErrorMessage = message;
    } else if (norm === 'bedrock') {
      this.bedrockState.lastErrorMessage = message;
    }
  }

  getHealth(provider: string): ProviderHealthState {
    const norm = provider.toLowerCase();

    if (norm === 'mock') {
      return {
        provider: 'mock',
        status: 'connected',
        model: 'Demo / Testing Only',
        configured: true,
        message: 'Mock AI — Demo / Testing Only',
      };
    }

    if (norm === 'gemini') {
      const apiKey = config.aiApiKey || config.geminiApiKey;
      const model = config.aiModel || 'gemini-3.1-flash-lite';
      if (!apiKey) {
        return {
          provider: 'gemini',
          status: 'not_configured',
          model,
          configured: false,
          message: 'Gemini — Not Configured (Missing API Key)',
        };
      }

      // Check active rate limit window
      if (this.geminiState.last429At && this.geminiState.retryAfterSeconds) {
        const elapsedSec = Math.floor((Date.now() - this.geminiState.last429At.getTime()) / 1000);
        const remaining = this.geminiState.retryAfterSeconds - elapsedSec;
        if (remaining > 0) {
          return {
            provider: 'gemini',
            status: 'rate_limited',
            model,
            configured: true,
            last429At: this.geminiState.last429At.toISOString(),
            retryAfterSeconds: this.geminiState.retryAfterSeconds,
            remainingRetrySeconds: remaining,
            message: `Gemini — Rate Limited (Retry in ${remaining}s)`,
          };
        } else {
          // Rate limit window expired!
          this.geminiState.last429At = undefined;
          this.geminiState.retryAfterSeconds = undefined;
        }
      }

      if (this.geminiState.lastSuccessAt) {
        return {
          provider: 'gemini',
          status: 'connected',
          model,
          configured: true,
          lastSuccessfulRequestAt: this.geminiState.lastSuccessAt.toISOString(),
          message: 'Gemini — Connected',
        };
      }

      return {
        provider: 'gemini',
        status: 'ready',
        model,
        configured: true,
        message: 'Gemini — Ready',
      };
    }

    if (norm === 'openai') {
      const apiKey = config.openaiApiKey;
      const model = config.openaiModel || 'gpt-4o';
      if (!apiKey) {
        return {
          provider: 'openai',
          status: 'not_configured',
          model,
          configured: false,
          message: 'OpenAI — Not Configured',
        };
      }

      if (this.openAIState.last429At && this.openAIState.retryAfterSeconds) {
        const elapsedSec = Math.floor((Date.now() - this.openAIState.last429At.getTime()) / 1000);
        const remaining = this.openAIState.retryAfterSeconds - elapsedSec;
        if (remaining > 0) {
          return {
            provider: 'openai',
            status: 'rate_limited',
            model,
            configured: true,
            last429At: this.openAIState.last429At.toISOString(),
            retryAfterSeconds: this.openAIState.retryAfterSeconds,
            remainingRetrySeconds: remaining,
            message: `OpenAI — Rate Limited (Retry in ${remaining}s)`,
          };
        } else {
          this.openAIState.last429At = undefined;
          this.openAIState.retryAfterSeconds = undefined;
        }
      }

      if (this.openAIState.lastSuccessAt) {
        return {
          provider: 'openai',
          status: 'connected',
          model,
          configured: true,
          lastSuccessfulRequestAt: this.openAIState.lastSuccessAt.toISOString(),
          message: 'OpenAI — Connected',
        };
      }

      return {
        provider: 'openai',
        status: 'ready',
        model,
        configured: true,
        message: 'OpenAI — Ready',
      };
    }

    if (norm === 'bedrock') {
      const apiKey = config.bedrockApiKey;
      const model = config.bedrockModel || 'anthropic.claude-3-5-sonnet-20240620-v1:0';
      if (!apiKey) {
        return {
          provider: 'bedrock',
          status: 'not_configured',
          model,
          configured: false,
          message: 'AWS Bedrock — Not Configured',
        };
      }

      if (this.bedrockState.last429At && this.bedrockState.retryAfterSeconds) {
        const elapsedSec = Math.floor((Date.now() - this.bedrockState.last429At.getTime()) / 1000);
        const remaining = this.bedrockState.retryAfterSeconds - elapsedSec;
        if (remaining > 0) {
          return {
            provider: 'bedrock',
            status: 'rate_limited',
            model,
            configured: true,
            last429At: this.bedrockState.last429At.toISOString(),
            retryAfterSeconds: this.bedrockState.retryAfterSeconds,
            remainingRetrySeconds: remaining,
            message: `AWS Bedrock — Rate Limited (Retry in ${remaining}s)`,
          };
        } else {
          this.bedrockState.last429At = undefined;
          this.bedrockState.retryAfterSeconds = undefined;
        }
      }

      if (this.bedrockState.lastSuccessAt) {
        return {
          provider: 'bedrock',
          status: 'connected',
          model,
          configured: true,
          lastSuccessfulRequestAt: this.bedrockState.lastSuccessAt.toISOString(),
          message: 'AWS Bedrock — Connected',
        };
      }

      return {
        provider: 'bedrock',
        status: 'ready',
        model,
        configured: true,
        message: 'AWS Bedrock — Ready',
      };
    }

    return {
      provider: norm,
      status: 'error',
      model: 'Unknown',
      configured: false,
      message: `Unknown provider '${provider}'`,
    };
  }
}

export const providerHealthTracker = new ProviderHealthTracker();
