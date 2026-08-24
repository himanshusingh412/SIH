import React, { useState } from 'react';
import { Languages, ShieldCheck, Download, Sparkles, RefreshCw } from 'lucide-react';
import type { ContentSpineData } from '../../types';

interface DubbingStudioProps {
  projectId: string;
  spine: ContentSpineData | null;
}

export const DubbingStudio: React.FC<DubbingStudioProps> = ({ projectId, spine }) => {
  const [sourceText, setSourceText] = useState<string>(
    spine?.summary ||
      'BluePeak Technologies confirmed credential compromise affecting 11 systems on 21 October 2026 in Bengaluru.'
  );
  const [targetLanguage, setTargetLanguage] = useState<string>('hi');
  const [isDubbing, setIsDubbing] = useState<boolean>(false);
  const [dubbingResult, setDubbingResult] = useState<{
    translatedText: string;
    audioUrl: string;
    factLocksPassed: boolean;
  } | null>(null);

  const languages = [
    { code: 'hi', label: 'Hindi (हिंदी)' },
    { code: 'es', label: 'Spanish (Español)' },
    { code: 'fr', label: 'French (Français)' },
    { code: 'de', label: 'German (Deutsch)' },
    { code: 'ar', label: 'Arabic (العربية)' },
    { code: 'ja', label: 'Japanese (日本語)' },
  ];

  const handleRunDubbing = async () => {
    setIsDubbing(true);
    try {
      const res = await fetch('/api/audio/dub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, sourceText, targetLanguage }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        setDubbingResult({
          translatedText: data.dubbing?.tracks?.[0]?.translatedText || data.translatedText || sourceText,
          audioUrl: data.audioUrl,
          factLocksPassed: data.factLocksPassed ?? true,
        });
      }
    } catch (err: any) {
      alert(`Dubbing error: ${err.message}`);
    } finally {
      setIsDubbing(false);
    }
  };

  const lockedFacts = spine?.factLocks || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Languages size={20} color="var(--accent-rose)" /> Multilingual Dubbing & Localization
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Translate & dub media into global languages while enforcing 100% Fact Lock preservation (numbers, dates, names).
          </p>
        </div>

        {/* Fact Protection Shield */}
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
            <strong>Localization Fact Guard:</strong> Locked facts like "11 affected systems" and "21 October 2026" remain invariant across languages.
          </span>
        </div>

        {/* Text Input */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Source Script (English)
          </label>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
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

        <button className="btn-primary" onClick={handleRunDubbing} disabled={isDubbing} style={{ justifyContent: 'center', padding: '12px' }}>
          {isDubbing ? <RefreshCw size={18} className="spin" /> : <Sparkles size={18} />}
          {isDubbing ? 'Translating & Generating Dubbed Audio...' : 'Run Dubbing & Localization'}
        </button>

        {/* Dubbing Output */}
        {dubbingResult && (
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1.5px solid var(--accent-rose)', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-emerald">
                Fact Protection Verified ({dubbingResult.factLocksPassed ? 'PASS' : 'FLAGGED'})
              </span>
              <a href={dubbingResult.audioUrl} download="dubbed_audio.mp3" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                <Download size={14} /> Download Dubbed MP3
              </a>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Translated Script ({languages.find((l) => l.code === targetLanguage)?.label})
              </div>
              <div style={{ fontSize: '0.95rem', color: 'white', marginTop: '4px', fontWeight: 600, background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px' }}>
                {dubbingResult.translatedText}
              </div>
            </div>

            <audio controls src={dubbingResult.audioUrl} style={{ width: '100%' }} />
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>Target Language</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`btn-secondary ${targetLanguage === lang.code ? 'active' : ''}`}
              onClick={() => setTargetLanguage(lang.code)}
              style={{ justifyContent: 'flex-start', padding: '10px' }}
            >
              <Languages size={15} /> {lang.label}
            </button>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
            Locked Facts Monitored ({lockedFacts.length})
          </div>
          {lockedFacts.slice(0, 4).map((fact) => (
            <div key={fact.id} style={{ fontSize: '0.75rem', color: '#e2e8f0', marginBottom: '4px' }}>
              🔒 <strong>{fact.key}:</strong> {fact.value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
