import React, { useState } from 'react';
import { Bot, Send, Mic, ShieldCheck, RefreshCw, Zap, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { ContentSpineData } from '../types';
import { apiClient } from '../services/apiClient';

interface AgentsPageProps {
  projectId: string;
  spine: ContentSpineData | null;
}

export const AgentsPage: React.FC<AgentsPageProps> = ({ projectId, spine }) => {
  const [query, setQuery] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<{ role: 'USER' | 'ASSISTANT'; content: string; toolCalls?: any[]; audioUrl?: string }>>([
    {
      role: 'ASSISTANT',
      content:
        'Hello! I am your ContentSpine Knowledge Agent. I answer questions strictly from the verified Content Spine and locked facts. Ask me anything about this project.',
    },
  ]);
  const [isVoiceRecording, setIsVoiceRecording] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testError, setTestError] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!query.trim()) return;
    const userQuery = query;
    setQuery('');
    setMessages((prev) => [...prev, { role: 'USER', content: userQuery }]);
    setIsAsking(true);

    try {
      const res = await fetch('/api/agents/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projectId || 'demo-project', query: userQuery }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { success: false, error: { message: text || 'Non-JSON server response' } };
      }

      if (!res.ok || data.success === false) {
        throw new Error(data.error?.message || data.error || 'Agent request failed');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'ASSISTANT',
          content: data.answer || data.data?.answer || 'I couldn’t find that information in the source.',
          toolCalls: data.toolCalls || data.data?.toolCalls,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'ASSISTANT', content: `Agent error: ${err.message}` },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleVoiceAsk = async () => {
    setIsVoiceRecording(true);
    try {
      const res = await fetch('/api/agents/voice-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId || 'demo-project',
          queryText: 'How many systems were affected and when did the incident occur?',
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { success: false, error: { message: text || 'Non-JSON voice agent response' } };
      }

      if (!res.ok || data.success === false) {
        throw new Error(data.error?.message || 'Voice agent request failed');
      }

      const payload = data.data || data;

      setMessages((prev) => [
        ...prev,
        { role: 'USER', content: '🎤 [Voice Query] How many systems were affected and when did the incident occur?' },
        {
          role: 'ASSISTANT',
          content: payload.answer,
          toolCalls: payload.toolCalls,
          audioUrl: payload.audioUrl,
        },
      ]);
    } catch (err: any) {
      alert(`Voice agent error: ${err.message}`);
    } finally {
      setIsVoiceRecording(false);
    }
  };

  const handleRunAgentTests = async () => {
    setIsTesting(true);
    setTestError(null);
    try {
      const data = await apiClient.runAgentTest(projectId || 'demo-project');
      setTestResults(data);
    } catch (err: any) {
      console.error('❌ Agent Test UI Error:', err);
      setTestError(err.message || 'The hallucination and fact test could not be completed.');
      setTestResults(null);
    } finally {
      setIsTesting(false);
    }
  };

  const lockedFacts = spine?.factLocks || [];

  return (
    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>
      {/* Left: Chat Window */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 120px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <span className="badge badge-indigo" style={{ marginBottom: '4px' }}>
              Ask Your Content Spine
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={20} color="var(--accent-indigo)" /> AI Knowledge & Voice Agent
            </h2>
          </div>

          <button className="btn-secondary" onClick={handleVoiceAsk} disabled={isVoiceRecording} style={{ fontSize: '0.8rem' }}>
            <Mic size={15} color="var(--accent-rose)" /> {isVoiceRecording ? 'Listening...' : 'Voice Query'}
          </button>
        </div>

        {/* Message Thread */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.role === 'USER' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.role === 'USER' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: m.role === 'USER' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: m.role === 'USER' ? 'var(--accent-sky)' : 'var(--accent-emerald)', marginBottom: '4px' }}>
                {m.role === 'USER' ? 'User Query' : 'ContentSpine Agent'}
              </div>

              <div style={{ fontSize: '0.92rem', color: '#e2e8f0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {m.content}
              </div>

              {m.audioUrl && (
                <div style={{ marginTop: '10px' }}>
                  <audio controls src={m.audioUrl} style={{ width: '100%', height: '36px' }} />
                </div>
              )}

              {m.toolCalls && m.toolCalls.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  🔧 <strong>Tools Executed:</strong> {m.toolCalls.map((t) => `${t.tool} (${t.result})`).join(', ')}
                </div>
              )}
            </div>
          ))}
          {isAsking && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={15} className="spin" /> Searching Content Spine facts...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Ask a question about the incident, dates, systems affected, or risks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            style={{
              flex: 1,
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: 'white',
              fontSize: '0.9rem',
            }}
          />
          <button className="btn-primary" onClick={handleAsk} disabled={isAsking} style={{ padding: '0 20px' }}>
            <Send size={16} /> Send
          </button>
        </div>
      </div>

      {/* Right: Guardrails & Test Harness */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white', textTransform: 'uppercase' }}>
          Agent Guardrails & Testing
        </h4>

        {/* Guardrail Status Card */}
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6ee7b7', fontWeight: 700, fontSize: '0.85rem' }}>
            <ShieldCheck size={18} /> Source-Only Guardrail Active
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            The agent is strictly locked to Content Spine facts. Unsupported questions trigger explicit "Not in source" responses.
          </div>
        </div>

        {/* Facts Knowledge Base Summary */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
            Knowledge Facts ({lockedFacts.length})
          </div>
          {lockedFacts.slice(0, 4).map((f) => (
            <div key={f.id} style={{ fontSize: '0.75rem', color: '#e2e8f0', marginBottom: '4px' }}>
              🔒 <strong>{f.key}:</strong> {f.value}
            </div>
          ))}
        </div>

        {/* Agent Automated Test Harness */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontWeight: 700, color: 'white', fontSize: '0.85rem' }}>
            Automated Guardrail Test Harness
          </div>

          <button
            className="btn-secondary"
            onClick={handleRunAgentTests}
            disabled={isTesting}
            style={{ justifyContent: 'center', fontWeight: 700 }}
          >
            {isTesting ? (
              <>
                <RefreshCw size={14} className="spin" color="var(--accent-amber)" /> Running Test...
              </>
            ) : (
              <>
                <Zap size={14} color="var(--accent-amber)" /> Run Hallucination & Fact Test
              </>
            )}
          </button>

          {/* Test Error State Card (Section 11) */}
          {testError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '12px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fca5a5', fontWeight: 700, fontSize: '0.82rem' }}>
                <AlertTriangle size={16} /> Agent test could not be completed.
              </div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                {testError}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Check the AI provider configuration or server logs.
              </div>
              <button
                className="btn-secondary"
                onClick={handleRunAgentTests}
                disabled={isTesting}
                style={{ fontSize: '0.78rem', justifyContent: 'center', marginTop: '4px' }}
              >
                <RefreshCw size={12} /> Retry Test
              </button>
            </div>
          )}

          {/* Structured Test Results UI (Section 10) */}
          {testResults && (
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                <span style={{ color: '#6ee7b7', fontWeight: 800, fontSize: '0.85rem' }}>
                  Pass Rate: {testResults.summary?.passRate || testResults.passRate}
                </span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                  {testResults.summary?.passed ?? testResults.passed}/{testResults.summary?.total ?? testResults.total} Passed
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(testResults.tests || testResults.results || []).map((t: any, idx: number) => {
                  const isPassed = t.status === 'passed' || t.passed === true;
                  return (
                    <div
                      key={t.id || idx}
                      style={{
                        background: isPassed ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.08)',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: isPassed ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, marginBottom: '4px' }}>
                        <span style={{ color: isPassed ? '#6ee7b7' : '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isPassed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {t.name || `Scenario #${idx + 1}`}
                        </span>
                        <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: isPassed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: isPassed ? '#6ee7b7' : '#fca5a5' }}>
                          {(t.status || (isPassed ? 'passed' : 'failed')).toUpperCase()}
                        </span>
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.72rem', marginTop: '2px' }}>
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
