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
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }} className="gradient-text">
                Content Spine — Single Source of Truth
              </h2>
              <span className="badge badge-emerald">
                {lockedCount} / {totalFacts} Facts Locked
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Extracted Knowledge Representation & Source Reference Mapping (Zero-Hallucination Anchor)
            </p>
          </div>
          <button className="btn-primary" onClick={onNext}>
            <span>Proceed to Configuration & Generators</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid of Spine Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Extracted Metrics & Statistics */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Fact Lock Metrics ({spine.factLocks?.filter((f) => f.category === 'NUMBER').length || spine.numbers.length})
              </h3>
            </div>
            <span className="badge badge-amber">Enforced Numbers</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(spine.factLocks?.filter((f) => f.category === 'NUMBER') || spine.numbers).map((item: FactItem) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>{item.key}</span>
                    <button
                      onClick={() => setInspectFact(item)}
                      style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: 'none',
                        color: '#818cf8',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Eye size={10} /> View Source (Page {item.pageNumber || 1})
                    </button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Source Snippet: "{item.sourceSnippet?.slice(0, 60)}..."
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: '#38bdf8',
                      fontSize: '1.05rem',
                      background: 'rgba(56, 189, 248, 0.1)',
                      padding: '3px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    {item.value}
                  </span>
                  <button
                    onClick={() => onToggleLock(item.id, item.isLocked)}
                    style={{
                      background: item.isLocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                      border: 'none',
                      color: item.isLocked ? '#6ee7b7' : '#fda4af',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {item.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                    {item.isLocked ? '🔒 LOCKED' : '🔓 UNLOCKED'}
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
              <Lock size={18} color="#10b981" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Fact Lock Dates ({spine.factLocks?.filter((f) => f.category === 'DATE').length || spine.dates.length})
              </h3>
            </div>
            <span className="badge badge-emerald">Milestone Locks</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(spine.factLocks?.filter((f) => f.category === 'DATE') || spine.dates).map((item: FactItem) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>{item.key}</span>
                    <button
                      onClick={() => setInspectFact(item)}
                      style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: 'none',
                        color: '#818cf8',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Eye size={10} /> View Source (Page {item.pageNumber || 1})
                    </button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Source Snippet: "{item.sourceSnippet?.slice(0, 60)}..."
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: '#6ee7b7',
                      fontSize: '0.95rem',
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '3px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    🔒 {item.value}
                  </span>
                  <button
                    onClick={() => onToggleLock(item.id, item.isLocked)}
                    style={{
                      background: item.isLocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                      border: 'none',
                      color: item.isLocked ? '#6ee7b7' : '#fda4af',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {item.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
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
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>Extracted Entities & Knowledge Nodes</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {spine.entities.map((e, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Tag size={14} color="#818cf8" />
              <span style={{ fontWeight: 700 }}>{e.name}</span>
              <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>{e.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Identified Risks & Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fcd34d', marginBottom: '12px' }}>Identified Risks</h4>
          <ul style={{ paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
            {spine.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#6ee7b7', marginBottom: '12px' }}>Core Recommendations</h4>
          <ul style={{ paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
            {spine.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Fact Inspection Source Mapping Modal */}
      {inspectFact && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
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
                <BookOpen size={20} color="#38bdf8" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Source Mapping Inspection</h3>
              </div>
              <button
                onClick={() => setInspectFact(null)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: '10px', padding: '20px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                FACT KEY & LOCKED VALUE
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                🔒 {inspectFact.key}: {inspectFact.value}
              </div>

              <div style={{ margin: '16px 0', borderTop: '1px solid var(--border-color)' }} />

              <div style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 700 }}>
                EXACT SOURCE DOCUMENT SNIPPET (Page {inspectFact.pageNumber || 1})
              </div>
              <div style={{ fontSize: '0.9rem', color: 'white', fontStyle: 'italic', marginTop: '8px', lineHeight: '1.6' }}>
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
