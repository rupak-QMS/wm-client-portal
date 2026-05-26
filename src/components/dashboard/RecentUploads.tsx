'use client';

import { FileText, Download, ArrowUpRight } from 'lucide-react';

interface Report {
  id: string;
  title?: string;
  created_at: string;
  file_size?: number | null;
  client?: { company_name?: string } | null;
  uploader?: { full_name?: string } | null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function RecentUploads({ reports }: { reports: Report[] }) {
  return (
    <div className="wm-card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '18px 22px',
        borderBottom: '1px solid rgba(124,58,237,.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'rgba(96,165,250,.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#60a5fa',
          }}>
            <FileText size={14} aria-hidden />
          </div>
          <div>
            <div style={{ fontSize: '.9rem', fontWeight: 600, color: '#f1f5f9' }}>Recent Uploads</div>
            <div style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.45)' }}>Latest reports added</div>
          </div>
        </div>
        <a href="/reports" style={{
          fontSize: '.75rem', color: '#a78bfa', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 4,
          transition: 'color .2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#c4b5fd')}
          onMouseLeave={e => (e.currentTarget.style.color = '#a78bfa')}
        >
          View all <ArrowUpRight size={12} />
        </a>
      </div>

      {/* List */}
      <div style={{ padding: '8px 0' }}>
        {reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(148,163,184,.3)', fontSize: '.85rem' }}>
            No reports uploaded yet
          </div>
        ) : reports.map((r, i) => (
          <div key={r.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 22px',
            borderBottom: i < reports.length - 1 ? '1px solid rgba(255,255,255,.03)' : 'none',
            transition: 'background .2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {/* File icon */}
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: 'rgba(96,165,250,.1)',
              border: '0.5px solid rgba(96,165,250,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#60a5fa',
            }}>
              <FileText size={16} aria-hidden />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '.85rem', fontWeight: 500, color: '#f1f5f9',
                marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {r.title ?? 'Untitled Report'}
              </div>
              <div style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.45)', display: 'flex', gap: 8 }}>
                <span>{r.client?.company_name ?? 'Unknown client'}</span>
                {r.file_size && <span>· {formatBytes(r.file_size)}</span>}
                <span>· {new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <button
              aria-label="Download report"
              style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: 'rgba(255,255,255,.04)',
                border: '0.5px solid rgba(255,255,255,.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(148,163,184,.4)', cursor: 'pointer',
                transition: 'all .2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(96,165,250,.12)';
                (e.currentTarget as HTMLButtonElement).style.color = '#60a5fa';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.04)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(148,163,184,.4)';
              }}
            >
              <Download size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}