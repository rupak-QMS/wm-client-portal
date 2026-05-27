'use client';
import { useState }                 from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter }                from 'next/navigation';
import { AddClientModal }           from '@/components/clients/AddClientModal';
import { EditClientModal }          from '@/components/clients/EditClientModal';
import { ConfirmDialog }            from '@/components/shared/ConfirmDialog';
import { getInitials, formatTime }  from '@/lib/utils';
import { UserPlus, Mail, Globe, ExternalLink, Pencil, Trash2, Users } from 'lucide-react';
import { toast }                    from 'sonner';
import type { Client, User }        from '@/types';

const STATUS: Record<string, { bg: string; color: string }> = {
  active:    { bg: 'rgba(52,211,153,.12)',  color: '#34d399' },
  inactive:  { bg: 'rgba(148,163,184,.1)',  color: 'rgba(148,163,184,.6)' },
  suspended: { bg: 'rgba(248,113,113,.12)', color: '#f87171' },
};

export default function AMClientsPage() {
  const router = useRouter();
  const qc     = useQueryClient();
  const [showAdd,    setShowAdd]    = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [confirmId,  setConfirmId]  = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn:  async () => (await (await fetch('/api/clients')).json()).data ?? [],
  });
  const { data: managers = [] } = useQuery<User[]>({
    queryKey: ['account-managers'],
    queryFn:  async () => (await (await fetch('/api/users?role=account_manager')).json()).data ?? [],
  });

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const res  = await fetch('/api/delete-requests', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ client_id: id, reason: 'Requested by account manager' }),
    });
    const json = await res.json();
    if (!res.ok) toast.error(json.error);
    else toast.success('Deletion request sent to manager for approval');
    setIsDeleting(false);
    setConfirmId(null);
  };

  const refresh = () => qc.invalidateQueries({ queryKey: ['clients'] });

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }} className="wm-fade-up">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Users size={15} style={{ color: '#a78bfa' }} />
            <span style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Management</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>My Clients</h1>
          <p style={{ fontSize: '.875rem', color: 'rgba(148,163,184,.5)' }}>Clients assigned to you</p>
        </div>
        <button className="wm-btn-primary" onClick={() => setShowAdd(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38 }}>
          <UserPlus size={15} /> Add Client
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(148,163,184,.3)' }}>Loading...</div>
      ) : clients.length === 0 ? (
        <div className="wm-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(167,139,250,.1)', border: '0.5px solid rgba(167,139,250,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#a78bfa' }}>
            <Users size={22} />
          </div>
          <p style={{ color: 'rgba(148,163,184,.4)', fontSize: '.9rem' }}>No clients assigned yet</p>
        </div>
      ) : (
        <div className="wm-card wm-fade-up-2" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="wm-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client: Client) => {
                  const st = STATUS[client.status] ?? STATUS.inactive;
                  return (
                    <tr key={client.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg,rgba(124,58,237,.35),rgba(59,130,246,.35))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#f1f5f9' }}>
                            {getInitials(client.company_name)}
                          </div>
                          <div>
                            <p onClick={() => router.push(`/account/clients/${client.id}`)}
                              style={{ fontWeight: 500, color: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '.85rem' }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                              onMouseLeave={e => (e.currentTarget.style.color = '#f1f5f9')}>
                              {client.company_name} <ExternalLink size={11} style={{ opacity: .4 }} />
                            </p>
                            {client.website && (
                              <a href={client.website} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.4)', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
                                <Globe size={10} /> {client.website.replace(/https?:\/\//, '')}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <p style={{ fontSize: '.83rem', fontWeight: 500, color: '#f1f5f9', marginBottom: 2 }}>{client.contact_person}</p>
                        <p style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.45)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Mail size={10} /> {client.email}
                        </p>
                      </td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: '.7rem', fontWeight: 500, background: st.bg, color: st.color, textTransform: 'capitalize' }}>
                          {client.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '.78rem', color: 'rgba(148,163,184,.45)' }}>
                        {formatTime(client.created_at)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                          {[
                            { icon: Pencil, action: () => setEditClient(client), color: '#a78bfa' },
                            { icon: Trash2, action: () => setConfirmId(client.id), color: '#f87171' },
                          ].map(({ icon: Icon, action, color }, i) => (
                            <button key={i} onClick={action}
                              style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: 'rgba(255,255,255,.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(148,163,184,.4)', transition: 'all .2s' }}
                              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = color + '18'; b.style.color = color; }}
                              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,.04)'; b.style.color = 'rgba(148,163,184,.4)'; }}>
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
      )}

      <AddClientModal  open={showAdd}      onClose={() => setShowAdd(false)}    onSuccess={refresh} managers={managers} />
      <EditClientModal open={!!editClient} onClose={() => setEditClient(null)}  onSuccess={refresh} client={editClient} managers={managers} />
      <ConfirmDialog
        open={!!confirmId}
        title="Request Client Deletion"
        description="This will send a deletion request to the manager for approval. The client will not be deleted until approved."
        onConfirm={() => confirmId && handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
        loading={isDeleting}
      />
    </div>
  );
}