import React from 'react';
import { Cpu, ShieldCheck, Download, Zap } from 'lucide-react';

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
        <span className="badge badge-indigo">SIH 2026 Engine</span>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Single Source of Truth • Content Spine Architecture
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Provider Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <Cpu size={15} color="#38bdf8" />
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            style={{
              background: 'transparent',
              color: 'white',
              border: 'none',
              outline: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            <option value="mock" style={{ background: '#121826' }}>Mock AI (Demo Mode)</option>
            <option value="gemini" style={{ background: '#121826' }}>Google Gemini 1.5 Flash</option>
            <option value="openai" style={{ background: '#121826' }}>OpenAI GPT-4o</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="badge badge-emerald">
          <ShieldCheck size={14} />
          <span>Fact Lock Enforced</span>
        </div>

        <button className="btn-secondary" onClick={onOpenExport} style={{ padding: '7px 14px', fontSize: '0.85rem' }}>
          <Download size={15} /> Export
        </button>

        <button className="btn-primary" onClick={onLoadDemo} disabled={isLoading} style={{ padding: '7px 16px', fontSize: '0.85rem' }}>
          <Zap size={15} /> Benchmark Demo
        </button>
      </div>
    </header>
  );
};
