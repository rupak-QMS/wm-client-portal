'use client';

import { useState }      from 'react';
import { useAddComment } from '@/hooks/useReports';
import { getInitials, formatTime } from '@/lib/utils';
import { Send }          from 'lucide-react';
import type { Comment }  from '@/types';

interface Props {
  reportId:      string;
  comments:      Comment[];
  currentUserId: string;
}

export function CommentSection({ reportId, comments, currentUserId }: Props) {
  const [text, setText] = useState('');
  const addComment      = useAddComment(reportId);

  const handleSubmit = () => {
    if (!text.trim()) return;
    addComment.mutate(text.trim(), { onSuccess: () => setText('') });
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <p style={{ fontSize: '.8rem', fontWeight: 600, color: 'rgba(148,163,184,.7)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
        Comments ({comments.length})
      </p>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p style={{ fontSize: '.8rem', color: 'rgba(148,163,184,.35)', fontStyle: 'italic' }}>No comments yet. Be the first to comment.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
          {comments.map(c => {
            const isMe = c.user_id === currentUserId;
            return (
              <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: isMe
                    ? 'linear-gradient(135deg,rgba(124,58,237,.6),rgba(59,130,246,.6))'
                    : 'rgba(255,255,255,.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#f1f5f9',
                }}>
                  {getInitials(c.user?.full_name ?? '?')}
                </div>

                {/* Bubble */}
                <div style={{
                  flex: 1,
                  background: isMe ? 'rgba(124,58,237,.1)' : 'rgba(255,255,255,.04)',
                  border: `0.5px solid ${isMe ? 'rgba(124,58,237,.25)' : 'rgba(255,255,255,.07)'}`,
                  borderRadius: 10,
                  padding: '8px 12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '.75rem', fontWeight: 600, color: isMe ? '#a78bfa' : '#f1f5f9' }}>
                      {c.user?.full_name ?? 'Unknown'}
                    </span>
                    <span style={{ fontSize: '.68rem', color: 'rgba(148,163,184,.35)' }}>
                      {formatTime(c.created_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: '.82rem', color: 'rgba(241,245,249,.8)', lineHeight: 1.5, margin: 0 }}>
                    {c.comment}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Write a comment… (Ctrl+Enter to send)"
          rows={2}
          style={{
            flex: 1, resize: 'none',
            background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(124,58,237,.18)',
            borderRadius: 10, padding: '8px 12px',
            fontSize: '.83rem', color: '#f1f5f9',
            outline: 'none', lineHeight: 1.5,
            transition: 'border-color .2s',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,.5)')}
          onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(124,58,237,.18)')}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || addComment.isPending}
          style={{
            width: 38, height: 38, borderRadius: 10, border: 'none', flexShrink: 0,
            background: text.trim()
              ? 'linear-gradient(135deg,#7c3aed,#3b82f6)'
              : 'rgba(255,255,255,.06)',
            color: text.trim() ? '#fff' : 'rgba(148,163,184,.3)',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .2s',
            boxShadow: text.trim() ? '0 0 12px rgba(124,58,237,.3)' : 'none',
          }}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}