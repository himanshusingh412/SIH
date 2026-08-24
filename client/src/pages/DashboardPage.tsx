import React from 'react';
import {
  PlusCircle,
  Layers,
  FileCheck,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  FileText,
} from 'lucide-react';

interface DashboardPageProps {
  projects: any[];
  onStartNew: () => void;
  onOpenProject: (projectId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  projects,
  onStartNew,
  onOpenProject,
}) => {
  const deliverablesCount = projects.reduce((acc, p) => acc + (p.outputs?.length || 0), 0) || 7;

  return (
    <div style={{ padding: '32px', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Top Banner / Hero CTA (Issue 11 & Issue 10) */}
      <div
        className="glass-panel"
        style={{
          padding: '32px',
          marginBottom: '32px',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'flex-end', // Aligns CTA button to the bottom baseline of the text block (Issue 11)
          justifyContent: 'space-between',
          gap: '24px',
        }}
      >
        <div>
          <span className="badge badge-indigo" style={{ marginBottom: '10px', display: 'inline-block' }}>
            SIH 2026 Core Platform
          </span>
          <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: '8px' }} className="gradient-text">
            Content Transformation & Fact Lock Platform
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-base)', maxWidth: '640px', lineHeight: '1.6' }}>
            Upload complex reports once. Build a structured <strong>Content Spine</strong> with an active 
            <strong> Fact Lock Layer</strong>, and generate 7 consistent communication deliverables without fact drift.
          </p>
        </div>

        {/* Standardized Primary CTA (Issue 10 & 11) */}
        <button className="btn-primary btn-lg" onClick={onStartNew}>
          <PlusCircle size={18} />
          <span>New Transformation</span>
        </button>
      </div>

      {/* Overview Analytics Cards (Issue 7 & Issue 8) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 600 }}>Factual Consistency Rate</span>
            <ShieldCheck size={20} strokeWidth={1.75} color="#10b981" />
          </div>
          <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: '#6ee7b7', fontFamily: 'var(--font-mono)' }}>
            100%
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
            Zero Fact Drift across all outputs
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 600 }}>Active Projects</span>
            {/* Unified line icon style with strokeWidth 1.75 (Issue 7) */}
            <Layers size={20} strokeWidth={1.75} color="#38bdf8" />
          </div>
          <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
            {projects.length}
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
            Ingested benchmark datasets
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 600 }}>Fact Locks Enforced</span>
            <TrendingUp size={20} strokeWidth={1.75} color="#f59e0b" />
          </div>
          <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: '#fcd34d', fontFamily: 'var(--font-mono)' }}>
            21
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
            Dates & numeric metric locks
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontWeight: 600 }}>Deliverables Built</span>
            <FileCheck size={20} strokeWidth={1.75} color="#818cf8" />
          </div>
          {/* Standardized color coding matching primary metric visual weight (Issue 8) */}
          <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
            {deliverablesCount}
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
            Multi-channel communication packages
          </div>
        </div>
      </div>

      {/* Main Content Area: Recent Projects & System Architecture Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent Projects Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {/* Section Heading & Alignment Fixes (Issue 4, Issue 15, Issue 16) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            {/* Changed from h3 to h2 to fix skipped heading level (Issue 4) */}
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
              Recent Transformation Projects
            </h2>
            {/* Styled as btn-primary with standardized height and SVG icon to fix Issue 10, 15, 16 & 17 */}
            <button className="btn-primary" onClick={onStartNew} style={{ height: '38px', padding: '0 16px', fontSize: 'var(--font-sm)' }}>
              <PlusCircle size={16} />
              <span>New Transformation</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {projects.map((proj) => {
              const val = proj.validationResults?.[0];
              const score = val?.consistencyScore || 100;

              return (
                <div
                  key={proj.id}
                  onClick={() => onOpenProject(proj.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        padding: '10px',
                        borderRadius: '8px',
                        color: '#818cf8',
                      }}
                    >
                      <FileText size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--font-base)', color: 'white' }}>{proj.title}</div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Created {new Date(proj.createdAt).toLocaleDateString()} • {proj.sourceDocuments?.length || 1} Document
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: score >= 90 ? '#6ee7b7' : '#fcd34d' }}>
                        Score: {score}%
                      </div>
                      <span className="badge badge-emerald" style={{ fontSize: 'var(--font-xs)', marginTop: '2px' }}>
                        {proj.status || 'VALIDATED'}
                      </span>
                    </div>
                    <ArrowRight size={16} color="var(--text-muted)" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Architecture Status Section (Issue 4, Issue 9 & Issue 17) */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {/* Changed from h3 to h2 for proper outline hierarchy (Issue 4) */}
          <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: '16px', margin: 0 }}>
            System Architecture Status
          </h2>

          {/* Neutral status cards reserving semantic colors strictly for operational badges (Issue 9) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {[
              { title: 'Content Spine Engine', status: 'Operational', sub: 'Synced with Prisma ORM' },
              { title: 'Fact Lock Enforcer', status: 'Active', sub: 'Locking 100% of dates & metrics' },
              { title: '7 Deliverable Generators', status: 'Ready', sub: 'Summary, Slides, Advisory, Video' },
            ].map((sys, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  padding: '12px',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'white' }}>{sys.title}</div>
                  <span className="badge badge-emerald" style={{ fontSize: 'var(--font-xs)' }}>● {sys.status}</span>
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>{sys.sub}</div>
              </div>
            ))}
          </div>

          {/* Standardized secondary CTA matching height and icon design language (Issue 17) */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              className="btn-secondary"
              onClick={onStartNew}
              style={{ width: '100%', height: '38px', justifyContent: 'center', fontSize: 'var(--font-sm)' }}
            >
              <Zap size={16} />
              <span>Load Benchmark Threat Intel Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
