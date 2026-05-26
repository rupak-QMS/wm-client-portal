import { useQuery } from '@tanstack/react-query';
import type { Message } from '@/types';

export function useMessages(otherUserId: string) {
  return useQuery<Message[]>({
    queryKey: ['messages', otherUserId],
    queryFn:  async () => (await (await fetch(`/api/messages?with=${otherUserId}`)).json()).data,
    enabled:  !!otherUserId,
    refetchInterval: 10_000,
  });
}