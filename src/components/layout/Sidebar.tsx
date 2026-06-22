'use client';

import Link           from 'next/link';
import { usePathname } from 'next/navigation';
import { cn }         from '@/lib/utils';
import {
  LayoutDashboard, Users, UserCheck, FileText,
  CheckCircle, Settings, MessageSquare, FolderOpen,
  LogOut, Target, TrendingUp, Crown,
} from 'lucide-react';
import type { UserRole } from '@/types';
import { logoutAction }  from '@/lib/auth';

interface NavItem { label: string; href: string; icon: React.ElementType }

const managerNav: NavItem[] = [
  { label: 'Dashboard',        href: '/manager/dashboard',        icon: LayoutDashboard },
  { label: 'Account Managers', href: '/manager/account-managers', icon: UserCheck },
  { label: 'Clients',          href: '/manager/clients',          icon: Users },
  { label: 'Reports',          href: '/manager/reports',          icon: FileText },
  { label: 'Upsells',          href: '/manager/upsells',          icon: TrendingUp },
  { label: 'Targets',          href: '/manager/targets',          icon: Target },
  { label: 'Approvals',        href: '/manager/approvals',        icon: CheckCircle },
  { label: 'Settings',         href: '/manager/settings',         icon: Settings },
];

const accountManagerNav: NavItem[] = [
  { label: 'Dashboard', href: '/account/dashboard', icon: LayoutDashboard },
  { label: 'Clients',   href: '/account/clients',   icon: Users },
  { label: 'Reports',   href: '/account/reports',   icon: FileText },
  { label: 'Upsells',   href: '/account/upsells',   icon: TrendingUp },
  { label: 'Chat',      href: '/account/chat',      icon: MessageSquare },
];

const salesTeamNav: NavItem[] = [
  { label: 'Dashboard',   href: '/sales/dashboard',   icon: LayoutDashboard },
  { label: 'My Sales',    href: '/sales/leads',       icon: Users },
  { label: 'Notepad',     href: '/sales/notes',       icon: FileText },
  { label: 'My Team',     href: '/sales/team',        icon: UserCheck },
  { label: 'My Targets',  href: '/sales/targets',     icon: Target },
  { label: 'Performance', href: '/sales/performance', icon: TrendingUp },
];

const teamLeaderNav: NavItem[] = [
  { label: 'Dashboard', href: '/team-leader/dashboard', icon: LayoutDashboard },
  { label: 'My Agents', href: '/team-leader/agents',    icon: Users },
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
  sales_team:      salesTeamNav,
  team_leader:     teamLeaderNav,
  client:          clientNav,
};

const roleLabels: Record<UserRole, string> = {
  manager:         'Manager',
  account_manager: 'Account Manager',
  sales_team:      'Sales Team',
  team_leader:     'Team Leader',
  client:          'Client',
};

const roleBadgeColors: Record<UserRole, string> = {
  manager:         'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  account_manager: 'bg-blue-500/20   text-blue-400   border border-blue-500/30',
  sales_team:      'bg-pink-500/20   text-pink-400   border border-pink-500/30',
  team_leader:     'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  client:          'bg-green-500/20  text-green-400  border border-green-500/30',
};

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items    = navMap[role];

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r border-border"
      style={{ background: 'hsl(224 71% 5%)' }}>

      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
        <img src="/logo.png" alt="Web Maniacs"
          style={{ height: '30px', width: 'auto', background: 'white', padding: '3px 6px', borderRadius: '6px' }} />
        <div>
          <p className="text-xs font-bold leading-none text-foreground">Client Portal</p>
          <p className="text-xs text-muted-foreground mt-0.5">Web Maniacs Ltd</p>
        </div>
      </div>

      {/* Role */}
      <div className="px-4 pt-5 pb-2">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${roleBadgeColors[role]}`}>
          {role === 'team_leader' && <Crown className="h-3 w-3" />}
          {roleLabels[role]}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
              active
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            )}>
              <Icon className={cn(
                'h-4 w-4 flex-shrink-0 transition-colors',
                active ? 'text-primary' : 'group-hover:text-foreground'
              )} />
              <span>{label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border">
        <form action={logoutAction}>
          <button type="submit"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all group">
            <LogOut className="h-4 w-4 group-hover:text-red-400 transition-colors" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}