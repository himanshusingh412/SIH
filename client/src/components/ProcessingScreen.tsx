import React, { useEffect } from 'react';
import { UploadCloud, FileSearch, Brain, Database, Lock, CheckCircle2, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { AIProviderStatusBadge } from './AIProviderStatusBadge';

interface ProcessingScreenProps {
  onComplete: () => void;
  statusText?: string;
  isProcessing?: boolean;
  activeStage?: number;
  stageStatus?: 'idle' | 'processing' | 'done' | 'failed';
  error?: string | null;
  onRetry?: () => void;
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  onComplete,
  statusText,
  isProcessing = true,
  activeStage = 0,
  stageStatus = 'processing',
  error,
  onRetry,
}) => {
  const stages = [
    { label: 'Ingesting Source Document', icon: UploadCloud, desc: 'Receiving buffer & analyzing document content' },
    { label: 'Extracting Raw Text & Structure', icon: FileSearch, desc: 'Parsing text formatting & document layout' },
    { label: 'Extracting Content Spine', icon: Brain, desc: 'Identifying entities, dates, numbers, risks, & recommendations via Live Gemini AI' },
    { label: 'Locking Verified Facts', icon: Lock, desc: 'Enforcing Fact Lock Layer on critical metrics' },
    { label: 'Generating Deliverables & Saving to Neon', icon: Database, desc: 'Persisting relational graph and 7 deliverable outputs' },
    { label: 'Review Workspace Ready', icon: CheckCircle2, desc: 'Factual accuracy verified' },
  ];

  const isFailed = Boolean(error) || stageStatus === 'failed';

  // Automatically open workspace when pipeline finishes Stage 5 cleanly
  useEffect(() => {
    if (!isProcessing && !isFailed && (activeStage >= 5 || stageStatus === 'done')) {
      const doneTimer = setTimeout(() => {
        onComplete();
      }, 400);
      return () => clearTimeout(doneTimer);
    }
  }, [isProcessing, isFailed, activeStage, stageStatus, onComplete]);

  return (
    <div style={{ maxWidth: '720px', margin: '40px auto', padding: '20px' }}>
      <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span className="badge badge-burgundy">Ingestion Pipeline</span>
          <AIProviderStatusBadge />
        </div>

        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: '8px', color: 'var(--burgundy-900)' }} className="gradient-text">
          {isFailed ? 'Pipeline Ingestion Notice' : 'Processing Source Document'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', marginBottom: '24px' }}>
          {statusText || 'Building Content Spine, Fact Locks, and Deliverable Outputs via Live Gemini AI...'}
        </p>

        {isFailed ? (
          <div style={{ background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', padding: '24px', borderRadius: '12px', color: 'var(--color-error)', textAlign: 'left', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <AlertTriangle size={20} color="var(--color-error)" />
              <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>
                {stages[activeStage]?.label || 'Pipeline Stage'} — Failed
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {error || 'Gemini request could not be completed. Please check server logs and configuration.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start' }}>
              {onRetry && (
                <button className="btn-primary" onClick={onRetry} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={16} /> Retry Ingestion
                </button>
              )}
              <button className="btn-secondary" onClick={onComplete}>
                Open Workspace with Saved Data →
              </button>
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isStageDone = !isFailed && (activeStage > idx || (activeStage >= 5 && stageStatus === 'done'));
            const isStageFailed = isFailed && activeStage === idx;
            const isStageCurrent = !isFailed && activeStage === idx && activeStage < 5;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: isStageFailed
                    ? 'var(--color-error-bg)'
                    : isStageCurrent
                    ? 'var(--pink-100)'
                    : isStageDone
                    ? 'var(--color-success-bg)'
                    : 'var(--bg-secondary)',
                  border: isStageFailed
                    ? '1.5px solid var(--color-error)'
                    : isStageCurrent
                    ? '1.5px solid var(--burgundy-700)'
                    : isStageDone
                    ? '1px solid var(--color-success-border)'
                    : '1px solid var(--border-color)',
                  opacity: isStageDone || isStageCurrent || isStageFailed ? 1 : 0.5,
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
                    background: isStageFailed
                      ? 'var(--color-error)'
                      : isStageCurrent
                      ? 'var(--burgundy-700)'
                      : isStageDone
                      ? 'var(--color-success)'
                      : 'var(--pink-200)',
                    color: isStageCurrent || isStageDone || isStageFailed ? 'white' : 'var(--text-muted)',
                  }}
                >
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: isStageFailed ? 'var(--color-error)' : isStageCurrent || isStageDone ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {stage.label}
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {stage.desc}
                  </div>
                </div>
                {isStageFailed && (
                  <span className="badge" style={{ background: 'var(--color-error)', color: 'white', fontSize: '0.65rem' }}>
                    Failed
                  </span>
                )}
                {isStageCurrent && (
                  <span className="badge badge-burgundy" style={{ fontSize: '0.65rem' }}>
                    In Progress...
                  </span>
                )}
                {isStageDone && (
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                    Done
                  </span>
                )}
              </div>
            );
          })}

          {/* Direct Navigation Button if Content Spine is ready (Stage >= 3) */}
          {(activeStage >= 3 || (!isProcessing && !isFailed)) && (
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
      </div>
    </div>
  );
};
