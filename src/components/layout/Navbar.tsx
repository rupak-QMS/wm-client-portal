'use client';

import { ThemeToggle } from './ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge }   from '@/components/ui/badge';
import { Bell }    from 'lucide-react';
import { Button }  from '@/components/ui/button';
import { getInitials } from '@/lib/utils';
import type { User } from '@/types';

const roleLabels: Record<string, string> = {
  manager:         'Manager',
  account_manager: 'Account Manager',
  client:          'Client',
};

const roleColors: Record<string, string> = {
  manager:         'bg-purple-500/20 text-purple-400 border-purple-500/30',
  account_manager: 'bg-blue-500/20   text-blue-400   border-blue-500/30',
  client:          'bg-green-500/20  text-green-400  border-green-500/30',
};

export function Navbar({ user }: { user: User }) {
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm font-semibold">{user.full_name}</p>
          <p className="text-xs text-muted-foreground">
            Welcome back 👋
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </Button>
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
          <Avatar className="h-8 w-8 ring-2 ring-border">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs bg-accent">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-xs font-medium leading-none">{user.full_name}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium mt-0.5 inline-block ${roleColors[user.role]}`}>
              {roleLabels[user.role]}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
