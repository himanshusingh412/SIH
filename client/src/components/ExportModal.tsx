import React, { useState } from 'react';
import { Download, Copy, Printer, Check, X, ShieldCheck, FileText, Share2, MessageSquare, FileCheck, Presentation as SlideIcon, PieChart, Video } from 'lucide-react';
import type { GeneratedOutput, OutputType } from '../types';
import { BrandLogo } from './BrandLogo';

interface ExportModalProps {
  outputs: GeneratedOutput[];
  activeOutputType?: OutputType;
  projectId?: string;
  projectTitle?: string;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  outputs,
  activeOutputType = 'EXECUTIVE_SUMMARY',
  projectId = '',
  projectTitle = 'ContentSpine Transformation Project',
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<OutputType>(activeOutputType);
  const [copied, setCopied] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const deliverableTypes: Array<{ id: OutputType; label: string; icon: any }> = [
    { id: 'EXECUTIVE_SUMMARY', label: 'Executive Summary', icon: FileText },
    { id: 'LINKEDIN_POST', label: 'LinkedIn Post', icon: Share2 },
    { id: 'X_THREAD', label: 'X Thread', icon: MessageSquare },
    { id: 'ADVISORY', label: 'Official Advisory', icon: FileCheck },
    { id: 'PRESENTATION', label: 'Presentation Deck', icon: SlideIcon },
    { id: 'INFOGRAPHIC', label: 'Infographic Layout', icon: PieChart },
    { id: 'VIDEO_PACKAGE', label: 'Video Package', icon: Video },
  ];

  const currentOutput = outputs.find((o) => o.outputType === selectedType) || outputs[0];
  const cleanTitle = projectTitle.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const typeLabel = selectedType.replace(/_/g, '_');

