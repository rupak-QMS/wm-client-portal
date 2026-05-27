'use client';
import { useState }                 from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClientTable }              from '@/components/clients/ClientTable';
import { AddClientModal }           from '@/components/clients/AddClientModal';
import { EditClientModal }          from '@/components/clients/EditClientModal';
import { UserPlus, Users }          from 'lucide-react';
import { toast }                    from 'sonner';
import type { Client, User }        from '@/types';

export default function ManagerClientsPage() {
  const [showAdd,    setShowAdd]    = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const qc = useQueryClient();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn:  async () => (await (await fetch('/api/clients')).json()).data,
  });

  const { data: managers = [] } = useQuery<User[]>({
    queryKey: ['account-managers'],
    queryFn:  async () => (await (await fetch('/api/users?role=account_manager')).json()).data,
  });

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const res  = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) toast.error(json.error);
    else { toast.success('Client deleted'); qc.invalidateQueries({ queryKey: ['clients'] }); }
    setIsDeleting(false);
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
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Clients</h1>
          <p style={{ fontSize: '.875rem', color: 'rgba(148,163,184,.5)' }}>Manage all your clients</p>
        </div>
        <button className="wm-btn-primary" onClick={() => setShowAdd(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38 }}>
          <UserPlus size={15} /> Add Client
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(148,163,184,.3)' }}>Loading...</div>
      ) : (
        <div className="wm-fade-up-2">
          <ClientTable clients={clients} onEdit={setEditClient} onDelete={handleDelete} isDeleting={isDeleting} />
        </div>
      )}

      <AddClientModal  open={showAdd}      onClose={() => setShowAdd(false)}   onSuccess={refresh} managers={managers} />
      <EditClientModal open={!!editClient} onClose={() => setEditClient(null)} onSuccess={refresh} client={editClient} managers={managers} />
    </div>
  );
}