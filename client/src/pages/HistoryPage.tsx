import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  Search,
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  ArrowRight,
  Cpu,
  Clock,
  AlertTriangle,
  RefreshCw,
  X,
  Check,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface ConversationItem {
  id: string;
  projectId: string;
  title: string;
  provider: string;
  model: string;
  lastMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface HistoryPageProps {
  projectId: string;
  onOpenConversation: (conversationId: string) => void;
  onStartNewConversation: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  projectId,
  onOpenConversation,
  onStartNewConversation,
}) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [editingConv, setEditingConv] = useState<{ id: string; title: string } | null>(null);
  const [deletingConv, setDeletingConv] = useState<{ id: string; title: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchHistory();
  }, [projectId, searchQuery]);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getConversations(projectId || '', searchQuery);
      setConversations(data || []);
    } catch (err: any) {
      console.error('❌ Failed to fetch history:', err);
      setError(err?.message || 'History could not be loaded from database.');
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameSubmit = async () => {
    if (!editingConv || !editingConv.title.trim()) return;
    setIsSubmitting(true);
    try {
      await apiClient.renameConversation(editingConv.id, editingConv.title.trim());
      setConversations((prev) =>
        prev.map((c) => (c.id === editingConv.id ? { ...c, title: editingConv.title.trim() } : c))
      );
      setEditingConv(null);
    } catch (err: any) {
      alert(`Failed to rename: ${err.message || 'Error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingConv) return;
    setIsSubmitting(true);
    try {
      await apiClient.deleteConversation(deletingConv.id);
      setConversations((prev) => prev.filter((c) => c.id !== deletingConv.id));
      setDeletingConv(null);
    } catch (err: any) {
      alert(`Failed to delete: ${err.message || 'Error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group conversations into Today, Yesterday, Older
  const groupConversations = (items: ConversationItem[]) => {
    const today: ConversationItem[] = [];
    const yesterday: ConversationItem[] = [];
    const older: ConversationItem[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    items.forEach((item) => {
      const itemTime = new Date(item.updatedAt || item.createdAt).getTime();
      if (itemTime >= startOfToday) {
        today.push(item);
      } else if (itemTime >= startOfYesterday) {
        yesterday.push(item);
      } else {
        older.push(item);
      }
    });

    return { today, yesterday, older };
  };

  const { today, yesterday, older } = groupConversations(conversations);

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const renderSection = (title: string, items: ConversationItem[]) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: 'var(--font-xs)', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
          {title} ({items.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((c) => (
            <div
              key={c.id}
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                cursor: 'pointer',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => onOpenConversation(c.id)}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--pink-400)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--pink-50)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-surface)'; }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                  <MessageSquare size={14} color="var(--burgundy-700)" aria-hidden="true" />
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--font-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                    {c.title}
                  </span>
                  <span className="badge badge-pink" style={{ fontSize: '0.68rem' }}>
                    <Cpu size={10} aria-hidden="true" /> {c.provider === 'gemini' ? 'Gemini' : c.provider === 'openai' ? 'OpenAI' : 'Mock'}
                  </span>
                </div>
                {c.lastMessage && (
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '420px' }}>
                    "{c.lastMessage}"
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} aria-hidden="true" /> {formatRelativeTime(c.updatedAt)}
                </span>
                <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn-ghost btn-icon btn-sm"
                    onClick={() => setEditingConv({ id: c.id, title: c.title })}
                    aria-label="Rename conversation"
                  >
                    <Edit2 size={13} aria-hidden="true" />
                  </button>
                  <button
                    className="btn-ghost btn-icon btn-sm"
                    onClick={() => setDeletingConv({ id: c.id, title: c.title })}
                    aria-label="Delete conversation"
                    style={{ color: 'var(--color-error)' }}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
                <ArrowRight size={14} color="var(--text-muted)" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="page-enter" style={{ padding: '28px 32px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-burgundy">Persistent History</span>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-success)', fontWeight: 700 }}>● Neon PostgreSQL</span>
          </div>
          <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HistoryIcon size={22} color="var(--burgundy-700)" aria-hidden="true" /> History &amp; Q&amp;A Logs
          </h1>
        </div>

        <button className="btn-primary" onClick={onStartNewConversation}>
          <Plus size={15} aria-hidden="true" /> New Conversation
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search conversation titles & messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ paddingLeft: '40px' }}
            aria-label="Search conversations"
          />
        </div>
        {searchQuery && (
          <button className="btn-secondary" onClick={() => setSearchQuery('')}>
            <X size={14} aria-hidden="true" /> Clear
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-error)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: 'var(--font-sm)' }}>
            <AlertTriangle size={15} aria-hidden="true" /> History could not be loaded from database.
          </div>
          <button className="btn-secondary btn-sm" onClick={fetchHistory}>
            <RefreshCw size={13} aria-hidden="true" /> Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <RefreshCw size={15} className="spin" color="var(--burgundy-700)" aria-hidden="true" /> Loading from Neon PostgreSQL...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && conversations.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <MessageSquare size={24} color="var(--burgundy-700)" aria-hidden="true" />
          </div>
          <div className="empty-state-title">
            {searchQuery ? 'No matching conversations' : 'No history yet'}
          </div>
          <div className="empty-state-description">
            {searchQuery
              ? `No conversations matched "${searchQuery}".`
              : 'Start an AI Knowledge Agent session to create your first conversation.'}
          </div>
          <button className="btn-primary" onClick={onStartNewConversation}>
            <Plus size={15} aria-hidden="true" /> Start Knowledge Agent Session
          </button>
        </div>
      )}

      {/* Conversation Lists */}
      {!isLoading && !error && conversations.length > 0 && (
        <>
          {renderSection('Today', today)}
          {renderSection('Yesterday', yesterday)}
          {renderSection('Older', older)}
        </>
      )}

      {/* Rename Modal */}
      {editingConv && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,7,21,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 'var(--z-modal)' }} role="dialog" aria-modal="true" aria-labelledby="rename-modal-title">
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', width: '420px', padding: '24px', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 id="rename-modal-title" style={{ fontSize: 'var(--font-md)', fontWeight: 800, color: 'var(--text-primary)' }}>Rename Conversation</h3>
              <button onClick={() => setEditingConv(null)} className="btn-ghost btn-icon" aria-label="Close">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <input
              className="input"
              type="text"
              value={editingConv.title}
              onChange={(e) => setEditingConv({ ...editingConv, title: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
              autoFocus
              aria-label="Conversation title"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn-secondary" onClick={() => setEditingConv(null)} disabled={isSubmitting}>Cancel</button>
              <button className="btn-primary" onClick={handleRenameSubmit} disabled={isSubmitting || !editingConv.title.trim()}>
                {isSubmitting ? <RefreshCw size={13} className="spin" aria-hidden="true" /> : <Check size={13} aria-hidden="true" />} Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingConv && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,7,21,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 'var(--z-modal)' }} role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--color-error-border)', borderRadius: 'var(--radius-lg)', width: '420px', padding: '24px', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} color="var(--color-error)" aria-hidden="true" />
              <h3 id="delete-modal-title" style={{ fontSize: 'var(--font-md)', fontWeight: 800, color: 'var(--text-primary)' }}>Delete conversation?</h3>
            </div>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
              <strong>"{deletingConv.title}"</strong> and all its messages will be permanently removed from Neon. Source documents and facts remain intact.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn-secondary" onClick={() => setDeletingConv(null)} disabled={isSubmitting}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteSubmit} disabled={isSubmitting}>
                {isSubmitting ? <RefreshCw size={13} className="spin" aria-hidden="true" /> : <Trash2 size={13} aria-hidden="true" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
