'use client';

import { useState }               from 'react';
import Link                        from 'next/link';
import { usePathname, useRouter }  from 'next/navigation';
import { useAuthStore }            from '@/store/authStore';
import { createClient }            from '@/lib/supabase/client';
import { toast }                   from 'sonner';
import {
  LayoutDashboard, Users, FileText, TrendingUp, MessageSquare,
  LogOut, Bell, Search, Menu, X, ChevronRight, Target,
  CheckSquare, UserCheck,
} from 'lucide-react';

const NAV_MANAGER = [
  { href: '/manager/dashboard',        icon: LayoutDashboard, label: 'Dashboard'        },
  { href: '/manager/clients',          icon: Users,           label: 'Clients'          },
  { href: '/manager/reports',          icon: FileText,        label: 'Reports'          },
  { href: '/manager/upsells',          icon: TrendingUp,      label: 'Upsells'          },
  { href: '/manager/targets',          icon: Target,          label: 'AM Targets'       },
  { href: '/manager/approvals',        icon: CheckSquare,     label: 'Approvals'        },
  { href: '/manager/account-managers', icon: UserCheck,       label: 'Account Managers' },
  { href: '/manager/sales-team',       icon: Users,           label: 'Sales Team'       },

];

const NAV_ACCOUNT = [
  { href: '/account/dashboard', icon: LayoutDashboard, label: 'Dashboard'  },
  { href: '/account/clients',   icon: Users,           label: 'My Clients' },
  { href: '/account/reports',   icon: FileText,        label: 'Reports'    },
  { href: '/account/upsells',   icon: TrendingUp,      label: 'Upsells'    },
  { href: '/account/chat',      icon: MessageSquare,   label: 'Chat'       },
];

const NAV_SALES = [
  { href: '/sales/dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
  { href: '/sales/leads',       icon: Users,           label: 'My Leads'    },
  { href: '/sales/logs',        icon: FileText,        label: 'Sales Logs'  },
  { href: '/sales/targets',     icon: Target,          label: 'My Targets'  },
  { href: '/sales/performance', icon: TrendingUp,      label: 'Performance' },
];

const NAV_CLIENT = [
  { href: '/client/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/client/reports',    icon: FileText,        label: 'Reports'   },
  { href: '/client/messages',   icon: MessageSquare,   label: 'Messages'  },
  { href: '/client/documents',  icon: FileText,        label: 'Documents' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const user     = useAuthStore(s => s.user);
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  const nav = pathname.startsWith('/manager') ? NAV_MANAGER
            : pathname.startsWith('/account')  ? NAV_ACCOUNT
            : pathname.startsWith('/sales')    ? NAV_SALES
            : NAV_CLIENT;

  const roleLabel = pathname.startsWith('/manager') ? 'MANAGER'
                  : pathname.startsWith('/account')  ? 'ACCOUNT MGR'
                  : pathname.startsWith('/sales')    ? 'SALES TEAM'
                  : 'CLIENT';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.push('/login');
  };

  const initials = user?.full_name
    ?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'WM';

  return (
    <div style={{ minHeight: '100vh', background: '#06060f' }}>

      {/* bg grid */}
      <div className="wm-grid-bg" />

      {/* orbs */}
      {[
        { w:400, h:400, bg:'rgba(124,58,237,.16)', top:-100,  left:-80,   anim:'float1 10s ease-in-out infinite' },
        { w:300, h:300, bg:'rgba(59,130,246,.12)', bottom:-60, right:180, anim:'float2 13s ease-in-out infinite' },
        { w:200, h:200, bg:'rgba(236,72,153,.1)',  top:300,   right:50,   anim:'float3 15s ease-in-out infinite' },
      ].map((o, i) => (
        <div key={i} className="wm-orb" style={{
          width: o.w, height: o.h,
          background: `radial-gradient(circle,${o.bg} 0%,transparent 70%)`,
          top: (o as any).top, left: (o as any).left,
          bottom: (o as any).bottom, right: (o as any).right,
          animation: o.anim,
        }} />
      ))}

      {/* mobile overlay */}
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
          zIndex: 49, backdropFilter: 'blur(4px)', pointerEvents: 'auto',
        }} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`wm-sidebar ${open ? 'open' : ''}`}>

        {/* Logo */}
        <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid rgba(124,58,237,.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#fff',
              boxShadow: '0 0 16px rgba(124,58,237,.45)',
            }}>WM</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>Web Maniacs</div>
              <div style={{ fontSize: 9, color: 'rgba(148,163,184,.4)', letterSpacing: '.06em', marginTop: 1 }}>
                {roleLabel} PORTAL
              </div>
            </div>
          </div>
        </div>

        {/* User pill */}
        {user && (
          <div style={{ margin: '12px 12px 0', padding: '10px 12px', borderRadius: 10, background: 'rgba(124,58,237,.08)', border: '0.5px solid rgba(124,58,237,.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg,rgba(124,58,237,.5),rgba(59,130,246,.5))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#f1f5f9',
              }}>{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '.78rem', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.full_name}
                </div>
                <div style={{ fontSize: '.68rem', color: 'rgba(148,163,184,.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          <div style={{ fontSize: '.62rem', color: 'rgba(100,116,139,.45)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '0 6px', marginBottom: 6 }}>
            Navigation
          </div>
          {nav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href}
                className={`wm-nav-item ${active ? 'active' : ''}`}
                onClick={() => setOpen(false)}>
                <Icon size={15} aria-hidden />
                {label}
                {active && <ChevronRight size={11} style={{ marginLeft: 'auto', opacity: .5 }} />}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '10px', borderTop: '1px solid rgba(124,58,237,.08)' }}>
          <button className="wm-nav-item" onClick={handleLogout}
            style={{ color: 'rgba(248,113,113,.65)', width: '100%' }}>
            <LogOut size={15} aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="wm-page">

        {/* Topbar */}
        <header className="wm-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setOpen(v => !v)} className="mobile-menu-btn"
              style={{ background: 'none', border: 'none', color: 'rgba(148,163,184,.6)', cursor: 'pointer', padding: 4, display: 'none' }}
              aria-label="Toggle menu">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,.3)', pointerEvents: 'none' }} />
              <input className="wm-input" placeholder="Search..."
                style={{ paddingLeft: 30, height: 34, width: 200, fontSize: '.8rem' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button aria-label="Notifications" style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,.04)', border: '0.5px solid rgba(255,255,255,.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', color: 'rgba(148,163,184,.55)', transition: 'all .2s',
            }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(124,58,237,.12)'; b.style.color = '#a78bfa'; }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,.04)'; b.style.color = 'rgba(148,163,184,.55)'; }}>
              <Bell size={14} />
              <span style={{ position: 'absolute', top: 7, right: 7, width: 5, height: 5, borderRadius: '50%', background: '#f472b6', boxShadow: '0 0 5px #f472b6', animation: 'dotPulse 2s ease-in-out infinite' }} />
            </button>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer',
              boxShadow: '0 0 10px rgba(124,58,237,.3)',
            }}>{initials}</div>
          </div>
        </header>

        <main style={{ position: 'relative', zIndex: 1 }}>{children}</main>
      </div>

      <style>{`@media(max-width:768px){.mobile-menu-btn{display:flex!important;}}`}</style>
    </div>
  );
}