import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Download,
  Zap,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Info,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  onLoadDemo: () => void;
  onOpenExport: () => void;
  isLoading: boolean;
  selectedProvider: string;
  setSelectedProvider: (p: string) => void;
  activeRoute: string;
}

const PAGE_TITLES: Record<string, string> = {
  dashboard:          'Dashboard',
  projects:           'Projects',
  'new-transformation':'New Transformation',
  processing:         'Processing',
  spine:              'Content Spine',
  config:             'Configure Outputs',
  generation:         'Generating Outputs',
  workspace:          'Review Workspace',
  validation:         'Validation',
  'resume-studio':    'Resume Studio',
  agents:             'AI Agents',
  history:            'History',
  analytics:          'Analytics',
  settings:           'Settings',
};

export const Header: React.FC<HeaderProps> = ({
  onLoadDemo,
  onOpenExport,
  isLoading,
  selectedProvider,
  setSelectedProvider,
  activeRoute,
}) => {
  const [providerStatus, setProviderStatus] = useState<{
    status: 'connected' | 'ready' | 'rate_limited' | 'not_configured' | 'unavailable' | 'demo' | 'checking';
    message: string;
    model?: string;
    remainingSeconds?: number;
  }>({ status: 'checking', message: 'Checking...' });

  const [isTesting, setIsTesting] = useState<boolean>(false);

  useEffect(() => {
    fetchProviderInfo(selectedProvider);
  }, [selectedProvider]);

  useEffect(() => {
    if (providerStatus.status !== 'rate_limited' || !providerStatus.remainingSeconds) return;
    const timer = setInterval(() => {
      setProviderStatus((prev) => {
        if (prev.status !== 'rate_limited' || !prev.remainingSeconds) return prev;
        const next = prev.remainingSeconds - 1;
        if (next <= 0) {
          return { ...prev, status: 'ready', message: 'Gemini Ready', remainingSeconds: undefined };
        }
        return { ...prev, remainingSeconds: next, message: `Rate Limited (${next}s)` };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [providerStatus.status, providerStatus.remainingSeconds]);

  const fetchProviderInfo = async (prov: string) => {
    if (prov === 'mock') {
      setProviderStatus({ status: 'demo', message: 'Mock AI — Demo', model: 'Demo Mode' });
      return;
    }
    try {
      const res = await apiClient.getAIProviders();
      const provInfo = (res.providers?.[prov] as any);
      const name = prov === 'gemini' ? 'Gemini' : prov === 'openai' ? 'OpenAI' : 'AWS Bedrock';
      if (!provInfo || provInfo.configured === false) {
        setProviderStatus({ status: 'not_configured', message: `${name} — Not Configured` });
        return;
      }
      if (provInfo.status === 'rate_limited') {
        const remaining = provInfo.remainingRetrySeconds || provInfo.retryAfterSeconds || 45;
        setProviderStatus({ status: 'rate_limited', message: `Rate Limited (${remaining}s)`, remainingSeconds: remaining, model: provInfo.model });
        return;
      }
      if (provInfo.status === 'connected') {
        setProviderStatus({ status: 'connected', message: `${name} Ready`, model: provInfo.model });
        return;
      }
      setProviderStatus({ status: 'ready', message: `${name} Ready`, model: provInfo.model });
    } catch {
      const name = prov === 'gemini' ? 'Gemini' : prov === 'openai' ? 'OpenAI' : 'AWS Bedrock';
      setProviderStatus({ status: 'ready', message: `${name} Ready` });
    }
  };

  const handleManualTest = async () => {
    if (selectedProvider === 'mock') return;
    setIsTesting(true);
    setProviderStatus({ status: 'checking', message: 'Testing...' });
    try {
      const res = await apiClient.testAIProvider(selectedProvider);
      const name = selectedProvider === 'gemini' ? 'Gemini' : selectedProvider === 'openai' ? 'OpenAI' : 'AWS Bedrock';
      if (res && res.status === 'connected') {
        setProviderStatus({ status: 'connected', message: `${name} Ready`, model: res.model });
      } else {
        setProviderStatus({ status: 'unavailable', message: `${name} Unavailable` });
      }
    } catch (err: any) {
      const name = selectedProvider === 'gemini' ? 'Gemini' : selectedProvider === 'openai' ? 'OpenAI' : 'AWS Bedrock';
      const isRateLimit = err?.code === 'GEMINI_RATE_LIMITED' || err?.statusCode === 429;
      const retryAfter = err?.retryAfterSeconds || 45;
      if (isRateLimit) {
        setProviderStatus({ status: 'rate_limited', message: `Rate Limited (${retryAfter}s)`, remainingSeconds: retryAfter });
      } else {
        setProviderStatus({
          status: err?.message?.includes('configured') ? 'not_configured' : 'unavailable',
          message: err?.message?.includes('configured') ? `${name} Not Configured` : `${name} Unavailable`,
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIndicator = () => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: 'var(--font-xs)',
      fontWeight: 700,
      padding: '4px 10px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid',
      whiteSpace: 'nowrap',
    };

    if (providerStatus.status === 'checking' || isTesting) {
      return (
        <span style={{ ...base, color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <RefreshCw size={12} className="spin" /> Checking...
        </span>
      );
    }
    if (providerStatus.status === 'connected' || providerStatus.status === 'ready') {
      return (
        <span style={{ ...base, color: 'var(--color-success)', background: 'var(--color-success-bg)', borderColor: 'var(--color-success-border)' }}>
          <span className="status-dot status-dot-success" />
          {providerStatus.message}
          <button
            onClick={handleManualTest}
            title="Re-test connection"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: '2px', display: 'flex' }}
          >
            <RefreshCw size={10} color="var(--color-success)" />
          </button>
        </span>
      );
    }
    if (providerStatus.status === 'rate_limited') {
      return (
        <span style={{ ...base, color: 'var(--color-warning)', background: 'var(--color-warning-bg)', borderColor: 'var(--color-warning-border)' }}>
          <AlertTriangle size={12} />
          {providerStatus.message}
          <button
            onClick={handleManualTest}
            title="Retry"
            disabled={Boolean(providerStatus.remainingSeconds && providerStatus.remainingSeconds > 0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: '2px', display: 'flex', opacity: providerStatus.remainingSeconds ? 0.5 : 1 }}
          >
            <RefreshCw size={10} color="var(--color-warning)" />
          </button>
        </span>
      );
    }
    if (providerStatus.status === 'not_configured') {
      return (
        <span style={{ ...base, color: 'var(--color-warning)', background: 'var(--color-warning-bg)', borderColor: 'var(--color-warning-border)' }}>
          <AlertTriangle size={12} />
          {providerStatus.message}
        </span>
      );
    }
    if (providerStatus.status === 'unavailable') {
      return (
        <span style={{ ...base, color: 'var(--color-error)', background: 'var(--color-error-bg)', borderColor: 'var(--color-error-border)' }}>
          <XCircle size={12} />
          {providerStatus.message}
          <button
            onClick={handleManualTest}
            title="Retry"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: '2px', display: 'flex' }}
          >
            <RefreshCw size={10} color="var(--color-error)" />
          </button>
        </span>
      );
    }
    // Demo
    return (
      <span style={{ ...base, color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <Info size={12} />
        Mock AI — Demo
      </span>
    );
  };

  const pageTitle = PAGE_TITLES[activeRoute] || 'ContentSpine AI';

  return (
    <header
      style={{
        height: '60px',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface)',
        flexShrink: 0,
        gap: '16px',
      }}
    >
      {/* Left: page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <h1
          style={{
            fontSize: 'var(--font-md)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
          }}
        >
          {pageTitle}
        </h1>
        <span style={{ color: 'var(--border-color)' }}>·</span>
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
          SIH 2026 Workspace
        </span>
      </div>

      {/* Right: status + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

        {/* AI Provider status */}
        {getStatusIndicator()}

        {/* Provider selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-secondary)',
            padding: '0 10px',
            height: '34px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <BrandLogo name={selectedProvider === 'openai' ? 'openai' : 'gemini'} size={15} />
          <select
            aria-label="Select AI Provider"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            disabled={isTesting}
            style={{
              background: 'transparent',
              color: 'var(--text-primary)',
              border: 'none',
              outline: 'none',
              fontWeight: 600,
              fontSize: 'var(--font-xs)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <option value="gemini" style={{ background: '#FFF8FA' }}>Gemini 2.0 Flash Lite</option>
            <option value="openai" style={{ background: '#FFF8FA' }}>OpenAI GPT-4o</option>
            <option value="bedrock" style={{ background: '#FFF8FA' }}>AWS Bedrock (Claude 3.5)</option>
            <option value="mock"   style={{ background: '#FFF8FA' }}>Mock AI (Demo)</option>
          </select>
        </div>

        {/* Fact Lock status */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: 'var(--font-xs)',
            fontWeight: 700,
            color: 'var(--burgundy-700)',
            background: 'var(--pink-100)',
            border: '1px solid var(--pink-300)',
            borderRadius: 'var(--radius-md)',
            padding: '4px 10px',
            whiteSpace: 'nowrap',
          }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          Fact Lock Active
        </div>

        {/* Export */}
        <button
          className="btn-primary btn-sm"
          onClick={onOpenExport}
          style={{ gap: '5px' }}
        >
          <Download size={13} aria-hidden="true" />
          Export
        </button>

        {/* Benchmark */}
        <button
          className="btn-secondary btn-sm"
          onClick={onLoadDemo}
          disabled={isLoading}
          title="Load benchmark demo project"
        >
          <Zap size={13} aria-hidden="true" />
          Demo
        </button>
      </div>
    </header>
  );
};
