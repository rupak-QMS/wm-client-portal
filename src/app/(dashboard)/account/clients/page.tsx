'use client';

import { useState }                  from 'react';
import { useQuery, useQueryClient }  from '@tanstack/react-query';
import { useRouter }                 from 'next/navigation';
import { Button }                    from '@/components/ui/button';
import { Avatar, AvatarFallback }    from '@/components/ui/avatar';
import { AddClientModal }            from '@/components/clients/AddClientModal';
import { EditClientModal }           from '@/components/clients/EditClientModal';
import { ConfirmDialog }             from '@/components/shared/ConfirmDialog';
import { UserPlus, Mail, Globe, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { getInitials, formatTime }   from '@/lib/utils';
import { toast }                     from 'sonner';
import type { Client, User }         from '@/types';

const statusColors = {
  active:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  inactive:  'bg-gray-100  text-gray-700  dark:bg-gray-900/30  dark:text-gray-400',
  suspended: 'bg-red-100   text-red-700   dark:bg-red-900/30   dark:text-red-400',
};

export default function AMClientsPage() {
  const router                        = useRouter();
  const qc                            = useQueryClient();
  const [showAdd,    setShowAdd]      = useState(false);
  const [editClient, setEditClient]   = useState<Client | null>(null);
  const [confirmId,  setConfirmId]    = useState<string | null>(null);
  const [isDeleting, setIsDeleting]   = useState(false);

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
    setConfirmId(null);
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
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium">No clients assigned yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Added</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                          {getInitials(client.company_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p
                          className="font-medium hover:text-primary cursor-pointer flex items-center gap-1"
                          onClick={() => router.push(`/account/clients/${client.id}`)}
                        >
                          {client.company_name}
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </p>
                        {client.website && (
                          <a href={client.website} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary"
                            onClick={e => e.stopPropagation()}>
                            <Globe className="h-3 w-3" />
                            {client.website.replace('https://', '').replace('http://', '')}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="font-medium text-sm">{client.contact_person}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {client.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[client.status]}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {formatTime(client.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon"
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => setEditClient(client)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmId(client.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddClientModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={refresh}
        managers={managers}
      />

      <EditClientModal
        open={!!editClient}
        onClose={() => setEditClient(null)}
        onSuccess={refresh}
        client={editClient}
        managers={managers}
      />

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
