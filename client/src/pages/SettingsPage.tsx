import React, { useState } from 'react';
import { Settings } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [aiProvider, setAiProvider] = useState<string>('gemini');
  const [audioProvider, setAudioProvider] = useState<string>('elevenlabs');
  const [model, setModel] = useState<string>('gemini-3.1-flash-lite');

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={20} color="var(--accent-indigo)" /> Platform Provider & System Settings
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Configure primary AI providers, ElevenLabs voice synthesizers, models, and demo modes.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label htmlFor="ai-provider-select" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white', display: 'block', marginBottom: '6px' }}>
            Primary Text AI Provider
          </label>
          <select
            id="ai-provider-select"
            aria-label="Primary Text AI Provider"
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value)}
            style={{ width: '100%', padding: '10px', background: '#121826', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}
          >
            <option value="gemini">Google Gemini AI (gemini-3.1-flash-lite)</option>
            <option value="openai">OpenAI GPT-4o / GPT-3.5</option>
            <option value="llama">Llama 3 REST Provider</option>
            <option value="mock">Offline Mock Provider (Demo Mode)</option>
          </select>
        </div>

        <div>
          <label htmlFor="audio-provider-select" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white', display: 'block', marginBottom: '6px' }}>
            Voice & Audio Synthesizer Provider
          </label>
          <select
            id="audio-provider-select"
            aria-label="Voice & Audio Synthesizer Provider"
            value={audioProvider}
            onChange={(e) => setAudioProvider(e.target.value)}
            style={{ width: '100%', padding: '10px', background: '#121826', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}
          >
            <option value="elevenlabs">ElevenLabs Multilingual v2 API</option>
            <option value="mock">Offline Audio Synthesizer (Demo Mode)</option>
          </select>
        </div>

        <div>
          <label htmlFor="model-name-input" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white', display: 'block', marginBottom: '6px' }}>
            Target AI Model Name
          </label>
          <input
            id="model-name-input"
            aria-label="Target AI Model Name"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{ width: '100%', padding: '10px', background: '#121826', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}
          />
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '14px', fontSize: '0.8rem', color: '#6ee7b7' }}>
          <strong style={{ color: 'white' }}>Security Status:</strong> API Keys are stored securely in backend server environment (`.env`). No credentials are exposed to client JavaScript.
        </div>
      </div>
    </div>
  );
};
