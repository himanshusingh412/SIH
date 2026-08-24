import React, { useState } from 'react';
import { Bot, Send, Mic, ShieldCheck, RefreshCw, Zap } from 'lucide-react';
import type { ContentSpineData } from '../types';

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
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'ASSISTANT',
          content: data.answer || 'I couldn’t find that information in the source.',
          toolCalls: data.toolCalls,
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
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'USER', content: '🎤 [Voice Query] How many systems were affected and when did the incident occur?' },
        {
          role: 'ASSISTANT',
          content: data.answer,
          toolCalls: data.toolCalls,
          audioUrl: data.audioUrl,
        },
      ]);
    } catch (err: any) {
      alert(`Voice agent error: ${err.message}`);
    } finally {
      setIsVoiceRecording(false);
    }
  };

  const handleRunAgentTests = async () => {
    try {
      const res = await fetch('/api/agents/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'demo-agent-id',
          testCases: [
            { query: 'How many systems were affected?', expectedAnswerSnippet: '11' },
            { query: 'What date did the incident occur?', expectedAnswerSnippet: '21 October 2026' },
            { query: 'Who is the president of Mars?', expectedAnswerSnippet: "couldn't find" },
          ],
        }),
      });
      const data = await res.json();
      setTestResults(data);
    } catch (err: any) {
      alert(`Test harness error: ${err.message}`);
    }
  };

  const lockedFacts = spine?.factLocks || [];

  return (
    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
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
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontWeight: 700, color: 'white', fontSize: '0.85rem' }}>
            Automated Guardrail Test Harness
          </div>
          <button className="btn-secondary" onClick={handleRunAgentTests} style={{ justifyContent: 'center' }}>
            <Zap size={14} color="var(--accent-amber)" /> Run Hallucination & Fact Test
          </button>

          {testResults && (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6ee7b7', fontWeight: 800 }}>
                <span>Pass Rate: {testResults.passRate}</span>
                <span>{testResults.passed}/{testResults.total} Passed</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
