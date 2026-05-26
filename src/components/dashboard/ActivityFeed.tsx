'use client';

import { Activity } from 'lucide-react';

interface Log {
  id: string;
  action: string;
  created_at: string;
  user?: { full_name?: string; avatar_url?: string } | null;
}

export function ActivityFeed({ logs }: { logs: Log[] }) {
  return (
    <div className="wm-card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '18px 22px',
        borderBottom: '1px solid rgba(124,58,237,.1)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'rgba(167,139,250,.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#a78bfa',
        }}>
          <Activity size={14} aria-hidden />
        </div>
        <div>
          <div style={{ fontSize: '.9rem', fontWeight: 600, color: '#f1f5f9' }}>Activity Feed</div>
          <div style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.45)' }}>Recent portal actions</div>
        </div>
      </div>

      {/* List */}
      <div style={{ padding: '8px 0', maxHeight: 340, overflowY: 'auto' }}>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(148,163,184,.3)', fontSize: '.85rem' }}>
            No activity yet
          </div>
        ) : logs.map((log, i) => (
          <div key={log.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '10px 22px',
            borderBottom: i < logs.length - 1 ? '1px solid rgba(255,255,255,.03)' : 'none',
            transition: 'background .2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg,rgba(124,58,237,.4),rgba(59,130,246,.4))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#f1f5f9',
            }}>
              {log.user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '.82rem', color: 'rgba(241,245,249,.85)', marginBottom: 2 }}>
                <span style={{ fontWeight: 500, color: '#f1f5f9' }}>
                  {log.user?.full_name ?? 'System'}
                </span>
                {' '}{log.action}
              </div>
              <div style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.4)' }}>
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>

            {/* Timeline dot */}
            <div style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 6,
              background: '#a78bfa',
              boxShadow: '0 0 6px rgba(167,139,250,.5)',
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}