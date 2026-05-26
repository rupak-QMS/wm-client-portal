'use client';

import { ThemeToggle }    from './ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell }           from 'lucide-react';
import { Button }         from '@/components/ui/button';
import { getInitials }    from '@/lib/utils';
import type { User }      from '@/types';

const roleLabels: Record<string, string> = {
  manager:         'Manager',
  account_manager: 'Account Manager',
  client:          'Client',
};

const roleBadgeColors: Record<string, string> = {
  manager:         'bg-purple-500/20 text-purple-400',
  account_manager: 'bg-blue-500/20   text-blue-400',
  client:          'bg-green-500/20  text-green-400',
};

export function Navbar({ user }: { user: User }) {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 flex-shrink-0"
      style={{ background: 'hsl(224 71% 5%)' }}>

      {/* Left */}
      <div>
        <p className="text-sm font-semibold text-foreground">
          Welcome back, {user.full_name.split(' ')[0]} 👋
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
        </Button>

        <div className="flex items-center gap-2.5 ml-1 pl-3 border-l border-border">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback
              className="text-xs font-bold"
              style={{ background: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))' }}>
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-xs font-semibold leading-none text-foreground">{user.full_name}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block ${roleBadgeColors[user.role]}`}>
              {roleLabels[user.role]}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
