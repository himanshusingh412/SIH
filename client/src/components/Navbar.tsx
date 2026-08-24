import React from 'react';
import { Sparkles, ShieldCheck, Cpu, Zap } from 'lucide-react';

interface NavbarProps {
  onLoadDemo: () => void;
  isLoading: boolean;
  selectedProvider: string;
  setSelectedProvider: (p: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoadDemo,
  isLoading,
  selectedProvider,
  setSelectedProvider,
}) => {
  return (
    <header className="glass-panel" style={{ margin: '16px', padding: '16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              padding: '10px',
              borderRadius: '10px',
              display: 'flex',
            }}
          >
            <Sparkles size={22} color="white" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }} className="gradient-text">
                ContentSpine AI
              </h1>
              <span className="badge badge-indigo">SIH 2026 Prototype</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Upload Once • Lock Facts • Multi-Output Transformation Engine
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Provider Abstraction Selector */}
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
            <Cpu size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Provider:</span>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              style={{
                background: 'transparent',
                color: 'white',
                border: 'none',
                outline: 'none',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <option value="mock" style={{ background: '#121826' }}>
                Mock AI (Offline Demo)
              </option>
              <option value="gemini" style={{ background: '#121826' }}>
                Google Gemini 1.5 Flash
              </option>
              <option value="openai" style={{ background: '#121826' }}>
                OpenAI GPT-4o
              </option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="badge badge-emerald">
            <ShieldCheck size={14} />
            <span>Fact Lock Active</span>
          </div>

          <button className="btn-primary" onClick={onLoadDemo} disabled={isLoading}>
            <Zap size={16} />
            <span>{isLoading ? 'Processing...' : 'Load Demo Benchmark'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
