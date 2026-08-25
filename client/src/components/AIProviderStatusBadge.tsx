import React, { useEffect, useState } from 'react';
import { ShieldAlert, Zap } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface ProviderStatusData {
  providers: Record<
    string,
    { id: string; name: string; model: string; configured?: boolean; status?: string; remainingRetrySeconds?: number; message?: string }
  >;
  defaultProvider: string;
}

export const AIProviderStatusBadge: React.FC<{ selectedProvider?: string }> = ({ selectedProvider = 'gemini' }) => {
  const [data, setData] = useState<ProviderStatusData | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchStatus = () => {
      apiClient
        .getAIProviders()
        .then((res: any) => {
          if (mounted && res) setData(res);
        })
        .catch(() => {});
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 6000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const gemini = data?.providers?.gemini;
  const isGeminiRateLimited = gemini?.status === 'rate_limited';
  const remainingSec = gemini?.remainingRetrySeconds || 0;

  if (isGeminiRateLimited) {
    return (
      <div
        title={gemini?.message || 'Gemini is temporarily rate limited. Seamlessly using active fallback provider.'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(234, 88, 12, 0.12)',
          border: '1px solid rgba(234, 88, 12, 0.3)',
          color: '#c2410c',
          fontSize: 'var(--font-xs)',
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        <ShieldAlert size={13} color="#ea580c" aria-hidden="true" />
        <span>Gemini (Rate Limited {remainingSec > 0 ? `${remainingSec}s` : ''})</span>
        <span style={{ opacity: 0.6 }}>→</span>
        <span style={{ color: 'var(--burgundy-700)', fontWeight: 700 }}>Fallback Active ✓</span>
      </div>
    );
  }

  const activeName =
    selectedProvider === 'openai'
      ? 'OpenAI GPT-4o'
      : selectedProvider === 'bedrock'
      ? 'AWS Bedrock (Claude 3.5)'
      : selectedProvider === 'mock'
      ? 'Mock AI Engine'
      : 'Google Gemini 3.1';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--pink-100)',
        border: '1px solid var(--pink-300)',
        color: 'var(--burgundy-800)',
        fontSize: 'var(--font-xs)',
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      <Zap size={13} color="var(--burgundy-700)" aria-hidden="true" />
      <span>{activeName}</span>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} aria-hidden="true" />
    </div>
  );
};
