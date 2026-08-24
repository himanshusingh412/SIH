import React, { useState } from 'react';
import { Users, Volume2, Sliders, Target, Layers, CheckSquare, Square, Sparkles } from 'lucide-react';
import type { AudienceProfile, OutputType } from '../types';

interface ConfigScreenProps {
  onGenerate: (
    types: OutputType[],
    audience: AudienceProfile,
    tone: string,
    detail: string,
    objective: string
  ) => void;
  isLoading: boolean;
}

export const ConfigScreen: React.FC<ConfigScreenProps> = ({ onGenerate, isLoading }) => {
  const [audience, setAudience] = useState<AudienceProfile>('EXECUTIVE');
  const [tone, setTone] = useState<string>('Formal');
  const [detail, setDetail] = useState<string>('Standard');
  const [objective, setObjective] = useState<string>('Inform');
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

  const toneOptions = ['Formal', 'Professional', 'Urgent', 'Educational', 'Neutral'];
  const detailOptions = ['Brief', 'Standard', 'Detailed'];
  const objectiveOptions = ['Inform', 'Warn', 'Educate', 'Persuade', 'Summarize', 'Recommend'];

  const outputCards: Array<{ id: OutputType; label: string; desc: string; category: string }> = [
    { id: 'EXECUTIVE_SUMMARY', label: 'Executive Summary', desc: 'Structured summary for decision makers', category: 'Document' },
    { id: 'LINKEDIN_POST', label: 'LinkedIn Post', desc: 'Engaging post with key statistics & hashtags', category: 'Social' },
    { id: 'X_THREAD', label: 'X (Twitter) Thread', desc: '5-part breakdown sequence for social reach', category: 'Social' },
    { id: 'ADVISORY', label: 'Official Advisory', desc: 'Policy compliance notice & directive document', category: 'GovTech' },
    { id: 'PRESENTATION', label: 'Presentation Deck', desc: 'Slide-by-slide structure with speaker notes', category: 'Slides' },
    { id: 'INFOGRAPHIC', label: 'Infographic Layout Data', desc: 'Visual stats grid & key takeaway diagram', category: 'Visual' },
    { id: 'VIDEO_PACKAGE', label: 'Complete Video Package', desc: 'Voiceover script, scene storyboard & SRT subtitles', category: 'Video' },
  ];

  const toggleType = (type: OutputType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) return;
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="badge badge-indigo" style={{ marginBottom: '8px', display: 'inline-block' }}>
            Configuration & Target Deliverable Selection
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }} className="gradient-text">
            Configure Audience, Tone & Target Formats
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
            Tailor audience profile, detail level, and select deliverables to generate from the Content Spine.
          </p>
        </div>

        {/* 1. Audience Profile */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Users size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>1. Audience Profile</h3>
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
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: active ? 'white' : 'var(--text-main)' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Tone, Detail Level & Objective Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          {/* Tone */}
          <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Volume2 size={16} color="#10b981" />
              <label htmlFor="tone-select" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Tone</label>
            </div>
            <select
              id="tone-select"
              aria-label="Select Content Tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={{
                width: '100%',
                background: '#121826',
                color: 'white',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 12px',
                outline: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              {toneOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Detail Level */}
          <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Sliders size={16} color="#f59e0b" />
              <label htmlFor="detail-select" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Detail Depth</label>
            </div>
            <select
              id="detail-select"
              aria-label="Select Detail Depth"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              style={{
                width: '100%',
                background: '#121826',
                color: 'white',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 12px',
                outline: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              {detailOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Objective */}
          <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Target size={16} color="#a5b4fc" />
              <label htmlFor="objective-select" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Communication Objective</label>
            </div>
            <select
              id="objective-select"
              aria-label="Select Communication Objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              style={{
                width: '100%',
                background: '#121826',
                color: 'white',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 12px',
                outline: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              {objectiveOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Output Cards Multi-Selection */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#10b981" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>2. Target Deliverables ({selectedTypes.length} Selected)</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTypes(outputCards.map((o) => o.id))}
              style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
            >
              Select All 7 Formats
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {outputCards.map((card) => {
              const selected = selectedTypes.includes(card.id);
              return (
                <div
                  key={card.id}
                  onClick={() => toggleType(card.id)}
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
                        {card.label}
                      </span>
                      <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>{card.category}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {card.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Generate Action Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            className="btn-primary"
            onClick={() => onGenerate(selectedTypes, audience, tone, detail, objective)}
            disabled={isLoading}
            style={{ padding: '14px 36px', fontSize: '1rem' }}
          >
            <Sparkles size={20} />
            <span>{isLoading ? 'Generating Deliverables...' : `Generate ${selectedTypes.length} Outputs →`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
