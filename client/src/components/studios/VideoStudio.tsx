import React, { useState } from 'react';
import { Video, Film, Music, Mic, Layers, AlertCircle } from 'lucide-react';
import type { ContentSpineData } from '../../types';

interface VideoStudioProps {
  projectId: string;
  spine: ContentSpineData | null;
  onOpenConverter?: () => void;
}

export const VideoStudio: React.FC<VideoStudioProps> = ({ spine, onOpenConverter }) => {
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);

  const scenes = [
    {
      sceneNumber: 1,
      title: 'Incident Detection & Overview',
      narrationText:
        spine?.summary ||
        'BluePeak Technologies confirmed credential compromise affecting 11 systems on 21 October 2026 in Bengaluru.',
      visualDescription: 'Cyber intelligence dashboard displaying red alert pulse over affected Bengaluru server cluster.',
      durationSeconds: 10,
    },
    {
      sceneNumber: 2,
      title: 'Impact Assessment & Affected Systems',
      narrationText: 'Initial containment verified zero data exfiltration while 11 credentials were reset immediately.',
      visualDescription: '3D topology network node map highlighting 11 credential reset markers.',
      durationSeconds: 12,
    },
    {
      sceneNumber: 3,
      title: 'Action Directives & Executive Mandate',
      narrationText: 'All operational teams must enforce mandatory MFA and update API keys within 24 hours.',
      visualDescription: 'Split screen showing executive briefing summary and security compliance badge.',
      durationSeconds: 14,
    },
  ];

  const currentScene = scenes[activeSceneIndex] || scenes[0];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
      {/* Left: Video Production Storyboard & Scene Timeline */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={20} color="var(--accent-sky)" /> Visual Production Workspace & Storyboard
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Multi-scene video package generator connecting Narration, Visual Specs, Audio Scores, and Subtitles.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {onOpenConverter && (
              <button
                className="btn-primary"
                onClick={onOpenConverter}
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <Film size={14} /> MOV → MP4 Converter
              </button>
            )}
            <span className="badge badge-indigo">16:9 Landscape Spec</span>
          </div>
        </div>

        {/* Scene Selection Timeline Bar */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '8px' }}>
          {scenes.map((s, idx) => (
            <button
              key={s.sceneNumber}
              className={`btn-secondary ${activeSceneIndex === idx ? 'active' : ''}`}
              onClick={() => setActiveSceneIndex(idx)}
              style={{ flex: 1, padding: '8px', fontSize: '0.78rem', justifyContent: 'center' }}
            >
              <Film size={14} /> Scene {s.sceneNumber} ({s.durationSeconds}s)
            </button>
          ))}
        </div>

        {/* Scene Inspector */}
        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white' }}>
              Scene {currentScene.sceneNumber}: {currentScene.title}
            </h4>
            <span className="badge badge-emerald">Duration: {currentScene.durationSeconds}s</span>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-sky)', fontWeight: 700, textTransform: 'uppercase' }}>
              🎤 Voiceover Narration Script
            </div>
            <div style={{ fontSize: '0.92rem', color: '#e2e8f0', marginTop: '4px', lineHeight: '1.6', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px' }}>
              "{currentScene.narrationText}"
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-indigo)', fontWeight: 700, textTransform: 'uppercase' }}>
              🎬 Visual Asset Description & Motion Prompt
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px' }}>
              {currentScene.visualDescription}
            </div>
          </div>
        </div>

        {/* Video Rendering Notice */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1.5px solid var(--accent-amber)',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#fcd34d',
          }}
        >
          <AlertCircle size={18} />
          <div style={{ flex: 1, fontSize: '0.8rem' }}>
            <strong style={{ color: 'white' }}>Video Package Spec Ready:</strong> Timeline, script, audio beds, and subtitles compiled. Native MP4 rendering engine requires GPU cloud configuration.
          </div>
          <span className="badge badge-amber">Rendering Not Configured</span>
        </div>
      </div>

      {/* Right: Production Assets Summary */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white', textTransform: 'uppercase' }}>
          Production Assets
        </h4>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'white', fontWeight: 700 }}>
            <Mic size={15} color="var(--accent-indigo)" /> Narration Voice
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rachel (ElevenLabs Multilingual v2)</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'white', fontWeight: 700 }}>
            <Music size={15} color="var(--accent-purple)" /> Background Score
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cinematic Cyber Pulse (30s)</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'white', fontWeight: 700 }}>
            <Layers size={15} color="var(--accent-emerald)" /> Subtitles Format
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SRT Subtitles File Ready</div>
        </div>
      </div>
    </div>
  );
};
