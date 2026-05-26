'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, UserCheck, FileText,
  CheckCircle, Settings, MessageSquare, FolderOpen, LogOut,
} from 'lucide-react';
import type { UserRole } from '@/types';
import { logoutAction } from '@/lib/auth';

interface NavItem { label: string; href: string; icon: React.ElementType }

const managerNav: NavItem[] = [
  { label: 'Dashboard',        href: '/manager/dashboard',        icon: LayoutDashboard },
  { label: 'Account Managers', href: '/manager/account-managers', icon: UserCheck },
  { label: 'Clients',          href: '/manager/clients',          icon: Users },
  { label: 'Reports',          href: '/manager/reports',          icon: FileText },
  { label: 'Approvals',        href: '/manager/approvals',        icon: CheckCircle },
  { label: 'Settings',         href: '/manager/settings',         icon: Settings },
];

const accountManagerNav: NavItem[] = [
  { label: 'Dashboard', href: '/account/dashboard', icon: LayoutDashboard },
  { label: 'Clients',   href: '/account/clients',   icon: Users },
  { label: 'Reports',   href: '/account/reports',   icon: FileText },
  { label: 'Chat',      href: '/account/chat',      icon: MessageSquare },
];

const clientNav: NavItem[] = [
  { label: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { label: 'Reports',   href: '/client/reports',   icon: FileText },
  { label: 'Messages',  href: '/client/messages',  icon: MessageSquare },
  { label: 'Documents', href: '/client/documents', icon: FolderOpen },
];

const navMap: Record<UserRole, NavItem[]> = {
  manager:         managerNav,
  account_manager: accountManagerNav,
  client:          clientNav,
};

const roleLabels: Record<UserRole, string> = {
  manager:         'Manager',
  account_manager: 'Account Manager',
  client:          'Client',
};

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items    = navMap[role];

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
  <img src="/logo.svg" alt="Web Maniacs" className="h-8 w-auto" />
  <div>
    <p className="text-sm font-bold leading-none">Client Portal</p>
    <p className="text-xs text-muted-foreground mt-0.5">Web Maniacs Ltd</p>
  </div>
</div>

      {/* Role badge */}
      <div className="px-4 pt-4 pb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {roleLabels[role]}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              active
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}>
              <Icon className={cn('h-4 w-4 flex-shrink-0', active && 'text-primary')} />
              {label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border">
        <form action={logoutAction}>
          <button type="submit" className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
