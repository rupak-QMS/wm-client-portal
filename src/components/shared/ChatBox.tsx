'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/providers/SupabaseProvider';
import { Input }       from '@/components/ui/input';
import { Button }      from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send }        from 'lucide-react';
import { cn, formatTime, getInitials } from '@/lib/utils';
import type { Message, User } from '@/types';

interface Props {
  currentUser: User;
  otherUser:   User;
}

export function ChatBox({ currentUser, otherUser }: Props) {
  const [text,    setText]    = useState('');
  const bottomRef             = useRef<HTMLDivElement>(null);
  const supabase              = useSupabase();
  const qc                    = useQueryClient();

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', otherUser.id],
    queryFn: async () => {
      const res  = await fetch(`/api/messages?with=${otherUser.id}`);
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const send = useMutation({
    mutationFn: async (msg: string) => {
      const res = await fetch('/api/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ receiver_id: otherUser.id, message: msg }),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', otherUser.id] });
      setText('');
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${[currentUser.id, otherUser.id].sort().join('-')}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'messages',
        filter: `receiver_id=eq.${currentUser.id}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['messages', otherUser.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser.id, otherUser.id, supabase, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    send.mutate(text.trim());
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <Avatar className="h-8 w-8">
          <AvatarImage src={otherUser.avatar_url ?? undefined} />
          <AvatarFallback>{getInitials(otherUser.full_name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold">{otherUser.full_name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {otherUser.role.replace('_', ' ')}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Say hello! 👋
          </p>
        )}
        {messages.map(msg => {
          const isOwn = msg.sender_id === currentUser.id;
          return (
            <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[70%] px-4 py-2.5 rounded-2xl text-sm',
                isOwn
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              )}>
                <p>{msg.message}</p>
                <p className={cn(
                  'text-xs mt-1',
                  isOwn ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'
                )}>
                  {formatTime(msg.created_at)}
                  {isOwn && <span className="ml-1">{msg.is_read ? '✓✓' : '✓'}</span>}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-border bg-card flex items-center gap-2">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend} disabled={!text.trim() || send.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
