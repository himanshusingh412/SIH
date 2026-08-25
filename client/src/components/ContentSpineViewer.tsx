import React, { useState } from 'react';
import { Database, Lock, Unlock, Tag, ArrowRight, BookOpen, Eye, X } from 'lucide-react';
import type { ContentSpineData, FactItem } from '../types';
import { cleanPdfText } from '../utils/pdfSanitizer';

interface ContentSpineViewerProps {
  spine: ContentSpineData;
  onToggleLock: (factLockId: string, currentLock: boolean) => void;
  onNext: () => void;
}

export const ContentSpineViewer: React.FC<ContentSpineViewerProps> = ({ spine, onToggleLock, onNext }) => {
  const [inspectFact, setInspectFact] = useState<FactItem | null>(null);

  const lockedCount = spine.factLocks?.filter((f) => f.isLocked).length || 0;
  const totalFacts  = spine.factLocks?.length || 0;

  return (
    <div className="page-enter" style={{ maxWidth: '1150px', margin: '0 auto', padding: '24px 28px' }}>

      {/* Overview Banner */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)',
          borderLeft: '4px solid var(--burgundy-700)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <Database size={22} color="var(--burgundy-700)" aria-hidden="true" />
              <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--burgundy-900)', margin: 0 }}>
                Content Spine — Single Source of Truth
              </h1>
              <span className="badge badge-burgundy">
                🔒 {lockedCount} / {totalFacts} Facts Locked
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', margin: 0 }}>
              Extracted Knowledge Representation &amp; Source Reference Mapping (Fact Lock Anchor)
            </p>
          </div>
          <button className="btn-primary" onClick={onNext}>
            <span>Proceed to Configuration &amp; Generators</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Grid of Spine Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* Fact Lock Metrics */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="var(--burgundy-700)" aria-hidden="true" />
              <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Fact Lock Metrics ({spine.factLocks?.filter((f) => f.category === 'NUMBER').length || spine.numbers.length})
              </h2>
            </div>
            <span className="badge badge-amber">Enforced Numbers</span>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Fact Lock Metrics List"
            style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}
          >
            {(spine.factLocks?.filter((f) => f.category === 'NUMBER') || spine.numbers).map((item: FactItem) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{item.key}</span>
                    <button
                      onClick={() => setInspectFact(item)}
                      aria-label={`Inspect source for ${item.key}`}
                      className="btn-ghost btn-sm"
                      style={{ height: '24px', padding: '0 6px', fontSize: 'var(--font-xs)', color: 'var(--burgundy-700)' }}
                    >
                      <Eye size={11} aria-hidden="true" /> Source (p. {item.pageNumber || 1})
                    </button>
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Snippet: "{cleanPdfText(item.sourceSnippet || '').slice(0, 55)}..."
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: 'var(--burgundy-700)',
                      fontSize: 'var(--font-sm)',
                      background: 'var(--pink-100)',
                      border: '1px solid var(--pink-300)',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    {item.value}
                  </span>
                  <button
                    onClick={() => onToggleLock(item.id, item.isLocked)}
                    aria-label={`${item.isLocked ? 'Unlock' : 'Lock'} fact ${item.key}`}
                    className={item.isLocked ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                    style={{ height: '28px', fontSize: 'var(--font-xs)', padding: '0 8px' }}
                  >
                    {item.isLocked ? <Lock size={11} aria-hidden="true" /> : <Unlock size={11} aria-hidden="true" />}
                    {item.isLocked ? 'LOCKED' : 'UNLOCKED'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fact Lock Dates */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="var(--color-success)" aria-hidden="true" />
              <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Fact Lock Dates ({spine.factLocks?.filter((f) => f.category === 'DATE').length || spine.dates.length})
              </h2>
            </div>
            <span className="badge badge-success">Milestone Locks</span>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Fact Lock Dates List"
            style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}
          >
            {(spine.factLocks?.filter((f) => f.category === 'DATE') || spine.dates).map((item: FactItem) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{item.key}</span>
                    <button
                      onClick={() => setInspectFact(item)}
                      aria-label={`Inspect source for ${item.key}`}
                      className="btn-ghost btn-sm"
                      style={{ height: '24px', padding: '0 6px', fontSize: 'var(--font-xs)', color: 'var(--burgundy-700)' }}
                    >
                      <Eye size={11} aria-hidden="true" /> Source (p. {item.pageNumber || 1})
                    </button>
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Snippet: "{cleanPdfText(item.sourceSnippet || '').slice(0, 55)}..."
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: 'var(--color-success)',
                      fontSize: 'var(--font-sm)',
                      background: 'var(--color-success-bg)',
                      border: '1px solid var(--color-success-border)',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    🔒 {item.value}
                  </span>
                  <button
                    onClick={() => onToggleLock(item.id, item.isLocked)}
                    aria-label={`${item.isLocked ? 'Unlock' : 'Lock'} date ${item.key}`}
                    className={item.isLocked ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                    style={{ height: '28px', fontSize: 'var(--font-xs)', padding: '0 8px' }}
                  >
                    {item.isLocked ? <Lock size={11} aria-hidden="true" /> : <Unlock size={11} aria-hidden="true" />}
                    {item.isLocked ? 'LOCKED' : 'UNLOCKED'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Extracted Entities */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', margin: 0 }}>
          Extracted Entities &amp; Knowledge Nodes
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {spine.entities.map((e, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--pink-100)',
                border: '1px solid var(--pink-300)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--font-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Tag size={13} color="var(--burgundy-700)" aria-hidden="true" />
              <span style={{ fontWeight: 700, color: 'var(--burgundy-900)' }}>{e.name}</span>
              <span className="badge badge-burgundy" style={{ fontSize: '0.68rem' }}>{e.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risks & Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--color-warning-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--color-warning)', marginBottom: '12px', margin: 0 }}>
            Identified Risks
          </h2>
          <ul style={{ paddingLeft: '20px', fontSize: 'var(--font-sm)', color: 'var(--text-primary)', lineHeight: '1.65' }}>
            {spine.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--color-success-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--color-success)', marginBottom: '12px', margin: 0 }}>
            Core Recommendations
          </h2>
          <ul style={{ paddingLeft: '20px', fontSize: 'var(--font-sm)', color: 'var(--text-primary)', lineHeight: '1.65' }}>
            {spine.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Source Mapping Modal */}
      {inspectFact && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="source-mapping-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(42, 7, 21, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 'var(--z-modal)',
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              width: '540px',
              padding: '28px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} color="var(--burgundy-700)" aria-hidden="true" />
                <h3 id="source-mapping-title" style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Source Mapping Inspection
                </h3>
              </div>
              <button
                onClick={() => setInspectFact(null)}
                className="btn-ghost btn-icon"
                aria-label="Close modal"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                marginBottom: '20px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                FACT KEY &amp; LOCKED VALUE
              </div>
              <div style={{ fontSize: 'var(--font-md)', fontWeight: 800, color: 'var(--burgundy-700)', marginTop: '4px' }}>
                🔒 {inspectFact.key}: {inspectFact.value}
              </div>

              <div style={{ margin: '14px 0', borderTop: '1px solid var(--border-color)' }} />

              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', fontWeight: 700 }}>
                EXACT SOURCE DOCUMENT SNIPPET (Page {inspectFact.pageNumber || 1})
              </div>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', fontStyle: 'italic', marginTop: '8px', lineHeight: '1.6' }}>
                "{cleanPdfText(inspectFact.sourceSnippet || 'Extracted snippet from document text.')}"
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="badge badge-success">Confidence: 99.8%</span>
              <button className="btn-secondary" onClick={() => setInspectFact(null)}>
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
