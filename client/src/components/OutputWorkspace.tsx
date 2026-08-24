import React, { useState } from 'react';
import {
  FileText,
  Share2,
  MessageSquare,
  FileCheck,
  Presentation as SlideIcon,
  PieChart,
  Video,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import type { GeneratedOutput, OutputType, ValidationReportData } from '../types';

interface OutputWorkspaceProps {
  outputs: GeneratedOutput[];
  validationReport: ValidationReportData | null;
  onAutoCorrect: () => void;
  isFixing: boolean;
}

export const OutputWorkspace: React.FC<OutputWorkspaceProps> = ({
  outputs,
  validationReport,
  onAutoCorrect,
  isFixing,
}) => {
  const [activeTab, setActiveTab] = useState<OutputType>('EXECUTIVE_SUMMARY');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const tabs: Array<{ id: OutputType; label: string; icon: any }> = [
    { id: 'EXECUTIVE_SUMMARY', label: 'Executive Summary', icon: FileText },
    { id: 'LINKEDIN_POST', label: 'LinkedIn Post', icon: Share2 },
    { id: 'X_THREAD', label: 'X Thread', icon: MessageSquare },
    { id: 'ADVISORY', label: 'Official Advisory', icon: FileCheck },
    { id: 'PRESENTATION', label: 'Presentation Deck', icon: SlideIcon },
    { id: 'INFOGRAPHIC', label: 'Infographic Layout', icon: PieChart },
    { id: 'VIDEO_PACKAGE', label: 'Video Package', icon: Video },
  ];

  const currentOutput = outputs.find((o) => o.outputType === activeTab) || outputs[0];

  const handleCopy = () => {
    if (currentOutput) {
      navigator.clipboard.writeText(currentOutput.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(outputs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'SIH2026_Generated_Content_Package.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const safeParseJSON = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Consistency Matrix Banner */}
      {validationReport && (
        <div
          className="glass-panel"
          style={{
            padding: '20px 24px',
            marginBottom: '24px',
            borderLeft: validationReport.passed
              ? '6px solid var(--accent-emerald)'
              : '6px solid var(--accent-amber)',
            background: validationReport.passed
              ? 'rgba(16, 185, 129, 0.08)'
              : 'rgba(245, 158, 11, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {validationReport.passed ? (
                <ShieldCheck size={36} color="#6ee7b7" />
              ) : (
                <ShieldAlert size={36} color="#fcd34d" />
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    Factual Consistency Score: {validationReport.consistencyScore}%
                  </h3>
                  <span
                    className={validationReport.passed ? 'badge badge-emerald' : 'badge badge-amber'}
                  >
                    {validationReport.passed ? 'Zero Fact Drift Verified' : `${validationReport.issues.length} Discrepancy Found`}
                  </span>
                  {validationReport.autoCorrected && (
                    <span className="badge badge-indigo">Auto-Corrected</span>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {validationReport.passed
                    ? 'All generated outputs match 100% of the locked dates, numbers, and entities in the Content Spine.'
                    : 'Consistency validator detected fact drift. Click below to trigger the automatic correction loop.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {!validationReport.passed && (
                <button className="btn-primary" onClick={onAutoCorrect} disabled={isFixing}>
                  <Wrench size={16} />
                  <span>{isFixing ? 'Auto-Correcting...' : 'Trigger Auto-Correction Loop'}</span>
                </button>
              )}
              <button className="btn-secondary" onClick={handleExportJSON}>
                <Download size={16} />
                <span>Export Deliverables (JSON)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Row */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '20px',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const outputObj = outputs.find((o) => o.outputType === tab.id);

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentSlideIndex(0);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                background: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.04)',
                color: isActive ? 'white' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {outputObj?.isConsistent && (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'inline-block',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Preview Card */}
      {currentOutput && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '16px',
            }}
          >
            <div>
              <span className="badge badge-indigo" style={{ marginBottom: '6px', display: 'inline-block' }}>
                Audience: {currentOutput.audienceProfile}
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{currentOutput.title}</h2>
            </div>
            <button className="btn-secondary" onClick={handleCopy}>
              {copied ? <Check size={16} color="#6ee7b7" /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Raw Text'}</span>
            </button>
          </div>

          {/* Render format-specific component views */}

          {/* 1. Presentation Deck Viewer */}
          {activeTab === 'PRESENTATION' && (
            (() => {
              const slides = safeParseJSON(currentOutput.content);
              if (Array.isArray(slides)) {
                const slide = slides[currentSlideIndex] || slides[0];
                return (
                  <div>
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
                        border: '1px solid var(--accent-primary)',
                        borderRadius: '14px',
                        padding: '40px',
                        minHeight: '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 700, marginBottom: '8px' }}>
                          SLIDE {slide.slideNumber} OF {slides.length}
                        </div>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: '20px' }}>
                          {slide.title}
                        </h3>
                        <ul style={{ paddingLeft: '24px', fontSize: '1.05rem', lineHeight: '1.8', color: '#e0e7ff' }}>
                          {slide.bulletPoints?.map((pt: string, idx: number) => (
                            <li key={idx}>{pt}</li>
                          ))}
                        </ul>
                      </div>

                      {slide.visualPrompt && (
                        <div
                          style={{
                            marginTop: '20px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            color: '#93c5fd',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          🎨 Visual Prompt: {slide.visualPrompt}
                        </div>
                      )}
                    </div>

                    {/* Speaker Notes & Carousel Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <strong>Speaker Notes:</strong> {slide.speakerNotes || 'N/A'}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-secondary"
                          onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                          disabled={currentSlideIndex === 0}
                        >
                          <ChevronLeft size={16} /> Prev Slide
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                          disabled={currentSlideIndex === slides.length - 1}
                        >
                          Next Slide <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
              return <pre style={{ whiteSpace: 'pre-wrap' }}>{currentOutput.content}</pre>;
            })()
          )}

          {/* 2. X Thread View */}
          {activeTab === 'X_THREAD' && (
            (() => {
              const parsed = safeParseJSON(currentOutput.content);
              if (parsed?.tweets && Array.isArray(parsed.tweets)) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {parsed.tweets.map((tweet: any) => (
                      <div
                        key={tweet.tweetNumber}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '16px 20px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <MessageSquare size={16} color="#38bdf8" />
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#38bdf8' }}>
                            Tweet {tweet.tweetNumber} / {parsed.tweets.length}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'white' }}>{tweet.content}</p>
                      </div>
                    ))}
                  </div>
                );
              }
              return <pre style={{ whiteSpace: 'pre-wrap' }}>{currentOutput.content}</pre>;
            })()
          )}

          {/* 3. Infographic View */}
          {activeTab === 'INFOGRAPHIC' && (
            (() => {
              const info = safeParseJSON(currentOutput.content);
              if (info?.keyStats) {
                return (
                  <div>
                    {/* Key Stats Bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                      {info.keyStats.map((stat: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15))',
                            border: '1px solid var(--accent-primary)',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                            {stat.value}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Infographic Sections */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {info.sections?.map((sec: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '18px',
                          }}
                        >
                          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '10px' }}>{sec.heading}</h4>
                          <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                            {sec.points?.map((p: string, pIdx: number) => (
                              <li key={pIdx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return <pre style={{ whiteSpace: 'pre-wrap' }}>{currentOutput.content}</pre>;
            })()
          )}

          {/* 4. Complete Video Package View */}
          {activeTab === 'VIDEO_PACKAGE' && (
            (() => {
              const video = safeParseJSON(currentOutput.content);
              if (video?.scenes) {
                return (
                  <div>
                    {/* Narration Script */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#6ee7b7', marginBottom: '6px' }}>
                        🎙️ Voiceover Script ({video.targetDurationSeconds}s Target Duration)
                      </h4>
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.6', fontStyle: 'italic' }}>{video.narrationScript}</p>
                    </div>

                    {/* Scene Storyboard */}
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>🎬 Scene Storyboard & Timestamp Breakdown</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {video.scenes.map((scene: any) => (
                        <div
                          key={scene.sceneNumber}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '120px 1fr 1fr',
                            gap: '16px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            padding: '14px',
                          }}
                        >
                          <div>
                            <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>{scene.timestampRange}</span>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '6px' }}>Scene #{scene.sceneNumber}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>VISUAL PROMPT</div>
                            <div style={{ fontSize: '0.85rem', color: '#93c5fd' }}>{scene.visualDescription}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ON-SCREEN CAPTION</div>
                            <div style={{ fontSize: '0.85rem', color: '#6ee7b7', fontWeight: 600 }}>{scene.onScreenText}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return <pre style={{ whiteSpace: 'pre-wrap' }}>{currentOutput.content}</pre>;
            })()
          )}

          {/* Default Document View (Summary, LinkedIn, Advisory) */}
          {(activeTab === 'EXECUTIVE_SUMMARY' || activeTab === 'LINKEDIN_POST' || activeTab === 'ADVISORY') && (
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '24px',
                fontFamily: activeTab === 'ADVISORY' ? 'var(--font-mono)' : 'var(--font-sans)',
                fontSize: '0.95rem',
                lineHeight: '1.7',
                whiteSpace: 'pre-wrap',
                color: 'white',
              }}
            >
              {currentOutput.content}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
