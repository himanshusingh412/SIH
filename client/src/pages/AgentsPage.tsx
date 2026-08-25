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
      const list = await apiClient.getConversations(projectId);
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
              <h3 key={lIdx} style={{ fontSize: '1.05rem', fontWeight: 800, color: '#3D1324', margin: '4px 0' }}>
                {line.substring(2)}
              </h3>
            );
          if (line.startsWith('## '))
            return (
              <h4 key={lIdx} style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3D1324', margin: '4px 0' }}>
                {line.substring(3)}
              </h4>
            );
          if (line.startsWith('* ') || line.startsWith('- '))
            return (
              <div key={lIdx} style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                <span style={{ color: '#7A173D', fontWeight: 700 }}>•</span>
                <span>{parseInlineFormatting(line.substring(2))}</span>
              </div>
            );
          // Table row
          if (line.startsWith('|') && line.endsWith('|')) {
            const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1);
            if (cells.every((c) => c.trim().match(/^[-:]+$/))) return null; // separator row
            return (
              <div key={lIdx} style={{ display: 'flex', gap: '12px', fontSize: '0.82rem', fontFamily: 'monospace', color: '#5A2639' }}>
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
        return <strong key={i} style={{ color: '#3D1324', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={i} style={{ color: '#5A2639' }}>{part.slice(1, -1)}</em>;
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={i} style={{ background: '#F8E8EE', border: '1px solid #E9C9D5', padding: '1px 5px', borderRadius: '3px', fontSize: '0.85em', color: '#7A173D' }}>{part.slice(1, -1)}</code>;
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
      {msgs.map((m) => {
        const isUser = m.role === 'USER';
        const isNotInSource = m.content.includes('Not in source.');

        let bubbleBg = isUser ? '#F8E8EE' : m.isError ? '#FDECEC' : isNotInSource ? '#FFF8FA' : '#FFFFFF';
        let bubbleBorder = isUser ? '1px solid #E9C9D5' : m.isError ? '1px solid #F5C6CB' : '1px solid #E9C9D5';
        let bubbleTextColor = m.isError ? '#C62828' : '#3D1324';

        return (
          <div
            key={m.id}
            style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '88%', display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <div
              style={{
                background: bubbleBg,
                border: bubbleBorder,
                borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                padding: '14px 18px',
                boxShadow: '0 2px 8px rgba(61, 19, 36, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.72rem' }}>
                <div style={{ fontWeight: 700, color: '#7A173D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isUser ? (
                    <span style={{ color: '#7A173D', fontWeight: 700 }}>User Question</span>
                  ) : (
                    <>
                      {activeTab === 'prototype' ? <Sparkles size={13} color="#7A173D" /> : <Bot size={13} color="#7A173D" />}
                      <span style={{ color: '#7A173D', fontWeight: 700 }}>{activeTab === 'prototype' ? 'ContentSpine Prototype Assistant' : 'ContentSpine Knowledge Agent'}</span>
                      {m.model && <span style={{ color: '#8A6875', fontWeight: 500 }}>({m.model})</span>}
                    </>
                  )}
                </div>
                <span style={{ color: '#8A6875' }}>{m.createdAt}</span>
              </div>

              <div style={{ fontSize: '0.92rem', color: bubbleTextColor, lineHeight: '1.65' }}>
                {renderFormattedContent(m.content)}
              </div>

              {m.role === 'ASSISTANT' && !m.isError && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #E9C9D5', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {m.sources && m.sources.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: '#8A6875', fontWeight: 700 }}>SOURCES:</span>
                      {m.sources.map((src, sIdx) => (
                        <span key={sIdx} title={src.snippet} style={{ fontSize: '0.7rem', background: '#F8E8EE', color: '#7A173D', padding: '2px 8px', borderRadius: '4px', border: '1px solid #E9C9D5', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FileText size={11} color="#7A173D" /> {src.title} · Page {src.page}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#16805B', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} color="#16805B" /> {activeTab === 'prototype' ? 'Prototype Context' : 'Grounded in Content Spine'}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => onCopy(m.id, m.content)} style={{ background: 'none', border: 'none', color: '#8A6875', fontSize: '0.7rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        {copiedId === m.id ? <Check size={12} color="#16805B" /> : <Copy size={12} />}
                        {copiedId === m.id ? 'Copied' : 'Copy'}
                      </button>
                      <button onClick={onRegenerate} disabled={isAsking || Boolean(rateLimit && rateLimit.remainingSeconds > 0)} style={{ background: 'none', border: 'none', color: '#8A6875', fontSize: '0.7rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', opacity: isAsking ? 0.5 : 1 }}>
                        <RefreshCw size={11} /> Regenerate
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {m.isError && (
                <div style={{ marginTop: '10px' }}>
                  <button onClick={onRegenerate} disabled={isAsking || Boolean(rateLimit && rateLimit.remainingSeconds > 0)} style={{ background: '#C62828', border: 'none', color: '#FFFFFF', borderRadius: '6px', fontSize: '0.75rem', padding: '6px 12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={12} /> {rateLimit && rateLimit.remainingSeconds > 0 ? `Retry in ${rateLimit.remainingSeconds}s` : 'Retry Question'}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isAsking && (
        <div style={{ alignSelf: 'flex-start', background: '#F8E8EE', border: '1px solid #E9C9D5', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#3D1324', fontSize: '0.85rem' }}>
          <RefreshCw size={16} className="spin" color="#7A173D" />
          {activeTab === 'prototype' ? 'ContentSpine Assistant is thinking...' : 'ContentSpine Knowledge Agent is thinking...'}
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
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 120px)', background: '#FFFFFF', border: '1px solid #E9C9D5' }}>
        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E9C9D5', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('knowledge')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'knowledge' ? '1px solid #7A173D' : '1px solid #E9C9D5',
              background: activeTab === 'knowledge' ? '#F8E8EE' : '#FFFFFF',
              color: activeTab === 'knowledge' ? '#7A173D' : '#8A6875',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <MessageSquare size={14} color={activeTab === 'knowledge' ? '#7A173D' : '#8A6875'} />
            Knowledge Agent
            <span style={{ fontSize: '0.68rem', background: '#E8F7F0', color: '#16805B', border: '1px solid #B8DEC9', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>Gemini</span>
          </button>

          <button
            onClick={() => setActiveTab('prototype')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'prototype' ? '1px solid #7A173D' : '1px solid #E9C9D5',
              background: activeTab === 'prototype' ? '#F8E8EE' : '#FFFFFF',
              color: activeTab === 'prototype' ? '#7A173D' : '#8A6875',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Sparkles size={14} color={activeTab === 'prototype' ? '#7A173D' : '#8A6875'} />
            Prototype Assistant
            <span style={{ fontSize: '0.68rem', background: '#E8F7F0', color: '#16805B', border: '1px solid #B8DEC9', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>Gemini</span>
          </button>

          {/* Voice Query button — top right */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {voiceStatus && (
              <span style={{ fontSize: '0.75rem', color: isListening ? '#C62828' : '#7A173D', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {voiceStatus}
              </span>
            )}
            <button
              onClick={startVoiceInput}
              title={voiceSupported ? (isListening ? 'Stop listening' : 'Start voice input') : 'Voice not supported in this browser'}
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: '8px',
                background: isListening ? '#FDECEC' : '#FFFFFF',
                border: isListening ? '1px solid #C62828' : '1px solid #7A173D',
                color: isListening ? '#C62828' : '#7A173D',
                fontWeight: 700,
                cursor: voiceSupported ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                animation: isListening ? 'pulse 1.5s infinite' : undefined,
              }}
            >
              {isListening ? <MicOff size={15} color="#C62828" /> : <Mic size={15} color="#7A173D" />}
              {isListening ? 'Stop' : 'Voice Query'}
            </button>
          </div>
        </div>

        {/* Tab Header Info */}
        {activeTab === 'knowledge' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={20} color="#7A173D" />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3D1324' }}>Knowledge &amp; Q&amp;A Assistant</div>
              <div style={{ fontSize: '0.72rem', color: '#8A6875', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={11} color="#7A173D" />
                {selectedProvider === 'gemini' ? 'Gemini 3.1 Flash Lite' : selectedProvider === 'openai' ? 'GPT-4o' : 'Demo Mode'} · Answers from locked Content Spine facts only
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#7A173D" />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3D1324' }}>ContentSpine AI Prototype Assistant</div>
              <div style={{ fontSize: '0.72rem', color: '#8A6875', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={11} color="#7A173D" />
                Gemini gemini-2.0-flash-lite · Full prototype knowledge — architecture, features, tech stack, deployment
              </div>
            </div>
          </div>
        )}

        {/* Rate Limit Banner */}
        {currentRateLimit && (
          <div style={{ background: '#FFF4DD', border: '1px solid #FFEBAA', borderRadius: '10px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px', color: '#3D1324' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, fontSize: '0.95rem', color: '#B7791F' }}>
              <AlertTriangle size={20} color="#B7791F" />
              <span>Gemini is temporarily rate-limited.</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: '#B7791F', fontWeight: 700 }}>
                {currentRateLimit.remainingSeconds > 0 ? `Retry available in ${currentRateLimit.remainingSeconds}s` : 'Retry is now available!'}
              </span>
              <button onClick={activeTab === 'knowledge' ? handleRegenerate : handleProtoRegenerate} disabled={isCurrentlyAsking || currentRateLimit.remainingSeconds > 0} style={{ background: '#7A173D', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, opacity: currentRateLimit.remainingSeconds > 0 ? 0.5 : 1, cursor: currentRateLimit.remainingSeconds > 0 ? 'not-allowed' : 'pointer' }}>
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
        <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #E9C9D5', paddingTop: '14px', alignItems: 'center' }}>
          {/* Mic button in input bar */}
          <button
            onClick={startVoiceInput}
            title={voiceSupported ? (isListening ? 'Stop' : 'Speak your question') : 'Voice not supported'}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              border: isListening ? '1px solid #C62828' : '1px solid #E9C9D5',
              background: isListening ? '#FDECEC' : '#FFFFFF',
              cursor: voiceSupported ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            {isListening
              ? <MicOff size={18} color="#C62828" />
              : <Mic size={18} color={voiceSupported ? '#7A173D' : '#A48792'} />}
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
              background: isCurrentlyAsking ? '#F4EEF1' : isListening ? '#E8F7F0' : '#FFFFFF',
              border: isListening ? '1px solid #B8DEC9' : '1px solid #E9C9D5',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#3D1324',
              fontSize: '0.9rem',
              outline: 'none',
              opacity: isCurrentlyAsking || (currentRateLimit && currentRateLimit.remainingSeconds > 0) ? 0.6 : 1,
              transition: 'border-color 0.2s ease, background 0.2s ease',
            }}
          />
          <button
            onClick={handleSend}
            disabled={isCurrentlyAsking || !query.trim() || Boolean(currentRateLimit && currentRateLimit.remainingSeconds > 0)}
            style={{
              padding: '0 20px',
              height: '44px',
              borderRadius: '8px',
              border: 'none',
              background: '#7A173D',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isCurrentlyAsking || !query.trim() || (currentRateLimit && currentRateLimit.remainingSeconds > 0) ? 0.5 : 1,
              cursor: isCurrentlyAsking || !query.trim() || (currentRateLimit && currentRateLimit.remainingSeconds > 0) ? 'not-allowed' : 'pointer',
            }}
          >
            <Send size={16} /> Send
          </button>
        </div>
      </div>

      {/* Right Column: Guardrails & Facts Panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', background: '#FFFFFF', border: '1px solid #E9C9D5' }}>
        {activeTab === 'knowledge' ? (
          <>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3D1324', textTransform: 'uppercase' }}>
              Agent Guardrails &amp; Testing
            </h4>

            {/* Guardrail Status */}
            <div style={{ background: '#E8F7F0', border: '1px solid #B8DEC9', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16805B', fontWeight: 700, fontSize: '0.85rem' }}>
                <ShieldCheck size={18} color="#16805B" /> 🟢 Source-Only Guardrail Active
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B8277', lineHeight: '1.4' }}>
                The agent is strictly locked to Content Spine facts. Unsupported questions trigger explicit <strong style={{ color: '#7A173D' }}>"Not in source."</strong> responses without external speculation.
              </div>
            </div>

            {/* Knowledge Facts */}
            <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '8px', border: '1px solid #E9C9D5' }}>
              <div style={{ fontSize: '0.78rem', color: '#8A6875', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#3D1324' }}>Knowledge Facts ({lockedFacts.length})</span>
                <span style={{ fontSize: '0.68rem', color: '#16805B', background: '#E8F7F0', border: '1px solid #B8DEC9', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>VERIFIED SOT</span>
              </div>

              {lockedFacts.length === 0 ? (
                <div style={{ background: '#FFF4DD', border: '1px dashed #FFEBAA', padding: '12px', borderRadius: '6px', fontSize: '0.75rem', color: '#B7791F', lineHeight: '1.4' }}>
                  ⚠️ No verified Content Spine facts are available. Upload or ingest a source document first.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                  {lockedFacts.map((f: any) => {
                    const isExpanded = expandedFactId === f.id;
                    const ref = f.sourceSnippet ? f : f.references?.[0];
                    return (
                      <div key={f.id} onClick={() => setExpandedFactId(isExpanded ? null : f.id)} style={{ background: isExpanded ? '#F8E8EE' : '#FFF8FA', border: '1px solid #E9C9D5', borderRadius: '6px', padding: '8px 10px', fontSize: '0.76rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: '#3D1324' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            🔒 <strong style={{ color: '#3D1324' }}>{f.key || f.factKey}:</strong> <span style={{ color: '#5A2639' }}>{f.value || f.factValue}</span>
                          </span>
                          {isExpanded ? <ChevronUp size={14} color="#8A6875" /> : <ChevronDown size={14} color="#8A6875" />}
                        </div>
                        {isExpanded && (
                          <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #E9C9D5', fontSize: '0.7rem', color: '#8A6875', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>📄 <strong style={{ color: '#3D1324' }}>Source:</strong> {ref?.sourceDocument?.originalFilename || 'SIH 2026 Technical Report'}</div>
                            <div>📖 <strong style={{ color: '#3D1324' }}>Page:</strong> {ref?.pageNumber || 1}</div>
                            <div>💬 <strong style={{ color: '#3D1324' }}>Snippet:</strong> "{ref?.sourceSnippet || f.value || f.factValue}"</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Automated Test Harness */}
            <div style={{ borderTop: '1px solid #E9C9D5', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontWeight: 800, color: '#3D1324', fontSize: '0.85rem' }}>Automated Guardrail Test Harness</div>

              <button onClick={handleRunAgentTests} disabled={isTesting || Boolean(rateLimitInfo && rateLimitInfo.remainingSeconds > 0)} style={{ justifyContent: 'center', fontWeight: 700, padding: '10px', borderRadius: '8px', background: '#FFFFFF', border: '1px solid #7A173D', color: '#7A173D', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: isTesting || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0) ? 0.5 : 1, cursor: isTesting || (rateLimitInfo && rateLimitInfo.remainingSeconds > 0) ? 'not-allowed' : 'pointer' }}>
                {isTesting ? <><RefreshCw size={14} className="spin" color="#7A173D" /> Running Sequential Test Harness...</> : <><Zap size={14} color="#7A173D" /> Run Hallucination &amp; Fact Test</>}
              </button>

              {testError && (
                <div style={{ background: '#FDECEC', border: '1px solid #F5C6CB', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#C62828', fontWeight: 700, fontSize: '0.82rem' }}>
                    <AlertTriangle size={16} color="#C62828" /> Agent test could not be completed.
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#3D1324', lineHeight: '1.4' }}>{testError}</div>
                  <button onClick={handleRunAgentTests} disabled={isTesting || Boolean(rateLimitInfo && rateLimitInfo.remainingSeconds > 0)} style={{ fontSize: '0.78rem', justifyContent: 'center', marginTop: '4px', background: '#C62828', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>
                    <RefreshCw size={12} /> Retry Test
                  </button>
                </div>
              )}

              {testResults && (
                <div style={{ background: '#FFF8FA', padding: '14px', borderRadius: '8px', border: '1px solid #E9C9D5', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E9C9D5', paddingBottom: '8px' }}>
                    <span style={{ color: '#16805B', fontWeight: 800, fontSize: '0.88rem' }}>Pass Rate: {testResults.summary?.passRate || testResults.passRate}</span>
                    <span style={{ color: '#8A6875', fontWeight: 600 }}>{testResults.summary?.passed ?? testResults.passed}/{testResults.summary?.total ?? testResults.total} Passed</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                    {(testResults.tests || testResults.results || []).map((t: any, idx: number) => {
                      const isPassed = t.status === 'passed' || t.passed === true;
                      const isRateLimit = t.status === 'rate_limited';
                      return (
                        <div key={t.id || idx} style={{ background: isPassed ? '#E8F7F0' : isRateLimit ? '#FFF4DD' : '#FDECEC', padding: '8px 10px', borderRadius: '6px', border: isPassed ? '1px solid #B8DEC9' : isRateLimit ? '1px solid #FFEBAA' : '1px solid #F5C6CB' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, marginBottom: '4px' }}>
                            <span style={{ color: isPassed ? '#16805B' : isRateLimit ? '#B7791F' : '#C62828', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {isPassed ? <CheckCircle2 size={13} color="#16805B" /> : isRateLimit ? <AlertTriangle size={13} color="#B7791F" /> : <XCircle size={13} color="#C62828" />}
                              {t.name || `Scenario #${idx + 1}`}
                            </span>
                            <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: isPassed ? '#16805B' : isRateLimit ? '#B7791F' : '#C62828', color: '#FFFFFF', fontWeight: 600 }}>
                              {(t.status || (isPassed ? 'passed' : 'failed')).toUpperCase()}
                            </span>
                          </div>
                          <div style={{ color: '#3D1324', fontSize: '0.72rem' }}><strong style={{ color: '#3D1324' }}>Query:</strong> "{t.query || t.inputQuery}"</div>
                          <div style={{ color: '#8A6875', fontSize: '0.7rem', marginTop: '2px' }}>{t.details || `Expected: "${t.expected || t.expectedAns}"`}</div>
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
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3D1324', textTransform: 'uppercase' }}>
              Prototype Knowledge Base
            </h4>

            <div style={{ background: '#F8E8EE', border: '1px solid #E9C9D5', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7A173D', fontWeight: 700, fontSize: '0.85rem' }}>
                <Sparkles size={18} color="#7A173D" /> Gemini Powered
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8A6875', lineHeight: '1.4' }}>
                This assistant is pre-loaded with full ContentSpine AI prototype knowledge. Ask about architecture, features, tech stack, database schema, API endpoints, deployment, and more.
              </div>
            </div>

            {/* Quick Question Chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#8A6875', fontWeight: 700, textTransform: 'uppercase' }}>Quick Questions</div>
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
                    background: '#FFFFFF',
                    border: '1px solid #E9C9D5',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '0.75rem',
                    color: '#7A173D',
                    fontWeight: 600,
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
            <div style={{ background: '#F8E8EE', border: '1px solid #E9C9D5', borderRadius: '8px', padding: '12px', fontSize: '0.75rem', color: '#8A6875', lineHeight: '1.4', marginTop: 'auto' }}>
              <div style={{ fontWeight: 700, color: '#7A173D', marginBottom: '4px' }}>🎙️ Voice Input {voiceSupported ? 'Available' : 'Not Supported'}</div>
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
