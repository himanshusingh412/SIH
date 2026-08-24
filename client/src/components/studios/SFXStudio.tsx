import React, { useState } from 'react';
import { Zap, Download, Sparkles } from 'lucide-react';

interface SFXStudioProps {
  projectId: string;
}

export const SFXStudio: React.FC<SFXStudioProps> = ({ projectId }) => {
  const [prompt, setPrompt] = useState<string>('Digital glitch alert for high-priority security breach notification');
  const [category, setCategory] = useState<string>('alert');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [sfxUrl, setSfxUrl] = useState<string | null>(null);

  const presets = [
    { label: 'Cyber Alert Tone', prompt: 'High priority digital cyber alert tone', category: 'alert' },
    { label: 'Server Room Ambience', prompt: 'Humming server room background ambience', category: 'ambience' },
    { label: 'Transition Glitch', prompt: 'Futuristic digital UI transition glitch', category: 'transition' },
    { label: 'Emergency Beacon', prompt: 'Urgent red alert emergency pulse siren', category: 'emergency' },
  ];

  const handleGenerateSFX = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/audio/sfx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, prompt, category }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        setSfxUrl(data.audioUrl);
      }
    } catch (err: any) {
      alert(`SFX generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} color="var(--accent-amber)" /> Sound Effects (SFX) Studio
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Generate cyber alerts, digital glitches, UI sound cues, and ambient soundscapes.
          </p>
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Sound Effect Prompt
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '12px',
              color: 'white',
              fontSize: '0.9rem',
            }}
          />
        </div>

        <button className="btn-primary" onClick={handleGenerateSFX} disabled={isGenerating} style={{ justifyContent: 'center', padding: '12px' }}>
          <Sparkles size={18} /> {isGenerating ? 'Synthesizing Sound Effect...' : 'Generate SFX Audio'}
        </button>

        {sfxUrl && (
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1.5px solid var(--accent-amber)', borderRadius: '10px', padding: '16px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span className="badge badge-amber">SFX Audio Cue Generated</span>
              <a href={sfxUrl} download="sfx.mp3" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                <Download size={14} /> Download MP3
              </a>
            </div>
            <audio controls src={sfxUrl} style={{ width: '100%' }} />
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>Quick Presets</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {presets.map((p, i) => (
            <button
              key={i}
              className="btn-secondary"
              onClick={() => {
                setPrompt(p.prompt);
                setCategory(p.category);
              }}
              style={{ justifyContent: 'flex-start', padding: '10px', textAlign: 'left' }}
            >
              <Zap size={14} color="var(--accent-amber)" /> {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
