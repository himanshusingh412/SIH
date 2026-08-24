import React, { useState } from 'react';
import {
  FileText,
  ShieldAlert,
  Presentation,
  BarChart2,
  Video,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Download,
  HelpCircle,
  AlertTriangle,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import type { ContentSpineData, GeneratedOutput, OutputType, ValidationReportData } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { cleanPdfText } from '../utils/pdfSanitizer';

const LinkedinIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.75a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9z"/>
  </svg>
);

const TwitterIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

interface ReviewWorkspace3PaneProps {
  projectTitle?: string;
  outputs: GeneratedOutput[];
  spine: ContentSpineData | null;
  validationReport: ValidationReportData | null;
  onToggleLock: (factId: string, isLocked: boolean) => void;
  onAutoCorrect: () => void;
  onRegenerateOutput: (type: OutputType) => void;
  onInjectTestErrors?: (injections: Array<{ outputType: OutputType; find: string; replace: string }>) => void;
  onOpenExport: () => void;
  isFixing?: boolean;
  autoFixAttempt?: number;
}

export const ReviewWorkspace3Pane: React.FC<ReviewWorkspace3PaneProps> = ({
  projectTitle,
  outputs,
  spine,
  validationReport,
  onAutoCorrect,
  onRegenerateOutput,
  onInjectTestErrors,
  onOpenExport,
  isFixing,
}) => {
  const [selectedType, setSelectedType] = useState<OutputType>('EXECUTIVE_SUMMARY');
  const [rightPanelTab, setRightPanelTab] = useState<'traceability' | 'validation' | 'test'>('traceability');
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);

  const [activeTraceability, setActiveTraceability] = useState<{
    statement: string;
    factKey: string;
    factValue: string;
    category: string;
    sourceDoc: string;
    page: number;
    section: string;
    snippet: string;
  }>({
    statement: 'Executive Summary Briefing Statement',
    factKey: 'Target Milestone Date',
    factValue: '2026-08-24',
    category: 'DATE',
    sourceDoc: projectTitle ? `${projectTitle} Document` : 'Ingested Source Document',
    page: 1,
    section: 'Content Spine & Fact Lock Layer',
    snippet: 'Ingested source document verifies milestone target date and system consistency metrics.',
  });

  const formats: Array<{ type: OutputType; label: string; icon: any; profile: string }> = [
    { type: 'EXECUTIVE_SUMMARY', label: 'Executive Summary', icon: FileText, profile: 'EXECUTIVE' },
    { type: 'LINKEDIN_POST', label: 'LinkedIn Post', icon: LinkedinIcon, profile: 'EXECUTIVE' },
    { type: 'X_THREAD', label: 'X Thread', icon: TwitterIcon, profile: 'EXECUTIVE' },
    { type: 'ADVISORY', label: 'Advisory Notice', icon: ShieldAlert, profile: 'EXECUTIVE' },
    { type: 'PRESENTATION', label: 'Presentation Deck', icon: Presentation, profile: 'EXECUTIVE' },
    { type: 'INFOGRAPHIC', label: 'Infographic Layout', icon: BarChart2, profile: 'EXECUTIVE' },
    { type: 'VIDEO_PACKAGE', label: 'Video Package', icon: Video, profile: 'EXECUTIVE' },
  ];

  const currentOutput = outputs.find((o) => o.outputType === selectedType) || outputs[0];

  const handleCopy = () => {
    if (currentOutput?.content) {
      navigator.clipboard.writeText(currentOutput.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const parseJsonSafe = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  // Inspect "Why was this generated?" helper
  const handleInspectTraceability = (statement: string, factKey?: string, factValue?: string) => {
    const fact = spine?.factLocks?.find((f) => (factKey ? f.key === factKey : statement.includes(f.value))) || spine?.factLocks?.[0];

    setActiveTraceability({
      statement: statement || currentOutput?.title || 'Selected Claim Statement',
      factKey: factKey || fact?.key || 'Fact Node',
      factValue: factValue || fact?.value || 'Verified',
      category: fact?.category || 'CLAIM',
      sourceDoc: projectTitle ? `${projectTitle} Document` : 'Ingested Source Document',
      page: fact?.pageNumber || 1,
      section: 'Content Spine Fact Lock Node',
      snippet: fact?.sourceSnippet || (fact ? `${fact.key}: ${fact.value}` : 'Source reference verified from ingested document.'),
    });
    setRightPanelTab('traceability');
  };

  // Test error injection helper
  const handleInjectDateError = () => {
    if (onInjectTestErrors) {
      const dateFact = spine?.factLocks?.find((f) => f.category === 'DATE');
      const targetDate = dateFact ? dateFact.value : '2026-08-24';
      onInjectTestErrors([
        {
          outputType: 'EXECUTIVE_SUMMARY',
          find: targetDate,
          replace: '2026-09-15',
        },
      ]);
      setRightPanelTab('validation');
    }
  };

  // Render Rich Deliverable Content (Issue 4: Rich Markdown Renderer)
  const renderOutputPreview = () => {
    if (!currentOutput) {
      return <div style={{ color: 'var(--text-muted)' }}>No output content generated yet.</div>;
    }

    if (selectedType === 'PRESENTATION') {
      const slides = parseJsonSafe(currentOutput.content);
      if (Array.isArray(slides)) {
        const currentSlide = slides[activeSlideIndex] || slides[0];
        return (
          <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span className="badge badge-indigo">
                Slide {activeSlideIndex + 1} of {slides.length}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px' }}
                  disabled={activeSlideIndex === 0}
                  onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                  aria-label="Previous Slide"
                >
                  <ChevronLeft size={16} aria-hidden="true" /> Prev
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px' }}
                  disabled={activeSlideIndex === slides.length - 1}
                  onClick={() => setActiveSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                  aria-label="Next Slide"
                >
                  Next <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div style={{ background: 'var(--bg-dark)', padding: '24px', borderRadius: 'var(--radius-md)', minHeight: '220px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'white', marginBottom: '16px' }}>
                {currentSlide.title}
              </h3>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', color: '#e2e8f0' }}>
                {currentSlide.bulletPoints?.map((bp: string, i: number) => (
                  <li key={i} style={{ fontSize: 'var(--font-sm)' }}>{bp}</li>
                ))}
              </ul>
            </div>

            {currentSlide.speakerNotes && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'white' }}>🔊 Speaker Notes:</strong> {currentSlide.speakerNotes}
              </div>
            )}
          </div>
        );
      }
    }

    if (selectedType === 'INFOGRAPHIC') {
      const layout = parseJsonSafe(currentOutput.content);
      if (layout && layout.header) {
        return (
          <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-color)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <span className="badge badge-emerald" style={{ marginBottom: '8px' }}>Infographic Layout</span>
              <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'white' }}>{layout.header.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>{layout.header.subtitle}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {layout.heroMetrics?.map((m: any, i: number) => (
                <div key={i} style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--accent-sky)' }}>{m.value}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {layout.sectionCallouts?.map((c: any, i: number) => (
                <div key={i} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 700, color: 'white', marginBottom: '4px' }}>{c.title}</div>
                  <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>{c.text}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }

    // Default Rich Markdown Rendering for document deliverables (Issue 4 Fix)
    return <MarkdownRenderer content={currentOutput.content} />;
  };

  const score = validationReport?.consistencyScore ?? 100;
  const passed = validationReport?.passed ?? true;
  const errorsCount = validationReport?.errorsCount ?? 0;

  return (
    <div style={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: '16px' }}>
      {/* Top Bar Workspace Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: passed ? '4px solid var(--accent-emerald)' : '4px solid var(--accent-rose)',
        }}
      >
        <div>
          <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Project Transformation Workspace
          </div>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'white', marginTop: '2px' }}>
            {projectTitle || 'SIH 2026 AI Content Transformation'}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Redesigned Validation Summary Hierarchy (Issue 8 Fix) */}
          <div
            className="validation-summary"
            role="region"
            aria-label={`Consistency score ${score} percent. ${validationReport?.factsChecked || 0} facts checked, ${validationReport?.passedCount || 0} passed, ${errorsCount} errors.`}
            style={{ display: 'flex', alignItems: 'center', gap: '14px' }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-full)',
                background: score === 100 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                border: score === 100 ? '2px solid var(--accent-emerald)' : '2px solid var(--accent-rose)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: score === 100 ? '#a7f3d0' : '#fecdd3',
                fontWeight: 800,
                fontSize: 'var(--font-sm)',
              }}
            >
              {score}%
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: '#ffffff' }}>
                {score}% Consistency
              </div>
              {/* High-visibility breakdown statistics (min 0.85rem / bold values) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '3px', fontSize: 'var(--font-sm)' }}>
                <span style={{ color: '#cbd5e1' }}>
                  <strong style={{ color: '#ffffff' }}>{validationReport?.factsChecked || 0}</strong> Facts
                </span>
                <span style={{ color: '#a7f3d0' }}>
                  <strong style={{ color: '#34d399' }}>{validationReport?.passedCount || 0}</strong> Passed
                </span>
                <span style={{ color: errorsCount > 0 ? '#fecdd3' : '#cbd5e1', fontWeight: errorsCount > 0 ? 700 : 400 }}>
                  <strong style={{ color: errorsCount > 0 ? '#f43f5e' : '#ffffff' }}>{errorsCount}</strong> {errorsCount > 0 ? 'Errors ⚠️' : 'Errors'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
            {errorsCount > 0 && (
              <button
                className="btn-primary"
                onClick={onAutoCorrect}
                disabled={isFixing}
                style={{ background: 'var(--accent-amber)', borderColor: 'var(--accent-amber)' }}
              >
                <Zap size={15} aria-hidden="true" /> {isFixing ? 'Fixing Facts...' : 'Fix Automatically'}
              </button>
            )}

            {/* Unified Export Menu Button (Issue 5 Fix) */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn-secondary"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                aria-haspopup="menu"
                aria-expanded={isExportMenuOpen}
                aria-label="Export Menu Options"
              >
                <Download size={15} aria-hidden="true" /> Export Deliverable ▾
              </button>

              {isExportMenuOpen && (
                <div
                  role="menu"
                  aria-label="Export Options Menu"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '6px',
                    background: '#121826',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '6px',
                    width: '220px',
                    zIndex: 200,
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsExportMenuOpen(false);
                  }}
                >
                  <button
                    role="menuitem"
                    onClick={() => { setIsExportMenuOpen(false); handleCopy(); }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      fontSize: 'var(--font-sm)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    📄 Copy Markdown Text
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setIsExportMenuOpen(false); onOpenExport(); }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      fontSize: 'var(--font-sm)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    📦 Export Full Project Package
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setIsExportMenuOpen(false); onOpenExport(); }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      fontSize: 'var(--font-sm)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    📑 Export DOCX / PDF / PPTX
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Human Review Shield Banner if Auto-Fix retries unresolved */}
      {validationReport?.humanReviewRequired && (
        <div
          role="alert"
          style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1.5px solid var(--accent-rose)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#fda4af',
          }}
        >
          <AlertTriangle size={20} aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <strong style={{ color: 'white' }}>HUMAN REVIEW REQUIRED SHIELD ACTIVE</strong>
            <div style={{ fontSize: 'var(--font-xs)', marginTop: '2px' }}>
              3 automated correction retries executed. Discrepancies require manual operator verification before release.
            </div>
          </div>
          <span className="badge badge-rose">Human Review Required</span>
        </div>
      )}

      {/* 3-Pane Main Layout */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr 340px', gap: '16px', minHeight: 0 }}>
        {/* Pane 1: Format Selector List */}
        <div className="glass-panel" style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px' }}>
            Output Formats ({outputs.length})
          </div>

          {formats.map((item) => {
            const Icon = item.icon;
            const output = outputs.find((o) => o.outputType === item.type);
            const isSelected = selectedType === item.type;
            const isConsistent = output?.isConsistent ?? true;

            return (
              <button
                key={item.type}
                onClick={() => setSelectedType(item.type)}
                aria-pressed={isSelected}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.06)',
                    color: isSelected ? 'white' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} aria-hidden="true" />
                </div>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: isSelected ? 'white' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    Profile: {item.profile}
                  </div>
                </div>

                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: 'var(--radius-full)',
                    background: isConsistent ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  }}
                  aria-label={isConsistent ? 'Consistent' : 'Inconsistency detected'}
                />
              </button>
            );
          })}
        </div>

        {/* Pane 2: Center Preview & Output Actions Toolbar (Issue 7 Fix) */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {/* Header Row + Action Toolbar */}
          <div className="output-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)', gap: '16px', flexWrap: 'wrap' }}>
            <div className="output-card-title">
              <span className="badge badge-indigo" style={{ marginBottom: '4px' }}>
                {formats.find((f) => f.type === selectedType)?.label || selectedType}
              </span>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'white' }}>
                {(currentOutput?.title || `${selectedType} Output`)
                  .replace(/EXECUTIVE SUMMARY \(EXECUTIVE\)/gi, 'Executive Summary')
                  .replace(/LINKEDIN POST \(EXECUTIVE\)/gi, 'LinkedIn Post')
                  .replace(/X THREAD \(EXECUTIVE\)/gi, 'X Thread')
                  .replace(/ADVISORY \(EXECUTIVE\)/gi, 'Official Advisory')
                  .replace(/PRESENTATION \(EXECUTIVE\)/gi, 'Presentation Deck')
                  .replace(/INFOGRAPHIC \(EXECUTIVE\)/gi, 'Infographic Layout Data')
                  .replace(/VIDEO PACKAGE \(EXECUTIVE\)/gi, 'Video Package')
                  .replace(/\s*—\s*Gemini\s*\(gemini-[^)]+\)/gi, ' (Gemini)')
                  .replace(/\s*—\s*GPT-4o/gi, ' (OpenAI)')}
              </h3>
            </div>

            {/* Dedicated Action Toolbar (Issue 7 Fix) */}
            <div
              className="output-actions"
              role="toolbar"
              aria-label="Deliverable actions toolbar"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
            >
              <button
                className="btn-secondary"
                onClick={() => handleInspectTraceability(currentOutput?.title || 'Deliverable Statement')}
                style={{ fontSize: 'var(--font-xs)' }}
              >
                <HelpCircle size={14} aria-hidden="true" /> Why was this generated?
              </button>
              <button
                className="btn-secondary"
                onClick={() => onRegenerateOutput(selectedType)}
                style={{ fontSize: 'var(--font-xs)' }}
              >
                <RotateCw size={14} aria-hidden="true" /> Regenerate
              </button>
              <button className="btn-secondary" onClick={handleCopy} style={{ fontSize: 'var(--font-xs)' }}>
                {copied ? <Check size={14} color="#10b981" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div style={{ flex: 1 }}>{renderOutputPreview()}</div>
        </div>

        {/* Pane 3: Right Inspector Panel */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
          {/* Tab Selector Buttons */}
          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.4)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button
              onClick={() => setRightPanelTab('traceability')}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: rightPanelTab === 'traceability' ? 'var(--accent-primary)' : 'transparent',
                color: rightPanelTab === 'traceability' ? 'white' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 'var(--font-xs)',
                cursor: 'pointer',
              }}
            >
              Traceability
            </button>
            <button
              onClick={() => setRightPanelTab('validation')}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: rightPanelTab === 'validation' ? 'var(--accent-primary)' : 'transparent',
                color: rightPanelTab === 'validation' ? 'white' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 'var(--font-xs)',
                cursor: 'pointer',
              }}
            >
              Validation
            </button>
            <button
              onClick={() => setRightPanelTab('test')}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: rightPanelTab === 'test' ? 'var(--accent-primary)' : 'transparent',
                color: rightPanelTab === 'test' ? 'white' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 'var(--font-xs)',
                cursor: 'pointer',
              }}
            >
              Test Harness
            </button>
          </div>

          {/* Tab 1: Source Traceability Inspector */}
          {rightPanelTab === 'traceability' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Source Traceability Anchor
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: 'var(--radius-md)', padding: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--accent-sky)', fontWeight: 700 }}>CLAIM STATEMENT</div>
                <div style={{ fontSize: 'var(--font-sm)', color: 'white', marginTop: '4px', fontStyle: 'italic' }}>
                  "{activeTraceability.statement}"
                </div>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: 'var(--radius-md)', padding: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 'var(--font-xs)', color: '#a7f3d0', fontWeight: 700 }}>VERIFIED FACT LOCK NODE</div>
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                  🔒 {activeTraceability.factKey}: {activeTraceability.factValue}
                </div>
                <span className="badge badge-emerald" style={{ marginTop: '8px', display: 'inline-block' }}>
                  Category: {activeTraceability.category}
                </span>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: 'var(--radius-md)', padding: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 'var(--font-xs)', color: '#c7d2fe', fontWeight: 700 }}>SOURCE REFERENCE</div>
                <div style={{ fontSize: 'var(--font-sm)', color: 'white', marginTop: '4px' }}>
                  📄 {activeTraceability.sourceDoc} (Page {activeTraceability.page})
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                  "{cleanPdfText(activeTraceability.snippet)}"
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Validation Inspector */}
          {rightPanelTab === 'validation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Discrepancy Inspector ({validationReport?.issues?.length || 0})
              </div>

              {(!validationReport?.issues || validationReport.issues.length === 0) ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-emerald)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'center', color: '#a7f3d0' }}>
                  <CheckCircle2 size={32} style={{ margin: '0 auto 8px' }} aria-hidden="true" />
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)' }}>100% Factual Consistency</div>
                  <div style={{ fontSize: 'var(--font-xs)', marginTop: '4px', color: 'var(--text-muted)' }}>
                    All locked facts and milestone dates match Content Spine perfectly.
                  </div>
                </div>
              ) : (
                validationReport.issues.map((iss, i) => (
                  <div key={i} style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--accent-rose)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="badge badge-rose">Discrepancy #{i + 1}</span>
                      <span style={{ fontSize: 'var(--font-xs)', color: '#fda4af', fontWeight: 700 }}>{iss.severity}</span>
                    </div>
                    <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'white', marginTop: '8px' }}>
                      Fact: {iss.factKey}
                    </div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Expected: <strong style={{ color: '#34d399' }}>{iss.expectedValue}</strong>
                    </div>
                    <div style={{ fontSize: 'var(--font-xs)', color: '#fda4af', marginTop: '4px' }}>
                      {iss.description}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Test Error Injection Harness */}
          {rightPanelTab === 'test' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Automated Test Harness
              </div>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Inject a deliberate fact discrepancy into the generated Executive Summary to test the automated validation and auto-fix loop.
              </p>

              <button
                className="btn-primary"
                onClick={handleInjectDateError}
                style={{ background: 'rgba(244, 63, 94, 0.8)', borderColor: 'var(--accent-rose)', width: '100%', justifyContent: 'center' }}
              >
                <Zap size={16} aria-hidden="true" /> Inject Milestone Date Error
              </button>

              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'white' }}>Test Flow:</strong>
                <ol style={{ paddingLeft: '16px', marginTop: '6px', lineHeight: '1.6' }}>
                  <li>Click button to corrupt locked date in deliverable.</li>
                  <li>Consistency Score drops to 85%.</li>
                  <li>Click "Fix Automatically" to trigger repair loop.</li>
                  <li>Score restores to 100% verified.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
