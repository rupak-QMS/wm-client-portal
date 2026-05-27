'use client';

import { useState }       from 'react';
import { CommentSection } from './CommentSection';
import { formatTime, formatFileSize } from '@/lib/utils';
import { FileText, Download, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import type { Report } from '@/types';

const TYPE_COLOR: Record<string, { bg: string; color: string }> = {
  seo:            { bg: 'rgba(96,165,250,.12)',  color: '#60a5fa' },
  website_update: { bg: 'rgba(52,211,153,.12)',  color: '#34d399' },
  analytics:      { bg: 'rgba(167,139,250,.12)', color: '#a78bfa' },
  audit:          { bg: 'rgba(251,191,36,.12)',  color: '#fbbf24' },
  other:          { bg: 'rgba(148,163,184,.1)',  color: 'rgba(148,163,184,.7)' },
};

interface Props { report: Report; currentUserId: string; }

export function ReportCard({ report, currentUserId }: Props) {
  const [showComments, setShowComments] = useState(false);
  const tc = TYPE_COLOR[report.report_type] ?? TYPE_COLOR.other;

  return (
    <div className="wm-card" style={{ padding: '18px 20px', transition: 'all .25s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

        {/* file icon */}
        <div style={{
          width: 42, height: 42, borderRadius: 11, flexShrink: 0,
          background: tc.bg, border: `0.5px solid ${tc.color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: tc.color,
        }}>
          <FileText size={18} aria-hidden />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
            <div>
              <h3 style={{ fontSize: '.92rem', fontWeight: 600, color: '#f1f5f9', marginBottom: 2 }}>
                {report.title}
              </h3>
              <p style={{ fontSize: '.78rem', color: 'rgba(148,163,184,.55)' }}>
                {report.client?.company_name} · Uploaded by {report.uploader?.full_name}
              </p>
            </div>
            <span style={{
              flexShrink: 0, padding: '3px 10px', borderRadius: 99,
              fontSize: '.7rem', fontWeight: 500,
              background: tc.bg, color: tc.color,
              border: `0.5px solid ${tc.color}44`,
            }}>
              {report.report_type.replace('_', ' ')}
            </span>
          </div>

          {/* description */}
          {report.description && (
            <p style={{ fontSize: '.82rem', color: 'rgba(148,163,184,.5)', marginTop: 6, marginBottom: 4 }}>
              {report.description}
            </p>
          )}

          {/* meta + actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.4)' }}>
              {formatTime(report.created_at)}
            </span>
            {report.file_size && (
              <span style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.4)' }}>
                {formatFileSize(Number(report.file_size))}
              </span>
            )}

            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button
                onClick={() => setShowComments(v => !v)}
                className="wm-btn-ghost"
                style={{ padding: '5px 12px', fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: 5, height: 'auto' }}>
                <MessageSquare size={13} />
                {report.comments?.length ?? 0}
                {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              <a href={report.file_url} target="_blank" rel="noopener noreferrer"
                className="wm-btn-primary"
                style={{ padding: '5px 12px', fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: 5, borderRadius: 8, textDecoration: 'none' }}>
                <Download size={13} />
                Download
              </a>
            </div>
          </div>

          {/* comments */}
          {showComments && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(124,58,237,.1)' }}>
              <CommentSection
                reportId={report.id}
                comments={report.comments ?? []}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}