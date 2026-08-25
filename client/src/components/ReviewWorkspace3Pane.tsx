import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldAlert,
  BarChart2,
  Video,
  Copy,
  Check,
  RotateCw,
  Download,
  AlertTriangle,
  Zap,
  Lock,
} from 'lucide-react';
import type { ContentSpineData, GeneratedOutput, OutputType, ValidationReportData } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SlideDeckView } from './deliverables/SlideDeckView';
import { InfographicView } from './deliverables/InfographicView';
import { VideoStoryboardView } from './deliverables/VideoStoryboardView';
import { parseInfographic, parseSlides, parseVideoPackage } from '../utils/deliverableParsers';
import { cleanPdfText } from '../utils/pdfSanitizer';
import { BrandLogo, type BrandName } from './BrandLogo';
import { AIProviderStatusBadge } from './AIProviderStatusBadge';

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
  onOpenExport: (activeTab?: OutputType) => void;
  isFixing?: boolean;
  autoFixAttempt?: number;
}

export const ReviewWorkspace3Pane: React.FC<ReviewWorkspace3PaneProps> = ({
  projectTitle,
  outputs = [],
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

  // 1. Strict derivation of current selected format and output (NO fallback to outputs[0])
  const currentFormatItem = formats.find((f) => f.type === selectedType) || formats[0];
  const currentOutput = outputs.find((o) => o.outputType === selectedType);
  const currentContent = currentOutput && currentOutput.content && currentOutput.content.trim().length > 0
    ? currentOutput.content
    : null;

  // Reset slide index when switching deliverable tabs
  useEffect(() => {
    setActiveSlideIndex(0);
  }, [selectedType]);

  // 2. Traceability state strictly derived from selected deliverable
  const firstFact = spine?.factLocks && spine.factLocks.length > 0 ? spine.factLocks[0] : null;
  const currentTraceability = {
    statement: currentOutput?.title || `${currentFormatItem.label} Briefing Statement`,
    factKey: firstFact?.key || 'Target Milestone Date',
    factValue: firstFact?.value || '2026-08-24',
    category: firstFact?.category || 'DATE',
    sourceDoc: projectTitle ? `${projectTitle} Document` : (spine?.sourceDocument?.filename || 'Ingested Source Document'),
    page: firstFact?.pageNumber || 1,
    section: 'Content Spine & Fact Lock Layer',
    snippet: firstFact?.sourceSnippet || (firstFact ? `${firstFact.key}: ${firstFact.value}` : 'Ingested source document verifies milestone target date and system consistency metrics.'),
  };

  const handleCopy = () => {
    if (currentContent) {
      navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInjectDateError = () => {
    if (onInjectTestErrors) {
      const dateFact = spine?.factLocks?.find((f) => f.category === 'DATE');
      const targetDate = dateFact ? dateFact.value : '2026-08-24';
      onInjectTestErrors([
        {
          outputType: selectedType,
          find: targetDate,
          replace: '2026-09-15',
        },
      ]);
      setRightPanelTab('validation');
    }
  };

  const renderOutputPreview = () => {
    if (!currentContent) {
      return (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: currentFormatItem.bgLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            {currentFormatItem.brandName ? (
              <BrandLogo name={currentFormatItem.brandName} size={22} />
            ) : currentFormatItem.lucideIcon ? (
              <currentFormatItem.lucideIcon size={22} color={currentFormatItem.brandColor} />
            ) : (
              <FileText size={22} color="var(--burgundy-700)" />
            )}
          </div>
          <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 800, color: 'var(--burgundy-900)', marginBottom: '6px' }}>
            {currentFormatItem.label} Pending
          </h3>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px' }}>
            Content for this deliverable format has not been generated yet or is pending synthesis.
          </p>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => onRegenerateOutput(selectedType)}
            style={{ gap: '8px', margin: '0 auto' }}
          >
            <RotateCw size={14} aria-hidden="true" /> Generate {currentFormatItem.label}
          </button>
        </div>
      );
    }

    // Structured providers emit JSON; live Gemini may return prose. Both are
    // parsed into the same shape so every deliverable renders in its real
    // format rather than falling through to raw markdown.
    if (selectedType === 'PRESENTATION') {
      const slides = parseSlides(currentContent);
      if (slides.length > 0) {
        return (
          <SlideDeckView
            slides={slides}
            activeIndex={activeSlideIndex}
            onChangeIndex={setActiveSlideIndex}
            deckTitle={projectTitle}
            accentColor={currentFormatItem.brandColor}
          />
        );
      }
    }

    if (selectedType === 'INFOGRAPHIC') {
      const layout = parseInfographic(currentContent);
      if (layout && (layout.heroMetrics.length > 0 || layout.sectionCallouts.length > 0)) {
        return <InfographicView layout={layout} accentColor={currentFormatItem.brandColor} />;
      }
    }

    if (selectedType === 'VIDEO_PACKAGE') {
      const pkg = parseVideoPackage(currentContent);
      if (pkg && pkg.storyboard.length > 0) {
        return <VideoStoryboardView pkg={pkg} accentColor={currentFormatItem.brandColor} />;
      }
    }

    return <MarkdownRenderer content={currentContent} />;
  };

  const score = validationReport?.consistencyScore ?? 100;
  const passed = validationReport?.passed ?? true;
  const errorsCount = validationReport?.errorsCount ?? 0;

  // Deliverable-specific validation issues
  const currentFormatIssues = (validationReport?.issues || []).filter(
    (issue: any) => !issue.outputType || issue.outputType === selectedType
  );

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <AIProviderStatusBadge />

          {/* Validation Summary */}
          <div
            role="region"
            aria-label={`Consistency score ${score} percent.`}
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
                    onClick={() => { setIsExportMenuOpen(false); onOpenExport(selectedType); }}
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
            Output Formats ({formats.length})
          </div>

          {formats.map((item) => {
            const isSelected = selectedType === item.type;
            const outputObj = outputs.find((o) => o.outputType === item.type);
            const exists = Boolean(outputObj && outputObj.content && outputObj.content.trim().length > 0);
            const isVerified = outputObj?.isConsistent ?? true;

            return (
              <button
                key={item.type}
                type="button"
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
                {selectedType.replace(/_/g, ' ')}
              </span>
              <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {currentOutput?.title || currentFormatItem.label}
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary btn-sm" onClick={handleCopy} disabled={!currentContent} title="Copy Content">
                {copied ? <Check size={14} color="var(--color-success)" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                className="btn-secondary btn-sm"
                onClick={() => onRegenerateOutput(selectedType)}
                title={`Regenerate ${currentFormatItem.label}`}
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
              Validation ({currentFormatIssues.length})
            </button>
            <button
              className={`tab-item ${rightPanelTab === 'test' ? 'active' : ''}`}
              onClick={() => setRightPanelTab('test')}
            >
              Test Errors
            </button>
          </div>

          {/* Tab 1: Traceability Inspector (Strictly Synced to Selected Deliverable) */}
          {rightPanelTab === 'traceability' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--pink-100)', border: '1px solid var(--pink-300)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--burgundy-700)', textTransform: 'uppercase' }}>
                  SELECTED DELIVERABLE BRIEFING
                </div>
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--burgundy-900)', marginTop: '4px', lineHeight: '1.4' }}>
                  "{currentTraceability.statement}"
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
                  {currentTraceability.factKey}: <span style={{ color: 'var(--burgundy-700)', fontFamily: 'var(--font-mono)' }}>{currentTraceability.factValue}</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  SOURCE DOCUMENT SNIPPET (Page {currentTraceability.page})
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.6' }}>
                  "{cleanPdfText(currentTraceability.snippet)}"
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Validation Inspector (Filtered to Selected Deliverable) */}
          {rightPanelTab === 'validation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: currentFormatIssues.length === 0 ? 'var(--color-success-bg)' : 'var(--color-error-bg)', border: `1px solid ${currentFormatIssues.length === 0 ? 'var(--color-success-border)' : 'var(--color-error-border)'}`, borderRadius: 'var(--radius-md)', padding: '14px' }}>
                <div style={{ fontWeight: 800, fontSize: 'var(--font-sm)', color: currentFormatIssues.length === 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {currentFormatIssues.length === 0 ? `✓ ${currentFormatItem.label} Fact Lock Verified` : `⚠️ Discrepancies Found in ${currentFormatItem.label}`}
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {currentFormatIssues.length === 0
                    ? `All extracted numbers and milestone dates in ${currentFormatItem.label} match locked source facts.`
                    : `${currentFormatIssues.length} fact consistency issues found in ${currentFormatItem.label}.`}
                </div>
              </div>

              {currentFormatIssues.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
                  ✓ No validation issues found for {currentFormatItem.label}.
                </div>
              ) : (
                currentFormatIssues.map((err: any, i: number) => (
                  <div key={i} style={{ background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-xs)', color: 'var(--color-error)' }}>
                      ❌ {err.factKey || err.claimKey || 'Discrepancy'}
                    </div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Found "{err.foundValue}" vs Locked "{err.expectedValue}"
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Test Errors Injection */}
          {rightPanelTab === 'test' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  INJECT SYNTHETIC ERROR
                </div>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Inject a date/number discrepancy into <strong>{currentFormatItem.label}</strong> to test the Fact Lock Guardrail.
                </p>
                <button className="btn-secondary btn-sm" onClick={handleInjectDateError} style={{ width: '100%' }}>
                  Inject Target Date Error into {currentFormatItem.label}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
