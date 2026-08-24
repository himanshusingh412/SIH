import React, { useState, useEffect } from 'react';
import {
  Bot,
  Send,
  Mic,
  ShieldCheck,
  RefreshCw,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react';
import type { ContentSpineData } from '../types';
import { apiClient } from '../services/apiClient';

interface AgentsPageProps {
  projectId: string;
  spine: ContentSpineData | null;
  selectedProvider?: string;
  activeConversationId?: string;
  onConversationChange?: (id: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  provider?: string;
  model?: string;
  sources?: Array<{ documentId: string; page: number; title: string; snippet: string }>;
  grounded?: boolean;
  isError?: boolean;
  createdAt: string;
}

export const AgentsPage: React.FC<AgentsPageProps> = ({
  projectId,
  spine,
  selectedProvider = 'gemini',
  activeConversationId,
  onConversationChange,
}) => {
  const [query, setQuery] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | undefined>(activeConversationId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedFactId, setExpandedFactId] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<boolean>(false);

  // Load persistent history from Neon PostgreSQL (Requirements 14, 18, 37, 38)
  useEffect(() => {
    if (activeConversationId) {
      setConversationId(activeConversationId);
      loadConversationHistory(activeConversationId);
    } else {
      loadMostRecentConversation();
    }
  }, [activeConversationId, projectId]);

  const loadMostRecentConversation = async () => {
    try {
      const list = await apiClient.getConversations(projectId || 'demo-project');
      if (list && list.length > 0) {
        setConversationId(list[0].id);
        if (onConversationChange) onConversationChange(list[0].id);
        loadConversationHistory(list[0].id);
      }
    } catch {
      // Keep welcome state if no history exists yet
    }
  };

  const loadConversationHistory = async (convId: string) => {
    try {
      const data = await apiClient.getConversation(convId);
      if (data && data.messages && data.messages.length > 0) {
        const mapped: ChatMessage[] = data.messages.map((m) => ({
          id: m.id,
          role: m.role as 'USER' | 'ASSISTANT',
          content: m.content,
          provider: m.provider || selectedProvider,
          model: m.model || (selectedProvider === 'gemini' ? 'gemini-3.1-flash-lite' : 'gpt-4o'),
          sources: m.sources || [],
          grounded: m.grounded !== false,
          isError: m.isError || false,
          createdAt: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(mapped);
      }
    } catch (err) {
      console.warn('Could not load conversation history from Neon:', err);
    }
  };

  // Rate limit state & countdown tracker (Requirements 4, 7, 16)
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    retryAfterSeconds: number;
    remainingSeconds: number;
  } | null>(null);

  // Live countdown timer for rate-limit window
  useEffect(() => {
    if (!rateLimitInfo || rateLimitInfo.remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRateLimitInfo((prev) => {
        if (!prev) return null;
        const next = prev.remainingSeconds - 1;
        if (next <= 0) {
          return { ...prev, remainingSeconds: 0 };
        }
        return { ...prev, remainingSeconds: next };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitInfo?.remainingSeconds]);

  // Requirement 9 & 10: Static greeting message initialized without consuming Gemini quota on mount
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'ASSISTANT',
      content:
        'Hello! I am the **ContentSpine Knowledge Agent**.\n\nI answer questions strictly from the verified Content Spine and locked facts. Ask me anything about this project.',
      provider: selectedProvider,
      model: selectedProvider === 'gemini' ? 'gemini-3.1-flash-lite' : selectedProvider === 'openai' ? 'gpt-4o' : 'Demo Mode',
      grounded: true,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [testResults, setTestResults] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testError, setTestError] = useState<string | null>(null);

  const lockedFacts = spine?.factLocks || spine?.dates || [];

  const handleSendQuery = async (customMessage?: string) => {
    const textToSend = customMessage || query;
    if (!textToSend.trim() || isAsking) return;

    // Requirement 8: Single-flight request lock
    setIsAsking(true);
    if (!customMessage) {
      setQuery('');
    }

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'USER',
      content: textToSend,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Requirement 22 & 23: DO NOT call Gemini if Knowledge Facts = 0
    if (!lockedFacts || lockedFacts.length === 0) {
      setTimeout(() => {
        const noFactMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: 'ASSISTANT',
          content: 'Not in source. No verified Content Spine facts are currently available. Please upload or ingest a source document first.',
          provider: selectedProvider,
          model: selectedProvider === 'gemini' ? 'gemini-3.1-flash-lite' : selectedProvider === 'openai' ? 'gpt-4o' : 'Demo Mode',
          grounded: true,
          sources: [],
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, noFactMsg]);
        setIsAsking(false);
      }, 200);
      return;
    }

    try {
      const res = await apiClient.askKnowledgeAgent(
        projectId || 'demo-project',
        textToSend,
        conversationId,
        selectedProvider
      );

      if (res && res.answer) {
        if (res.conversationId) {
          setConversationId(res.conversationId);
          if (onConversationChange) onConversationChange(res.conversationId);
        }

        // Successful request clears any previous rate limit state
        setRateLimitInfo(null);

        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: 'ASSISTANT',
          content: res.answer,
          provider: res.provider || selectedProvider,
          model: res.model || (selectedProvider === 'gemini' ? 'gemini-3.1-flash-lite' : 'gpt-4o'),
          sources: res.sources || [],
          grounded: res.grounded !== false,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('The agent returned an empty response.');
      }
    } catch (err: any) {
      const isRateLimit = err?.code === 'GEMINI_RATE_LIMITED' || err?.statusCode === 429;
      const retryAfter = err?.retryAfterSeconds || 45;

      if (isRateLimit) {
        setRateLimitInfo({
          retryAfterSeconds: retryAfter,
          remainingSeconds: retryAfter,
        });

        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'ASSISTANT',
          content: `🟡 **Gemini is temporarily rate-limited.**\n\nToo many requests were sent in a short period. Please try again shortly.`,
          isError: true,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'ASSISTANT',
          content: `Gemini could not answer right now. (${err.message || 'Request failed'})`,
          isError: true,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsAsking(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = () => {
    if (isAsking || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0)) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'USER');
    if (lastUserMsg) {
      handleSendQuery(lastUserMsg.content);
    }
  };

  const handleVoiceAsk = () => {
    setVoiceNotice(true);
    setTimeout(() => setVoiceNotice(false), 4000);
  };

  // Requirement 12: Sequential test execution with rate limit awareness
  const handleRunAgentTests = async () => {
    if (isTesting || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0)) return;
    setIsTesting(true);
    setTestError(null);
    try {
      const data = await apiClient.runAgentTest(projectId || 'demo-project', undefined, undefined, selectedProvider);
      setTestResults(data);
    } catch (err: any) {
      console.error('❌ Agent Test UI Error:', err);
      const isRateLimit = err?.code === 'GEMINI_RATE_LIMITED' || err?.statusCode === 429;
      if (isRateLimit) {
        const retryAfter = err?.retryAfterSeconds || 45;
        setRateLimitInfo({
          retryAfterSeconds: retryAfter,
          remainingSeconds: retryAfter,
        });
        setTestError(`Gemini is temporarily rate-limited. Test suite paused. Retry available in ${retryAfter}s.`);
      } else {
        setTestError(err.message || 'The hallucination and fact test could not be completed.');
      }
      setTestResults(null);
    } finally {
      setIsTesting(false);
    }
  };

  // Helper to format simple markdown text
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {lines.map((line, lIdx) => {
          if (!line.trim()) return <div key={lIdx} style={{ height: '4px' }} />;

          if (line.startsWith('# ')) {
            return (
              <h3 key={lIdx} style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', margin: '4px 0' }}>
                {line.substring(2)}
              </h3>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h4 key={lIdx} style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', margin: '4px 0' }}>
                {line.substring(3)}
              </h4>
            );
          }

          if (line.startsWith('* ') || line.startsWith('- ')) {
            return (
              <div key={lIdx} style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                <span style={{ color: 'var(--accent-sky)' }}>•</span>
                <span>{parseInlineFormatting(line.substring(2))}</span>
              </div>
            );
          }

          return <div key={lIdx}>{parseInlineFormatting(line)}</div>;
        })}
      </div>
    );
  };

  const parseInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'white', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} style={{ color: '#cbd5e1' }}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
      {/* Left Column: Chat Window */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 120px)' }}>
        {/* Chat Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-indigo">ContentSpine Knowledge Agent</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={12} color="#38bdf8" /> {selectedProvider === 'gemini' ? 'Gemini 3.1 Flash Lite' : selectedProvider === 'openai' ? 'GPT-4o' : 'Demo Mode'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={22} color="var(--accent-indigo)" /> Knowledge & Q&A Assistant
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn-secondary" onClick={handleVoiceAsk} style={{ fontSize: '0.8rem' }}>
              <Mic size={15} color="var(--accent-rose)" /> Voice Query
            </button>
          </div>
        </div>

        {/* Voice Notice Alert Banner */}
        {voiceNotice && (
          <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', color: '#fcd34d', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} /> Voice input is not configured. Please use typed text queries.
          </div>
        )}

        {/* Friendly Rate Limit Banner Card (Requirement 3, 4, 7, 16) */}
        {rateLimitInfo && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '10px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              color: '#fef3c7',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, fontSize: '0.95rem', color: '#f59e0b' }}>
              <AlertTriangle size={20} />
              <span>🟡 Gemini is temporarily rate-limited.</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.45' }}>
              Too many requests were sent in a short period. Please try again shortly.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '0.82rem', color: '#fcd34d', fontWeight: 700 }}>
                {rateLimitInfo.remainingSeconds > 0
                  ? `Retry available in ${rateLimitInfo.remainingSeconds}s`
                  : 'Retry is now available!'}
              </span>

              <button
                className="btn-secondary"
                onClick={handleRegenerate}
                disabled={isAsking || rateLimitInfo.remainingSeconds > 0}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  opacity: isAsking || rateLimitInfo.remainingSeconds > 0 ? 0.5 : 1,
                  cursor: isAsking || rateLimitInfo.remainingSeconds > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <RefreshCw size={13} className={isAsking ? 'spin' : ''} /> Retry
              </button>
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '6px' }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                alignSelf: m.role === 'USER' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Message Bubble */}
              <div
                style={{
                  background: m.role === 'USER' ? 'rgba(99, 102, 241, 0.18)' : m.isError ? 'rgba(245, 158, 11, 0.12)' : 'rgba(18, 24, 38, 0.85)',
                  border: m.role === 'USER' ? '1px solid rgba(99, 102, 241, 0.4)' : m.isError ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-color)',
                  borderRadius: m.role === 'USER' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  padding: '14px 18px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                }}
              >
                {/* Message Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.72rem' }}>
                  <div style={{ fontWeight: 700, color: m.role === 'USER' ? '#818cf8' : m.isError ? '#f59e0b' : '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {m.role === 'USER' ? (
                      'User Question'
                    ) : (
                      <>
                        <Bot size={13} /> ContentSpine Agent
                        {m.model && <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({m.model})</span>}
                      </>
                    )}
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>{m.createdAt}</span>
                </div>

                {/* Body Content */}
                <div style={{ fontSize: '0.92rem', color: m.isError ? '#fef3c7' : '#e2e8f0', lineHeight: '1.65' }}>
                  {renderFormattedContent(m.content)}
                </div>

                {/* Sources & Grounding Citations */}
                {m.role === 'ASSISTANT' && !m.isError && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {m.sources && m.sources.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>SOURCES:</span>
                        {m.sources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            title={src.snippet}
                            style={{
                              fontSize: '0.7rem',
                              background: 'rgba(56, 189, 248, 0.12)',
                              color: '#38bdf8',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <FileText size={11} /> {src.title} · Page {src.page}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} color="#10b981" /> Grounded in Content Spine
                      </span>

                      {/* Utility Action Buttons: Copy & Regenerate */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleCopy(m.id, m.content)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          {copiedId === m.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          {copiedId === m.id ? 'Copied' : 'Copy'}
                        </button>

                        <button
                          onClick={handleRegenerate}
                          disabled={isAsking || Boolean(rateLimitInfo && rateLimitInfo.remainingSeconds > 0)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '0.7rem',
                            cursor: isAsking || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0) ? 'not-allowed' : 'pointer',
                            opacity: isAsking || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0) ? 0.5 : 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <RefreshCw size={11} /> Regenerate
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Retry Button */}
                {m.isError && (
                  <div style={{ marginTop: '10px' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => handleRegenerate()}
                      disabled={isAsking || Boolean(rateLimitInfo && rateLimitInfo.remainingSeconds > 0)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '4px 10px',
                        opacity: isAsking || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0) ? 0.5 : 1,
                        cursor: isAsking || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <RefreshCw size={12} /> {rateLimitInfo && rateLimitInfo.remainingSeconds > 0 ? `Retry in ${rateLimitInfo.remainingSeconds}s` : 'Retry Question'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking State Indicator */}
          {isAsking && (
            <div style={{ alignSelf: 'flex-start', background: 'rgba(18, 24, 38, 0.8)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', fontSize: '0.85rem' }}>
              <RefreshCw size={16} className="spin" color="var(--accent-amber)" /> ContentSpine Agent is thinking...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
          <input
            type="text"
            placeholder="Ask a question strictly anchored to verified Content Spine facts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isAsking && handleSendQuery()}
            disabled={isAsking || Boolean(rateLimitInfo && rateLimitInfo.remainingSeconds > 0)}
            style={{
              flex: 1,
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: 'white',
              fontSize: '0.9rem',
              outline: 'none',
              opacity: isAsking || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0) ? 0.6 : 1,
            }}
          />
          <button
            className="btn-primary"
            onClick={() => handleSendQuery()}
            disabled={isAsking || !query.trim() || Boolean(rateLimitInfo && rateLimitInfo.remainingSeconds > 0)}
            style={{
              padding: '0 20px',
              height: '44px',
              opacity: isAsking || !query.trim() || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0) ? 0.5 : 1,
              cursor: isAsking || !query.trim() || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0) ? 'not-allowed' : 'pointer',
            }}
          >
            <Send size={16} /> Send
          </button>
        </div>
      </div>

      {/* Right Column: Guardrails & Facts Knowledge Base */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white', textTransform: 'uppercase' }}>
          Agent Guardrails & Testing
        </h4>

        {/* Guardrail Status Card */}
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6ee7b7', fontWeight: 700, fontSize: '0.85rem' }}>
            <ShieldCheck size={18} /> 🟢 Source-Only Guardrail Active
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            The agent is strictly locked to Content Spine facts. Unsupported questions trigger explicit <strong>"Not in source."</strong> responses without external speculation.
          </div>
        </div>

        {/* Knowledge Facts Dynamic Panel */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Knowledge Facts ({lockedFacts.length})</span>
            <span style={{ fontSize: '0.68rem', color: '#10b981' }}>Verified SOT</span>
          </div>

          {lockedFacts.length === 0 ? (
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px dashed rgba(245, 158, 11, 0.3)', padding: '12px', borderRadius: '6px', fontSize: '0.75rem', color: '#fcd34d', lineHeight: '1.4' }}>
              ⚠️ No verified Content Spine facts are available. Upload or ingest a source document first.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
              {lockedFacts.map((f: any) => {
                const isExpanded = expandedFactId === f.id;
                const ref = f.sourceSnippet ? f : f.references?.[0];
                return (
                  <div
                    key={f.id}
                    onClick={() => setExpandedFactId(isExpanded ? null : f.id)}
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: '#e2e8f0' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🔒 <strong>{f.key || f.factKey}:</strong> {f.value || f.factValue}
                      </span>
                      {isExpanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div>📄 <strong>Source:</strong> {ref?.sourceDocument?.originalFilename || ref?.sourceDocument?.title || 'SIH 2026 Technical Report'}</div>
                        <div>📖 <strong>Page:</strong> {ref?.pageNumber || 1}</div>
                        <div>💬 <strong>Original Snippet:</strong> "{ref?.sourceSnippet || ref?.snippetText || f.value || f.factValue}"</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Automated Guardrail Test Harness */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontWeight: 800, color: 'white', fontSize: '0.85rem' }}>
            Automated Guardrail Test Harness
          </div>

          <button
            className="btn-secondary"
            onClick={handleRunAgentTests}
            disabled={isTesting || Boolean(rateLimitInfo && rateLimitInfo.remainingSeconds > 0)}
            style={{
              justifyContent: 'center',
              fontWeight: 700,
              padding: '10px',
              opacity: isTesting || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0) ? 0.5 : 1,
              cursor: isTesting || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0) ? 'not-allowed' : 'pointer',
            }}
          >
            {isTesting ? (
              <>
                <RefreshCw size={14} className="spin" color="var(--accent-amber)" /> Running Sequential Test Harness...
              </>
            ) : (
              <>
                <Zap size={14} color="var(--accent-amber)" /> Run Hallucination & Fact Test
              </>
            )}
          </button>

          {/* Test Error State Card */}
          {testError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fca5a5', fontWeight: 700, fontSize: '0.82rem' }}>
                <AlertTriangle size={16} /> Agent test could not be completed.
              </div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                {testError}
              </div>
              <button
                className="btn-secondary"
                onClick={handleRunAgentTests}
                disabled={isTesting || Boolean(rateLimitInfo && rateLimitInfo.remainingSeconds > 0)}
                style={{ fontSize: '0.78rem', justifyContent: 'center', marginTop: '4px' }}
              >
                <RefreshCw size={12} /> Retry Test
              </button>
            </div>
          )}

          {/* Structured Test Results UI */}
          {testResults && (
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                <span style={{ color: '#6ee7b7', fontWeight: 800, fontSize: '0.88rem' }}>
                  Pass Rate: {testResults.summary?.passRate || testResults.passRate}
                </span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                  {testResults.summary?.passed ?? testResults.passed}/{testResults.summary?.total ?? testResults.total} Passed
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                {(testResults.tests || testResults.results || []).map((t: any, idx: number) => {
                  const isPassed = t.status === 'passed' || t.passed === true;
                  const isRateLimit = t.status === 'rate_limited';
                  return (
                    <div
                      key={t.id || idx}
                      style={{
                        background: isPassed ? 'rgba(16, 185, 129, 0.06)' : isRateLimit ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: isPassed ? '1px solid rgba(16, 185, 129, 0.25)' : isRateLimit ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, marginBottom: '4px' }}>
                        <span style={{ color: isPassed ? '#6ee7b7' : isRateLimit ? '#f59e0b' : '#fca5a5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isPassed ? <CheckCircle2 size={13} /> : isRateLimit ? <AlertTriangle size={13} /> : <XCircle size={13} />}
                          {t.name || `Scenario #${idx + 1}`}
                        </span>
                        <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: isPassed ? 'rgba(16,185,129,0.2)' : isRateLimit ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', color: isPassed ? '#6ee7b7' : isRateLimit ? '#fcd34d' : '#fca5a5' }}>
                          {(t.status || (isPassed ? 'passed' : 'failed')).toUpperCase()}
                        </span>
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>
                        <strong>Query:</strong> "{t.query || t.inputQuery}"
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>
                        {t.details || `Expected: "${t.expected || t.expectedAns}"`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
