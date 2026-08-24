import React from 'react';
import { Upload, Database, Lock, Layers, CheckCircle2 } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  setStep: (step: number) => void;
  hasSpine: boolean;
  hasOutputs: boolean;
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, setStep, hasSpine, hasOutputs }) => {
  const steps = [
    { number: 1, label: '1. Ingest Source', icon: Upload, enabled: true },
    { number: 2, label: '2. Content Spine', icon: Database, enabled: hasSpine },
    { number: 3, label: '3. Fact Lock Layer', icon: Lock, enabled: hasSpine },
    { number: 4, label: '4. Output Generator', icon: Layers, enabled: hasSpine },
    { number: 5, label: '5. Validation & Workspace', icon: CheckCircle2, enabled: hasOutputs },
  ];

  return (
    <div className="glass-panel" style={{ margin: '0 16px 16px 16px', padding: '12px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <button
              key={step.number}
              onClick={() => step.enabled && setStep(step.number)}
              disabled={!step.enabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: isActive
                  ? 'rgba(99, 102, 241, 0.15)'
                  : 'transparent',
                border: isActive
                  ? '1px solid var(--accent-primary)'
                  : '1px solid transparent',
                borderRadius: '8px',
                padding: '8px 14px',
                cursor: step.enabled ? 'pointer' : 'not-allowed',
                opacity: step.enabled ? 1 : 0.4,
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive
                    ? 'var(--accent-primary)'
                    : isCompleted
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(255, 255, 255, 0.08)',
                  color: isActive ? 'white' : isCompleted ? '#6ee7b7' : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                <Icon size={14} />
              </div>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'white' : 'var(--text-main)',
                }}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
