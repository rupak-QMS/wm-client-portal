'use client';

import { useState }                  from 'react';
import { useQuery, useQueryClient }  from '@tanstack/react-query';
import { Button }                    from '@/components/ui/button';
import { ClientTable }               from '@/components/clients/ClientTable';
import { AddClientModal }            from '@/components/clients/AddClientModal';
import { EditClientModal }           from '@/components/clients/EditClientModal';
import { UserPlus }                  from 'lucide-react';
import { toast }                     from 'sonner';
import type { Client, User }         from '@/types';

export default function AMClientsPage() {
  const [showAdd,    setShowAdd]    = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const qc = useQueryClient();

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
    if (!res.ok) {
      toast.error(json.error);
    } else {
      toast.success('Deletion request sent to manager for approval');
    }
    setIsDeleting(false);
  };

  const refresh = () => qc.invalidateQueries({ queryKey: ['clients'] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Clients</h1>
          <p className="text-muted-foreground text-sm">Clients assigned to you</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading...</div>
      ) : (
        <ClientTable clients={clients} onEdit={setEditClient} onDelete={handleDelete} isDeleting={isDeleting} />
      )}
      <AddClientModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={refresh} managers={managers} />
      <EditClientModal open={!!editClient} onClose={() => setEditClient(null)} onSuccess={refresh} client={editClient} managers={managers} />
    </div>
  );
}
