import { create } from 'zustand';
import type { User } from '@/types';

interface ChatState {
  activeThread:   User | null;
  pendingMessage: string;
  setThread:  (u: User | null) => void;
  setPending: (m: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeThread:   null,
  pendingMessage: '',
  setThread:  (activeThread)   => set({ activeThread }),
  setPending: (pendingMessage) => set({ pendingMessage }),
}));