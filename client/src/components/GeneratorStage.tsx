import React, { useState } from 'react';
import { Layers, Users, Sparkles, CheckSquare, Square } from 'lucide-react';
import type { AudienceProfile, OutputType } from '../types';

interface GeneratorStageProps {
  onGenerate: (types: OutputType[], audience: AudienceProfile) => void;
  isLoading: boolean;
}

export const GeneratorStage: React.FC<GeneratorStageProps> = ({ onGenerate, isLoading }) => {
  const [audience, setAudience] = useState<AudienceProfile>('EXECUTIVE');
  const [selectedTypes, setSelectedTypes] = useState<OutputType[]>([
    'EXECUTIVE_SUMMARY',
    'LINKEDIN_POST',
    'X_THREAD',
    'ADVISORY',
    'PRESENTATION',
    'INFOGRAPHIC',
    'VIDEO_PACKAGE',
  ]);

  const audienceOptions: Array<{ id: AudienceProfile; label: string; desc: string }> = [
    { id: 'EXECUTIVE', label: 'Executive Leadership', desc: 'High-level strategic summaries & ROI metrics' },
    { id: 'TECHNICAL', label: 'Technical Engineers', desc: 'Deep implementation architecture & code details' },
    { id: 'GOVERNMENT', label: 'Government & Policy', desc: 'Formal advisory language, compliance, & directives' },
    { id: 'PUBLIC', label: 'General Public', desc: 'Engaging, clear, accessible social content & videos' },
  ];

  const outputTypeOptions: Array<{ id: OutputType; label: string; desc: string; badge: string }> = [
    { id: 'EXECUTIVE_SUMMARY', label: 'Executive Summary', desc: 'Structured summary for decision makers', badge: 'Document' },
    { id: 'LINKEDIN_POST', label: 'LinkedIn Post', desc: 'Engaging post with key statistics & hashtags', badge: 'Social' },
    { id: 'X_THREAD', label: 'X (Twitter) Thread', desc: '5-part breakdown sequence for social reach', badge: 'Social' },
    { id: 'ADVISORY', label: 'Official Advisory', desc: 'Policy compliance notice & directive document', badge: 'GovTech' },
    { id: 'PRESENTATION', label: 'Presentation Deck', desc: 'Slide-by-slide structure with speaker notes', badge: 'Slides' },
    { id: 'INFOGRAPHIC', label: 'Infographic Layout Data', desc: 'Visual stats grid & key takeaway diagram', badge: 'Visual' },
    { id: 'VIDEO_PACKAGE', label: 'Complete Video Package', desc: 'Voiceover script, scene storyboard & SRT subtitles', badge: 'Video' },
  ];

  const toggleType = (type: OutputType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) return;
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleSelectAll = () => {
    setSelectedTypes(outputTypeOptions.map((o) => o.id));
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span className="badge badge-indigo" style={{ marginBottom: '8px', display: 'inline-block' }}>
            Stage 3 — Multi-Output Generator
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }} className="gradient-text">
            Transform 1 Source into 7 Deliverables
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
            All generators read strictly from the validated Content Spine with Fact Lock Layer protection.
          </p>
        </div>

        {/* Audience Profile Selector */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Users size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Select Audience Profile</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {audienceOptions.map((opt) => {
              const active = audience === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAudience(opt.id)}
                  style={{
                    textAlign: 'left',
                    padding: '14px',
                    borderRadius: '10px',
                    background: active ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    border: active ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: active ? 'white' : 'var(--text-main)', marginBottom: '4px' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Outputs Selection */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#10b981" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Select Target Communication Formats</h3>
            </div>
            <button
              type="button"
              onClick={handleSelectAll}
              style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
            >
              Select All (7 Formats)
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {outputTypeOptions.map((opt) => {
              const selected = selectedTypes.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={() => toggleType(opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px',
                    borderRadius: '10px',
                    background: selected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: selected ? '1.5px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ marginTop: '2px', color: selected ? '#6ee7b7' : 'var(--text-muted)' }}>
                    {selected ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: selected ? 'white' : 'var(--text-main)' }}>
                        {opt.label}
                      </span>
                      <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>{opt.badge}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {opt.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            className="btn-primary"
            onClick={() => onGenerate(selectedTypes, audience)}
            disabled={isLoading}
            style={{ padding: '14px 32px', fontSize: '1rem' }}
          >
            <Sparkles size={20} />
            <span>{isLoading ? 'Generating & Validating Outputs...' : `Generate ${selectedTypes.length} Outputs & Validate Consistency →`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
