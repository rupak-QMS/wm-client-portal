'use client';
import { useState }      from 'react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { getInitials, formatTime } from '@/lib/utils';
import { Trash2, Mail }  from 'lucide-react';
import type { User }     from '@/types';

interface Props {
  managers:   User[];
  onDelete:   (id: string) => void;
  isDeleting: boolean;
}

export function AMTable({ managers, onDelete, isDeleting }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <>
      <div className="wm-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="wm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {managers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'rgba(148,163,184,.3)' }}>
                    No account managers yet
                  </td>
                </tr>
              )}
              {managers.map(am => (
                <tr key={am.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        background: 'linear-gradient(135deg,rgba(124,58,237,.4),rgba(59,130,246,.4))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#f1f5f9',
                      }}>
                        {getInitials(am.full_name)}
                      </div>
                      <span style={{ fontWeight: 500, color: '#f1f5f9', fontSize: '.87rem' }}>
                        {am.full_name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.82rem', color: 'rgba(148,163,184,.6)' }}>
                      <Mail size={12} style={{ flexShrink: 0 }} />
                      {am.email}
                    </div>
                  </td>
                  <td style={{ fontSize: '.8rem', color: 'rgba(148,163,184,.45)' }}>
                    {formatTime(am.created_at)}
                  </td>
                  <td>
                    <span style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: '.7rem', fontWeight: 500,
                      background: 'rgba(52,211,153,.12)', color: '#34d399',
                      border: '0.5px solid rgba(52,211,153,.25)',
                    }}>
                      Active
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => setConfirmId(am.id)}
                      style={{
                        width: 30, height: 30, borderRadius: 7, border: 'none',
                        background: 'rgba(255,255,255,.04)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'rgba(148,163,184,.4)', transition: 'all .2s', marginLeft: 'auto',
                      }}
                      onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(248,113,113,.12)'; b.style.color = '#f87171'; }}
                      onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,.04)'; b.style.color = 'rgba(148,163,184,.4)'; }}
                    >
                      <Trash2 size={13} aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmId}
        title="Delete Account Manager"
        description="This will permanently delete the account manager. This action cannot be undone."
        onConfirm={() => { if (confirmId) onDelete(confirmId); setConfirmId(null); }}
        onCancel={() => setConfirmId(null)}
        loading={isDeleting}
      />
    </>
  );
}