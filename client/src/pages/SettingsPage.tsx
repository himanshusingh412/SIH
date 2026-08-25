import React, { useState } from 'react';
import {
  Settings,
  Cpu,
  Database,
  ShieldCheck,
  Eye,
  EyeOff,
  Globe,
  Download,
  Bell,
} from 'lucide-react';

type Section = 'general' | 'ai' | 'database' | 'security' | 'appearance' | 'export' | 'notifications';

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'general',       label: 'General',       icon: Settings },
  { id: 'ai',            label: 'AI Providers',   icon: Cpu },
  { id: 'database',      label: 'Database',       icon: Database },
  { id: 'security',      label: 'Security',       icon: ShieldCheck },
  { id: 'appearance',    label: 'Appearance',     icon: Eye },
  { id: 'export',        label: 'Export',         icon: Download },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
];

export const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('general');
  const [aiProvider, setAiProvider] = useState<string>('gemini');
  const [model, setModel] = useState<string>('gemini-2.0-flash-lite');
  const [showKey, setShowKey] = useState<boolean>(false);

  const card = (children: React.ReactNode, title: string) => (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <h2 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
        {title}
      </h2>
      {children}
    </div>
  );

  const field = (label: string, children: React.ReactNode, hint?: string) => (
    <div style={{ marginBottom: '18px' }}>
      <label className="form-label">{label}</label>
      {children}
      {hint && <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '5px' }}>{hint}</div>}
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return card(
          <>
            {field('Workspace Name', <input className="input" defaultValue="SIH 2026 Workspace" />, 'Display name shown in the header')}
            {field('Platform Version', <input className="input" defaultValue="ContentSpine AI v2.0" disabled style={{ opacity: 0.7 }} />)}
            {field('Demo Mode', (
              <select className="input" defaultValue="disabled">
                <option value="disabled">Disabled — Real data only</option>
                <option value="enabled">Enabled — Load demo content</option>
              </select>
            ), 'When enabled, the platform loads a sample project')}
          </>,
          'General Settings'
        );

      case 'ai':
        return card(
          <>
            {field('Primary AI Provider', (
              <select className="input" value={aiProvider} onChange={e => setAiProvider(e.target.value)}>
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="mock">Mock AI (Demo / Testing)</option>
              </select>
            ))}
            {field('Model Name', (
              <input className="input" value={model} onChange={e => setModel(e.target.value)} />
            ), 'e.g. gemini-2.0-flash-lite, gpt-4o')}
            {field('API Key', (
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showKey ? 'text' : 'password'}
                  defaultValue="••••••••••••••••••••"
                  style={{ paddingRight: '44px' }}
                  readOnly
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            ), 'API keys are stored securely in the server environment. They are never exposed to the browser.')}
            <div style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: 'var(--font-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: '1px' }} aria-hidden="true" />
              <span>API keys are managed server-side via environment variables. They are never sent to or stored by the browser.</span>
            </div>
          </>,
          'AI Provider Configuration'
        );

      case 'database':
        return card(
          <>
            {field('Database URL', (
              <div style={{ position: 'relative' }}>
                <input className="input" type="password" defaultValue="••••••••••••••••••••••••••••••••" readOnly />
              </div>
            ), 'Neon PostgreSQL connection string. Managed server-side only.')}
            <div style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: 'var(--font-xs)', color: 'var(--color-success)', display: 'flex', gap: '8px' }}>
              <span className="status-dot status-dot-success" style={{ marginTop: '2px', flexShrink: 0 }} aria-hidden="true" />
              <span>Connected to Neon PostgreSQL. All project data, conversations, and resume records are persisted.</span>
            </div>
          </>,
          'Database Configuration'
        );

      case 'security':
        return card(
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'API Keys — Server-side only',     status: true,  note: 'Never exposed to browser' },
                { label: 'Prisma error sanitization',       status: true,  note: 'DATABASE_UNAVAILABLE pattern' },
                { label: 'Rate limiting (120 req/min/IP)',  status: true,  note: 'In-memory rate limiter active' },
                { label: 'File upload MIME allowlist',      status: true,  note: 'PDF, DOCX, TXT, Image only' },
                { label: 'Security headers',                status: true,  note: 'X-Frame-Options, CSP, XSS protection' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>{item.note}</div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                    <span className="status-dot status-dot-success" aria-hidden="true" />
                    Active
                  </span>
                </div>
              ))}
            </div>
          </>,
          'Security Configuration'
        );

      case 'appearance':
        return card(
          <>
            {field('Color Theme', (
              <select className="input" defaultValue="burgundy">
                <option value="burgundy">Burgundy / Light Pink (current)</option>
              </select>
            ), 'The UI uses the Burgundy + Light Pink design system')}
            {field('Font', (
              <select className="input" defaultValue="manrope">
                <option value="manrope">Manrope (current)</option>
                <option value="inter">Inter</option>
              </select>
            ))}
          </>,
          'Appearance'
        );

      case 'export':
        return card(
          <>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.6' }}>
              Supported export formats:
            </p>
            {[
              { fmt: 'DOCX', note: 'Microsoft Word document' },
              { fmt: 'PDF',  note: 'Portable Document Format' },
              { fmt: 'PPTX', note: 'PowerPoint presentation' },
              { fmt: 'JSON', note: 'Structured Content Spine data' },
              { fmt: 'Markdown', note: 'Plain text with formatting' },
            ].map((e) => (
              <div key={e.fmt} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{e.fmt}</span>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginLeft: '10px' }}>{e.note}</span>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Available</span>
              </div>
            ))}
          </>,
          'Export Settings'
        );

      case 'notifications':
        return card(
          <>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Notification preferences are coming in a future release.
              Rate limit warnings and validation failures are displayed inline in the UI.
            </p>
          </>,
          'Notifications'
        );

      default:
        return null;
    }
  };

  return (
    <div className="page-enter" style={{ padding: '28px 32px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Settings size={22} color="var(--burgundy-700)" aria-hidden="true" />
        Settings
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px' }}>
        {/* Section Nav */}
        <nav aria-label="Settings sections">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {SECTIONS.map(s => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  aria-current={active ? 'page' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: active ? 'var(--burgundy-700)' : 'transparent',
                    color: active ? '#FFF5F8' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-sans)',
                    width: '100%',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(110,27,56,0.06)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <Icon size={15} aria-hidden="true" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Section Content */}
        <div>{renderSection()}</div>
      </div>
    </div>
  );
};
