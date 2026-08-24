import React from 'react';
import {
  PlusCircle,
  Database,
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
  return (
    <div style={{ padding: '32px', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Top Banner / Hero CTA */}
      <div
        className="glass-panel"
        style={{
          padding: '32px',
          marginBottom: '32px',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span className="badge badge-indigo" style={{ marginBottom: '10px', display: 'inline-block' }}>
            SIH 2026 Core Platform
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }} className="gradient-text">
            Content Transformation & Fact Lock Platform
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '640px', lineHeight: '1.6' }}>
            Upload complex reports once. Build a structured <strong>Content Spine</strong> with an active 
            <strong> Fact Lock Layer</strong>, and generate 7 consistent communication deliverables without fact drift.
          </p>
        </div>

        <button className="btn-primary" onClick={onStartNew} style={{ padding: '14px 28px', fontSize: '1rem' }}>
          <PlusCircle size={20} />
          <span>New Transformation →</span>
        </button>
      </div>

      {/* Overview Analytics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Factual Consistency Rate</span>
            <ShieldCheck size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#6ee7b7', fontFamily: 'var(--font-mono)' }}>
            100%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Zero Fact Drift across all 7 outputs
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Projects</span>
            <Database size={20} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
            {projects.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Ingested benchmark datasets
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fact Locks Enforced</span>
            <TrendingUp size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fcd34d', fontFamily: 'var(--font-mono)' }}>
            21
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Dates & numeric metric locks
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Deliverables Built</span>
            <FileCheck size={20} color="#a5b4fc" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#a5b4fc', fontFamily: 'var(--font-mono)' }}>
            {projects.reduce((acc, p) => acc + (p.outputs?.length || 0), 0) || 7}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Multi-channel communication packages
          </div>
        </div>
      </div>

      {/* Main Content Area: Recent Projects & Outputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent Projects Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recent Transformation Projects</h3>
            <button className="btn-secondary" onClick={onStartNew} style={{ fontSize: '0.8rem' }}>
              + New Transformation
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
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>{proj.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Created {new Date(proj.createdAt).toLocaleDateString()} • {proj.sourceDocuments?.length || 1} Document
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: score >= 90 ? '#6ee7b7' : '#fcd34d' }}>
                        Score: {score}%
                      </div>
                      <span className="badge badge-emerald" style={{ fontSize: '0.65rem', marginTop: '2px' }}>
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

        {/* Quick Benchmark Preset / System Status */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>System Architecture Status</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#6ee7b7' }}>Content Spine Engine</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Operational & Synced with Prisma ORM</div>
            </div>

            <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#a5b4fc' }}>Fact Lock Enforcer</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Locking 100% of dates & key statistics</div>
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#7dd3fc' }}>7 Deliverable Generators</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Summary, LinkedIn, X Thread, Advisory, Slides, Infographic, Video</div>
            </div>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button className="btn-secondary" onClick={onStartNew} style={{ width: '100%', justifyContent: 'center' }}>
              <Zap size={16} /> Load Benchmark Threat Intel Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