  const triggerDirectDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportDOCX = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/docx?outputType=${selectedType}`);
    triggerToast(`Downloading Word Document (.docx) for ${selectedType.replace(/_/g, ' ')}...`);
  };

  const handleExportPDF = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/pdf?outputType=${selectedType}`);
    triggerToast(`Downloading PDF Document (.pdf) for ${selectedType.replace(/_/g, ' ')}...`);
  };

  const handleExportPPTX = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/pptx?outputType=${selectedType}`);
    triggerToast(`Downloading PowerPoint Deck (.pptx)...`);
  };

  const handleExportJSON = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/data?format=json&outputType=${selectedType}`);
    triggerToast('Downloading JSON Data Package (.json)...');
  };

  const handleExportCSV = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/data?format=csv&outputType=${selectedType}`);
    triggerToast('Downloading CSV Dataset (.csv)...');
  };

  const handleExportXML = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/data?format=xml&outputType=${selectedType}`);
    triggerToast('Downloading XML Document (.xml)...');
  };

  const handleExportYAML = () => {
    triggerDirectDownload(`/api/projects/${projectId}/export/data?format=yaml&outputType=${selectedType}`);
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
    if (!currentOutput) return;
    const mdContent = `# ${currentOutput.title || projectTitle}\n` +
      `*ContentSpine AI — Fact-Locked ${selectedType.replace(/_/g, ' ')} Deliverable*\n` +
      `*Audience Profile: ${currentOutput.audienceProfile || 'Executive'}*\n` +
      `*Fact Verification: ${currentOutput.isConsistent ? '✓ 100% Zero Fact Drift' : 'Reviewed'}*\n` +
      `*Exported: ${new Date().toLocaleString()}*\n\n` +
      `---\n\n` +
      `${currentOutput.content}\n`;

    downloadClientFile(`ContentSpine_${cleanTitle}_${typeLabel}.md`, mdContent, 'text/markdown;charset=utf-8');
    triggerToast(`Markdown Document (.md) Exported for ${selectedType.replace(/_/g, ' ')}`);
  };

  const handleExportTXT = () => {
    if (!currentOutput) return;
    const txtContent = `==================================================\n` +
      `PROJECT: ${projectTitle}\n` +
      `TITLE: ${currentOutput.title}\n` +
      `FORMAT: ${selectedType}\n` +
      `AUDIENCE: ${currentOutput.audienceProfile}\n` +
      `FACT LOCK: ${currentOutput.isConsistent ? '✓ Zero Fact Drift' : 'Reviewed'}\n` +
      `==================================================\n\n` +
      `${currentOutput.content}\n`;

    downloadClientFile(`ContentSpine_${cleanTitle}_${typeLabel}.txt`, txtContent, 'text/plain;charset=utf-8');
    triggerToast(`Plain Text File (.txt) Exported for ${selectedType.replace(/_/g, ' ')}`);
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
  <title>${projectTitle} — ${selectedType.replace(/_/g, ' ')} Print Report</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; padding: 40px; color: #3D1324; background: #ffffff; line-height: 1.6; }
    h1 { font-size: 24pt; color: #7A173D; margin-bottom: 4px; border-bottom: 3px solid #7A173D; padding-bottom: 8px; }
    .meta { font-size: 10pt; color: #8A6875; margin-bottom: 20px; font-style: italic; }
    .badge { background: #E8F7F0; color: #16805B; border: 1px solid #B8DEC9; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 9pt; margin-bottom: 20px; display: inline-block; }
    .deliverable { page-break-inside: avoid; margin-bottom: 30px; }
    pre { font-family: inherit; font-size: 11pt; white-space: pre-wrap; background: #FFF8FA; padding: 18px; border: 1px solid #E9C9D5; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>${currentOutput?.title || projectTitle}</h1>
  <div class="meta">ContentSpine AI — Fact-Locked ${selectedType.replace(/_/g, ' ')} Deliverable | Printed: ${new Date().toLocaleString()}</div>
  <div class="badge">🔒 FACT-LOCKED INFORMATION — ✓ Verified against source</div>
  <div class="deliverable">
    <pre>${currentOutput?.content || ''}</pre>
  </div>
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
    if (!currentOutput) return;
    navigator.clipboard.writeText(currentOutput.content);
    setCopied(true);
    triggerToast(`Copied ${selectedType.replace(/_/g, ' ')} to Clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerToast = (msg: string) => {
    setExportNotice(msg);
    setTimeout(() => setExportNotice(null), 3500);
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
          background: '#FFFFFF',
          border: '1px solid #E9C9D5',
          borderRadius: '16px',
          width: '680px',
          padding: '28px',
          boxShadow: '0 10px 30px rgba(61, 19, 36, 0.15)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          className="btn-ghost btn-icon"
          aria-label="Close export modal"
          style={{ position: 'absolute', top: '18px', right: '18px', color: '#8A6875' }}
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <ShieldCheck size={24} color="#7A173D" aria-hidden="true" />
          <h2 id="export-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3D1324', margin: 0 }}>
            Format Engine Export Center
          </h2>
        </div>
        <p style={{ color: '#8A6875', fontSize: '0.82rem', marginBottom: '18px' }}>
          Export native binary documents and structured data files with authentic ContentSpine brand styling.
        </p>

        {/* Deliverable Selector Chips */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8A6875', textTransform: 'uppercase', marginBottom: '8px' }}>
            Select Deliverable to Export:
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {deliverableTypes.map((tab) => {
              const Icon = tab.icon;
              const isSelected = selectedType === tab.id;
              const hasOutput = outputs.some((o) => o.outputType === tab.id);

              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedType(tab.id)}
                  disabled={!hasOutput}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 700 : 500,
                    background: isSelected ? '#F8E8EE' : '#FFFFFF',
                    color: isSelected ? '#7A173D' : '#8A6875',
                    border: isSelected ? '1px solid #7A173D' : '1px solid #E9C9D5',
                    cursor: hasOutput ? 'pointer' : 'not-allowed',
                    opacity: hasOutput ? 1 : 0.4,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon size={13} color={isSelected ? '#7A173D' : '#8A6875'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {exportNotice && (
          <div
            style={{
              background: '#E8F7F0',
              border: '1px solid #B8DEC9',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.8rem',
              color: '#16805B',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
            }}
          >
            <Check size={14} aria-hidden="true" /> {exportNotice}
          </div>
        )}

        {/* Real Brand Exporters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
          <button className="btn-primary btn-sm" onClick={handleExportDOCX} style={{ justifyContent: 'flex-start', gap: '8px', background: '#7A173D', color: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', fontWeight: 700 }}>
            <BrandLogo name="word" size={16} /> Word (.docx)
          </button>

          <button className="btn-primary btn-sm" onClick={handleExportPDF} style={{ justifyContent: 'flex-start', gap: '8px', background: '#7A173D', color: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', fontWeight: 700 }}>
            <BrandLogo name="pdf" size={16} /> PDF (.pdf)
          </button>

          <button className="btn-primary btn-sm" onClick={handleExportPPTX} style={{ justifyContent: 'flex-start', gap: '8px', background: '#7A173D', color: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', fontWeight: 700 }}>
            <BrandLogo name="powerpoint" size={16} /> PowerPoint (.pptx)
          </button>

          <button className="btn-secondary btn-sm" onClick={handleExportJSON} style={{ justifyContent: 'flex-start', gap: '8px', background: '#FFFFFF', border: '1px solid #E9C9D5', color: '#3D1324', padding: '10px 14px', borderRadius: '8px' }}>
            <BrandLogo name="gemini" size={16} /> JSON (.json)
          </button>

          <button className="btn-secondary btn-sm" onClick={handleExportCSV} style={{ justifyContent: 'flex-start', gap: '8px', background: '#FFFFFF', border: '1px solid #E9C9D5', color: '#3D1324', padding: '10px 14px', borderRadius: '8px' }}>
            <BrandLogo name="excel" size={16} /> CSV (.csv)
          </button>

          <button className="btn-secondary btn-sm" onClick={handleExportXML} style={{ justifyContent: 'flex-start', gap: '8px', background: '#FFFFFF', border: '1px solid #E9C9D5', color: '#3D1324', padding: '10px 14px', borderRadius: '8px' }}>
            <BrandLogo name="neon" size={16} /> XML (.xml)
          </button>

          <button className="btn-secondary btn-sm" onClick={handleExportYAML} style={{ justifyContent: 'flex-start', gap: '8px', background: '#FFFFFF', border: '1px solid #E9C9D5', color: '#3D1324', padding: '10px 14px', borderRadius: '8px' }}>
            <BrandLogo name="prisma" size={16} /> YAML (.yaml)
          </button>

          <button className="btn-secondary btn-sm" onClick={handleExportMarkdown} style={{ justifyContent: 'flex-start', gap: '8px', background: '#FFFFFF', border: '1px solid #E9C9D5', color: '#3D1324', padding: '10px 14px', borderRadius: '8px' }}>
            <BrandLogo name="github" size={16} /> Markdown (.md)
          </button>

          <button className="btn-secondary btn-sm" onClick={handleExportTXT} style={{ justifyContent: 'flex-start', gap: '8px', background: '#FFFFFF', border: '1px solid #E9C9D5', color: '#3D1324', padding: '10px 14px', borderRadius: '8px' }}>
            <Download size={15} color="#7A173D" aria-hidden="true" /> Text (.txt)
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
          <button className="btn-secondary btn-sm" onClick={handlePrintView} style={{ flex: 1, justifyContent: 'center', background: '#FFFFFF', border: '1px solid #E9C9D5', color: '#3D1324', padding: '10px' }}>
            <Printer size={14} color="#7A173D" aria-hidden="true" /> Print View
          </button>

          <button className="btn-secondary btn-sm" onClick={handleCopyAll} style={{ flex: 1, justifyContent: 'center', background: '#FFFFFF', border: '1px solid #E9C9D5', color: '#3D1324', padding: '10px' }}>
            {copied ? <Check size={14} color="#16805B" aria-hidden="true" /> : <Copy size={14} color="#7A173D" aria-hidden="true" />}
            <span>{copied ? 'Copied Deliverable!' : 'Copy to Clipboard'}</span>
          </button>
        </div>

        <div style={{ textAlign: 'right' }}>
          <button onClick={onClose} style={{ background: '#F8E8EE', border: '1px solid #E9C9D5', color: '#7A173D', padding: '8px 18px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
