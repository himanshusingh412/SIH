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
      const data = await apiClient.getConversations(projectId || 'demo-project', searchQuery);
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
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
          {title} ({items.length})
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((c) => (
            <div
              key={c.id}
              className="glass-panel"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid var(--border-color)',
              }}
              onClick={() => onOpenConversation(c.id)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <MessageSquare size={16} color="var(--accent-indigo)" />
                  <span style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.title}
                  </span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Cpu size={11} /> {c.provider === 'gemini' ? 'Gemini' : c.provider === 'openai' ? 'OpenAI' : 'Mock AI'} ({c.model})
                  </span>
                </div>

                {c.lastMessage && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                    "{c.lastMessage}"
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {formatRelativeTime(c.updatedAt)}
                </span>

                <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn-secondary"
                    onClick={() => setEditingConv({ id: c.id, title: c.title })}
                    title="Rename Conversation"
                    style={{ padding: '6px', fontSize: '0.75rem' }}
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    className="btn-secondary"
                    onClick={() => setDeletingConv({ id: c.id, title: c.title })}
                    title="Delete Conversation"
                    style={{ padding: '6px', fontSize: '0.75rem', color: 'var(--accent-rose)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <ArrowRight size={16} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-indigo">Persistent History</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>🟢 Neon PostgreSQL Connected</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HistoryIcon size={26} color="var(--accent-indigo)" /> History & Q&A Logs
          </h1>
        </div>

        <button className="btn-primary" onClick={onStartNewConversation} style={{ height: '42px', padding: '0 18px', fontWeight: 700 }}>
          <Plus size={16} /> New Conversation
        </button>
      </div>

      {/* Search Input Bar */}
      <div style={{ marginBottom: '28px', display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search conversation titles & message content in Neon database..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '12px 16px 12px 44px',
              color: 'white',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        {searchQuery && (
          <button className="btn-secondary" onClick={() => setSearchQuery('')} style={{ height: '44px' }}>
            Clear Search
          </button>
        )}
      </div>

      {/* Error State Banner */}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px 20px', borderRadius: '10px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fca5a5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, fontSize: '0.9rem' }}>
            <AlertTriangle size={18} /> History could not be loaded from database.
          </div>
          <button className="btn-secondary" onClick={fetchHistory} style={{ fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Retry Connection
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={{ padding: '40px', textTransform: 'uppercase', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <RefreshCw size={16} className="spin" color="var(--accent-sky)" /> Fetching persistent history from Neon PostgreSQL...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && conversations.length === 0 && (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <MessageSquare size={40} color="var(--text-muted)" />
          <h3 style={{ fontSize: '1.1rem', color: 'white', fontWeight: 700 }}>
            {searchQuery ? 'No matching conversations found' : 'No historical conversations yet'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px' }}>
            {searchQuery
              ? `No messages in Neon database matched "${searchQuery}".`
              : 'Ask a question in the AI Knowledge Agent to start your first persistent conversation.'}
          </p>
          <button className="btn-primary" onClick={onStartNewConversation} style={{ marginTop: '8px' }}>
            <Plus size={16} /> Start Knowledge Agent Session
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '440px', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>Rename Conversation</h3>
              <button onClick={() => setEditingConv(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <input
              type="text"
              value={editingConv.title}
              onChange={(e) => setEditingConv({ ...editingConv, title: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
              autoFocus
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 14px',
                color: 'white',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setEditingConv(null)} disabled={isSubmitting}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleRenameSubmit} disabled={isSubmitting || !editingConv.title.trim()}>
                {isSubmitting ? <RefreshCw size={14} className="spin" /> : <Check size={14} />} Save Title
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingConv && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '440px', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5' }}>
              <AlertTriangle size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>Delete this conversation?</h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong>"{deletingConv.title}"</strong>? This will permanently remove the conversation and its message history from Neon. Source documents and facts will remain intact.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setDeletingConv(null)} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleDeleteSubmit}
                disabled={isSubmitting}
                style={{ background: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}
              >
                {isSubmitting ? <RefreshCw size={14} className="spin" /> : <Trash2 size={14} />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
