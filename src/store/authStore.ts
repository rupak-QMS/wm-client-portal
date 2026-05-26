import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  clear:   () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:    null,
      setUser: (user) => set({ user }),
      clear:   ()     => set({ user: null }),
    }),
    { name: 'wm-auth' }
  )
);