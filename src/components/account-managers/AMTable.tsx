'use client';
import { useState }      from 'react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { getInitials, formatTime } from '@/lib/utils';
import { Mail, ToggleLeft, ToggleRight } from 'lucide-react';
import type { User }     from '@/types';

interface Props {
  managers:   User[];
  onToggle:   (id: string, status: string) => void;
  isToggling: boolean;
}

export function AMTable({ managers, onToggle, isToggling }: Props) {
  const [confirmUser, setConfirmUser] = useState<User | null>(null);

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
              {managers.map((am: any) => (
                <tr key={am.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        background: 'linear-gradient(135deg,rgba(124,58,237,.4),rgba(59,130,246,.4))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#f1f5f9',
                        opacity: am.status === 'inactive' ? 0.5 : 1,
                      }}>
                        {getInitials(am.full_name)}
                      </div>
                      <span style={{ fontWeight: 500, color: am.status === 'inactive' ? 'rgba(148,163,184,.4)' : '#f1f5f9', fontSize: '.87rem' }}>
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
                      background: am.status === 'active' ? 'rgba(52,211,153,.12)' : 'rgba(148,163,184,.1)',
                      color:      am.status === 'active' ? '#34d399'              : 'rgba(148,163,184,.4)',
                      border: `0.5px solid ${am.status === 'active' ? 'rgba(52,211,153,.25)' : 'rgba(148,163,184,.2)'}`,
                    }}>
                      {am.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => setConfirmUser(am)}
                      title={am.status === 'active' ? 'Deactivate account' : 'Activate account'}
                      style={{
                        width: 30, height: 30, borderRadius: 7, border: 'none',
                        background: am.status === 'active' ? 'rgba(248,113,113,.08)' : 'rgba(52,211,153,.08)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: am.status === 'active' ? '#f87171' : '#34d399', marginLeft: 'auto',
                      }}>
                      {am.status === 'active' ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmUser}
        title={confirmUser?.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
        description={confirmUser?.status === 'active'
          ? `${confirmUser?.full_name} will not be able to log in. Their data will be preserved.`
          : `${confirmUser?.full_name} will be able to log in again.`}
        confirmLabel={confirmUser?.status === 'active' ? 'Deactivate' : 'Activate'}
        confirmColor={confirmUser?.status === 'active' ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'linear-gradient(135deg,#059669,#10b981)'}
        onConfirm={() => { if (confirmUser) onToggle(confirmUser.id, confirmUser.status ?? 'active'); setConfirmUser(null); }}
        onCancel={() => setConfirmUser(null)}
        loading={isToggling}
      />
    </>
  );
}
