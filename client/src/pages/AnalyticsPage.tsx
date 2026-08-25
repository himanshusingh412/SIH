import React, { useState, useEffect } from 'react';
import { BarChart3, Database, ShieldCheck, FileText, Bot, Zap, RefreshCw, TrendingUp } from 'lucide-react';
import type { AnalyticsData } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agents/analytics');
      const data = await res.json();
      if (data.analytics) setAnalytics(data.analytics);
    } catch { /* keep null */ } finally { setIsLoading(false); }
  };

  const score = analytics?.avgConsistencyScore ?? 100;
  const scoreColor = score >= 90 ? 'var(--color-success)' : score >= 70 ? 'var(--color-warning)' : 'var(--color-error)';

  const cards = [
    { label: 'Total Projects',       value: analytics?.totalProjects ?? 0,         icon: FileText,    accent: 'var(--burgundy-700)', bg: 'var(--pink-100)' },
    { label: 'Content Spines',       value: analytics?.totalContentSpines ?? 0,     icon: Database,    accent: 'var(--pink-500)',     bg: 'var(--pink-100)' },
    { label: 'Facts Locked',         value: analytics?.totalFactsLocked ?? 0,       icon: ShieldCheck, accent: 'var(--color-success)', bg: 'var(--color-success-bg)' },
    { label: 'Deliverables',         value: analytics?.totalOutputsGenerated ?? 0,  icon: Zap,         accent: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
    { label: 'Agent Sessions',       value: analytics?.totalAgentSessions ?? 0,     icon: Bot,         accent: 'var(--burgundy-600)', bg: 'var(--pink-100)' },
  ];

  return (
    <div className="page-enter" style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="badge badge-burgundy" style={{ marginBottom: '8px', display: 'inline-block' }}>
            Real Database Metrics
          </span>
          <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={22} color="var(--burgundy-700)" aria-hidden="true" />
            Platform Analytics
          </h1>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginTop: '4px' }}>
            All numbers sourced directly from Neon PostgreSQL.
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchAnalytics} disabled={isLoading}>
          <RefreshCw size={14} className={isLoading ? 'spin' : ''} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {/* Consistency Hero */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: `1px solid ${scoreColor}`,
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: 'var(--radius-full)',
            background: score >= 90 ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
            border: `3px solid ${scoreColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: 800,
            color: scoreColor,
            flexShrink: 0,
          }}
          aria-label={`Consistency score: ${score}%`}
        >
          {score}%
        </div>
        <div>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Factual Consistency Score
          </h2>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', maxWidth: '560px', lineHeight: '1.6' }}>
            Calculated across all validation runs. The Fact Lock system enforces zero fact drift
            between source documents and generated deliverables.
          </p>
        </div>
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <TrendingUp size={32} color={scoreColor} aria-hidden="true" />
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {c.label}
                </span>
                <div style={{ background: c.bg, borderRadius: 'var(--radius-md)', padding: '5px' }}>
                  <Icon size={15} color={c.accent} aria-hidden="true" />
                </div>
              </div>
              <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: c.accent }}>
                {isLoading ? '—' : c.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {!isLoading && !analytics && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BarChart3 size={24} color="var(--burgundy-700)" aria-hidden="true" />
          </div>
          <div className="empty-state-title">No analytics data yet</div>
          <div className="empty-state-description">
            Create projects and generate content to see analytics here.
          </div>
        </div>
      )}
    </div>
  );
};
