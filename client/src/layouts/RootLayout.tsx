import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface RootLayoutProps {
  children: React.ReactNode;
  error?: string | null;
  onClearError?: () => void;
  /** Non-blocking degraded-mode message (fallback provider / rate limit). */
  notice?: string | null;
  onClearNotice?: () => void;
  isLoading?: boolean;
}

export const RootLayout: React.FC<RootLayoutProps> = ({
  children,
  error,
  onClearError,
  notice,
  onClearNotice,
  isLoading,
}) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Level-1 Heading for Document Outline (WCAG Issue 2) */}
      <h1 className="sr-only">ContentSpine AI — Multimodal Content Engine</h1>

      {/* Global Error Alert Banner */}
      {error && (
        <div
          role="alert"
          style={{
            background: 'rgba(244, 63, 94, 0.25)',
            borderBottom: '1px solid var(--accent-rose)',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fecdd3',
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
              aria-label="Dismiss error notification"
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700 }}
            >
              Dismiss ✕
            </button>
          )}
        </div>
      )}

      {/* Degraded-Mode Notice (work succeeded, a fallback provider was used) */}
      {!error && notice && (
        <div
          role="status"
          style={{
            background: 'rgba(245, 158, 11, 0.18)',
            borderBottom: '1px solid #f59e0b',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            color: '#92400e',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} aria-hidden="true" />
            <span>{notice}</span>
          </div>
          {onClearNotice && (
            <button
              onClick={onClearNotice}
              aria-label="Dismiss degraded mode notice"
              style={{ background: 'none', border: 'none', color: '#92400e', cursor: 'pointer', fontWeight: 700 }}
            >
              Dismiss ✕
            </button>
          )}
        </div>
      )}

      {/* Global Loading Spinner Bar */}
      {isLoading && (
        <div
          role="progressbar"
          aria-label="Loading platform data"
          style={{
            background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
            height: '3px',
            width: '100%',
            animation: 'pulse 1.5s infinite',
          }}
        />
      )}

      {/* Main Page Content */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* Footer (WCAG Issue 52 Contrast Fix) */}
      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: 'var(--font-xs)',
          color: '#cbd5e1', // > 9:1 high contrast ratio
          background: '#0f172a', // Solid high-contrast background
        }}
      >
        SIH 2026 AI Content Transformation Platform • Single Source of Truth & Fact Lock Architecture
      </footer>
    </div>
  );
};
