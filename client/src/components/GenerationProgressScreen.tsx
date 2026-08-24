import React, { useEffect, useState } from 'react';
import { Layers, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import type { OutputType } from '../types';

interface GenerationProgressScreenProps {
  selectedTypes: OutputType[];
  onComplete: () => void;
}

export const GenerationProgressScreen: React.FC<GenerationProgressScreenProps> = ({
  selectedTypes,
  onComplete,
}) => {
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < selectedTypes.length) {
        setCompletedIndices((prev) => [...prev, index]);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => onComplete(), 500);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [selectedTypes, onComplete]);

  return (
    <div style={{ maxWidth: '750px', margin: '60px auto', padding: '20px' }}>
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', marginBottom: '16px' }}>
          <Layers size={32} color="#818cf8" />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }} className="gradient-text">
          Generating Multi-Channel Deliverables
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px' }}>
          Reading strictly from Content Spine with Fact Lock Layer protection...
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
          {selectedTypes.map((type, idx) => {
            const isDone = completedIndices.includes(idx);
            const isCurrent = completedIndices.length === idx;

            return (
              <div
                key={type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  background: isDone
                    ? 'rgba(16, 185, 129, 0.08)'
                    : isCurrent
                    ? 'rgba(99, 102, 241, 0.15)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: isDone
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : isCurrent
                    ? '1.5px solid var(--accent-primary)'
                    : '1px solid var(--border-color)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isDone ? (
                    <CheckCircle2 size={18} color="#6ee7b7" />
                  ) : isCurrent ? (
                    <Loader2 size={18} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--border-color)' }} />
                  )}
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isDone || isCurrent ? 'white' : 'var(--text-muted)' }}>
                    {type.replace(/_/g, ' ')}
                  </span>
                </div>

                {isDone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="badge badge-emerald">
                    <ShieldCheck size={12} />
                    <span>Fact Lock Verified</span>
                  </div>
                )}
                {isCurrent && (
                  <span className="badge badge-indigo">Synthesizing...</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
