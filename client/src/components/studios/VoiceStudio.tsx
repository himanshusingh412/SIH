import React, { useState, useEffect } from 'react';
import { Mic, Download, Volume2, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import type { VoiceProfile, ContentSpineData } from '../../types';

interface VoiceStudioProps {
  projectId: string;
  spine: ContentSpineData | null;
}

export const VoiceStudio: React.FC<VoiceStudioProps> = ({ projectId, spine }) => {
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('21m00Tcm4TlvDq8ikWAM');
  const [text, setText] = useState<string>(
    spine?.summary ||
      'BluePeak Technologies confirmed credential compromise affecting 11 systems on 21 October 2026 in Bengaluru.'
  );
  const [stability, setStability] = useState<number>(0.5);
  const [similarity, setSimilarity] = useState<number>(0.75);
  const [style, setStyle] = useState<number>(0.0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      const res = await fetch('/api/audio/voices');
      const data = await res.json();
      if (data.voices) {
        setVoices(data.voices);
      }
    } catch {
      // Fallback premade voices
      setVoices([
        { id: '21m00Tcm4TlvDq8ikWAM', voiceId: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', provider: 'elevenlabs', category: 'premade', language: 'en-US', gender: 'female', description: 'Calm narrative voice' },
        { id: 'AZnzlk1XvdvUeBnXmlld', voiceId: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', provider: 'elevenlabs', category: 'premade', language: 'en-US', gender: 'female', description: 'Emphatic news voice' },
        { id: 'ErXwobaYiN019PkySvjV', voiceId: 'ErXwobaYiN019PkySvjV', name: 'Antoni', provider: 'elevenlabs', category: 'premade', language: 'en-US', gender: 'male', description: 'Deep technical voice' },
      ]);
    }
  };

  const handleGenerateTTS = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/audio/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId || 'demo-project',
          text,
          voiceId: selectedVoiceId,
          stability,
          similarity,
          style,
        }),
      });

      const data = await res.json();
      if (data.audioUrl) {
        setGeneratedAudioUrl(data.audioUrl);
      }
    } catch (err: any) {
      alert(`TTS Generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const lockedFacts = spine?.factLocks || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
      {/* Left: Text & Audio Controls */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mic size={20} color="var(--accent-indigo)" /> ElevenLabs Voiceover Studio
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Synthesize natural voice narration backed by verified Content Spine facts.
            </p>
          </div>
          <span className="badge badge-emerald">ElevenLabs Multilingual v2</span>
        </div>

        {/* Fact Lock Protection Indicator */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.8rem',
            color: '#6ee7b7',
          }}
        >
          <ShieldCheck size={16} />
          <span>
            <strong>Content Spine Protection:</strong> {lockedFacts.length} locked facts active. Audio script will be verified for zero factual drift.
          </span>
        </div>

        {/* Script Editor */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
            Narration Script (Source Verified)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '14px',
              color: 'white',
              fontSize: '0.92rem',
              lineHeight: '1.6',
              fontFamily: 'var(--font-sans)',
            }}
          />
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-primary" onClick={handleGenerateTTS} disabled={isGenerating} style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>
            {isGenerating ? <RefreshCw size={18} className="spin" /> : <Sparkles size={18} />}
            {isGenerating ? 'Synthesizing Audio via ElevenLabs...' : 'Generate Voiceover'}
          </button>
        </div>

        {/* Audio Player & Waveform Display */}
        {generatedAudioUrl && (
          <div
            style={{
              marginTop: '12px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1.5px solid var(--accent-primary)',
              borderRadius: '10px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-indigo">
                <Volume2 size={13} /> Audio Waveform Ready
              </span>
              <a href={generatedAudioUrl} download="voiceover.mp3" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                <Download size={14} /> Download MP3
              </a>
            </div>

            <audio controls src={generatedAudioUrl} style={{ width: '100%', borderRadius: '6px' }} />
          </div>
        )}
      </div>

      {/* Right: Voice Settings & Voice Library */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Voice Library & Controls
        </h4>

        {/* Selected Voice Dropdown */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Select Voice Profile
          </label>
          <select
            value={selectedVoiceId}
            onChange={(e) => setSelectedVoiceId(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '10px',
              color: 'white',
              fontSize: '0.85rem',
            }}
          >
            {voices.map((v) => (
              <option key={v.voiceId} value={v.voiceId}>
                {v.name} ({v.gender}, {v.category})
              </option>
            ))}
          </select>
        </div>

        {/* Sliders: Stability, Similarity, Style */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Stability ({Math.round(stability * 100)}%)</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={stability}
              onChange={(e) => setStability(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Clarity / Similarity ({Math.round(similarity * 100)}%)</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={similarity}
              onChange={(e) => setSimilarity(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Style Exaggeration ({Math.round(style * 100)}%)</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={style}
              onChange={(e) => setStyle(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Voice Catalog Cards */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Available Voice Profiles ({voices.length})
          </div>
          {voices.map((v) => (
            <div
              key={v.voiceId}
              onClick={() => setSelectedVoiceId(v.voiceId)}
              style={{
                background: selectedVoiceId === v.voiceId ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                border: selectedVoiceId === v.voiceId ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 10px',
                cursor: 'pointer',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ fontWeight: 700, color: 'white' }}>{v.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>{v.description || `${v.language} • ${v.gender}`}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
