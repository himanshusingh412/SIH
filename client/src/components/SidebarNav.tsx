import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Database,
  Settings,
  ShieldCheck,
  Layers,
  Sparkles,
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
    { id: 'new-transformation', label: 'New Transformation', icon: PlusCircle },
    { id: 'spine', label: 'Content Spine', icon: Database },
    { id: 'workspace', label: 'Review Workspace', icon: Layers },
    { id: 'validation', label: 'Consistency Matrix', icon: ShieldCheck },
  ];

  return (
    <aside
      style={{
        width: '260px',
        background: 'rgba(12, 16, 28, 0.95)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 14px',
        userSelect: 'none',
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
            marginBottom: '24px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              borderRadius: '10px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.3px' }} className="gradient-text">
              ContentSpine AI
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              GovTech Enterprise Platform
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '9px',
                  background: active ? 'rgba(99, 102, 241, 0.16)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--text-muted)',
                  border: active ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                  cursor: 'pointer',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.88rem',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <Icon size={18} color={active ? '#818cf8' : 'var(--text-muted)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Project Card in Sidebar */}
        {activeProjectTitle && (
          <div
            style={{
              marginTop: '28px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Active Workspace
            </div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'white',
                marginTop: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeProjectTitle}
            </div>
            <span className="badge badge-emerald" style={{ fontSize: '0.65rem', marginTop: '6px', display: 'inline-block' }}>
              Fact Lock Active
            </span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SIH 2026 Engine v1.0</span>
        </div>
        <Settings size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
      </div>
    </aside>
  );
};
