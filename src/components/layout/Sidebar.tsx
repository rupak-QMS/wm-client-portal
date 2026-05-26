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

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items    = navMap[role];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <span className="text-lg font-bold text-primary">WM</span>
        <span className="ml-2 text-sm font-semibold text-muted-foreground">
          Client Portal
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <form action={logoutAction}>
          <button type="submit"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}