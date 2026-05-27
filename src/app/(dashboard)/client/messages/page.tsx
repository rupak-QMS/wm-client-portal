'use client';
import { useQuery }      from '@tanstack/react-query';
import { ChatBox }       from '@/components/shared/ChatBox';
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

  const myClient       = clients.find(c => c.email === currentUser?.email);
  const accountManager = myClient?.assignedManager as User | null;

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ marginBottom: 28 }} className="wm-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <MessageSquare size={15} style={{ color: '#f472b6' }} />
          <span style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Messaging</span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Messages</h1>
        <p style={{ fontSize: '.875rem', color: 'rgba(148,163,184,.5)' }}>Chat with your account manager</p>
      </div>

      {/* Content */}
      {!accountManager ? (
        <div className="wm-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(244,114,182,.1)', border: '0.5px solid rgba(244,114,182,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#f472b6' }}>
            <MessageSquare size={22} />
          </div>
          <p style={{ color: 'rgba(148,163,184,.4)', fontSize: '.9rem', marginBottom: 4 }}>No account manager assigned</p>
          <p style={{ color: 'rgba(148,163,184,.25)', fontSize: '.8rem' }}>Contact us to get an account manager assigned to you</p>
        </div>
      ) : currentUser ? (
        <div className="wm-fade-up-2" style={{ height: 'calc(100vh - 260px)' }}>
          <ChatBox currentUser={currentUser} otherUser={accountManager} />
        </div>
      ) : null}
    </div>
  );
}