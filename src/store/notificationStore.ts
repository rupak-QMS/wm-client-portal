import { create } from 'zustand';
import type { Notification } from '@/types';

interface NotifState {
  notifications: Notification[];
  unreadCount:   number;
  set:         (n: Notification[]) => void;
  push:        (n: Notification)   => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotifState>((set) => ({
  notifications: [],
  unreadCount:   0,
  set: (notifications) => set({
    notifications,
    unreadCount: notifications.filter(n => !n.is_read).length,
  }),
  push: (n) => set(s => ({
    notifications: [n, ...s.notifications],
    unreadCount: s.unreadCount + (n.is_read ? 0 : 1),
  })),
  markAllRead: () => set(s => ({
    notifications: s.notifications.map(n => ({ ...n, is_read: true })),
    unreadCount: 0,
  })),
}));