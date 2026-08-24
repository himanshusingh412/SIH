import React, { useEffect, useState } from 'react';
import { UploadCloud, FileSearch, Brain, Database, Lock, CheckCircle2 } from 'lucide-react';

interface ProcessingScreenProps {
  onComplete: () => void;
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ onComplete }) => {
  const [activeStage, setActiveStage] = useState(0);

  const stages = [
    { label: 'Uploading Source Document', icon: UploadCloud, desc: 'Receiving buffer & analyzing byte streams' },
    { label: 'Extracting Raw Text & Structure', icon: FileSearch, desc: 'Parsing PDF pages & document layout' },
    { label: 'Understanding Context & Entities', icon: Brain, desc: 'Identifying organizations, dates, and numbers' },
    { label: 'Building Content Spine', icon: Database, desc: 'Structuring single source of truth graph' },
    { label: 'Locking Facts & Milestones', icon: Lock, desc: 'Enforcing Fact Lock Layer on numbers & dates' },
    { label: 'Content Spine Ready', icon: CheckCircle2, desc: '100% factual accuracy verified' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((prev) => {
        if (prev < stages.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(() => onComplete(), 600);
          return prev;
        }
      });
    }, 450);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div style={{ maxWidth: '700px', margin: '60px auto', padding: '20px' }}>
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }} className="gradient-text">
          Processing Source Document
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px' }}>
          Building Content Spine and Enforcing Fact Lock Layer...
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isDone = activeStage > idx;
            const isCurrent = activeStage === idx;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  background: isCurrent
                    ? 'rgba(99, 102, 241, 0.15)'
                    : isDone
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: isCurrent
                    ? '1.5px solid var(--accent-primary)'
                    : isDone
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid var(--border-color)',
                  opacity: isDone || isCurrent ? 1 : 0.4,
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isCurrent
                      ? 'var(--accent-primary)'
                      : isDone
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(255, 255, 255, 0.08)',
                    color: isCurrent ? 'white' : isDone ? '#6ee7b7' : 'var(--text-muted)',
                  }}
                >
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isCurrent || isDone ? 'white' : 'var(--text-muted)' }}>
                    {stage.label}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {stage.desc}
                  </div>
                </div>
                {isCurrent && (
                  <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                    In Progress...
                  </span>
                )}
                {isDone && (
                  <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                    Done
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
