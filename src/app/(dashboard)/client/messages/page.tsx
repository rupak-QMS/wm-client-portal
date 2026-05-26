'use client';

import { useQuery }   from '@tanstack/react-query';
import { ChatBox }    from '@/components/shared/ChatBox';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import type { User, Client } from '@/types';

export default function ClientMessagesPage() {
  const { data: currentUser } = useQuery<User>({
    queryKey: ['current-user'],
    queryFn:  async () => (await (await fetch('/api/users/me')).json()).data,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn:  async () => (await (await fetch('/api/clients')).json()).data ?? [],
  });

  // Find the client record for current user
  const myClient = clients.find(c => c.email === currentUser?.email);

  // Get assigned account manager as the chat partner
  const accountManager = myClient?.assignedManager as User | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground text-sm">
          Chat with your account manager
        </p>
      </div>

      {!accountManager ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No account manager assigned</p>
            <p className="text-sm mt-1">
              Contact us to get an account manager assigned to you
            </p>
          </CardContent>
        </Card>
      ) : currentUser ? (
        <div className="h-[calc(100vh-12rem)]">
          <ChatBox
            currentUser={currentUser}
            otherUser={accountManager}
          />
        </div>
      ) : null}
    </div>
  );
}
