import React, { useState } from 'react';
import { FileAudio, Upload, ArrowRight, RefreshCw } from 'lucide-react';
import type { ContentSpineData } from '../../types';

interface SpeechToTextStudioProps {
  projectId: string;
  onSpineCreated?: (spine: ContentSpineData) => void;
}

export const SpeechToTextStudio: React.FC<SpeechToTextStudioProps> = ({ projectId, onSpineCreated }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<{
    fullText: string;
    segments: Array<{ speaker: string; startTime: number; endTime: number; text: string }>;
  } | null>(null);

  const handleTranscribe = async () => {
    setIsTranscribing(true);
    try {
      const res = await fetch('/api/audio/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId || 'demo-project',
          filename: file?.name || 'recorded_audio_briefing.mp3',
        }),
      });

      const data = await res.json();
      if (data.transcript) {
        setTranscript(data.transcript);
      }
    } catch (err: any) {
      alert(`Transcription failed: ${err.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleConvertToSpine = async () => {
    if (!transcript) return;
    try {
      const res = await fetch(`/api/projects/${projectId || 'demo-project'}/source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputCategory: 'AUDIO',
          rawText: transcript.fullText,
          filename: file?.name || 'transcribed_speech.mp3',
        }),
      });

      const data = await res.json();
      if (data.spine && onSpineCreated) {
        onSpineCreated(data.spine);
        alert('Transcript converted to Content Spine and Fact Locks created!');
      }
    } catch (err: any) {
      alert(`Conversion error: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
      {/* Left: Transcript Upload & Viewer */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileAudio size={20} color="var(--accent-sky)" /> Speech-to-Text Studio
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Transcribe audio/video recordings into timestamps & speaker segments, then feed into Content Spine.
          </p>
        </div>

        {/* Upload Box */}
        <div
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: '10px',
            padding: '24px',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.2)',
            cursor: 'pointer',
          }}
          onClick={() => {
            const fakeFile = new File(['mock audio'], 'incident_debrief_recording.mp3', { type: 'audio/mpeg' });
            setFile(fakeFile);
          }}
        >
          <Upload size={32} color="var(--accent-indigo)" style={{ margin: '0 auto 8px auto' }} />
          <div style={{ fontWeight: 700, color: 'white' }}>
            {file ? file.name : 'Click to Upload Audio File (MP3, WAV, M4A, MP4)'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Or select sample incident debrief recording'}
          </div>
        </div>

        <button className="btn-primary" onClick={handleTranscribe} disabled={isTranscribing} style={{ justifyContent: 'center', padding: '11px' }}>
          {isTranscribing ? <RefreshCw size={16} className="spin" /> : <FileAudio size={16} />}
          {isTranscribing ? 'Transcribing Speech & Detecting Speakers...' : 'Run Transcription'}
        </button>

        {/* Transcript Output */}
        {transcript && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-emerald">Transcription Completed</span>
              <button className="btn-primary" onClick={handleConvertToSpine} style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                Convert Transcript to Content Spine <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '16px', maxHeight: '280px', overflowY: 'auto' }}>
              {transcript.segments.map((seg, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-sky)' }}>
                    {seg.speaker} [{seg.startTime}s - {seg.endTime}s]
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#e2e8f0', marginTop: '2px' }}>
                    {seg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Pipeline Info */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white', textTransform: 'uppercase' }}>
          Audio-to-Spine Pipeline
        </h4>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          Audio recordings are processed through Speech-to-Text, speaker detection, and timestamp indexing.
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
          <strong style={{ color: 'white' }}>Pipeline Sequence:</strong>
          <ol style={{ paddingLeft: '16px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-muted)' }}>
            <li>Audio Upload</li>
            <li>Speech-to-Text Transcript</li>
            <li>Content Spine Fact Extraction</li>
            <li>Fact Locking</li>
            <li>Multimodal Delivery</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
