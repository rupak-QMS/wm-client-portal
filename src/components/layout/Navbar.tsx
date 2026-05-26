'use client';

import { ThemeToggle } from './ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';
import type { User } from '@/types';

const roleLabels: Record<string, string> = {
  manager:         'Manager',
  account_manager: 'Account Manager',
  client:          'Client',
};

export function Navbar({ user }: { user: User }) {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 flex-shrink-0">
      <div className="text-sm text-muted-foreground">
        Welcome back,{' '}
        <span className="font-semibold text-foreground">{user.full_name}</span>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">{user.full_name}</p>
            <Badge variant="secondary" className="text-xs mt-1">
              {roleLabels[user.role]}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}