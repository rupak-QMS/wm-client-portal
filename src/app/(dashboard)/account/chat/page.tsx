'use client';
import { useState }    from 'react';
import { useQuery }    from '@tanstack/react-query';
import { ChatBox }     from '@/components/shared/ChatBox';
import { getInitials } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';
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
    <div className="wm-page-inner" style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }} className="wm-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <MessageSquare size={15} style={{ color: '#f472b6' }} />
          <span style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Messaging</span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Chat</h1>
        <p style={{ fontSize: '.875rem', color: 'rgba(148,163,184,.5)' }}>Chat with your clients</p>
      </div>

      {/* Chat layout */}
      <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }} className="wm-fade-up-2">

        {/* Client list */}
        <div className="wm-card" style={{ width: 260, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(124,58,237,.1)' }}>
            <p style={{ fontSize: '.85rem', fontWeight: 600, color: '#f1f5f9', marginBottom: 2 }}>Conversations</p>
            <p style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.4)' }}>Select a client to chat</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {clients.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '32px 16px', fontSize: '.82rem', color: 'rgba(148,163,184,.3)' }}>
                No clients assigned yet
              </p>
            ) : clients.map(client => {
              const isSelected = selectedUser?.id === client.id;
              return (
                <button key={client.id}
                  onClick={() => setSelectedUser({
                    id: client.id, full_name: client.contact_person,
                    email: client.email, role: 'client',
                    created_at: client.created_at, updated_at: client.updated_at,
                  })}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 16px', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: isSelected ? 'rgba(124,58,237,.12)' : 'transparent',
                    borderLeft: isSelected ? '2px solid #a78bfa' : '2px solid transparent',
                    transition: 'all .2s',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,.06)'; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: isSelected ? 'linear-gradient(135deg,rgba(124,58,237,.5),rgba(59,130,246,.5))' : 'rgba(255,255,255,.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    color: isSelected ? '#f1f5f9' : 'rgba(148,163,184,.6)',
                  }}>
                    {getInitials(client.contact_person)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '.83rem', fontWeight: 500, color: isSelected ? '#f1f5f9' : 'rgba(241,245,249,.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {client.contact_person}
                    </p>
                    <p style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {client.company_name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selectedUser && currentUser ? (
            <ChatBox currentUser={currentUser} otherUser={selectedUser} />
          ) : (
            <div className="wm-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(244,114,182,.1)', border: '0.5px solid rgba(244,114,182,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: '#f472b6' }}>
                <MessageSquare size={22} />
              </div>
              <p style={{ fontSize: '.95rem', fontWeight: 500, color: 'rgba(148,163,184,.5)', marginBottom: 4 }}>Select a client</p>
              <p style={{ fontSize: '.8rem', color: 'rgba(148,163,184,.3)' }}>Choose a client from the list to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}