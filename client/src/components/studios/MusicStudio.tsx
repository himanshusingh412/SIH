import React, { useState } from 'react';
import { Music, Download, Sparkles, RefreshCw } from 'lucide-react';

interface MusicStudioProps {
  projectId: string;
}

export const MusicStudio: React.FC<MusicStudioProps> = ({ projectId }) => {
  const [prompt, setPrompt] = useState<string>('Create tense cinematic background music for a cyber-security advisory.');
  const [genre, setGenre] = useState<string>('cinematic');
  const [mood, setMood] = useState<string>('tense');
  const [duration] = useState<number>(30);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);

  const handleGenerateMusic = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/audio/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, prompt, genre, mood, durationSeconds: duration }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        setMusicUrl(data.audioUrl);
      }
    } catch (err: any) {
      alert(`Music generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Music size={20} color="var(--accent-purple)" /> AI Music Studio
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Generate custom background scores and soundtrack beds aligned with project mood & tone.
          </p>
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Soundtrack Prompt / Description
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
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

        <button className="btn-primary" onClick={handleGenerateMusic} disabled={isGenerating} style={{ justifyContent: 'center', padding: '12px' }}>
          {isGenerating ? <RefreshCw size={18} className="spin" /> : <Sparkles size={18} />}
          {isGenerating ? 'Generating Score...' : 'Generate Background Score'}
        </button>

        {musicUrl && (
          <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1.5px solid var(--accent-purple)', borderRadius: '10px', padding: '16px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span className="badge badge-indigo">Music Generated</span>
              <a href={musicUrl} download="score.mp3" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                <Download size={14} /> Download MP3
              </a>
            </div>
            <audio controls src={musicUrl} style={{ width: '100%' }} />
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>Score Parameters</h4>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Genre</label>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <option value="cinematic">Cinematic</option>
            <option value="corporate">Corporate Ambient</option>
            <option value="electronic">Cyber Electronic</option>
            <option value="orchestral">Orchestral</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Mood</label>
          <select value={mood} onChange={(e) => setMood(e.target.value)} style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <option value="tense">Tense / High Risk</option>
            <option value="calm">Calm / Informative</option>
            <option value="inspiring">Inspiring / Executive</option>
            <option value="urgent">Urgent / Emergency</option>
          </select>
        </div>
      </div>
    </div>
  );
};
