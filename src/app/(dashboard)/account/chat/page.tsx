'use client';

import { useState }   from 'react';
import { useQuery }   from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChatBox }    from '@/components/shared/ChatBox';
import { getInitials } from '@/lib/utils';
import type { User, Client } from '@/types';

export default function AMChatPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: currentUser } = useQuery<User>({
    queryKey: ['current-user'],
    queryFn:  async () => (await (await fetch('/api/users/me')).json()).data,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn:  async () => (await (await fetch('/api/clients')).json()).data ?? [],
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="w-72 flex-shrink-0 border border-border rounded-xl overflow-hidden bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Conversations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Chat with your clients</p>
        </div>
        <div className="overflow-y-auto">
          {clients.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No clients assigned yet</p>
          )}
          {clients.map(client => (
            <button key={client.id}
              onClick={() => setSelectedUser({
                id: client.id, full_name: client.contact_person,
                email: client.email, role: 'client',
                created_at: client.created_at, updated_at: client.updated_at,
              })}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left ${selectedUser?.id === client.id ? 'bg-accent' : ''}`}
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(client.contact_person)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{client.contact_person}</p>
                <p className="text-xs text-muted-foreground truncate">{client.company_name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1">
        {selectedUser && currentUser ? (
          <ChatBox currentUser={currentUser} otherUser={selectedUser} />
        ) : (
          <div className="h-full flex items-center justify-center border border-border rounded-xl bg-card">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">Select a client</p>
              <p className="text-sm mt-1">Choose a client to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
