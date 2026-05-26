import { useQuery } from '@tanstack/react-query';
import type { User } from '@/types';

export function useUser() {
  return useQuery<User>({
    queryKey: ['user'],
    queryFn:  async () => (await (await fetch('/api/users')).json()).data,
  });
}