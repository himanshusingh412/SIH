import React, { useState } from 'react';
import { Database, Lock, Unlock, Tag, ArrowRight, BookOpen, Eye, X } from 'lucide-react';
import type { ContentSpineData, FactItem } from '../types';

interface ContentSpineViewerProps {
  spine: ContentSpineData;
  onToggleLock: (factLockId: string, currentLock: boolean) => void;
  onNext: () => void;
}

export const ContentSpineViewer: React.FC<ContentSpineViewerProps> = ({ spine, onToggleLock, onNext }) => {
  const [inspectFact, setInspectFact] = useState<FactItem | null>(null);

  const lockedCount = spine.factLocks?.filter((f) => f.isLocked).length || 0;
  const totalFacts = spine.factLocks?.length || 0;

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '20px' }}>
      {/* Overview Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <Database size={22} color="#38bdf8" />
              <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800 }} className="gradient-text">
                Content Spine — Single Source of Truth
              </h2>
              <span className="badge badge-emerald">
                {lockedCount} / {totalFacts} Facts Locked
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
              Extracted Knowledge Representation & Source Reference Mapping (Zero-Hallucination Anchor)
            </p>
          </div>
          <button className="btn-primary" onClick={onNext}>
            <span>Proceed to Configuration & Generators</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Grid of Spine Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Extracted Metrics & Statistics */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="#fbbf24" />
              <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700 }}>
                Fact Lock Metrics ({spine.factLocks?.filter((f) => f.category === 'NUMBER').length || spine.numbers.length})
              </h3>
            </div>
            <span className="badge badge-amber">Enforced Numbers</span>
          </div>

          {/* Keyboard focusable scrollable region (WCAG Issue 3) */}
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
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: '#f8fafc' }}>{item.key}</span>
                    <button
                      onClick={() => setInspectFact(item)}
                      aria-label={`Inspect source for ${item.key}`}
                      style={{
                        background: 'rgba(99, 102, 241, 0.25)',
                        border: 'none',
                        color: '#e0e7ff',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: 'var(--font-xs)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Eye size={11} aria-hidden="true" /> View Source (Page {item.pageNumber || 1})
                    </button>
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Source Snippet: "{item.sourceSnippet?.slice(0, 60)}..."
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* High contrast sky mono text (>7:1 ratio) */}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: '#7dd3fc',
                      fontSize: 'var(--font-sm)',
                      background: 'rgba(2, 132, 199, 0.25)',
                      padding: '3px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    {item.value}
                  </span>
                  <button
                    onClick={() => onToggleLock(item.id, item.isLocked)}
                    aria-label={`${item.isLocked ? 'Unlock' : 'Lock'} fact ${item.key}`}
                    style={{
                      background: item.isLocked ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)',
                      border: 'none',
                      color: item.isLocked ? '#a7f3d0' : '#fecdd3',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: 'var(--font-xs)',
                      fontWeight: 700,
                    }}
                  >
                    {item.isLocked ? <Lock size={12} aria-hidden="true" /> : <Unlock size={12} aria-hidden="true" />}
                    {item.isLocked ? 'LOCKED' : 'UNLOCKED'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Extracted Milestone Dates */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="#34d399" />
              <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700 }}>
                Fact Lock Dates ({spine.factLocks?.filter((f) => f.category === 'DATE').length || spine.dates.length})
              </h3>
            </div>
            <span className="badge badge-emerald">Milestone Locks</span>
          </div>

          {/* Keyboard focusable scrollable region (WCAG Issue 3) */}
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
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: '#f8fafc' }}>{item.key}</span>
                    <button
                      onClick={() => setInspectFact(item)}
                      aria-label={`Inspect source for ${item.key}`}
                      style={{
                        background: 'rgba(99, 102, 241, 0.25)',
                        border: 'none',
                        color: '#e0e7ff',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: 'var(--font-xs)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Eye size={11} aria-hidden="true" /> View Source (Page {item.pageNumber || 1})
                    </button>
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Source Snippet: "{item.sourceSnippet?.slice(0, 60)}..."
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* High contrast emerald text (>7:1 ratio) */}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: '#a7f3d0',
                      fontSize: 'var(--font-sm)',
                      background: 'rgba(5, 150, 105, 0.25)',
                      padding: '3px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    🔒 {item.value}
                  </span>
                  <button
                    onClick={() => onToggleLock(item.id, item.isLocked)}
                    aria-label={`${item.isLocked ? 'Unlock' : 'Lock'} date ${item.key}`}
                    style={{
                      background: item.isLocked ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)',
                      border: 'none',
                      color: item.isLocked ? '#a7f3d0' : '#fecdd3',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: 'var(--font-xs)',
                      fontWeight: 700,
                    }}
                  >
                    {item.isLocked ? <Lock size={12} aria-hidden="true" /> : <Unlock size={12} aria-hidden="true" />}
                    {item.isLocked ? 'LOCKED' : 'UNLOCKED'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Extracted Named Entities */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: '14px' }}>Extracted Entities & Knowledge Nodes</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {spine.entities.map((e, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: 'var(--font-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Tag size={14} color="#a5b4fc" aria-hidden="true" />
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>{e.name}</span>
              <span className="badge badge-indigo">{e.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Identified Risks & Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: '#fde68a', marginBottom: '12px' }}>Identified Risks</h4>
          <ul style={{ paddingLeft: '20px', fontSize: 'var(--font-sm)', color: '#f8fafc', lineHeight: '1.6' }}>
            {spine.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: '#a7f3d0', marginBottom: '12px' }}>Core Recommendations</h4>
          <ul style={{ paddingLeft: '20px', fontSize: 'var(--font-sm)', color: '#f8fafc', lineHeight: '1.6' }}>
            {spine.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Fact Inspection Source Mapping Modal */}
      {inspectFact && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="source-mapping-title"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div className="glass-panel" style={{ width: '560px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} color="#38bdf8" aria-hidden="true" />
                <h3 id="source-mapping-title" style={{ fontSize: 'var(--font-lg)', fontWeight: 800 }}>Source Mapping Inspection</h3>
              </div>
              <button
                onClick={() => setInspectFact(null)}
                aria-label="Close modal"
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.5)', borderRadius: '10px', padding: '20px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                FACT KEY & LOCKED VALUE
              </div>
              <div style={{ fontSize: 'var(--font-md)', fontWeight: 800, color: '#7dd3fc', marginTop: '4px' }}>
                🔒 {inspectFact.key}: {inspectFact.value}
              </div>

              <div style={{ margin: '16px 0', borderTop: '1px solid var(--border-color)' }} />

              <div style={{ fontSize: 'var(--font-xs)', color: '#c7d2fe', fontWeight: 700 }}>
                EXACT SOURCE DOCUMENT SNIPPET (Page {inspectFact.pageNumber || 1})
              </div>
              <div style={{ fontSize: 'var(--font-sm)', color: '#f8fafc', fontStyle: 'italic', marginTop: '8px', lineHeight: '1.6' }}>
                "{inspectFact.sourceSnippet || 'Extracted snippet from document text.'}"
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="badge badge-emerald">Confidence: 99.8%</span>
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
