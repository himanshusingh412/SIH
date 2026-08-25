import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Video, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import type { InputCategory } from '../types';

interface UploadStageProps {
  onIngest: (category: InputCategory, file: File | null, rawText: string) => void;
  isLoading: boolean;
  onLoadDemo: () => void;
}

export const UploadStage: React.FC<UploadStageProps> = ({ onIngest, isLoading, onLoadDemo }) => {
  const [category, setCategory] = useState<InputCategory>('THREAT_INTEL');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: Array<{ id: InputCategory; label: string; icon: any }> = [
    { id: 'PDF',            label: 'PDF Document',       icon: FileText },
    { id: 'REPORT',         label: 'Executive Report',   icon: FileText },
    { id: 'THREAT_INTEL',   label: 'Threat Intel',       icon: ShieldAlert },
    { id: 'RESEARCH_PAPER', label: 'Research Paper',     icon: FileText },
    { id: 'IMAGE',          label: 'Image (OCR)',        icon: ImageIcon },
    { id: 'VIDEO',          label: 'Video Asset',        icon: Video },
    { id: 'PROMPT',         label: 'Free-form Prompt',   icon: Sparkles },
  ];

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!file && !rawText.trim()) {
      setValidationError('Please upload a file or paste source text.');
      return;
    }
    if (file && file.size > 50 * 1024 * 1024) {
      setValidationError('Source file exceeds maximum allowed size (50 MB).');
      return;
    }
    onIngest(category, file, rawText);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setValidationError(null);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      if (dropped.size > 50 * 1024 * 1024) {
        setValidationError('Source file exceeds maximum allowed size (50 MB).');
        return;
      }
      setFile(dropped);
    }
  };

  return (
    <div className="page-enter" style={{ maxWidth: '820px', margin: '0 auto', padding: '28px 24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <span className="badge badge-burgundy" style={{ marginBottom: '10px', display: 'inline-block' }}>
          Stage 1 — Source Ingestion
        </span>
        <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--burgundy-900)', marginBottom: '8px', lineHeight: 1.25 }}
            className="gradient-text">
          Upload Once. Build Your Content Spine.
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-base)', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
          Select a source category, upload a file, or paste document text. Gemini will extract a structured Content Spine with Fact Locks.
        </p>
      </div>

      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {validationError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#dc2626',
              fontSize: 'var(--font-sm)',
              fontWeight: 600,
            }}
          >
            ⚠️ {validationError}
          </div>
        )}

        {/* Category grid */}
        <div style={{ marginBottom: '24px' }}>
          <label className="form-label">Input Category</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
            {categories.map((cat) => {
              const Icon = cat.icon;
              const selected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '14px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: selected ? 'rgba(110,27,56,0.1)' : 'var(--bg-secondary)',
                    border: selected ? '2px solid var(--burgundy-700)' : '1px solid var(--border-color)',
                    color: selected ? 'var(--burgundy-700)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-xs)',
                    fontWeight: selected ? 700 : 500,
                    fontFamily: 'var(--font-sans)',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'center',
                    lineHeight: 1.3,
                  }}
                >
                  <Icon size={18} color={selected ? 'var(--burgundy-700)' : 'var(--text-muted)'} aria-hidden="true" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--burgundy-700)' : file ? 'var(--color-success)' : 'var(--pink-400)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '36px 24px',
              textAlign: 'center',
              background: dragOver ? 'var(--pink-100)' : file ? 'var(--color-success-bg)' : 'var(--pink-50)',
              marginBottom: '20px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            role="button"
            tabIndex={0}
            aria-label="Click or drag to upload a file"
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            {file ? (
              <>
                <CheckCircle2 size={36} color="var(--color-success)" style={{ marginBottom: '8px' }} aria-hidden="true" />
                <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--color-success)', marginBottom: '4px' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  {(file.size / 1024).toFixed(1)} KB — Click to replace
                </div>
              </>
            ) : (
              <>
                <UploadCloud size={36} color="var(--burgundy-700)" style={{ marginBottom: '10px' }} aria-hidden="true" />
                <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Drag &amp; drop or click to upload
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  PDF, DOCX, TXT, PNG, JPG, MP4 · Max 50 MB
                </div>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              style={{ display: 'none' }}
              id="file-upload-input"
              aria-label="Upload file"
            />
          </div>

          {/* Paste text */}
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="raw-text-input">Or paste document text</label>
            <textarea
              id="raw-text-input"
              className="textarea"
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw text, report excerpt, or free-form prompt here..."
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onLoadDemo} disabled={isLoading}>
              Load Benchmark Demo
            </button>
            <button
              type="submit"
              className="btn-primary btn-lg"
              disabled={isLoading || (!file && !rawText.trim())}
            >
              {isLoading ? (
                <><span className="spin" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%' }} aria-hidden="true" /> Extracting Content Spine...</>
              ) : (
                'Ingest & Build Content Spine →'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
