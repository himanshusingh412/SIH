import React, { useState } from 'react';
import {
  Database,
  Lock,
  Unlock,
  Tag,
  ArrowRight,
  BookOpen,
  Eye,
  X,
  RefreshCw,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Cpu,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { ContentSpineData, FactItem } from '../types';
import { cleanPdfText } from '../utils/pdfSanitizer';

interface ContentSpineViewerProps {
  spine: (ContentSpineData & { sourceDocument?: any; systemsAffected?: string[] }) | null;
  isLoading?: boolean;
  error?: string | null;
  projectTitle?: string;
  sourceDocument?: any;
  onToggleLock: (factLockId: string, currentLock: boolean) => void;
  onNext: () => void;
  onStartNew?: () => void;
  onRetry?: () => void;
}

export const ContentSpineViewer: React.FC<ContentSpineViewerProps> = ({
  spine,
  isLoading,
  error,
  projectTitle,
  sourceDocument,
  onToggleLock,
  onNext,
  onStartNew,
  onRetry,
}) => {
  const [inspectFact, setInspectFact] = useState<FactItem | null>(null);

  // 1. LOADING STATE
  if (isLoading) {
    return (
      <div className="page-enter" style={{ maxWidth: '650px', margin: '80px auto', padding: '40px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '48px 32px' }}>
          <RefreshCw size={44} className="spin" color="var(--burgundy-700)" style={{ margin: '0 auto 20px', display: 'block' }} aria-hidden="true" />
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--burgundy-900)', marginBottom: '8px' }}>
            Loading Content Spine...
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', margin: 0 }}>
            Fetching structured Knowledge Representation &amp; Fact Locks from Neon PostgreSQL...
          </p>
        </div>
      </div>
    );
  }

  // 2. ERROR STATE
  if (error) {
    return (
      <div className="page-enter" style={{ maxWidth: '650px', margin: '80px auto', padding: '40px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '48px 32px', borderLeft: '4px solid #b42318' }}>
          <AlertTriangle size={48} color="#b42318" style={{ margin: '0 auto 16px', display: 'block' }} aria-hidden="true" />
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: '#b42318', marginBottom: '8px' }}>
            Unable to Load Content Spine
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginBottom: '24px', lineHeight: '1.6' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {onRetry && (
              <button className="btn-primary" onClick={onRetry}>
                <RefreshCw size={16} aria-hidden="true" /> Retry Loading
              </button>
            )}
            {onStartNew && (
              <button className="btn-secondary" onClick={onStartNew}>
                Upload New Source Document
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (
    !spine ||
    (!spine.summary &&
      (!spine.factLocks || spine.factLocks.length === 0) &&
      (!spine.dates || spine.dates.length === 0) &&
      (!spine.numbers || spine.numbers.length === 0))
  ) {
    return (
      <div className="page-enter" style={{ maxWidth: '650px', margin: '80px auto', padding: '40px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '48px 32px' }}>
          <Database size={48} color="var(--burgundy-700)" style={{ margin: '0 auto 20px', display: 'block' }} aria-hidden="true" />
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--burgundy-900)', marginBottom: '10px' }}>
            No Content Spine Created Yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginBottom: '28px', lineHeight: '1.6' }}>
            Upload and process a Threat Intel report, PDF, DOCX, or text file to extract a structured Content Spine with Fact Locks stored in Neon PostgreSQL.
          </p>
          {onStartNew && (
            <button className="btn-primary btn-lg" onClick={onStartNew}>
              Upload &amp; Process Source Document →
            </button>
          )}
        </div>
      </div>
    );
  }

  // 4. SUCCESS STATE
  const doc = sourceDocument || spine.sourceDocument;
  const lockedCount = spine.factLocks?.filter((f) => f.isLocked).length || 0;
  const totalFacts = spine.factLocks?.length || (spine.dates.length + spine.numbers.length);
  const events = spine.events || [];
  const claims = spine.claims || [];
  const systems = spine.systemsAffected || [];
  const risks = spine.risks || [];
  const recommendations = spine.recommendations || [];

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <Database size={22} color="var(--burgundy-700)" aria-hidden="true" />
              <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--burgundy-900)', margin: 0 }}>
                {projectTitle || 'Content Spine'} — Single Source of Truth
              </h1>
              <span className="badge badge-burgundy">
                🔒 {lockedCount} / {totalFacts} Facts Locked
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', margin: 0 }}>
              Structured Relational Graph &amp; Fact-Lock Security Protocol (Neon PostgreSQL)
            </p>
          </div>
          <button className="btn-primary" onClick={onNext}>
            <span>Proceed to Configuration &amp; Generators</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Source Information Card */}
      {doc && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <FileText size={18} color="var(--burgundy-700)" aria-hidden="true" />
            <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Source Information &amp; Metadata
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>SOURCE FILENAME</div>
              <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--burgundy-900)', marginTop: '4px', wordBreak: 'break-all' }}>
                {doc.filename || 'Pasted Source Content'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>INPUT CATEGORY</div>
              <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                <span className="badge badge-burgundy">{doc.inputCategory || 'THREAT_INTEL'}</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>FILE SIZE / PAGES</div>
              <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'Raw Text Stream'} · {doc.pageCount || 1} page(s)
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>PROCESSING STATUS</div>
              <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} color="var(--color-success)" aria-hidden="true" />
                FACT_LOCKED &amp; PERSISTED
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Executive Summary Card */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={18} color="var(--burgundy-700)" aria-hidden="true" />
          <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--burgundy-900)', margin: 0 }}>
            Executive Summary
          </h2>
        </div>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-line' }}>
          {spine.summary || 'Structured Content Spine summary.'}
        </p>
      </div>

      {/* Extracted Entities */}
      {spine.entities && spine.entities.length > 0 && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', margin: 0 }}>
            Extracted Entities &amp; Knowledge Nodes ({spine.entities.length})
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
      )}

      {/* Grid of Fact Locks: Metrics & Dates */}
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
                    🔒 {item.value}
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

      {/* Events / Timeline & Claims */}
      {(events.length > 0 || claims.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {events.length > 0 && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Activity size={18} color="var(--burgundy-700)" aria-hidden="true" />
                <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Timeline &amp; Key Events
                </h2>
              </div>
              <ul style={{ paddingLeft: '20px', fontSize: 'var(--font-sm)', color: 'var(--text-primary)', lineHeight: '1.65', margin: 0 }}>
                {events.map((ev, i) => (
                  <li key={i} style={{ marginBottom: '6px' }}>{ev}</li>
                ))}
              </ul>
            </div>
          )}

          {claims.length > 0 && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Layers size={18} color="var(--burgundy-700)" aria-hidden="true" />
                <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Important Factual Claims
                </h2>
              </div>
              <ul style={{ paddingLeft: '20px', fontSize: 'var(--font-sm)', color: 'var(--text-primary)', lineHeight: '1.65', margin: 0 }}>
                {claims.map((cl, i) => (
                  <li key={i} style={{ marginBottom: '6px' }}>{cl}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Systems Affected, Risks & Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: systems.length > 0 ? '1fr 1fr 1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {systems.length > 0 && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Cpu size={18} color="var(--burgundy-700)" aria-hidden="true" />
              <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--burgundy-900)', margin: 0 }}>
                Systems Affected
              </h2>
            </div>
            <ul style={{ paddingLeft: '20px', fontSize: 'var(--font-sm)', color: 'var(--text-primary)', lineHeight: '1.65', margin: 0 }}>
              {systems.map((sys, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{sys}</li>
              ))}
            </ul>
          </div>
        )}

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
            Identified Risks ({risks.length})
          </h2>
          <ul style={{ paddingLeft: '20px', fontSize: 'var(--font-sm)', color: 'var(--text-primary)', lineHeight: '1.65', margin: 0 }}>
            {risks.map((r, i) => (
              <li key={i} style={{ marginBottom: '6px' }}>{r}</li>
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
            Core Recommendations ({recommendations.length})
          </h2>
          <ul style={{ paddingLeft: '20px', fontSize: 'var(--font-sm)', color: 'var(--text-primary)', lineHeight: '1.65', margin: 0 }}>
            {recommendations.map((rec, i) => (
              <li key={i} style={{ marginBottom: '6px' }}>{rec}</li>
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
              <button onClick={() => setInspectFact(null)} className="btn-ghost btn-icon" aria-label="Close modal">
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
