import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Database,
  Settings,
  Layers,
  Sparkles,
  Bot,
  BarChart3,
  History,
  FileText,
  FolderKanban,
  Lock,
} from 'lucide-react';

interface SidebarNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  activeProjectTitle?: string;
}

const GROUP_LABELS: Record<string, string> = {
  'new-transformation': 'CREATE',
  dashboard: 'WORKSPACE',
  'resume-studio': 'INTELLIGENCE',
  history: 'HISTORY',
  settings: 'SYSTEM',
};

const navGroups = [
  {
    label: 'CREATE',
    items: [
      { id: 'new-transformation', label: 'New Transformation', icon: PlusCircle },
    ],
  },
  {
    label: 'WORKSPACE',
    items: [
      { id: 'dashboard',    label: 'Dashboard',        icon: LayoutDashboard },
      { id: 'projects',     label: 'Projects',          icon: FolderKanban },
      { id: 'spine',        label: 'Content Spine',     icon: Database },
      { id: 'workspace',    label: 'Review Workspace',  icon: Layers },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { id: 'resume-studio', label: 'Resume Studio', icon: FileText,  badge: 'ATS' },
      { id: 'agents',        label: 'AI Agents',     icon: Bot,       badge: 'Knowledge' },
    ],
  },
  {
    label: 'HISTORY',
    items: [
      { id: 'history',   label: 'History',   icon: History },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentRoute,
  onNavigate,
  activeProjectTitle,
}) => {
  return (
    <aside
      aria-label="Main Navigation Sidebar"
      style={{
        width: '252px',
        minWidth: '252px',
        background: '#FFF1F5',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 12px',
        userSelect: 'none',
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      <div>
        {/* ── Brand Logo ── */}
        <div
          onClick={() => onNavigate('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 8px 16px',
            cursor: 'pointer',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              background: 'var(--burgundy-700)',
              borderRadius: 'var(--radius-md)',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(110, 27, 56, 0.3)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={18} color="#F6C2D3" aria-hidden="true" />
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 'var(--font-md)',
                letterSpacing: '-0.3px',
                lineHeight: 1.2,
              }}
              className="gradient-text"
            >
              ContentSpine AI
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '1px' }}>
              AI Transformation Engine
            </div>
          </div>
        </div>

        {/* ── Navigation Groups ── */}
        <nav aria-label="Sidebar Navigation">
          {navGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: '4px' }}>
              <div className="sidebar-nav-group-label">{group.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = currentRoute === item.id ||
                    (item.id === 'dashboard' && currentRoute === 'dashboard') ||
                    (item.id === 'projects' && currentRoute === 'projects');
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      aria-current={active ? 'page' : undefined}
                      className="sidebar-nav-item"
                      style={{
                        color: active ? '#FFF5F8' : 'var(--text-secondary)',
                      }}
                    >
                      <Icon
                        size={16}
                        color={active ? '#F6C2D3' : 'var(--text-muted)'}
                        style={{ flexShrink: 0 }}
                        aria-hidden="true"
                      />
                      <span className="sidebar-nav-label">{item.label}</span>
                      {(item as any).badge && (
                        <span className="sidebar-nav-badge" aria-hidden="true">
                          {(item as any).badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Active Project Card ── */}
        {activeProjectTitle && (
          <div
            style={{
              marginTop: '16px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Active Workspace
            </div>
            <div
              style={{
                fontSize: 'var(--font-sm)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginTop: '4px',
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
              title={activeProjectTitle}
            >
              {activeProjectTitle}
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '8px',
                fontSize: 'var(--font-xs)',
                fontWeight: 700,
                color: 'var(--burgundy-700)',
                background: 'var(--pink-100)',
                border: '1px solid var(--pink-300)',
                borderRadius: 'var(--radius-pill)',
                padding: '2px 8px',
              }}
            >
              <Lock size={10} aria-hidden="true" />
              Fact Lock Active
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            className="status-dot status-dot-success"
            aria-hidden="true"
          />
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
            ContentSpine v2.0
          </span>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          aria-label="Settings"
          className="btn-ghost btn-icon"
          style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }}
        >
          <Settings size={15} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};
