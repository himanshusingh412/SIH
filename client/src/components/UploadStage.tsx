import React, { useState } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Video, ShieldAlert, Sparkles } from 'lucide-react';
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

  const categories: Array<{ id: InputCategory; label: string; icon: any }> = [
    { id: 'PDF', label: 'PDF Document', icon: FileText },
    { id: 'REPORT', label: 'Executive Report', icon: FileText },
    { id: 'THREAT_INTEL', label: 'Threat Intel Report', icon: ShieldAlert },
    { id: 'RESEARCH_PAPER', label: 'Research Paper', icon: FileText },
    { id: 'IMAGE', label: 'Image (OCR)', icon: ImageIcon },
    { id: 'VIDEO', label: 'Video Asset', icon: Video },
    { id: 'PROMPT', label: 'Free-form Prompt', icon: Sparkles },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !rawText.trim()) return;
    onIngest(category, file, rawText);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span className="badge badge-indigo" style={{ marginBottom: '8px', display: 'inline-block' }}>
            Stage 1 — Source Ingestion
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }} className="gradient-text">
            Upload Once. Build Your Content Spine.
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
            Select input category, upload files (PDFs, images, videos) or paste raw document text.
          </p>
        </div>

        {/* Input Category Selector Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '24px' }}>
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
                  gap: '8px',
                  padding: '14px 10px',
                  borderRadius: '10px',
                  background: selected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: selected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  color: selected ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: selected ? 700 : 500,
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={20} color={selected ? '#818cf8' : 'var(--text-muted)'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          {/* File Drag and Drop zone */}
          <div
            style={{
              border: '2px dashed var(--border-glow)',
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center',
              background: 'rgba(99, 102, 241, 0.03)',
              marginBottom: '20px',
              position: 'relative',
            }}
          >
            <UploadCloud size={40} color="#818cf8" style={{ marginBottom: '10px' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
              Drag & Drop file or click to select
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Supports PDF, DOCX, TXT, PNG, JPG, MP4 (Max 50MB)
            </p>
            <input
              type="file"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              style={{ display: 'none' }}
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input" className="btn-secondary" style={{ cursor: 'pointer' }}>
              Choose File
            </label>
            {file && (
              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#6ee7b7', fontWeight: 600 }}>
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          {/* Or Paste Raw Text */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>
              Or Paste Text / Document Excerpt:
            </label>
            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw text, report excerpt, or free-form prompt here..."
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px',
                color: 'white',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onLoadDemo} disabled={isLoading}>
              Load Benchmark Demo Document
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading || (!file && !rawText.trim())}>
              {isLoading ? 'Extracting Content Spine...' : 'Ingest & Build Content Spine →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
