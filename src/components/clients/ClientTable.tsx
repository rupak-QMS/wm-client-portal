'use client';

import { useState }      from 'react';
import { useRouter }     from 'next/navigation';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { getInitials, formatTime } from '@/lib/utils';
import { Pencil, Trash2, Globe, Mail, ExternalLink } from 'lucide-react';
import type { Client } from '@/types';

const STATUS: Record<string, { bg: string; color: string }> = {
  active:    { bg: 'rgba(52,211,153,.12)',  color: '#34d399' },
  inactive:  { bg: 'rgba(148,163,184,.1)',  color: 'rgba(148,163,184,.6)' },
  suspended: { bg: 'rgba(248,113,113,.12)', color: '#f87171' },
};

interface Props {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  showDetail?: boolean;
}

export function ClientTable({ clients, onEdit, onDelete, isDeleting, showDetail = false }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const router = useRouter();
  const basePath = typeof window !== 'undefined' && window.location.pathname.startsWith('/account') ? '/account' : '/manager';

  return (
    <>
      <div className="wm-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="wm-table">
            <thead>
              <tr>
                <th>Company</th>
                <th style={{ display: 'none' }} className="md-show">Contact</th>
                <th style={{ display: 'none' }} className="lg-show">Account Manager</th>
                <th>Status</th>
                <th style={{ display: 'none' }} className="lg-show">Added</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'rgba(148,163,184,.3)' }}>
                    No clients yet. Add your first client!
                  </td>
                </tr>
              )}
              {clients.map(client => {
                const st = STATUS[client.status] ?? STATUS.inactive;
                return (
                  <tr key={client.id}>
                    {/* Company */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                          background: 'linear-gradient(135deg,rgba(124,58,237,.35),rgba(59,130,246,.35))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#f1f5f9',
                        }}>
                          {getInitials(client.company_name)}
                        </div>
                        <div>
                          <p onClick={() => router.push(`${basePath}/clients/${client.id}`)}
                            style={{ fontWeight: 500, color: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '.85rem' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#f1f5f9')}>
                            {client.company_name}
                            <ExternalLink size={11} style={{ opacity: .4 }} />
                          </p>
                          {client.website && (
                            <a href={client.website} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.4)', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
                              <Globe size={10} />
                              {client.website.replace(/https?:\/\//, '')}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td style={{ color: 'rgba(148,163,184,.7)' }}>
                      <p style={{ fontSize: '.83rem', fontWeight: 500, color: '#f1f5f9', marginBottom: 2 }}>{client.contact_person}</p>
                      <p style={{ fontSize: '.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={10} /> {client.email}
                      </p>
                    </td>

                    {/* AM */}
                    <td style={{ color: 'rgba(148,163,184,.55)', fontSize: '.83rem' }}>
                      {(client as any).assignedManager?.full_name ?? (
                        <span style={{ fontStyle: 'italic', opacity: .5, fontSize: '.75rem' }}>Unassigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 99,
                        fontSize: '.7rem', fontWeight: 500,
                        background: st.bg, color: st.color,
                        border: `0.5px solid ${st.color}44`,
                        textTransform: 'capitalize',
                      }}>
                        {client.status}
                      </span>
                    </td>

                    {/* Added */}
                    <td style={{ color: 'rgba(148,163,184,.45)', fontSize: '.78rem' }}>
                      {formatTime(client.created_at)}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        {[
                          { icon: Pencil, action: () => onEdit(client), color: '#a78bfa' },
                          { icon: Trash2, action: () => setConfirmId(client.id), color: '#f87171' },
                        ].map(({ icon: Icon, action, color }, i) => (
                          <button key={i} onClick={action} style={{
                            width: 30, height: 30, borderRadius: 7, border: 'none',
                            background: 'rgba(255,255,255,.04)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'rgba(148,163,184,.4)', transition: 'all .2s',
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = color + '18'; (e.currentTarget as HTMLButtonElement).style.color = color; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.04)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(148,163,184,.4)'; }}>
                            <Icon size={13} aria-hidden />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmId}
        title="Delete Client"
        description="This will permanently delete the client and all their data. This action cannot be undone."
        onConfirm={() => { if (confirmId) onDelete(confirmId); setConfirmId(null); }}
        onCancel={() => setConfirmId(null)}
        loading={isDeleting}
      />
    </>
  );
}