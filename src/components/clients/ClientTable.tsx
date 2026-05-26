'use client';

import { useState }       from 'react';
import { Badge }          from '@/components/ui/badge';
import { Button }         from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ConfirmDialog }  from '@/components/shared/ConfirmDialog';
import { getInitials, formatTime } from '@/lib/utils';
import { Pencil, Trash2, Globe, Mail } from 'lucide-react';
import type { Client } from '@/types';

const statusColors = {
  active:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  inactive:  'bg-gray-100  text-gray-700  dark:bg-gray-900/30  dark:text-gray-400',
  suspended: 'bg-red-100   text-red-700   dark:bg-red-900/30   dark:text-red-400',
};

interface Props {
  clients:    Client[];
  onEdit:     (client: Client) => void;
  onDelete:   (id: string) => void;
  isDeleting: boolean;
}

export function ClientTable({ clients, onEdit, onDelete, isDeleting }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Contact</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Account Manager</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Added</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-muted-foreground">
                  No clients yet. Add your first client!
                </td>
              </tr>
            )}
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
                      <p className="font-medium hover:text-primary cursor-pointer"
                onClick={() => window.location.href = `/manager/clients/${client.id}`}>
                 {client.company_name}
                     </p>
                      {client.website && (
                        <a href={client.website} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary">
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
                <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                  {(client as any).assignedManager?.full_name ?? (
                    <span className="text-xs italic">Unassigned</span>
                  )}
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
                      onClick={() => onEdit(client)}>
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

      <ConfirmDialog
        open={!!confirmId}
        title="Delete Client"
        description="This will permanently delete the client and all their data. This action cannot be undone."
        onConfirm={() => {
          if (confirmId) onDelete(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
        loading={isDeleting}
      />
    </>
  );
}