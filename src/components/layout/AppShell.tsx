'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  LayoutDashboard, Users, FileText, TrendingUp,
  MessageSquare, Settings, LogOut, Bell, Search,
  Menu, X, ChevronRight,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/clients',   icon: Users,           label: 'Clients'   },
  { href: '/dashboard/reports',   icon: FileText,        label: 'Reports'   },
  { href: '/dashboard/upsells',   icon: TrendingUp,      label: 'Upsells'   },
  { href: '/dashboard/chat',      icon: MessageSquare,   label: 'Chat'      },
  { href: '/dashboard/settings',  icon: Settings,        label: 'Settings'  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const supabase  = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.push('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#06060f' }}>

      {/* ── Background layers ── */}
      <div className="wm-grid-bg" />
      {[
        { w:400, h:400, bg:'rgba(124,58,237,.18)',  top:-100, left:-80,  anim:'float1 10s ease-in-out infinite' },
        { w:300, h:300, bg:'rgba(59,130,246,.14)',  bottom:0, right:200, anim:'float2 13s ease-in-out infinite' },
        { w:200, h:200, bg:'rgba(236,72,153,.12)',  top:300,  right:50,  anim:'float3 15s ease-in-out infinite' },
      ].map((o, i) => (
        <div key={i} className="wm-orb" style={{
          width: o.w, height: o.h,
          background: `radial-gradient(circle,${o.bg} 0%,transparent 70%)`,
          top: (o as any).top, left: (o as any).left,
          bottom: (o as any).bottom, right: (o as any).right,
          animation: o.anim,
        }} />
      ))}

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:49, backdropFilter:'blur(4px)' }}
        />
      )}

      {/* ══ SIDEBAR ══ */}
      <aside className={`wm-sidebar ${mobileOpen ? 'open' : ''}`}>

        {/* Logo */}
        <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid rgba(124,58,237,.1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:36, height:36, borderRadius:10,
              background:'linear-gradient(135deg,#7c3aed,#3b82f6)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:13, fontWeight:800, color:'#fff',
              boxShadow:'0 0 16px rgba(124,58,237,.5)',
              flexShrink:0,
            }}>WM</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9' }}>Web Maniacs</div>
              <div style={{ fontSize:10, color:'rgba(148,163,184,.45)', letterSpacing:'.04em' }}>CLIENT PORTAL</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:2 }}>
          <div style={{ fontSize:'.65rem', color:'rgba(100,116,139,.5)', textTransform:'uppercase', letterSpacing:'.08em', padding:'0 6px', marginBottom:8 }}>
            Navigation
          </div>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className={`wm-nav-item ${active ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}>
                <Icon size={16} aria-hidden />
                {label}
                {active && <ChevronRight size={12} style={{ marginLeft:'auto', color:'rgba(167,139,250,.5)' }} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'12px', borderTop:'1px solid rgba(124,58,237,.1)' }}>
          <button className="wm-nav-item" onClick={handleLogout}
            style={{ color:'rgba(248,113,113,.7)', width:'100%' }}>
            <LogOut size={16} aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div className="wm-page">

        {/* Topbar */}
        <header className="wm-topbar">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button
              onClick={() => setMobileOpen(v => !v)}
              style={{ background:'none', border:'none', color:'rgba(148,163,184,.6)', cursor:'pointer', padding:4, display:'none' }}
              className="mobile-menu-btn"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {/* Search bar */}
            <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
              <Search size={14} style={{ position:'absolute', left:11, color:'rgba(148,163,184,.3)', pointerEvents:'none' }} />
              <input
                className="wm-input"
                placeholder="Search..."
                style={{ paddingLeft:32, height:34, width:220, fontSize:'.82rem' }}
              />
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {/* Notification bell */}
            <button style={{
              width:34, height:34, borderRadius:9,
              background:'rgba(255,255,255,.04)',
              border:'0.5px solid rgba(255,255,255,.07)',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', position:'relative', color:'rgba(148,163,184,.6)',
              transition:'all .2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(124,58,237,.12)'; (e.currentTarget as HTMLButtonElement).style.color='#a78bfa'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background='rgba(255,255,255,.04)'; (e.currentTarget as HTMLButtonElement).style.color='rgba(148,163,184,.6)'; }}
              aria-label="Notifications"
            >
              <Bell size={15} />
              <span style={{
                position:'absolute', top:6, right:6,
                width:6, height:6, borderRadius:'50%',
                background:'#f472b6',
                boxShadow:'0 0 6px #f472b6',
                animation:'dotPulse 2s ease-in-out infinite',
              }} />
            </button>
            {/* Avatar */}
            <div style={{
              width:34, height:34, borderRadius:9,
              background:'linear-gradient(135deg,#7c3aed,#3b82f6)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, fontWeight:700, color:'#fff', cursor:'pointer',
              boxShadow:'0 0 12px rgba(124,58,237,.35)',
            }}>WM</div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ position:'relative', zIndex:1 }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) { .mobile-menu-btn { display:flex !important; } }
      `}</style>
    </div>
  );
}