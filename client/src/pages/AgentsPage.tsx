import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  Send,
  Mic,
  MicOff,
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
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import type { ContentSpineData } from '../types';
import { apiClient } from '../services/apiClient';

// ============================================================
// Web Speech API type declarations (browser-native, no package needed)
// ============================================================
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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

// ============================================================
// Active Tab: 'knowledge' = Gemini Knowledge Agent
//             'prototype' = OpenAI GPT-4o Prototype Bot
// ============================================================
type ActiveTab = 'knowledge' | 'prototype';

export const AgentsPage: React.FC<AgentsPageProps> = ({
  projectId,
  spine,
  selectedProvider = 'gemini',
  activeConversationId,
  onConversationChange,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('knowledge');

  // ── Shared input state ───────────────────────────────────
  const [query, setQuery] = useState<string>('');

  // ── Knowledge Agent state ────────────────────────────────
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | undefined>(activeConversationId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedFactId, setExpandedFactId] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    retryAfterSeconds: number;
    remainingSeconds: number;
  } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'ASSISTANT',
      content:
        'Hello! I am the **ContentSpine Knowledge Agent**.\n\nI answer questions strictly from the verified Content Spine and locked facts. Ask me anything about this project.',
      provider: selectedProvider,
      model:
        selectedProvider === 'gemini'
          ? 'gemini-3.1-flash-lite'
          : selectedProvider === 'openai'
          ? 'gpt-4o'
          : 'Demo Mode',
      grounded: true,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [testResults, setTestResults] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testError, setTestError] = useState<string | null>(null);

  // ── Prototype Agent state ────────────────────────────────
  const [protoMessages, setProtoMessages] = useState<ChatMessage[]>([
    {
      id: 'proto-welcome',
      role: 'ASSISTANT',
      content:
        "Hello! I'm the **ContentSpine AI Prototype Assistant** powered by Gemini.\n\nI know everything about the ContentSpine AI prototype — architecture, features, tech stack, Fact Lock system, Resume Studio, Knowledge Agent, database schema, deployment, and more.\n\nAsk me anything about the project!",
      provider: 'gemini',
      model: 'gemini-2.0-flash-lite',
      grounded: true,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isProtoAsking, setIsProtoAsking] = useState<boolean>(false);
  const [protoRateLimit, setProtoRateLimit] = useState<{
    retryAfterSeconds: number;
    remainingSeconds: number;
  } | null>(null);

  // ── Voice Input state ────────────────────────────────────
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceSupported, setVoiceSupported] = useState<boolean>(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // ── Chat scroll refs ─────────────────────────────────────
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const protoChatBottomRef = useRef<HTMLDivElement>(null);

  // ── Check Web Speech API support on mount ────────────────
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
    }
  }, []);

  // ── Auto-scroll chat to bottom ───────────────────────────
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAsking]);

  useEffect(() => {
    protoChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [protoMessages, isProtoAsking]);

  // ── Rate limit countdown (Knowledge Agent) ───────────────
  useEffect(() => {
    if (!rateLimitInfo || rateLimitInfo.remainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setRateLimitInfo((prev) => {
        if (!prev) return null;
        const next = prev.remainingSeconds - 1;
        return next <= 0 ? { ...prev, remainingSeconds: 0 } : { ...prev, remainingSeconds: next };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitInfo?.remainingSeconds]);

  // ── Rate limit countdown (Prototype Agent) ───────────────
  useEffect(() => {
    if (!protoRateLimit || protoRateLimit.remainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setProtoRateLimit((prev) => {
        if (!prev) return null;
        const next = prev.remainingSeconds - 1;
        return next <= 0 ? { ...prev, remainingSeconds: 0 } : { ...prev, remainingSeconds: next };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [protoRateLimit?.remainingSeconds]);

  // ── Load persistent history from Neon ───────────────────
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

  // ============================================================
  // VOICE INPUT — Web Speech API
  // ============================================================
  const startVoiceInput = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceStatus('Voice input is not supported in this browser. Try Chrome or Edge.');
      setTimeout(() => setVoiceStatus(''), 4000);
      return;
    }

    if (isListening) {
      // Stop listening
      recognitionRef.current?.stop();
      setIsListening(false);
      setVoiceStatus('');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus('🎙️ Listening… speak your question');
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Show live transcription in input field
      setQuery(finalTranscript || interimTranscript);

      if (finalTranscript) {
        setVoiceStatus('✅ Voice captured — press Send or press Enter');
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setVoiceStatus('❌ Microphone access denied. Allow microphone in browser settings.');
      } else if (event.error === 'no-speech') {
        setVoiceStatus('No speech detected. Try again.');
      } else {
        setVoiceStatus(`Voice error: ${event.error}`);
      }
      setTimeout(() => setVoiceStatus(''), 4000);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      setVoiceStatus('Could not start microphone. Please try again.');
      setTimeout(() => setVoiceStatus(''), 3000);
    }
  }, [isListening]);

  // ============================================================
  // KNOWLEDGE AGENT (Gemini)
  // ============================================================
  const lockedFacts = spine?.factLocks || spine?.dates || [];

  const handleSendQuery = async (customMessage?: string) => {
    const textToSend = customMessage || query;
    if (!textToSend.trim() || isAsking) return;

    setIsAsking(true);
    if (!customMessage) setQuery('');
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'USER',
      content: textToSend,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    if (!lockedFacts || lockedFacts.length === 0) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            role: 'ASSISTANT',
            content:
              'Not in source. No verified Content Spine facts are currently available. Please upload or ingest a source document first.',
            provider: selectedProvider,
            model: selectedProvider === 'gemini' ? 'gemini-3.1-flash-lite' : 'gpt-4o',
            grounded: true,
            sources: [],
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
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
        setRateLimitInfo(null);
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            role: 'ASSISTANT',
            content: res.answer,
            provider: res.provider || selectedProvider,
            model: res.model || 'gemini-3.1-flash-lite',
            sources: res.sources || [],
            grounded: res.grounded !== false,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error('The agent returned an empty response.');
      }
    } catch (err: any) {
      const isRateLimit = err?.code === 'GEMINI_RATE_LIMITED' || err?.statusCode === 429;
      const retryAfter = err?.retryAfterSeconds || 45;

      if (isRateLimit) {
        setRateLimitInfo({ retryAfterSeconds: retryAfter, remainingSeconds: retryAfter });
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'ASSISTANT',
            content: `🟡 **Gemini is temporarily rate-limited.**\n\nToo many requests were sent in a short period. Please try again shortly.`,
            isError: true,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'ASSISTANT',
            content: `Gemini could not answer right now. (${err.message || 'Request failed'})`,
            isError: true,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } finally {
      setIsAsking(false);
    }
  };

  const handleRegenerate = () => {
    if (isAsking || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0)) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'USER');
    if (lastUserMsg) handleSendQuery(lastUserMsg.content);
  };

  const handleRunAgentTests = async () => {
    if (isTesting || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0)) return;
    setIsTesting(true);
    setTestError(null);
    try {
      const data = await apiClient.runAgentTest(projectId || 'demo-project', undefined, undefined, selectedProvider);
      setTestResults(data);
    } catch (err: any) {
      const isRateLimit = err?.code === 'GEMINI_RATE_LIMITED' || err?.statusCode === 429;
      if (isRateLimit) {
        const retryAfter = err?.retryAfterSeconds || 45;
        setRateLimitInfo({ retryAfterSeconds: retryAfter, remainingSeconds: retryAfter });
        setTestError(`Gemini is temporarily rate-limited. Test suite paused. Retry available in ${retryAfter}s.`);
      } else {
        setTestError(err.message || 'The hallucination and fact test could not be completed.');
      }
      setTestResults(null);
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ============================================================
  // PROTOTYPE AGENT (OpenAI GPT-4o)
  // ============================================================
  const handleProtoSend = async (customMessage?: string) => {
    const textToSend = customMessage || query;
    if (!textToSend.trim() || isProtoAsking) return;

    setIsProtoAsking(true);
    if (!customMessage) setQuery('');
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMsg: ChatMessage = {
      id: `proto-user-${Date.now()}`,
      role: 'USER',
      content: textToSend,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setProtoMessages((prev) => [...prev, userMsg]);

    try {
      // Build conversation history for context (last 20 messages)
      const historyForContext = protoMessages
        .filter((m) => !m.isError)
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api')}/agents/prototype`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          conversationHistory: historyForContext,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.success === false) {
        const code = json?.error?.code;
        const retryAfter = json?.error?.retryAfterSeconds || 45;

        if (res.status === 429 || code === 'GEMINI_RATE_LIMITED') {
          setProtoRateLimit({ retryAfterSeconds: retryAfter, remainingSeconds: retryAfter });
          setProtoMessages((prev) => [
            ...prev,
            {
              id: `proto-err-${Date.now()}`,
              role: 'ASSISTANT',
              content: `🟡 **Gemini is temporarily rate-limited.**\n\nPlease wait ${retryAfter} seconds and try again.`,
              isError: true,
              createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        } else {
          setProtoMessages((prev) => [
            ...prev,
            {
              id: `proto-err-${Date.now()}`,
              role: 'ASSISTANT',
              content: `OpenAI could not respond: ${json?.error?.message || 'Unknown error'}`,
              isError: true,
              createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
        return;
      }

      const answer = json.data?.answer || json.answer;
      if (answer) {
        setProtoRateLimit(null);
        setProtoMessages((prev) => [
          ...prev,
          {
            id: `proto-asst-${Date.now()}`,
            role: 'ASSISTANT',
            content: answer,
            provider: 'gemini',
            model: json.data?.model || 'gemini-2.0-flash-lite',
            grounded: true,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      setProtoMessages((prev) => [
        ...prev,
        {
          id: `proto-err-${Date.now()}`,
          role: 'ASSISTANT',
          content: `Connection error: ${err.message || 'Could not reach server'}`,
          isError: true,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProtoAsking(false);
    }
  };

  const handleProtoRegenerate = () => {
    if (isProtoAsking || (protoRateLimit && protoRateLimit.remainingSeconds > 0)) return;
    const lastUser = [...protoMessages].reverse().find((m) => m.role === 'USER');
    if (lastUser) handleProtoSend(lastUser.content);
  };

  // ============================================================
  // SHARED SEND HANDLER (routes to active tab)
  // ============================================================
  const handleSend = () => {
    if (activeTab === 'knowledge') handleSendQuery();
    else handleProtoSend();
  };

  const isCurrentlyAsking = activeTab === 'knowledge' ? isAsking : isProtoAsking;
  const currentRateLimit = activeTab === 'knowledge' ? rateLimitInfo : protoRateLimit;

  // ============================================================
  // RENDER HELPERS
  // ============================================================
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {lines.map((line, lIdx) => {
          if (!line.trim()) return <div key={lIdx} style={{ height: '4px' }} />;
          if (line.startsWith('# '))
            return (
              <h3 key={lIdx} style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', margin: '4px 0' }}>
                {line.substring(2)}
              </h3>
            );
          if (line.startsWith('## '))
            return (
              <h4 key={lIdx} style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', margin: '4px 0' }}>
                {line.substring(3)}
              </h4>
            );
          if (line.startsWith('* ') || line.startsWith('- '))
            return (
              <div key={lIdx} style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                <span style={{ color: 'var(--accent-sky)' }}>•</span>
                <span>{parseInlineFormatting(line.substring(2))}</span>
              </div>
            );
          // Table row
          if (line.startsWith('|') && line.endsWith('|')) {
            const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1);
            if (cells.every((c) => c.trim().match(/^[-:]+$/))) return null; // separator row
            return (
              <div key={lIdx} style={{ display: 'flex', gap: '12px', fontSize: '0.82rem', fontFamily: 'monospace', color: '#cbd5e1' }}>
                {cells.map((cell, ci) => (
                  <span key={ci} style={{ flex: 1 }}>{parseInlineFormatting(cell.trim())}</span>
                ))}
              </div>
            );
          }
          return <div key={lIdx}>{parseInlineFormatting(line)}</div>;
        })}
      </div>
    );
  };

  const parseInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i} style={{ color: 'white', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={i} style={{ color: '#cbd5e1' }}>{part.slice(1, -1)}</em>;
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={i} style={{ background: 'rgba(99,102,241,0.2)', padding: '1px 5px', borderRadius: '3px', fontSize: '0.85em', color: '#a5b4fc' }}>{part.slice(1, -1)}</code>;
      return part;
    });
  };

  const renderMessageThread = (
    msgs: ChatMessage[],
    isAsking: boolean,
    rateLimit: typeof rateLimitInfo,
    onRegenerate: () => void,
    onCopy: (id: string, text: string) => void,
    scrollRef: React.RefObject<HTMLDivElement | null>
  ) => (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '6px' }}>
      {msgs.map((m) => (
        <div
          key={m.id}
          style={{ alignSelf: m.role === 'USER' ? 'flex-end' : 'flex-start', maxWidth: '88%', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <div
            style={{
              background: m.role === 'USER' ? 'rgba(99, 102, 241, 0.18)' : m.isError ? 'rgba(245, 158, 11, 0.12)' : 'rgba(18, 24, 38, 0.85)',
              border: m.role === 'USER' ? '1px solid rgba(99, 102, 241, 0.4)' : m.isError ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-color)',
              borderRadius: m.role === 'USER' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
              padding: '14px 18px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.72rem' }}>
              <div style={{ fontWeight: 700, color: m.role === 'USER' ? '#818cf8' : m.isError ? '#f59e0b' : '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {m.role === 'USER' ? 'User Question' : (
                  <>
                    <Bot size={13} /> {activeTab === 'prototype' ? 'Prototype Assistant' : 'ContentSpine Agent'}
                    {m.model && <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({m.model})</span>}
                  </>
                )}
              </div>
              <span style={{ color: 'var(--text-muted)' }}>{m.createdAt}</span>
            </div>

            <div style={{ fontSize: '0.92rem', color: m.isError ? '#fef3c7' : '#e2e8f0', lineHeight: '1.65' }}>
              {renderFormattedContent(m.content)}
            </div>

            {m.role === 'ASSISTANT' && !m.isError && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {m.sources && m.sources.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>SOURCES:</span>
                    {m.sources.map((src, sIdx) => (
                      <span key={sIdx} title={src.snippet} style={{ fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={11} /> {src.title} · Page {src.page}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: activeTab === 'prototype' ? '#a5b4fc' : '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> {activeTab === 'prototype' ? 'Prototype Context' : 'Grounded in Content Spine'}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => onCopy(m.id, m.content)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      {copiedId === m.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      {copiedId === m.id ? 'Copied' : 'Copy'}
                    </button>
                    <button onClick={onRegenerate} disabled={isAsking || Boolean(rateLimit && rateLimit.remainingSeconds > 0)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', opacity: isAsking ? 0.5 : 1 }}>
                      <RefreshCw size={11} /> Regenerate
                    </button>
                  </div>
                </div>
              </div>
            )}

            {m.isError && (
              <div style={{ marginTop: '10px' }}>
                <button className="btn-secondary" onClick={onRegenerate} disabled={isAsking || Boolean(rateLimit && rateLimit.remainingSeconds > 0)} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                  <RefreshCw size={12} /> {rateLimit && rateLimit.remainingSeconds > 0 ? `Retry in ${rateLimit.remainingSeconds}s` : 'Retry Question'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {isAsking && (
        <div style={{ alignSelf: 'flex-start', background: 'rgba(18, 24, 38, 0.8)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', fontSize: '0.85rem' }}>
          <RefreshCw size={16} className="spin" color="var(--accent-amber)" />
          {activeTab === 'prototype' ? 'Gemini is thinking...' : 'ContentSpine Agent is thinking...'}
        </div>
      )}
      <div ref={scrollRef} />
    </div>
  );

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
      {/* Left Column: Chat Window */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 120px)' }}>
        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('knowledge')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'knowledge' ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--border-color)',
              background: activeTab === 'knowledge' ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: activeTab === 'knowledge' ? '#818cf8' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <MessageSquare size={14} />
            Knowledge Agent
            <span style={{ fontSize: '0.68rem', background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '1px 5px', borderRadius: '4px' }}>Gemini</span>
          </button>

          <button
            onClick={() => setActiveTab('prototype')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'prototype' ? '1px solid rgba(16,185,129,0.5)' : '1px solid var(--border-color)',
              background: activeTab === 'prototype' ? 'rgba(16,185,129,0.12)' : 'transparent',
              color: activeTab === 'prototype' ? '#34d399' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Sparkles size={14} />
            Prototype Assistant
            <span style={{ fontSize: '0.68rem', background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '1px 5px', borderRadius: '4px' }}>Gemini</span>
          </button>

          {/* Voice Query button — top right */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {voiceStatus && (
              <span style={{ fontSize: '0.75rem', color: isListening ? '#34d399' : '#fcd34d', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {voiceStatus}
              </span>
            )}
            <button
              className={isListening ? 'btn-primary' : 'btn-secondary'}
              onClick={startVoiceInput}
              title={voiceSupported ? (isListening ? 'Stop listening' : 'Start voice input') : 'Voice not supported in this browser'}
              style={{
                fontSize: '0.8rem',
                background: isListening ? 'rgba(239, 68, 68, 0.2)' : undefined,
                border: isListening ? '1px solid rgba(239, 68, 68, 0.5)' : undefined,
                animation: isListening ? 'pulse 1.5s infinite' : undefined,
              }}
            >
              {isListening ? <MicOff size={15} color="#f87171" /> : <Mic size={15} color={voiceSupported ? 'var(--accent-rose)' : 'var(--text-muted)'} />}
              {isListening ? 'Stop' : 'Voice Query'}
            </button>
          </div>
        </div>

        {/* Tab Header Info */}
        {activeTab === 'knowledge' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={20} color="var(--accent-indigo)" />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>Knowledge &amp; Q&amp;A Assistant</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={11} color="#38bdf8" />
                {selectedProvider === 'gemini' ? 'Gemini 3.1 Flash Lite' : selectedProvider === 'openai' ? 'GPT-4o' : 'Demo Mode'} · Answers from locked Content Spine facts only
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#a78bfa" />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>ContentSpine AI Prototype Assistant</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={11} color="#34d399" />
                Gemini gemini-2.0-flash-lite · Full prototype knowledge — architecture, features, tech stack, deployment
              </div>
            </div>
          </div>
        )}

        {/* Rate Limit Banner */}
        {currentRateLimit && (
          <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '10px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px', color: '#fef3c7', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, fontSize: '0.95rem', color: '#f59e0b' }}>
              <AlertTriangle size={20} />
              <span>🟡 Gemini is temporarily rate-limited.</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: '#fcd34d', fontWeight: 700 }}>
                {currentRateLimit.remainingSeconds > 0 ? `Retry available in ${currentRateLimit.remainingSeconds}s` : 'Retry is now available!'}
              </span>
              <button className="btn-secondary" onClick={activeTab === 'knowledge' ? handleRegenerate : handleProtoRegenerate} disabled={isCurrentlyAsking || currentRateLimit.remainingSeconds > 0} style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, opacity: currentRateLimit.remainingSeconds > 0 ? 0.5 : 1, cursor: currentRateLimit.remainingSeconds > 0 ? 'not-allowed' : 'pointer' }}>
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          </div>
        )}

        {/* Message Thread */}
        {activeTab === 'knowledge'
          ? renderMessageThread(messages, isAsking, rateLimitInfo, handleRegenerate, handleCopy, chatBottomRef)
          : renderMessageThread(protoMessages, isProtoAsking, protoRateLimit, handleProtoRegenerate, handleCopy, protoChatBottomRef)}

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px', alignItems: 'center' }}>
          {/* Mic button in input bar */}
          <button
            onClick={startVoiceInput}
            title={voiceSupported ? (isListening ? 'Stop' : 'Speak your question') : 'Voice not supported'}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              border: isListening ? '1px solid rgba(239,68,68,0.6)' : '1px solid var(--border-color)',
              background: isListening ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.3)',
              cursor: voiceSupported ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            {isListening
              ? <MicOff size={18} color="#f87171" />
              : <Mic size={18} color={voiceSupported ? 'var(--accent-rose)' : 'var(--text-muted)'} />}
          </button>

          <input
            type="text"
            placeholder={
              isListening
                ? '🎙️ Listening… speak now'
                : activeTab === 'knowledge'
                ? 'Ask a question strictly anchored to verified Content Spine facts...'
                : 'Ask anything about the ContentSpine AI prototype...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isCurrentlyAsking && handleSend()}
            disabled={isCurrentlyAsking || Boolean(currentRateLimit && currentRateLimit.remainingSeconds > 0)}
            style={{
              flex: 1,
              background: isListening ? 'rgba(16,185,129,0.08)' : 'rgba(0, 0, 0, 0.4)',
              border: isListening ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: 'white',
              fontSize: '0.9rem',
              outline: 'none',
              opacity: isCurrentlyAsking || (currentRateLimit && currentRateLimit.remainingSeconds > 0) ? 0.6 : 1,
              transition: 'border-color 0.2s ease, background 0.2s ease',
            }}
          />
          <button
            className="btn-primary"
            onClick={handleSend}
            disabled={isCurrentlyAsking || !query.trim() || Boolean(currentRateLimit && currentRateLimit.remainingSeconds > 0)}
            style={{
              padding: '0 20px',
              height: '44px',
              opacity: isCurrentlyAsking || !query.trim() || (currentRateLimit && currentRateLimit.remainingSeconds > 0) ? 0.5 : 1,
              cursor: isCurrentlyAsking || !query.trim() || (currentRateLimit && currentRateLimit.remainingSeconds > 0) ? 'not-allowed' : 'pointer',
              background: activeTab === 'prototype' ? 'linear-gradient(135deg, rgba(16,185,129,0.8), rgba(52,211,153,0.7))' : undefined,
            }}
          >
            <Send size={16} /> Send
          </button>
        </div>
      </div>

      {/* Right Column: Guardrails & Facts Panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
        {activeTab === 'knowledge' ? (
          <>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white', textTransform: 'uppercase' }}>
              Agent Guardrails &amp; Testing
            </h4>

            {/* Guardrail Status */}
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6ee7b7', fontWeight: 700, fontSize: '0.85rem' }}>
                <ShieldCheck size={18} /> 🟢 Source-Only Guardrail Active
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                The agent is strictly locked to Content Spine facts. Unsupported questions trigger explicit <strong>"Not in source."</strong> responses without external speculation.
              </div>
            </div>

            {/* Knowledge Facts */}
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
                      <div key={f.id} onClick={() => setExpandedFactId(isExpanded ? null : f.id)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px', fontSize: '0.76rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: '#e2e8f0' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            🔒 <strong>{f.key || f.factKey}:</strong> {f.value || f.factValue}
                          </span>
                          {isExpanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                        </div>
                        {isExpanded && (
                          <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.1)', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>📄 <strong>Source:</strong> {ref?.sourceDocument?.originalFilename || 'SIH 2026 Technical Report'}</div>
                            <div>📖 <strong>Page:</strong> {ref?.pageNumber || 1}</div>
                            <div>💬 <strong>Snippet:</strong> "{ref?.sourceSnippet || f.value || f.factValue}"</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Automated Test Harness */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontWeight: 800, color: 'white', fontSize: '0.85rem' }}>Automated Guardrail Test Harness</div>

              <button className="btn-secondary" onClick={handleRunAgentTests} disabled={isTesting || Boolean(rateLimitInfo && rateLimitInfo.remainingSeconds > 0)} style={{ justifyContent: 'center', fontWeight: 700, padding: '10px', opacity: isTesting || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0) ? 0.5 : 1, cursor: isTesting || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0) ? 'not-allowed' : 'pointer' }}>
                {isTesting ? <><RefreshCw size={14} className="spin" color="var(--accent-amber)" /> Running Sequential Test Harness...</> : <><Zap size={14} color="var(--accent-amber)" /> Run Hallucination &amp; Fact Test</>}
              </button>

              {testError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fca5a5', fontWeight: 700, fontSize: '0.82rem' }}>
                    <AlertTriangle size={16} /> Agent test could not be completed.
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>{testError}</div>
                  <button className="btn-secondary" onClick={handleRunAgentTests} disabled={isTesting || Boolean(rateLimitInfo && rateLimitInfo.remainingSeconds > 0)} style={{ fontSize: '0.78rem', justifyContent: 'center', marginTop: '4px' }}>
                    <RefreshCw size={12} /> Retry Test
                  </button>
                </div>
              )}

              {testResults && (
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                    <span style={{ color: '#6ee7b7', fontWeight: 800, fontSize: '0.88rem' }}>Pass Rate: {testResults.summary?.passRate || testResults.passRate}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{testResults.summary?.passed ?? testResults.passed}/{testResults.summary?.total ?? testResults.total} Passed</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                    {(testResults.tests || testResults.results || []).map((t: any, idx: number) => {
                      const isPassed = t.status === 'passed' || t.passed === true;
                      const isRateLimit = t.status === 'rate_limited';
                      return (
                        <div key={t.id || idx} style={{ background: isPassed ? 'rgba(16,185,129,0.06)' : isRateLimit ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)', padding: '8px 10px', borderRadius: '6px', border: isPassed ? '1px solid rgba(16,185,129,0.25)' : isRateLimit ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(239,68,68,0.3)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, marginBottom: '4px' }}>
                            <span style={{ color: isPassed ? '#6ee7b7' : isRateLimit ? '#f59e0b' : '#fca5a5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {isPassed ? <CheckCircle2 size={13} /> : isRateLimit ? <AlertTriangle size={13} /> : <XCircle size={13} />}
                              {t.name || `Scenario #${idx + 1}`}
                            </span>
                            <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: isPassed ? 'rgba(16,185,129,0.2)' : isRateLimit ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', color: isPassed ? '#6ee7b7' : isRateLimit ? '#fcd34d' : '#fca5a5' }}>
                              {(t.status || (isPassed ? 'passed' : 'failed')).toUpperCase()}
                            </span>
                          </div>
                          <div style={{ color: '#cbd5e1', fontSize: '0.72rem' }}><strong>Query:</strong> "{t.query || t.inputQuery}"</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>{t.details || `Expected: "${t.expected || t.expectedAns}"`}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Prototype Assistant Right Panel */
          <>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white', textTransform: 'uppercase' }}>
              Prototype Knowledge Base
            </h4>

            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, fontSize: '0.85rem' }}>
                <Sparkles size={18} /> Gemini gemini-2.0-flash-lite Powered
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                This assistant is pre-loaded with full ContentSpine AI prototype knowledge. Ask about architecture, features, tech stack, database schema, API endpoints, deployment, and more.
              </div>
            </div>

            {/* Quick Question Chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Quick Questions</div>
              {[
                'What is ContentSpine AI?',
                'How does the Fact Lock system work?',
                'Tell me about the ATS Scanner',
                'What is the tech stack?',
                'How is it deployed?',
                'What AI models does it use?',
                'What are the key innovations?',
                'What is not yet implemented?',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setQuery(q);
                    handleProtoSend(q);
                  }}
                  disabled={isProtoAsking || Boolean(protoRateLimit && protoRateLimit.remainingSeconds > 0)}
                  style={{
                    textAlign: 'left',
                    background: 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '0.75rem',
                    color: '#6ee7b7',
                    cursor: isProtoAsking ? 'not-allowed' : 'pointer',
                    opacity: isProtoAsking ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  → {q}
                </button>
              ))}
            </div>

            {/* Voice Info */}
            <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '8px', padding: '12px', fontSize: '0.75rem', color: '#7dd3fc', lineHeight: '1.4', marginTop: 'auto' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>🎙️ Voice Input {voiceSupported ? 'Available' : 'Not Supported'}</div>
              {voiceSupported
                ? 'Click the microphone button or "Voice Query" to speak your question. Chrome and Edge are supported.'
                : 'Voice input requires Chrome or Edge browser with microphone access.'}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
