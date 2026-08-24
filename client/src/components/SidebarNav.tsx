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
} from 'lucide-react';

interface SidebarNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  activeProjectTitle?: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentRoute,
  onNavigate,
  activeProjectTitle,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'spine', label: 'Content Spine', icon: Database },
    { id: 'workspace', label: 'Review Workspace', icon: Layers },
    { id: 'resume-studio', label: 'Resume Studio', icon: FileText, badge: 'ATS' },
    { id: 'agents', label: 'AI Agents', icon: Bot, badge: 'Knowledge' },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      aria-label="Main Navigation Sidebar"
      style={{
        width: '260px',
        background: 'rgba(12, 16, 28, 0.95)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 14px',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      <div>
        {/* Brand Logo & Name */}
        <div
          onClick={() => onNavigate('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            marginBottom: '20px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              borderRadius: 'var(--radius-md)',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Sparkles size={20} color="white" aria-hidden="true" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 'var(--font-md)', letterSpacing: '-0.3px' }} className="gradient-text">
              ContentSpine AI
            </div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
              AI Content Transformation Engine
            </div>
          </div>
        </div>

        {/* Start New Transformation Button */}
        <button
          className="btn-primary"
          onClick={() => onNavigate('new-transformation')}
          style={{
            width: '100%',
            justifyContent: 'center',
            marginBottom: '16px',
            height: '40px',
          }}
        >
          <PlusCircle size={16} aria-hidden="true" />
          <span>New Transformation</span>
        </button>

        {/* Semantic Navigation List (Issue 2 & 6) */}
        <nav aria-label="Sidebar Navigation">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className="sidebar-nav-item"
                  style={{
                    background: active ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-muted)',
                    border: active ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                  }}
                >
                  <Icon size={17} color={active ? '#818cf8' : 'var(--text-muted)'} style={{ flexShrink: 0 }} aria-hidden="true" />
                  
                  {/* Label - Full visibility without clip/truncation (Issue 2) */}
                  <span className="sidebar-nav-label" style={{ color: active ? '#ffffff' : '#cbd5e1' }}>
                    {item.label}
                  </span>

                  {/* Badge - Clean Right-aligned alignment (Issue 6) */}
                  {item.badge && (
                    <span className="sidebar-nav-badge" aria-hidden="true">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Active Project Card in Sidebar */}
        {activeProjectTitle && (
          <div
            style={{
              marginTop: '20px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 700 }}>
              Active Workspace
            </div>
            <div
              style={{
                fontSize: 'var(--font-sm)',
                fontWeight: 700,
                color: 'white',
                marginTop: '4px',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
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
            <span className="badge badge-emerald" style={{ fontSize: 'var(--font-xs)', marginTop: '8px', display: 'inline-block' }}>
              Fact Lock Protected
            </span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: 'var(--radius-full)', background: '#10b981' }} aria-hidden="true" />
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>ContentSpine v2.0</span>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          aria-label="Settings"
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
        >
          <Settings size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};
