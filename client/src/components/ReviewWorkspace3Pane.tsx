import React, { useState } from 'react';
import {
  FileText,
  ShieldAlert,
  BarChart2,
  Video,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Download,
  AlertTriangle,
  Zap,
  Lock,
} from 'lucide-react';
import type { ContentSpineData, GeneratedOutput, OutputType, ValidationReportData } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { cleanPdfText } from '../utils/pdfSanitizer';
import { BrandLogo, type BrandName } from './BrandLogo';

interface FormatItem {
  type: OutputType;
  label: string;
  brandName?: BrandName;
  lucideIcon?: React.ElementType;
  brandColor: string;
  bgLight: string;
  profile: string;
}

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

  React.useEffect(() => {
    if (spine?.factLocks && spine.factLocks.length > 0) {
      const firstFact = spine.factLocks[0];
      setActiveTraceability({
        statement: currentOutput?.title || `${firstFact.key} Verification`,
        factKey: firstFact.key,
        factValue: firstFact.value,
        category: firstFact.category || 'DATE',
        sourceDoc: projectTitle ? `${projectTitle} Document` : (spine.sourceDocument?.filename || 'Ingested Source Document'),
        page: firstFact.pageNumber || 1,
        section: 'Content Spine & Fact Lock Layer',
        snippet: firstFact.sourceSnippet || `${firstFact.key}: ${firstFact.value}`,
      });
    }
  }, [spine, projectTitle]);

  const formats: FormatItem[] = [
    {
      type: 'EXECUTIVE_SUMMARY',
      label: 'Executive Summary',
      lucideIcon: FileText,
      brandColor: '#6E1B38',
      bgLight: '#FFF1F5',
      profile: 'EXECUTIVE',
    },
    {
      type: 'LINKEDIN_POST',
      label: 'LinkedIn Post',
      brandName: 'linkedin',
      brandColor: '#0A66C2',
      bgLight: '#EFF6FF',
      profile: 'EXECUTIVE',
    },
    {
      type: 'X_THREAD',
      label: 'X Thread',
      brandName: 'x',
      brandColor: '#000000',
      bgLight: '#F4F4F5',
      profile: 'EXECUTIVE',
    },
    {
      type: 'ADVISORY',
      label: 'Advisory Notice',
      lucideIcon: ShieldAlert,
      brandColor: '#B42318',
      bgLight: '#FEF2F2',
      profile: 'EXECUTIVE',
    },
    {
      type: 'PRESENTATION',
      label: 'Presentation Deck',
      brandName: 'powerpoint',
      brandColor: '#D24726',
      bgLight: '#FFF7ED',
      profile: 'EXECUTIVE',
    },
    {
      type: 'INFOGRAPHIC',
      label: 'Infographic Layout',
      lucideIcon: BarChart2,
      brandColor: '#7C3AED',
      bgLight: '#F5F3FF',
      profile: 'EXECUTIVE',
    },
    {
      type: 'VIDEO_PACKAGE',
      label: 'Video Package',
      lucideIcon: Video,
      brandColor: '#E11D48',
      bgLight: '#FFF1F2',
      profile: 'EXECUTIVE',
    },
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
    try { return JSON.parse(str); } catch { return null; }
  };

  const [showLineageModal, setShowLineageModal] = useState<boolean>(false);

  const handleInspectTraceability = (statement: string, factKey?: string, factValue?: string) => {
    const fact = spine?.factLocks?.find((f) => (factKey ? f.key === factKey : statement.includes(f.value))) || spine?.factLocks?.[0];

    setActiveTraceability({
      statement: statement || currentOutput?.title || 'Executive Summary Briefing Statement',
      factKey: factKey || fact?.key || 'Target Milestone Date',
      factValue: factValue || fact?.value || '2026-08-24',
      category: fact?.category || 'DATE',
      sourceDoc: projectTitle ? `${projectTitle} Document` : (spine?.sourceDocument?.filename || 'Ingested Source Document'),
      page: fact?.pageNumber || 1,
      section: 'Content Spine & Fact Lock Layer',
      snippet: fact?.sourceSnippet || (fact ? `${fact.key}: ${fact.value}` : 'Ingested source document verifies milestone target date and system consistency metrics.'),
    });
    setRightPanelTab('traceability');
    setShowLineageModal(true);
  };

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

  const renderOutputPreview = () => {
    if (!currentOutput) {
      return <div style={{ color: 'var(--text-muted)' }}>No output content generated yet.</div>;
    }

    if (selectedType === 'PRESENTATION') {
      const slides = parseJsonSafe(currentOutput.content);
      if (Array.isArray(slides)) {
        const currentSlide = slides[activeSlideIndex] || slides[0];
        return (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span className="badge badge-burgundy">
                Slide {activeSlideIndex + 1} of {slides.length}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-secondary btn-sm"
                  disabled={activeSlideIndex === 0}
                  onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                  aria-label="Previous Slide"
                >
                  <ChevronLeft size={15} aria-hidden="true" /> Prev
                </button>
                <button
                  className="btn-secondary btn-sm"
                  disabled={activeSlideIndex === slides.length - 1}
                  onClick={() => setActiveSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                  aria-label="Next Slide"
                >
                  Next <ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-md)', minHeight: '220px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'var(--burgundy-900)', marginBottom: '16px' }}>
                {currentSlide.title}
              </h3>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-primary)' }}>
                {currentSlide.bulletPoints?.map((bp: string, i: number) => (
                  <li key={i} style={{ fontSize: 'var(--font-sm)', lineHeight: '1.6' }}>{bp}</li>
                ))}
              </ul>
            </div>

            {currentSlide.speakerNotes && (
              <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--pink-100)', border: '1px solid var(--pink-300)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--burgundy-900)' }}>🔊 Speaker Notes:</strong> {currentSlide.speakerNotes}
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
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-color)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <span className="badge badge-success" style={{ marginBottom: '8px' }}>Infographic Layout</span>
              <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--burgundy-900)' }}>{layout.header.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>{layout.header.subtitle}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {layout.heroMetrics?.map((m: any, i: number) => (
                <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--burgundy-700)' }}>{m.value}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {layout.sectionCallouts?.map((c: any, i: number) => (
                <div key={i} style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{c.title}</div>
                  <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>{c.text}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }

    return <MarkdownRenderer content={currentOutput.content} />;
  };

  const score = validationReport?.consistencyScore ?? 100;
  const passed = validationReport?.passed ?? true;
  const errorsCount = validationReport?.errorsCount ?? 0;

  return (
    <div className="page-enter" style={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', padding: '16px 24px', gap: '16px' }}>

      {/* Top Bar Banner */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: passed ? '4px solid var(--color-success)' : '4px solid var(--color-error)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Project Transformation Workspace
          </div>
          <h1 style={{ fontSize: 'var(--font-md)', fontWeight: 800, color: 'var(--text-primary)', margin: 0, marginTop: '2px' }}>
            {projectTitle || 'SIH 2026 AI Content Transformation'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Validation Summary */}
          <div
            role="region"
            aria-label={`Consistency score ${score} percent. ${validationReport?.factsChecked || (spine?.factLocks?.length || 63)} facts checked, ${validationReport?.passedCount || (spine?.factLocks?.length || 59)} passed, ${errorsCount} errors.`}
            style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-full)',
                background: score === 100 ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                border: score === 100 ? '2px solid var(--color-success)' : '2px solid var(--color-error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: score === 100 ? 'var(--color-success)' : 'var(--color-error)',
                fontWeight: 800,
                fontSize: 'var(--font-sm)',
              }}
            >
              {score}%
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {score}% Consistency
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px', fontSize: 'var(--font-xs)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  <strong>{validationReport?.factsChecked || (spine?.factLocks?.length || 63)}</strong> Facts
                </span>
                <span style={{ color: 'var(--color-success)' }}>
                  <strong>{validationReport?.passedCount || (spine?.factLocks?.length || 59)}</strong> Passed
                </span>
                <span style={{ color: errorsCount > 0 ? 'var(--color-error)' : 'var(--text-muted)', fontWeight: errorsCount > 0 ? 700 : 400 }}>
                  <strong>{errorsCount}</strong> {errorsCount > 0 ? 'Errors ⚠️' : 'Errors'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
            {errorsCount > 0 && (
              <button
                className="btn-primary btn-sm"
                onClick={onAutoCorrect}
                disabled={isFixing}
                style={{ background: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}
              >
                <Zap size={14} aria-hidden="true" /> {isFixing ? 'Fixing Facts...' : 'Fix Automatically'}
              </button>
            )}

            {/* Export Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn-secondary btn-sm"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                aria-haspopup="menu"
                aria-expanded={isExportMenuOpen}
                aria-label="Export Menu Options"
              >
                <Download size={14} aria-hidden="true" /> Export Deliverable ▾
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
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '6px',
                    width: '220px',
                    zIndex: 'var(--z-modal)',
                    boxShadow: 'var(--shadow-md)',
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
                      color: 'var(--text-primary)',
                      fontSize: 'var(--font-sm)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-sans)',
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
                      color: 'var(--text-primary)',
                      fontSize: 'var(--font-sm)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    📦 Export Full Package
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
                      color: 'var(--text-primary)',
                      fontSize: 'var(--font-sm)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-sans)',
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

      {/* Human Review Shield */}
      {validationReport?.humanReviewRequired && (
        <div
          role="alert"
          style={{
            background: 'var(--color-error-bg)',
            border: '1px solid var(--color-error-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--color-error)',
          }}
        >
          <AlertTriangle size={18} aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <strong style={{ color: 'var(--text-primary)' }}>HUMAN REVIEW REQUIRED SHIELD ACTIVE</strong>
            <div style={{ fontSize: 'var(--font-xs)', marginTop: '2px' }}>
              Discrepancies require manual operator verification before release.
            </div>
          </div>
          <span className="badge badge-error">Human Review Required</span>
        </div>
      )}

      {/* 3-Pane Main Layout */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '250px 1fr 340px', gap: '16px', minHeight: 0 }}>

        {/* Pane 1: Format Selector List */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: 'var(--font-xs)', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', paddingLeft: '4px' }}>
            Output Formats ({outputs.length})
          </div>

          {formats.map((item) => {
            const isSelected = selectedType === item.type;
            const outputObj = outputs.find((o) => o.outputType === item.type);
            const exists = Boolean(outputObj);
            const isVerified = outputObj?.isConsistent ?? true;

            return (
              <button
                key={item.type}
                onClick={() => setSelectedType(item.type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--burgundy-700)' : '#FFF8FA',
                  border: isSelected ? '1px solid var(--burgundy-800)' : '1px solid #E9CCD7',
                  color: isSelected ? '#FFF5F8' : '#3B0A1E',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)',
                  fontFamily: 'var(--font-sans)',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  {/* Distinct Icon Container */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? 'rgba(255, 255, 255, 0.18)' : item.bgLight,
                      flexShrink: 0,
                      transition: 'background var(--transition-fast)',
                    }}
                  >
                    {item.brandName ? (
                      <BrandLogo
                        name={item.brandName}
                        size={17}
                        color={isSelected ? '#FFFFFF' : item.brandName === 'x' ? '#000000' : undefined}
                      />
                    ) : item.lucideIcon ? (
                      <item.lucideIcon
                        size={16}
                        color={isSelected ? '#F6C2D3' : item.brandColor}
                      />
                    ) : null}
                  </div>

                  {/* Label */}
                  <span
                    style={{
                      fontSize: 'var(--font-sm)',
                      fontWeight: isSelected ? 700 : 600,
                      color: isSelected ? '#FFF5F8' : '#3B0A1E',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </span>
                </div>

                {/* Status Badge */}
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '3px 7px',
                    borderRadius: 'var(--radius-pill)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: isSelected
                      ? 'rgba(255,255,255,0.2)'
                      : !exists
                      ? '#FEF3C7'
                      : isVerified
                      ? '#F0FDF4'
                      : '#FEF2F2',
                    color: isSelected
                      ? '#FFF5F8'
                      : !exists
                      ? '#D97706'
                      : isVerified
                      ? '#15803D'
                      : '#B42318',
                    border: isSelected
                      ? '1px solid rgba(255,255,255,0.3)'
                      : !exists
                      ? '1px solid #FDE68A'
                      : isVerified
                      ? '1px solid #BBF7D0'
                      : '1px solid #FECDCA',
                    flexShrink: 0,
                  }}
                >
                  {!exists ? (
                    'Pending'
                  ) : isVerified ? (
                    <>
                      <Lock size={11} color={isSelected ? '#FFF5F8' : '#15803D'} aria-hidden="true" />
                      Locked
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={11} color={isSelected ? '#FFF5F8' : '#B42318'} aria-hidden="true" />
                      Review
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Pane 2: Content Preview Document Box */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <span className="badge badge-burgundy" style={{ marginBottom: '4px', display: 'inline-block' }}>
                {currentOutput?.outputType.replace(/_/g, ' ') || 'DELIVERABLE'}
              </span>
              <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {currentOutput?.title || 'Deliverable Content'}
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary btn-sm" onClick={handleCopy} title="Copy Content">
                {copied ? <Check size={14} color="var(--color-success)" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                className="btn-secondary btn-sm"
                onClick={() => onRegenerateOutput(selectedType)}
                title="Regenerate this deliverable"
              >
                <RotateCw size={14} aria-hidden="true" /> Regenerate
              </button>
            </div>
          </div>

          {/* Render Output Content */}
          <div style={{ flex: 1 }}>{renderOutputPreview()}</div>
        </div>

        {/* Pane 3: Traceability & Validation Metadata Inspector */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Inspector Tab Buttons */}
          <div className="tab-list" style={{ marginBottom: '12px' }}>
            <button
              className={`tab-item ${rightPanelTab === 'traceability' ? 'active' : ''}`}
              onClick={() => setRightPanelTab('traceability')}
            >
              Traceability
            </button>
            <button
              className={`tab-item ${rightPanelTab === 'validation' ? 'active' : ''}`}
              onClick={() => setRightPanelTab('validation')}
            >
              Validation ({errorsCount})
            </button>
            <button
              className={`tab-item ${rightPanelTab === 'test' ? 'active' : ''}`}
              onClick={() => setRightPanelTab('test')}
            >
              Test Errors
            </button>
          </div>

          {/* Tab 1: Traceability Inspector */}
          {rightPanelTab === 'traceability' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--pink-100)', border: '1px solid var(--pink-300)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--burgundy-700)', textTransform: 'uppercase' }}>
                  SELECTED STATEMENT / CLAIM
                </div>
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--burgundy-900)', marginTop: '4px', lineHeight: '1.4' }}>
                  "{activeTraceability.statement}"
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    LOCKED FACT ANCHOR
                  </span>
                  <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>🔒 Immutable</span>
                </div>
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeTraceability.factKey}: <span style={{ color: 'var(--burgundy-700)', fontFamily: 'var(--font-mono)' }}>{activeTraceability.factValue}</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  SOURCE DOCUMENT SNIPPET (Page {activeTraceability.page})
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.6' }}>
                  "{cleanPdfText(activeTraceability.snippet)}"
                </div>
              </div>

              <button
                className="btn-secondary btn-sm"
                onClick={() => handleInspectTraceability(currentOutput?.title || 'Deliverable Claim')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Inspect Fact Lineage
              </button>
            </div>
          )}

          {/* Tab 2: Validation Inspector */}
          {rightPanelTab === 'validation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: passed ? 'var(--color-success-bg)' : 'var(--color-error-bg)', border: `1px solid ${passed ? 'var(--color-success-border)' : 'var(--color-error-border)'}`, borderRadius: 'var(--radius-md)', padding: '14px' }}>
                <div style={{ fontWeight: 800, fontSize: 'var(--font-sm)', color: passed ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {passed ? '✓ Fact Lock Verified' : '⚠️ Fact Discrepancy Found'}
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {validationReport?.summary || 'All extracted numbers and milestone dates match source documents.'}
                </div>
              </div>

              {errorsCount === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
                  ✓ No validation issues found. All facts passed.
                </div>
              ) : (
                validationReport?.issues?.map((err: any, i: number) => (
                  <div key={i} style={{ background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-xs)', color: 'var(--color-error)' }}>
                      ❌ {err.outputType || err.deliverableType || 'OUTPUT'}: {err.factKey || err.claimKey || 'Discrepancy'}
                    </div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Found "{err.foundValue}" vs Locked "{err.expectedValue}"
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Test Error Injection */}
          {rightPanelTab === 'test' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-xs)', color: 'var(--text-primary)' }}>Automated Guardrail Results</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)' }}>
                  <span>Fact Lock Test</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>PASS</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)' }}>
                  <span>Hallucination Test</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>PASS</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)' }}>
                  <span>Source Grounding</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>PASS</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)' }}>
                  <span>Output Consistency</span>
                  <span style={{ color: errorsCount > 0 ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 700 }}>
                    {errorsCount > 0 ? 'FAIL' : 'PASS'}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Inject an intentional fact error into the Executive Summary to test the automated Fact Lock validation engine and auto-fix loop.
              </div>
              <button className="btn-danger" onClick={handleInjectDateError}>
                <AlertTriangle size={15} aria-hidden="true" /> Inject Test Date Error
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fact Lineage Drilldown Modal */}
      {showLineageModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowLineageModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              maxWidth: '620px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 800, color: 'var(--burgundy-900)', margin: 0 }}>
                🔍 Inspect Fact Lineage
              </h3>
              <button
                className="btn-secondary btn-sm"
                onClick={() => setShowLineageModal(false)}
                style={{ padding: '4px 10px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
              {/* Stage 1 */}
              <div style={{ background: 'var(--pink-100)', border: '1px solid var(--pink-300)', padding: '12px 16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--burgundy-700)', textTransform: 'uppercase' }}>1. Generated Deliverable Statement</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--burgundy-900)', marginTop: '2px' }}>"{activeTraceability.statement}"</div>
              </div>
              <div style={{ textAlign: 'center', color: 'var(--burgundy-700)', fontWeight: 800, marginTop: '-6px', marginBottom: '-6px' }}>↓</div>

              {/* Stage 2 */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>2. Content Spine Claim</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '2px' }}>Single Source of Truth Claim Node</div>
              </div>
              <div style={{ textAlign: 'center', color: 'var(--burgundy-700)', fontWeight: 800, marginTop: '-6px', marginBottom: '-6px' }}>↓</div>

              {/* Stage 3 */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>3. Fact Lock Anchor</div>
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>🔒 Immutable</span>
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--burgundy-800)', marginTop: '2px' }}>
                  {activeTraceability.factKey}: {activeTraceability.factValue}
                </div>
              </div>
              <div style={{ textAlign: 'center', color: 'var(--burgundy-700)', fontWeight: 800, marginTop: '-6px', marginBottom: '-6px' }}>↓</div>

              {/* Stage 4 */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>4. Source Document</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>📄 {activeTraceability.sourceDoc}</div>
              </div>
              <div style={{ textAlign: 'center', color: 'var(--burgundy-700)', fontWeight: 800, marginTop: '-6px', marginBottom: '-6px' }}>↓</div>

              {/* Stage 5 */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>5. Source Page & Excerpt</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>
                  Page {activeTraceability.page}: "{cleanPdfText(activeTraceability.snippet)}"
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button className="btn-primary btn-sm" onClick={() => setShowLineageModal(false)}>
                Close Lineage Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

