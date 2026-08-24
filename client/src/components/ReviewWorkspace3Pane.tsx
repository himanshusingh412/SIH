import React, { useState } from 'react';
import {
  FileText,
  ShieldAlert,
  Presentation,
  BarChart2,
  Video,
  CheckCircle2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  RotateCw,
  Download,
  HelpCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import type { ContentSpineData, GeneratedOutput, OutputType, ValidationReportData } from '../types';

const LinkedinIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.75a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9z"/>
  </svg>
);

const TwitterIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
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
    factKey: 'Milestone Target Date',
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
    { type: 'ADVISORY', label: 'Advisory', icon: ShieldAlert, profile: 'EXECUTIVE' },
    { type: 'PRESENTATION', label: 'Presentation', icon: Presentation, profile: 'EXECUTIVE' },
    { type: 'INFOGRAPHIC', label: 'Infographic', icon: BarChart2, profile: 'EXECUTIVE' },
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

  const renderOutputPreview = () => {
    if (!currentOutput) {
      return <div style={{ color: 'var(--text-muted)' }}>No output content generated yet.</div>;
    }

    if (selectedType === 'PRESENTATION') {
      const slides = parseJsonSafe(currentOutput.content);
      if (Array.isArray(slides)) {
        const currentSlide = slides[activeSlideIndex] || slides[0];
        return (
          <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color)' }}>
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
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px' }}
                  disabled={activeSlideIndex === slides.length - 1}
                  onClick={() => setActiveSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div style={{ background: 'var(--bg-dark)', padding: '24px', borderRadius: '10px', minHeight: '220px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', marginBottom: '16px' }}>
                {currentSlide.title}
              </h3>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', color: '#e2e8f0' }}>
                {currentSlide.bulletPoints?.map((bp: string, i: number) => (
                  <li key={i} style={{ fontSize: '0.95rem' }}>{bp}</li>
                ))}
              </ul>
            </div>

            {currentSlide.speakerNotes && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <strong>🔊 Speaker Notes:</strong> {currentSlide.speakerNotes}
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
          <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <span className="badge badge-emerald" style={{ marginBottom: '8px' }}>Infographic Spec Spec</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>{layout.header.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{layout.header.subtitle}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {layout.heroMetrics?.map((m: any, i: number) => (
                <div key={i} style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--accent-primary)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-sky)' }}>{m.value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {layout.sectionCallouts?.map((c: any, i: number) => (
                <div key={i} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 700, color: 'white', marginBottom: '4px' }}>{c.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.text}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }

    return (
      <div
        style={{
          whiteSpace: 'pre-wrap',
          fontSize: '0.92rem',
          lineHeight: '1.7',
          color: '#e2e8f0',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {currentOutput.content}
      </div>
    );
  };

  const score = validationReport?.consistencyScore ?? 100;
  const passed = validationReport?.passed ?? true;
  const errorsCount = validationReport?.errorsCount ?? 0;

  return (
    <div style={{ padding: '20px 24px', height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner Bar */}
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
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Project Transformation Workspace
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginTop: '2px' }}>
            {projectTitle || 'SIH 2026 AI Content Transformation'}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Consistency Score Gauge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: score === 100 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                border: score === 100 ? '2px solid var(--accent-emerald)' : '2px solid var(--accent-rose)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: score === 100 ? '#6ee7b7' : '#fda4af',
                fontWeight: 800,
                fontSize: '0.95rem',
              }}
            >
              {score}%
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>
                Score: {score}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Facts: {validationReport?.factsChecked || 0} Passed: {validationReport?.passedCount || 0} Errors: {errorsCount}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {errorsCount > 0 && (
              <button
                className="btn-primary"
                onClick={onAutoCorrect}
                disabled={isFixing}
                style={{ background: 'var(--accent-amber)', borderColor: 'var(--accent-amber)' }}
              >
                <Zap size={15} /> {isFixing ? 'Fixing Facts...' : 'Fix Automatically'}
              </button>
            )}
            <button className="btn-secondary" onClick={onOpenExport}>
              <Download size={15} /> Export Package
            </button>
          </div>
        </div>
      </div>

      {/* Human Review Shield Banner if Auto-Fix retries unresolved */}
      {validationReport?.humanReviewRequired && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1.5px solid var(--accent-rose)',
            borderRadius: '10px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#fda4af',
          }}
        >
          <AlertTriangle size={20} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: 'white' }}>HUMAN REVIEW REQUIRED SHIELD ACTIVE</strong>
            <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
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
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px' }}>
            Output Formats ({outputs.length})
          </div>

          {formats.map((item) => {
            const Icon = item.icon;
            const output = outputs.find((o) => o.outputType === item.type);
            const isSelected = selectedType === item.type;
            const isConsistent = output?.isConsistent ?? true;

            return (
              <div
                key={item.type}
                onClick={() => setSelectedType(item.type)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: isSelected ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.06)',
                    color: isSelected ? 'white' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} />
                </div>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? 'white' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Profile: {item.profile}
                  </div>
                </div>

                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isConsistent ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Pane 2: Center Preview & Output Actions */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <span className="badge badge-indigo" style={{ marginBottom: '4px' }}>
                {formats.find((f) => f.type === selectedType)?.label || selectedType}
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                {currentOutput?.title || `${selectedType} Output`}
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-secondary"
                onClick={() => handleInspectTraceability(currentOutput?.title || 'Deliverable Statement')}
                style={{ fontSize: '0.78rem' }}
              >
                <HelpCircle size={14} /> [Why was this generated?]
              </button>
              <button
                className="btn-secondary"
                onClick={() => onRegenerateOutput(selectedType)}
                style={{ fontSize: '0.78rem' }}
              >
                <RotateCw size={14} /> Regenerate
              </button>
              <button className="btn-secondary" onClick={handleCopy} style={{ fontSize: '0.78rem' }}>
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div style={{ flex: 1 }}>{renderOutputPreview()}</div>
        </div>

        {/* Pane 3: Right Inspector Panel (4-Tier Lineage & Validation) */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(0, 0, 0, 0.3)', padding: '4px', borderRadius: '8px' }}>
            <button
              className={`btn-secondary ${rightPanelTab === 'traceability' ? 'active' : ''}`}
              onClick={() => setRightPanelTab('traceability')}
              style={{ flex: 1, padding: '6px', fontSize: '0.72rem', justifyContent: 'center' }}
            >
              <BookOpen size={13} /> Source Trace
            </button>
            <button
              className={`btn-secondary ${rightPanelTab === 'validation' ? 'active' : ''}`}
              onClick={() => setRightPanelTab('validation')}
              style={{ flex: 1, padding: '6px', fontSize: '0.72rem', justifyContent: 'center' }}
            >
              <CheckCircle2 size={13} /> Validation
            </button>
            <button
              className={`btn-secondary ${rightPanelTab === 'test' ? 'active' : ''}`}
              onClick={() => setRightPanelTab('test')}
              style={{ flex: 1, padding: '6px', fontSize: '0.72rem', justifyContent: 'center' }}
            >
              <Zap size={13} /> Test Drift
            </button>
          </div>

          {/* Tab 1: 4-Tier Source Lineage Inspector */}
          {rightPanelTab === 'traceability' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                4-Tier Source Lineage Inspector
              </div>

              <div
                style={{
                  background: 'rgba(17, 24, 39, 0.9)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Tier 1 */}
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-sky)', textTransform: 'uppercase' }}>
                    1. Generated Statement
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'white', marginTop: '2px' }}>
                    "{activeTraceability.statement}"
                  </div>
                </div>

                <div style={{ textAlign: 'center', color: 'var(--accent-indigo)', fontSize: '0.8rem' }}>↓</div>

                {/* Tier 2 */}
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>
                    2. Content Spine Fact Node
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#a5b4fc', marginTop: '2px' }}>
                    {activeTraceability.factKey}: {activeTraceability.factValue} ({activeTraceability.category})
                  </div>
                </div>

                <div style={{ textAlign: 'center', color: 'var(--accent-indigo)', fontSize: '0.8rem' }}>↓</div>

                {/* Tier 3 */}
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
                    3. Original Source Document
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#6ee7b7', marginTop: '2px', fontWeight: 600 }}>
                    📄 {activeTraceability.sourceDoc} (Page {activeTraceability.page})
                  </div>
                </div>

                <div style={{ textAlign: 'center', color: 'var(--accent-indigo)', fontSize: '0.8rem' }}>↓</div>

                {/* Tier 4 */}
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    4. Raw Source Quote & Location
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#e2e8f0', fontStyle: 'italic', marginTop: '4px', lineHeight: '1.5' }}>
                    "{activeTraceability.snippet}"
                  </div>
                </div>
              </div>

              {/* Spine Fact Locks Quick List */}
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Content Spine Locked Facts ({spine?.factLocks?.length || 0})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                  {spine?.factLocks?.map((fact) => (
                    <div
                      key={fact.id}
                      onClick={() => handleInspectTraceability(fact.key + ': ' + fact.value, fact.key, fact.value)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontWeight: 700 }}>
                        <span>{fact.key}</span>
                        <span className="badge badge-emerald" style={{ fontSize: '0.6rem' }}>
                          Locked
                        </span>
                      </div>
                      <div style={{ color: 'var(--accent-sky)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        {fact.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Validation Issues Panel */}
          {rightPanelTab === 'validation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Validation Discrepancies ({validationReport?.issues?.length || 0})
              </div>

              {(!validationReport?.issues || validationReport.issues.length === 0) ? (
                <div
                  style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '10px',
                    color: '#6ee7b7',
                  }}
                >
                  <CheckCircle2 size={28} style={{ margin: '0 auto 8px auto' }} />
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>100% Fact Lock Consistency</div>
                  <div style={{ fontSize: '0.78rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                    Zero contradictions detected across all generated deliverable outputs.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {validationReport.issues.map((iss) => (
                    <div
                      key={iss.id}
                      style={{
                        background: iss.severity === 'CRITICAL' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        border: iss.severity === 'CRITICAL' ? '1px solid var(--accent-rose)' : '1px solid var(--accent-amber)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={iss.severity === 'CRITICAL' ? 'badge badge-rose' : 'badge badge-amber'} style={{ fontSize: '0.65rem' }}>
                          {iss.severity}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{iss.outputType}</span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: 600 }}>{iss.description}</div>

                      <div style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                        Source: <strong style={{ color: '#6ee7b7' }}>{iss.expectedValue}</strong>
                        {iss.foundValue && (
                          <>
                            {' '}
                            | Output: <strong style={{ color: '#fda4af' }}>{iss.foundValue}</strong>
                          </>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {iss.autoFixAvailable !== false && (
                          <button className="btn-primary" onClick={onAutoCorrect} disabled={isFixing} style={{ padding: '4px 8px', fontSize: '0.68rem' }}>
                            {isFixing ? '⟳ Fixing...' : '[Fix Automatically]'}
                          </button>
                        )}
                        <button className="btn-secondary" onClick={() => handleInspectTraceability(iss.description, iss.factKey, iss.expectedValue)} style={{ padding: '4px 8px', fontSize: '0.68rem' }}>
                          [View Source]
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Fact Drift Test Harness */}
          {rightPanelTab === 'test' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Fact Drift Test Harness
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', marginBottom: '4px' }}>
                  Simulate Fact Contradiction
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Inject a fact drift error into the Executive Summary to test real-time validation score drop and auto-correction.
                </p>

                <button className="btn-secondary" onClick={handleInjectDateError} style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--accent-amber)', color: '#fcd34d' }}>
                  <Zap size={14} /> Inject Fact Error (Date Mismatch)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
