import React, { useState } from 'react';
import { Download, Copy, FileText, Printer, Presentation, Check, X, ShieldCheck, FileSpreadsheet, Code } from 'lucide-react';
import type { GeneratedOutput } from '../types';

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
    triggerToast('Downloading Real Word Document (.docx)...');
  };

  const handleExportPDF = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/pdf`);
    triggerToast('Downloading Real PDF Document (.pdf)...');
  };

  const handleExportPPTX = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/pptx`);
    triggerToast('Downloading Real PowerPoint Presentation (.pptx)...');
  };

  const handleExportJSON = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/data?format=json`);
    triggerToast('Downloading Real JSON Data Package (.json)...');
  };

  const handleExportCSV = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/data?format=csv`);
    triggerToast('Downloading Real CSV Dataset (.csv)...');
  };

  const handleExportXML = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/data?format=xml`);
    triggerToast('Downloading Real XML Document (.xml)...');
  };

  const handleExportYAML = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/data?format=yaml`);
    triggerToast('Downloading Real YAML Document (.yaml)...');
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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div className="glass-panel" style={{ width: '640px', padding: '28px', border: '1px solid var(--accent-primary)', position: 'relative' }}>
        <button
          onClick={onClose}
          aria-label="Close export modal"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <ShieldCheck size={22} color="#6ee7b7" aria-hidden="true" />
          <h3 id="export-modal-title" style={{ fontSize: '1.35rem', fontWeight: 800 }} className="gradient-text">
            Format Engine Export Center
          </h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '18px' }}>
          Export real native binary documents (.docx, .pdf, .pptx) and structured datasets (.json, .csv, .xml, .yaml).
        </p>

        {exportNotice && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '0.78rem',
              color: '#6ee7b7',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={14} /> {exportNotice}
          </div>
        )}

        {/* Real Exporters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
          <button className="btn-primary" onClick={handleExportDOCX} style={{ justifyContent: 'center', padding: '10px 8px', fontSize: '0.78rem' }}>
            <FileText size={15} /> Word (.docx)
          </button>

          <button className="btn-primary" onClick={handleExportPDF} style={{ justifyContent: 'center', padding: '10px 8px', fontSize: '0.78rem' }}>
            <Download size={15} /> PDF (.pdf)
          </button>

          <button className="btn-primary" onClick={handleExportPPTX} style={{ justifyContent: 'center', padding: '10px 8px', fontSize: '0.78rem' }}>
            <Presentation size={15} /> PowerPoint (.pptx)
          </button>

          <button className="btn-secondary" onClick={handleExportJSON} style={{ justifyContent: 'center', padding: '10px 8px', fontSize: '0.78rem' }}>
            <Code size={15} /> JSON (.json)
          </button>

          <button className="btn-secondary" onClick={handleExportCSV} style={{ justifyContent: 'center', padding: '10px 8px', fontSize: '0.78rem' }}>
            <FileSpreadsheet size={15} /> CSV (.csv)
          </button>

          <button className="btn-secondary" onClick={handleExportXML} style={{ justifyContent: 'center', padding: '10px 8px', fontSize: '0.78rem' }}>
            <Code size={15} /> XML (.xml)
          </button>

          <button className="btn-secondary" onClick={handleExportYAML} style={{ justifyContent: 'center', padding: '10px 8px', fontSize: '0.78rem' }}>
            <Code size={15} /> YAML (.yaml)
          </button>

          <button className="btn-secondary" onClick={handleExportMarkdown} style={{ justifyContent: 'center', padding: '10px 8px', fontSize: '0.78rem' }}>
            <FileText size={15} /> Markdown (.md)
          </button>

          <button className="btn-secondary" onClick={handleExportTXT} style={{ justifyContent: 'center', padding: '10px 8px', fontSize: '0.78rem' }}>
            <FileText size={15} /> Text (.txt)
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button className="btn-secondary" onClick={handlePrintView} style={{ flex: 1, justifyContent: 'center', padding: '9px', fontSize: '0.8rem' }}>
            <Printer size={15} /> Print View
          </button>

          <button className="btn-secondary" onClick={handleCopyAll} style={{ flex: 1, justifyContent: 'center', padding: '9px', fontSize: '0.8rem' }}>
            {copied ? <Check size={15} color="#6ee7b7" /> : <Copy size={15} />}
            <span>{copied ? 'Copied All!' : 'Copy to Clipboard'}</span>
          </button>
        </div>

        <div style={{ textAlign: 'right' }}>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
