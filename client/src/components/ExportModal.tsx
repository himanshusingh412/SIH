import React, { useState } from 'react';
import { Download, Copy, Printer, Check, X, ShieldCheck } from 'lucide-react';
import type { GeneratedOutput } from '../types';
import { BrandLogo } from './BrandLogo';

interface ExportModalProps {
  outputs: GeneratedOutput[];
  projectId?: string;
  projectTitle?: string;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  outputs,
  projectId = 'demo-project',
  projectTitle = 'SIH 2026 Transformation Project',
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const triggerDirectDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportDOCX = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/docx`);
    triggerToast('Downloading Word Document (.docx)...');
  };

  const handleExportPDF = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/pdf`);
    triggerToast('Downloading PDF Document (.pdf)...');
  };

  const handleExportPPTX = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/pptx`);
    triggerToast('Downloading PowerPoint Presentation (.pptx)...');
  };

  const handleExportJSON = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/data?format=json`);
    triggerToast('Downloading JSON Data Package (.json)...');
  };

  const handleExportCSV = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/data?format=csv`);
    triggerToast('Downloading CSV Dataset (.csv)...');
  };

  const handleExportXML = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/data?format=xml`);
    triggerToast('Downloading XML Document (.xml)...');
  };

  const handleExportYAML = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/data?format=yaml`);
    triggerToast('Downloading YAML Document (.yaml)...');
  };

  const downloadClientFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const mdContent = `# ${projectTitle}\n*SIH 2026 Fact-Locked Multi-Channel Deliverables Report*\n*Exported: ${new Date().toLocaleString()}*\n\n---\n\n` +
      outputs.map((o) => `## Format: ${o.outputType.replace(/_/g, ' ')}\n**Audience Profile**: ${o.audienceProfile}\n**Fact Lock Verification**: ${o.isConsistent ? 'Verified Immutable' : 'Pending Review'}\n\n### ${o.title}\n\n${o.content}\n\n---\n`).join('\n');
    downloadClientFile(`${projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}.md`, mdContent, 'text/markdown;charset=utf-8');
    triggerToast('Markdown Document (.md) Exported');
  };

  const handleExportTXT = () => {
    const txtContent = outputs
      .map((o) => `==================================================\nTITLE: ${o.title}\nFORMAT: ${o.outputType}\nAUDIENCE: ${o.audienceProfile}\n==================================================\n\n${o.content}\n\n`)
      .join('\n');
    downloadClientFile(`${projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}.txt`, txtContent, 'text/plain;charset=utf-8');
    triggerToast('Plain Text File (.txt) Exported');
  };

  const handlePrintView = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to open the print-friendly view.');
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>${projectTitle} — Print Report</title>
  <style>
    body { font-family: 'Times New Roman', Georgia, serif; padding: 40px; color: #000; background: #fff; line-height: 1.6; }
    h1 { font-size: 24pt; margin-bottom: 5px; border-bottom: 2px solid #000; padding-bottom: 8px; }
    h2 { font-size: 16pt; margin-top: 25px; color: #111; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    h3 { font-size: 14pt; color: #333; margin-top: 15px; }
    .meta { font-size: 10pt; color: #555; margin-bottom: 20px; font-style: italic; }
    .deliverable { page-break-inside: avoid; margin-bottom: 30px; }
    pre { font-family: 'Courier New', monospace; font-size: 9pt; white-space: pre-wrap; background: #f5f5f5; padding: 12px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>${projectTitle}</h1>
  <div class="meta">ContentSpine AI Platform — Fact-Locked Report | Printed: ${new Date().toLocaleString()}</div>
  ${outputs.map((o) => `
    <div class="deliverable">
      <h2>Format: ${o.outputType.replace(/_/g, ' ')}</h2>
      <div><strong>Audience Profile:</strong> ${o.audienceProfile} | <strong>Status:</strong> ${o.isConsistent ? 'Zero Fact Drift Verified' : 'Fact Check Review'}</div>
      <h3>${o.title}</h3>
      <pre>${o.content}</pre>
    </div>
  `).join('')}
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    triggerToast('Opening Print Window...');
  };

  const handleCopyAll = () => {
    const text = outputs.map((o) => `=== ${o.title} (${o.outputType}) ===\n${o.content}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    triggerToast('All Formats Copied to Clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerToast = (msg: string) => {
    setExportNotice(msg);
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(42, 7, 21, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-modal)',
      }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          width: '620px',
          padding: '28px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          className="btn-ghost btn-icon"
          aria-label="Close export modal"
          style={{ position: 'absolute', top: '18px', right: '18px' }}
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <ShieldCheck size={22} color="var(--burgundy-700)" aria-hidden="true" />
          <h2 id="export-modal-title" style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'var(--burgundy-900)', margin: 0 }}>
            Format Engine Export Center
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-xs)', marginBottom: '18px' }}>
          Export native binary documents and structured data files with authentic format branding.
        </p>

        {exportNotice && (
          <div
            style={{
              background: 'var(--color-success-bg)',
              border: '1px solid var(--color-success-border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              fontSize: 'var(--font-xs)',
              color: 'var(--color-success)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={14} aria-hidden="true" /> {exportNotice}
          </div>
        )}

        {/* Real Brand Exporters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
          <button className="btn-primary btn-sm" onClick={handleExportDOCX} style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <BrandLogo name="word" size={16} /> Word (.docx)
          </button>

          <button className="btn-primary btn-sm" onClick={handleExportPDF} style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <BrandLogo name="pdf" size={16} /> PDF (.pdf)
          </button>

          <button className="btn-primary btn-sm" onClick={handleExportPPTX} style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <BrandLogo name="powerpoint" size={16} /> PowerPoint (.pptx)
          </button>

          <button className="btn-secondary btn-sm" onClick={handleExportJSON} style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <BrandLogo name="gemini" size={16} /> JSON (.json)
          </button>

          <button className="btn-secondary btn-sm" onClick={handleExportCSV} style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <BrandLogo name="excel" size={16} /> CSV (.csv)
          </button>

          <button className="btn-secondary btn-sm" onClick={handleExportXML} style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <BrandLogo name="neon" size={16} /> XML (.xml)
          </button>

          <button className="btn-secondary btn-sm" onClick={handleExportYAML} style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <BrandLogo name="prisma" size={16} /> YAML (.yaml)
          </button>

          <button className="btn-secondary btn-sm" onClick={handleExportMarkdown} style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <BrandLogo name="github" size={16} /> Markdown (.md)
          </button>

          <button className="btn-secondary btn-sm" onClick={handleExportTXT} style={{ justifyContent: 'flex-start', gap: '8px' }}>
            <Download size={15} aria-hidden="true" /> Text (.txt)
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button className="btn-secondary btn-sm" onClick={handlePrintView} style={{ flex: 1, justifyContent: 'center' }}>
            <Printer size={14} aria-hidden="true" /> Print View
          </button>

          <button className="btn-secondary btn-sm" onClick={handleCopyAll} style={{ flex: 1, justifyContent: 'center' }}>
            {copied ? <Check size={14} color="var(--color-success)" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            <span>{copied ? 'Copied All!' : 'Copy to Clipboard'}</span>
          </button>
        </div>

        <div style={{ textAlign: 'right' }}>
          <button className="btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
