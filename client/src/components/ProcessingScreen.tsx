import React, { useEffect, useState } from 'react';
import { UploadCloud, FileSearch, Brain, Database, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { AIProviderStatusBadge } from './AIProviderStatusBadge';

interface ProcessingScreenProps {
  onComplete: () => void;
  statusText?: string;
  isProcessing?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  onComplete,
  statusText,
  isProcessing = true,
  error,
  onRetry,
}) => {
  const [activeStage, setActiveStage] = useState(0);

  const stages = [
    { label: 'Ingesting Source Document', icon: UploadCloud, desc: 'Receiving buffer & analyzing document content' },
    { label: 'Extracting Raw Text & Structure', icon: FileSearch, desc: 'Parsing text formatting & document layout' },
    { label: 'Extracting Content Spine', icon: Brain, desc: 'Identifying entities, dates, numbers, risks, & recommendations' },
    { label: 'Locking Verified Facts', icon: Lock, desc: 'Enforcing Fact Lock Layer on critical metrics' },
    { label: 'Generating Deliverables & Saving to Neon', icon: Database, desc: 'Persisting relational graph and deliverable outputs' },
    { label: 'Review Workspace Ready', icon: CheckCircle2, desc: 'Factual accuracy verified' },
  ];

  useEffect(() => {
    // Step through initial stages up to stage 4 while processing
    const timer = setInterval(() => {
      setActiveStage((prev) => {
        if (prev < 4) {
          return prev + 1;
        }
        return prev;
      });
    }, 500);

    return () => clearInterval(timer);
  }, []);

  // When isProcessing transitions from true to false (or when complete signal triggers)
  useEffect(() => {
    if (!isProcessing && !error) {
      setActiveStage(5);
      const doneTimer = setTimeout(() => {
        onComplete();
      }, 400);
      return () => clearTimeout(doneTimer);
    }
  }, [isProcessing, error, onComplete]);

  return (
    <div style={{ maxWidth: '720px', margin: '40px auto', padding: '20px' }}>
      <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span className="badge badge-burgundy">Ingestion Pipeline</span>
          <AIProviderStatusBadge />
        </div>

        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: '8px', color: 'var(--burgundy-900)' }} className="gradient-text">
          Processing Source Document
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', marginBottom: '24px' }}>
          {statusText || 'Building Content Spine, Fact Locks, and Deliverable Outputs...'}
        </p>

        {error ? (
          <div style={{ background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', padding: '20px', borderRadius: '12px', color: 'var(--color-error)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>Processing Notice</h3>
            <p style={{ fontSize: '0.88rem', marginBottom: '16px' }}>{error}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {onRetry && (
                <button className="btn-secondary" onClick={onRetry}>
                  Retry Ingestion
                </button>
              )}
              <button className="btn-primary" onClick={onComplete}>
                Open Review Workspace →
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
            {stages.map((stage, idx) => {
              const Icon = stage.icon;
              const isDone = activeStage > idx || (activeStage === 5 && idx <= 5);
              const isCurrent = activeStage === idx && activeStage < 5;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: isCurrent
                      ? 'var(--pink-100)'
                      : isDone
                      ? 'var(--color-success-bg)'
                      : 'var(--bg-secondary)',
                    border: isCurrent
                      ? '1.5px solid var(--burgundy-700)'
                      : isDone
                      ? '1px solid var(--color-success-border)'
                      : '1px solid var(--border-color)',
                    opacity: isDone || isCurrent ? 1 : 0.5,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isCurrent
                        ? 'var(--burgundy-700)'
                        : isDone
                        ? 'var(--color-success)'
                        : 'var(--pink-200)',
                      color: isCurrent || isDone ? 'white' : 'var(--text-muted)',
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: isCurrent || isDone ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {stage.label}
                    </div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {stage.desc}
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="badge badge-burgundy" style={{ fontSize: '0.65rem' }}>
                      In Progress...
                    </span>
                  )}
                  {isDone && (
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                      Done
                    </span>
                  )}
                </div>
              );
            })}

            {/* Direct Navigation Button if Content Spine is ready (Stage >= 3) */}
            {activeStage >= 3 && (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                  type="button"
                  className="btn-primary btn-lg"
                  onClick={onComplete}
                  style={{ gap: '8px' }}
                >
                  Open Review Workspace <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


