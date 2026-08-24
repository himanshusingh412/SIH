import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Film,
  RotateCw,
  Download,
  Play,
  Trash2,
  Video,
  Settings,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface VideoFormatConverterProps {
  projectId?: string;
}

export const VideoFormatConverter: React.FC<VideoFormatConverterProps> = ({ projectId }) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [sourceAsset, setSourceAsset] = useState<any | null>(null);
  const [sourceMeta, setSourceMeta] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Conversion Options
  const [resolution, setResolution] = useState<'original' | '1080p' | '720p' | '480p'>('original');
  const [quality, setQuality] = useState<'high' | 'balanced' | 'compressed'>('balanced');
  const [fps, setFps] = useState<'original' | '30' | '60'>('original');
  const [audioBitrate, setAudioBitrate] = useState<'128k' | '192k' | '256k'>('192k');

  // Conversion State
  const [conversionId, setConversionId] = useState<string | null>(null);
  const [converting, setConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [phase, setPhase] = useState<'idle' | 'analyzing' | 'converting' | 'validating' | 'completed' | 'cancelled' | 'failed'>('idle');
  const [outputAsset, setOutputAsset] = useState<any | null>(null);
  const [outputMeta, setOutputMeta] = useState<any | null>(null);

  // Media Library
  const [libraryConversions, setLibraryConversions] = useState<any[]>([]);
  const [previewAssetId, setPreviewAssetId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<any>(null);

  // Fetch Media Library on mount
  useEffect(() => {
    fetchMediaLibrary();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [projectId]);

  const fetchMediaLibrary = async () => {
    try {
      const res = await apiClient.listMediaLibrary(projectId);
      if (res.conversions) {
        setLibraryConversions(res.conversions);
      }
    } catch (_) {}
  };

  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatBytes = (bytes: number | undefined): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Step 1: File Selection & Upload
  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.mov' && ext !== '.qt') {
      setError('Invalid File Format: Only .mov QuickTime video files are supported.');
      return;
    }

    setUploading(true);
    setPhase('analyzing');

    try {
      const res = await apiClient.uploadMediaAsset(selectedFile, projectId);
      setSourceAsset(res.mediaAsset);
      setSourceMeta(res.mediaAsset.metadata);
      setUploading(false);
      setPhase('idle');
    } catch (err: any) {
      setUploading(false);
      setPhase('idle');
      setError(err.message || 'Failed to inspect MOV video file.');
    }
  };

  // Step 2: Trigger Conversion
  const handleStartConversion = async () => {
    if (!sourceAsset) return;
    setError(null);
    setConverting(true);
    setProgress(5);
    setPhase('converting');

    try {
      const res = await apiClient.convertMedia({
        sourceAssetId: sourceAsset.id,
        targetFormat: 'mp4',
        resolution,
        quality,
        fps,
        audioBitrate,
        projectId,
      });

      setConversionId(res.conversionId);

      // Start polling for real conversion progress
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await apiClient.getConversionStatus(res.conversionId);
          const conv = statusRes.conversion;

          if (conv.status === 'PROCESSING') {
            setProgress(Math.max(10, conv.progress));
          } else if (conv.status === 'COMPLETED') {
            clearInterval(pollIntervalRef.current);
            setProgress(100);
            setPhase('completed');
            setConverting(false);
            setOutputAsset(conv.outputAsset);
            if (conv.outputAsset?.metadata) {
              setOutputMeta(JSON.parse(conv.outputAsset.metadata));
            }
            fetchMediaLibrary();
          } else if (conv.status === 'CANCELLED') {
            clearInterval(pollIntervalRef.current);
            setConverting(false);
            setPhase('cancelled');
            setError('Conversion process was cancelled.');
          } else if (conv.status === 'FAILED') {
            clearInterval(pollIntervalRef.current);
            setConverting(false);
            setPhase('failed');
            setError(conv.error || 'FFmpeg conversion failed.');
          }
        } catch (_) {}
      }, 500);
    } catch (err: any) {
      setConverting(false);
      setPhase('failed');
      setError(err.message || 'Failed to trigger video conversion.');
    }
  };

  // Step 3: Cancel Conversion
  const handleCancelConversion = async () => {
    if (!conversionId) return;
    try {
      await apiClient.cancelConversion(conversionId);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setConverting(false);
      setPhase('cancelled');
      setError('Video conversion cancelled by user.');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel conversion.');
    }
  };

  // Delete Media Asset
  const handleDeleteAsset = async (assetId: string) => {
    try {
      await apiClient.deleteMediaAsset(assetId);
      fetchMediaLibrary();
      if (previewAssetId === assetId) setPreviewAssetId(null);
    } catch (_) {}
  };

  // Reset Form
  const handleReset = () => {
    setSourceAsset(null);
    setSourceMeta(null);
    setOutputAsset(null);
    setOutputMeta(null);
    setConversionId(null);
    setConverting(false);
    setProgress(0);
    setPhase('idle');
    setError(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: '4px solid var(--accent-sky)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-sky">Creative Studio → Video Tools</span>
            <span className="badge badge-emerald">FFmpeg H.264 Baseline Engine</span>
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', marginTop: '6px' }}>
            Video Format Converter (MOV → MP4)
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Transcode Apple QuickTime (.mov) video streams to web-optimized MP4 with H.264/AAC encoding and fast-start playback.
          </p>
        </div>

        <button
          className="btn-secondary"
          onClick={handleReset}
          style={{ padding: '8px 14px', fontSize: '0.8rem' }}
        >
          <RotateCw size={14} /> New Conversion
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1.5px solid #ef4444',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#fca5a5',
            fontSize: '0.88rem',
          }}
        >
          <XCircle size={20} color="#ef4444" />
          <div style={{ flex: 1 }}>
            <strong style={{ color: 'white' }}>Conversion Alert:</strong> {error}
          </div>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Upload & Settings / Result */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px' }}>
        {/* Left Column: Upload Dropzone & Conversion Studio */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!sourceAsset && !converting && phase !== 'completed' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--accent-sky)',
                borderRadius: 'var(--radius-lg)',
                padding: '44px 20px',
                textAlign: 'center',
                background: 'rgba(56, 189, 248, 0.03)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mov,.qt,video/quicktime"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px auto',
                }}
              >
                <Upload size={28} color="var(--accent-sky)" />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                {uploading ? 'Analyzing MOV Video Container...' : 'Drop QuickTime MOV Video Here'}
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '360px', margin: '6px auto 0 auto' }}>
                Select a valid .mov video file. Server ffprobe will analyze streams, codecs, and resolution.
              </p>
              <button
                className="btn-primary"
                style={{ marginTop: '16px', padding: '10px 20px', fontSize: '0.84rem' }}
                disabled={uploading}
              >
                <Film size={16} /> Choose .MOV File
              </button>
            </div>
          )}

          {/* Active Conversion Progress Screen */}
          {converting && (
            <div
              aria-live="polite"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                border: '1px solid var(--accent-sky)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RotateCw className="spin" size={20} color="var(--accent-sky)" /> Converting MOV → MP4
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Real-time FFmpeg stream transcoding with H.264 baseline encoder...
                  </p>
                </div>
                <span className="badge badge-sky" style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                  {progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ background: 'rgba(255,255,255,0.1)', height: '12px', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #38bdf8, #6366f1)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              {/* Pipeline Status Steps */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '0.75rem', textAlign: 'center' }}>
                <div className={`badge ${progress >= 10 ? 'badge-sky' : 'badge-neutral'}`}>1. Uploading</div>
                <div className={`badge ${progress >= 25 ? 'badge-sky' : 'badge-neutral'}`}>2. Analyzing</div>
                <div className={`badge ${progress >= 50 ? 'badge-sky' : 'badge-neutral'}`}>3. Converting</div>
                <div className={`badge ${progress >= 95 ? 'badge-sky' : 'badge-neutral'}`}>4. Validating</div>
              </div>

              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <button
                  className="btn-secondary"
                  onClick={handleCancelConversion}
                  aria-label="Cancel conversion"
                  style={{ padding: '8px 16px', fontSize: '0.8rem', color: '#fca5a5' }}
                >
                  <XCircle size={15} /> Cancel Conversion
                </button>
              </div>
            </div>
          )}

          {/* Completed MP4 Result & Video Playback Test */}
          {phase === 'completed' && outputAsset && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1.5px solid #10b981',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={22} color="#6ee7b7" />
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
                    ✓ MP4 Conversion Complete & Verified
                  </h4>
                </div>
                <span className="badge badge-emerald">H.264 / AAC Validated</span>
              </div>

              {/* Real HTML5 MP4 Video Player */}
              <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000', border: '1px solid var(--border-color)' }}>
                <video
                  src={apiClient.getMediaStreamUrl(outputAsset.id)}
                  controls
                  style={{ width: '100%', maxHeight: '360px', display: 'block' }}
                >
                  Your browser does not support HTML5 video playback.
                </video>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={apiClient.getMediaDownloadUrl(outputAsset.id)}
                  download
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: '0.84rem', textDecoration: 'none' }}
                >
                  <Download size={16} /> Download MP4 File
                </a>

                <button
                  className="btn-secondary"
                  onClick={() => setPreviewAssetId(outputAsset.id)}
                  style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: '0.84rem' }}
                >
                  <Play size={16} /> Preview Player
                </button>
              </div>
            </div>
          )}

          {/* Source MOV Video Preview Card */}
          {sourceAsset && sourceMeta && !converting && (
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Video size={16} color="var(--accent-sky)" /> Source File Inspector
                </h5>
                <span className="badge badge-sky">{sourceAsset.filename}</span>
              </div>

              {/* BEFORE Metadata Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Format</div>
                  <div style={{ color: 'white', fontWeight: 700 }}>MOV</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Resolution</div>
                  <div style={{ color: 'white', fontWeight: 700 }}>{sourceMeta.width} × {sourceMeta.height}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Duration</div>
                  <div style={{ color: 'white', fontWeight: 700 }}>{formatDuration(sourceMeta.duration)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Video Codec</div>
                  <div style={{ color: 'white', fontWeight: 700 }}>{sourceMeta.videoCodec}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Audio Codec</div>
                  <div style={{ color: 'white', fontWeight: 700 }}>{sourceMeta.audioCodec || 'None'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>File Size</div>
                  <div style={{ color: 'white', fontWeight: 700 }}>{formatBytes(sourceMeta.fileSize)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Settings & Before/After Comparison */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Conversion Options Card */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={16} color="var(--accent-indigo)" /> Transcoding Settings
            </h4>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Target Container Format
              </label>
              <select className="select-input" value="mp4" disabled style={{ width: '100%', fontSize: '0.8rem' }}>
                <option value="mp4">MP4 (.mp4)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Output Resolution
              </label>
              <select
                className="select-input"
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                style={{ width: '100%', fontSize: '0.8rem' }}
              >
                <option value="original">Original ({sourceMeta ? `${sourceMeta.width}x${sourceMeta.height}` : 'Match Source'})</option>
                <option value="1080p">1080p (Full HD - 1920x1080)</option>
                <option value="720p">720p (HD - 1280x720)</option>
                <option value="480p">480p (SD - 854x480)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Video Encoding Quality (CRF)
              </label>
              <select
                className="select-input"
                value={quality}
                onChange={(e) => setQuality(e.target.value as any)}
                style={{ width: '100%', fontSize: '0.8rem' }}
              >
                <option value="high">High Quality (CRF 18)</option>
                <option value="balanced">Balanced (CRF 23 - Default)</option>
                <option value="compressed">Compressed (CRF 28 - Smaller Size)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Frame Rate
              </label>
              <select
                className="select-input"
                value={fps}
                onChange={(e) => setFps(e.target.value as any)}
                style={{ width: '100%', fontSize: '0.8rem' }}
              >
                <option value="original">Original ({sourceMeta ? `${sourceMeta.fps} FPS` : 'Match Source'})</option>
                <option value="30">30 FPS</option>
                <option value="60">60 FPS</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Audio Bitrate (AAC)
              </label>
              <select
                className="select-input"
                value={audioBitrate}
                onChange={(e) => setAudioBitrate(e.target.value as any)}
                style={{ width: '100%', fontSize: '0.8rem' }}
              >
                <option value="192k">AAC 192 kbps (Standard)</option>
                <option value="256k">AAC 256 kbps (High Fidelity)</option>
                <option value="128k">AAC 128 kbps (Compact)</option>
              </select>
            </div>

            <button
              className="btn-primary"
              onClick={handleStartConversion}
              disabled={!sourceAsset || converting}
              style={{ marginTop: '8px', padding: '12px', fontSize: '0.85rem', justifyContent: 'center' }}
            >
              <Film size={16} /> Convert to MP4
            </button>
          </div>

          {/* BEFORE / AFTER Metadata Inspection Panel */}
          {(sourceMeta || outputMeta) && (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>
                Media Inspection Matrix
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.76rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--accent-sky)', fontWeight: 800, marginBottom: '6px' }}>BEFORE (MOV)</div>
                  <div>Resolution: {sourceMeta ? `${sourceMeta.width}x${sourceMeta.height}` : '—'}</div>
                  <div>Codec: {sourceMeta ? sourceMeta.videoCodec : '—'}</div>
                  <div>Audio: {sourceMeta ? sourceMeta.audioCodec || 'None' : '—'}</div>
                  <div>Duration: {sourceMeta ? formatDuration(sourceMeta.duration) : '—'}</div>
                  <div>Size: {sourceMeta ? formatBytes(sourceMeta.fileSize) : '—'}</div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid #10b981' }}>
                  <div style={{ color: '#6ee7b7', fontWeight: 800, marginBottom: '6px' }}>AFTER (MP4)</div>
                  <div>Resolution: {outputMeta ? `${outputMeta.width}x${outputMeta.height}` : '—'}</div>
                  <div>Codec: {outputMeta ? outputMeta.videoCodec : '—'}</div>
                  <div>Audio: {outputMeta ? outputMeta.audioCodec || 'None' : '—'}</div>
                  <div>Duration: {outputMeta ? formatDuration(outputMeta.duration) : '—'}</div>
                  <div>Size: {outputMeta ? formatBytes(outputMeta.fileSize) : '—'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Media Library History Table */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Film size={18} color="var(--accent-sky)" /> Converted Media Library (MOV → MP4)
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              History of all server-side converted media assets stored in ContentSpine Media Asset store.
            </p>
          </div>
          <span className="badge badge-sky">{libraryConversions.length} Assets</span>
        </div>

        {libraryConversions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No converted media files in library yet. Upload a MOV video above to perform your first conversion.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>CONVERSION</th>
                  <th style={{ padding: '10px' }}>SOURCE → TARGET</th>
                  <th style={{ padding: '10px' }}>RESOLUTION</th>
                  <th style={{ padding: '10px' }}>DURATION</th>
                  <th style={{ padding: '10px' }}>SIZE</th>
                  <th style={{ padding: '10px' }}>STATUS</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {libraryConversions.map((conv) => {
                  const srcMeta = conv.sourceAsset?.metadata ? JSON.parse(conv.sourceAsset.metadata) : {};
                  const outMeta = conv.outputAsset?.metadata ? JSON.parse(conv.outputAsset.metadata) : {};

                  return (
                    <tr key={conv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: 'white' }}>
                        {srcMeta.originalName || conv.sourceAsset?.filename || 'video.mov'}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span className="badge badge-sky">MOV → MP4</span>
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                        {outMeta.width ? `${outMeta.width}x${outMeta.height}` : srcMeta.width ? `${srcMeta.width}x${srcMeta.height}` : '—'}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                        {formatDuration(conv.outputDuration || conv.sourceDuration)}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                        {formatBytes(conv.outputSize || conv.sourceSize)}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span
                          className={`badge ${
                            conv.status === 'COMPLETED'
                              ? 'badge-emerald'
                              : conv.status === 'PROCESSING'
                              ? 'badge-sky'
                              : 'badge-amber'
                          }`}
                        >
                          {conv.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {conv.outputAsset && (
                            <>
                              <a
                                href={apiClient.getMediaDownloadUrl(conv.outputAsset.id)}
                                download
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.72rem', textDecoration: 'none' }}
                                title="Download MP4"
                              >
                                <Download size={12} /> Download
                              </a>
                            </>
                          )}
                          <button
                            className="btn-secondary"
                            onClick={() => handleDeleteAsset(conv.sourceAssetId)}
                            style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#fca5a5' }}
                            title="Delete Asset"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
