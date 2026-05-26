import { useQuery } from '@tanstack/react-query';
import type { Notification } from '@/types';

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn:  async () => (await (await fetch('/api/notifications')).json()).data,
    refetchInterval: 30_000,
  });
}