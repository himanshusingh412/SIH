import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, Download, Zap, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface HeaderProps {
  onLoadDemo: () => void;
  onOpenExport: () => void;
  isLoading: boolean;
  selectedProvider: string;
  setSelectedProvider: (p: string) => void;
  activeRoute: string;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadDemo,
  onOpenExport,
  isLoading,
  selectedProvider,
  setSelectedProvider,
}) => {
  const [providerStatus, setProviderStatus] = useState<{
    status: 'connected' | 'not_configured' | 'unavailable' | 'demo' | 'checking';
    message: string;
    model?: string;
  }>({ status: 'checking', message: 'Checking provider connectivity...' });

  const [isTesting, setIsTesting] = useState<boolean>(false);

  useEffect(() => {
    checkProviderStatus(selectedProvider);
  }, [selectedProvider]);

  const checkProviderStatus = async (prov: string) => {
    setIsTesting(true);
    setProviderStatus({ status: 'checking', message: 'Testing connection...' });

    if (prov === 'mock') {
      setProviderStatus({
        status: 'demo',
        message: 'Mock AI — Demo / Testing Only',
        model: 'Demo Mode',
      });
      setIsTesting(false);
      return;
    }

    try {
      const res = await apiClient.testAIProvider(prov);
      if (res && res.status === 'connected') {
        const name = prov === 'gemini' ? 'Gemini' : 'OpenAI';
        setProviderStatus({
          status: 'connected',
          message: `${name} — Connected`,
          model: res.model,
        });
      } else {
        const name = prov === 'gemini' ? 'Gemini' : 'OpenAI';
        setProviderStatus({
          status: 'unavailable',
          message: `${name} — Unavailable`,
        });
      }
    } catch (err: any) {
      const name = prov === 'gemini' ? 'Gemini' : 'OpenAI';
      const isConfigError = err?.message?.includes('not configured') || err?.message?.includes('missing');
      setProviderStatus({
        status: isConfigError ? 'not_configured' : 'unavailable',
        message: isConfigError ? `${name} — Not Configured` : `${name} — Unavailable`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = () => {
    if (providerStatus.status === 'checking') {
      return (
        <span
          style={{
            fontSize: 'var(--font-xs)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          <RefreshCw size={12} className="spin" /> Checking...
        </span>
      );
    }

    if (providerStatus.status === 'connected') {
      return (
        <span
          style={{
            fontSize: 'var(--font-xs)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: '#10b981',
            fontWeight: 700,
            background: 'rgba(16, 185, 129, 0.12)',
            padding: '4px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <CheckCircle2 size={13} color="#10b981" />
          <span>{providerStatus.message}</span>
        </span>
      );
    }

    if (providerStatus.status === 'not_configured') {
      return (
        <span
          style={{
            fontSize: 'var(--font-xs)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: '#f59e0b',
            fontWeight: 700,
            background: 'rgba(245, 158, 11, 0.12)',
            padding: '4px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          <AlertTriangle size={13} color="#f59e0b" />
          <span>{providerStatus.message}</span>
          <button
            onClick={() => checkProviderStatus(selectedProvider)}
            title="Retry Connection Test"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: '4px' }}
          >
            <RefreshCw size={11} color="#f59e0b" />
          </button>
        </span>
      );
    }

    if (providerStatus.status === 'unavailable') {
      return (
        <span
          style={{
            fontSize: 'var(--font-xs)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: '#ef4444',
            fontWeight: 700,
            background: 'rgba(239, 68, 68, 0.12)',
            padding: '4px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <XCircle size={13} color="#ef4444" />
          <span>{providerStatus.message}</span>
          <button
            onClick={() => checkProviderStatus(selectedProvider)}
            title="Retry Connection Test"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: '4px' }}
          >
            <RefreshCw size={11} color="#ef4444" />
          </button>
        </span>
      );
    }

    return (
      <span
        style={{
          fontSize: 'var(--font-xs)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          color: '#38bdf8',
          fontWeight: 700,
          background: 'rgba(56, 189, 248, 0.12)',
          padding: '4px 8px',
          borderRadius: '6px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
        }}
      >
        <Info size={13} color="#38bdf8" />
        <span>🔵 Mock AI — Demo</span>
      </span>
    );
  };

  return (
    <header
      style={{
        height: '64px',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(12, 16, 28, 0.8)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="badge badge-indigo">ContentSpine AI</span>
        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
          Single Source of Truth • Multi-Provider Architecture
        </div>
      </div>

      {/* Top Utility Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Truthful Provider Status Indicator */}
        {getStatusBadge()}

        {/* Provider Selector Dropdown */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '0 12px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <Cpu size={15} color="#38bdf8" />
          <select
            aria-label="Select AI Provider"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            disabled={isTesting}
            style={{
              background: 'transparent',
              color: 'white',
              border: 'none',
              outline: 'none',
              fontWeight: 600,
              fontSize: 'var(--font-sm)',
              cursor: 'pointer',
            }}
          >
            <option value="gemini" style={{ background: '#121826' }}>
              Google Gemini (Gemini 3.1 Flash Lite)
            </option>
            <option value="openai" style={{ background: '#121826' }}>
              OpenAI (GPT-4o)
            </option>
            <option value="mock" style={{ background: '#121826' }}>
              Mock AI (Demo / Testing Only)
            </option>
          </select>
        </div>

        <div style={{ height: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} className="badge badge-emerald">
          <ShieldCheck size={14} />
          <span>Fact Lock Enforced</span>
        </div>

        <button className="btn-secondary" onClick={onOpenExport} style={{ height: '36px', padding: '0 14px', fontSize: 'var(--font-sm)' }}>
          <Download size={15} /> Export
        </button>

        <button className="btn-secondary" onClick={onLoadDemo} disabled={isLoading} style={{ height: '36px', padding: '0 14px', fontSize: 'var(--font-sm)' }}>
          <Zap size={15} /> Benchmark Demo
        </button>
      </div>
    </header>
  );
};
