import React from 'react';
import { BarChart2 } from 'lucide-react';
import type { InfographicLayout } from '../../utils/deliverableParsers';

interface InfographicViewProps {
  layout: InfographicLayout;
  accentColor?: string;
}

/** Renders an INFOGRAPHIC deliverable as headline metric tiles plus callout panels. */
export const InfographicView: React.FC<InfographicViewProps> = ({ layout, accentColor = '#7C3AED' }) => (
  <div
    style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      overflow: 'hidden',
    }}
  >
    <div style={{ height: '6px', background: `linear-gradient(90deg, ${accentColor}, var(--burgundy-700))` }} />

    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '18px', borderBottom: '1px solid var(--border-color)' }}>
        <span
          className="badge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '10px',
            background: `${accentColor}18`,
            color: accentColor,
            border: `1px solid ${accentColor}33`,
            fontWeight: 800,
          }}
        >
          <BarChart2 size={13} aria-hidden="true" /> Infographic Layout
        </span>
        <h3 style={{ fontSize: 'clamp(1.1rem, 2vw, 1.5rem)', fontWeight: 800, color: 'var(--burgundy-900)', lineHeight: 1.3 }}>
          {layout.header.title}
        </h3>
        {layout.header.subtitle && (
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', marginTop: '6px' }}>{layout.header.subtitle}</p>
        )}
      </div>

      {/* Metric tiles */}
      {layout.heroMetrics.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '14px',
            marginBottom: layout.sectionCallouts.length ? '24px' : 0,
          }}
        >
          {layout.heroMetrics.map((metric, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderTop: `3px solid ${accentColor}`,
                borderRadius: 'var(--radius-md)',
                padding: '16px 14px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(1.15rem, 2.4vw, 1.6rem)',
                  fontWeight: 800,
                  color: 'var(--burgundy-700)',
                  lineHeight: 1.2,
                  wordBreak: 'break-word',
                }}
              >
                {metric.value}
              </div>
              <div
                style={{
                  fontSize: 'var(--font-xs)',
                  color: 'var(--text-muted)',
                  marginTop: '6px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Callout panels */}
      {layout.sectionCallouts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {layout.sectionCallouts.map((callout, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-surface)',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                borderLeft: `4px solid ${accentColor}`,
              }}
            >
              <div style={{ fontWeight: 800, color: 'var(--burgundy-900)', marginBottom: '5px', fontSize: 'var(--font-sm)' }}>
                {callout.title}
              </div>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{callout.text}</div>
            </div>
          ))}
        </div>
      )}

      {layout.footerNotes && (
        <p style={{ marginTop: '18px', fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
          {layout.footerNotes}
        </p>
      )}
    </div>
  </div>
);
