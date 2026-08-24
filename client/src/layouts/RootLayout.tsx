import React from 'react';
import { AlertCircle } from 'lucide-react';

interface RootLayoutProps {
  children: React.ReactNode;
  error?: string | null;
  onClearError?: () => void;
  isLoading?: boolean;
}

export const RootLayout: React.FC<RootLayoutProps> = ({ children, error, onClearError, isLoading }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Global Error Alert Banner */}
      {error && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.15)',
            borderBottom: '1px solid var(--accent-rose)',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fda4af',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          {onClearError && (
            <button
              onClick={onClearError}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700 }}
            >
              Dismiss ✕
            </button>
          )}
        </div>
      )}

      {/* Global Loading Spinner Bar */}
      {isLoading && (
        <div
          style={{
            background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
            height: '3px',
            width: '100%',
            animation: 'pulse 1.5s infinite',
          }}
        />
      )}

      {/* Main Page Content */}
      <div style={{ flex: 1 }}>{children}</div>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          background: 'rgba(11, 15, 25, 0.8)',
        }}
      >
        SIH 2026 AI Content Transformation Platform • Single Source of Truth & Fact Lock Architecture
      </footer>
    </div>
  );
};
