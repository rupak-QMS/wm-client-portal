'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validations/auth.schema';
import { loginAction } from '@/lib/auth';
import { Loader2, Mail, Eye, EyeOff, Lock, BarChart2, TrendingUp, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { LoginFormValues } from '@/types';

/* ─── Tiny reusable animated dot ─────────────────── */
const LiveDot = ({ color }: { color: string }) => (
  <span
    style={{
      display: 'inline-block',
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 6px ${color}`,
      animation: 'dotPulse 2s ease-in-out infinite',
    }}
  />
);

/* ─── Feature row ─────────────────────────────────── */
const Feat = ({
  icon: Icon,
  label,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  accent: string;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '11px 14px',
      borderRadius: 12,
      background: 'rgba(255,255,255,.033)',
      border: '0.5px solid rgba(255,255,255,.05)',
      transition: 'all .22s ease',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.background = 'rgba(124,58,237,.12)';
      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(124,58,237,.3)';
      (e.currentTarget as HTMLDivElement).style.transform = 'translateX(5px)';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,.033)';
      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,.05)';
      (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
    }}
  >
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        background: accent + '30',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: accent,
      }}
    >
      <Icon size={16} />
    </div>
    <span style={{ fontSize: '.8rem', color: 'rgba(148,163,184,.75)' }}>{label}</span>
  </div>
);

/* ─── Main Page ───────────────────────────────────── */
export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    const result = await loginAction(data.email, data.password);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Global keyframes injected once ── */}
      <style>{`
        @keyframes float1  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(28px,-22px) scale(1.08)} }
        @keyframes float2  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-22px,28px) scale(1.12)} }
        @keyframes float3  { 0%,100%{transform:translate(0,0)} 50%{transform:translate(16px,20px)} }
        @keyframes scan    { 0%{top:-100%} 100%{top:200%} }
        @keyframes bobPill { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes dotPulse{ 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.4);opacity:1} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimBtn { 0%{left:-100%} 100%{left:200%} }
        @keyframes bdPulse { 0%,100%{opacity:.45} 50%{opacity:1} }
        @keyframes borderGlow { 0%,100%{border-color:rgba(124,58,237,.28)} 50%{border-color:rgba(96,165,250,.5)} }

        .wm-feat:hover { background:rgba(124,58,237,.12)!important; border-color:rgba(124,58,237,.3)!important; transform:translateX(5px); }
        .wm-pill { animation: bobPill 3.5s ease-in-out infinite; }
        .wm-pill:nth-child(2) { animation-delay:.8s; }
        .wm-pill:nth-child(3) { animation-delay:1.6s; }
        .wm-card  { animation: borderGlow 4s ease-in-out infinite; }
        .wm-hero  { animation: fadeUp .7s .1s both; }
        .wm-form  { animation: fadeUp .55s .2s both; }
        .wm-btn::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent); animation:shimBtn 2.5s ease-in-out infinite; }
        .wm-btn:hover { transform:translateY(-2px); box-shadow:0 10px 35px rgba(99,102,241,.5),0 0 60px rgba(99,102,241,.15); }
        .wm-btn:active { transform:translateY(0)!important; }
        .wm-inp:focus { border-color:rgba(124,58,237,.65)!important; background:rgba(124,58,237,.07)!important; box-shadow:0 0 0 3px rgba(124,58,237,.12),0 0 20px rgba(124,58,237,.08)!important; }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          background: '#06060f',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ── Background grid ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.055,
            backgroundImage:
              'linear-gradient(rgba(139,92,246,1) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,1) 1px,transparent 1px)',
            backgroundSize: '44px 44px',
            pointerEvents: 'none',
          }}
        />

        {/* ── Scan line ── */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg,transparent,rgba(139,92,246,.4),rgba(96,165,250,.4),transparent)',
            animation: 'scan 6s linear infinite',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* ── Glowing orbs ── */}
        {[
          { w: 420, h: 420, bg: 'rgba(124,58,237,.28)', top: -120, left: -80, anim: 'float1 9s ease-in-out infinite' },
          { w: 300, h: 300, bg: 'rgba(59,130,246,.2)', bottom: -80, left: '38%', anim: 'float2 11s ease-in-out infinite' },
          { w: 220, h: 220, bg: 'rgba(236,72,153,.18)', top: '30%', right: '6%', anim: 'float3 13s ease-in-out infinite' },
        ].map((o, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              width: o.w,
              height: o.h,
              background: `radial-gradient(circle,${o.bg} 0%,transparent 70%)`,
              top: o.top,
              left: o.left,
              bottom: (o as any).bottom,
              right: (o as any).right,
              animation: o.anim,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* ══ LEFT PANEL ══ */}
        <div
          style={{
            width: '50%',
            padding: '40px 48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 2,
            borderRight: '1px solid rgba(139,92,246,.12)',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 800,
                color: '#fff',
                boxShadow: '0 0 18px rgba(124,58,237,.5)',
              }}
            >
              WM
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(241,245,249,.9)' }}>
              Web Maniacs
            </span>
          </div>

          {/* Hero */}
          <div className="wm-hero">
            <h1
              style={{
                fontSize: '2.1rem',
                fontWeight: 800,
                lineHeight: 1.22,
                color: '#f1f5f9',
                marginBottom: 12,
              }}
            >
              Your clients,
              <br />
              <span
                style={{
                  background: 'linear-gradient(90deg,#a78bfa 0%,#60a5fa 50%,#f472b6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                beautifully managed.
              </span>
            </h1>
            <p style={{ fontSize: '.88rem', color: 'rgba(148,163,184,.65)', lineHeight: 1.7, marginBottom: 28 }}>
              The all-in-one client portal for Web Maniacs Ltd.
              <br />
              Reports, upsells, and chat — in one sleek place.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* ─ Change feature text here ─ */}
              <Feat icon={BarChart2}   label="Track SEO & website performance reports" accent="#a78bfa" />
              <Feat icon={TrendingUp}  label="Monitor upsells and revenue targets"      accent="#60a5fa" />
              <Feat icon={MessageCircle} label="Real-time client communication"         accent="#f472b6" />
            </div>

            {/* Live status pills */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 28 }}>
              {[
                { dot: '#34d399', text: '4 clients online' },
                { dot: '#fbbf24', text: '2 new reports' },
                { dot: '#f472b6', text: '1 upsell ready' },
              ].map(({ dot, text }) => (
                <div
                  key={text}
                  className="wm-pill"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    borderRadius: 50,
                    background: 'rgba(255,255,255,.04)',
                    border: '0.5px solid rgba(255,255,255,.07)',
                    fontSize: '.72rem',
                    color: 'rgba(148,163,184,.7)',
                  }}
                >
                  <LiveDot color={dot} />
                  {text}
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '.7rem', color: 'rgba(100,116,139,.5)' }}>
            © {new Date().getFullYear()} Web Maniacs Ltd. All rights reserved.
          </p>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '36px 48px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            className="wm-card"
            style={{
              width: '100%',
              maxWidth: 370,
              background: 'rgba(10,10,28,.85)',
              border: '1px solid rgba(124,58,237,.28)',
              borderRadius: 22,
              padding: '34px 32px',
              backdropFilter: 'blur(24px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top shimmer line */}
            <div
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: 1,
                background: 'linear-gradient(90deg,transparent,rgba(167,139,250,.6),rgba(96,165,250,.5),transparent)',
              }}
            />
            {/* Inner scan */}
            <div
              style={{
                position: 'absolute',
                left: 0, right: 0,
                height: 60,
                background: 'linear-gradient(to bottom,transparent,rgba(124,58,237,.04),transparent)',
                animation: 'scan 4s linear infinite',
                pointerEvents: 'none',
              }}
            />

            {/* Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 11px',
                borderRadius: 20,
                background: 'rgba(124,58,237,.13)',
                border: '0.5px solid rgba(124,58,237,.28)',
                fontSize: '.7rem',
                color: '#a78bfa',
                marginBottom: 18,
                letterSpacing: '.02em',
              }}
            >
              <span
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#a78bfa',
                  animation: 'bdPulse 1.8s ease-in-out infinite',
                  display: 'inline-block',
                }}
              />
              Secure Portal Access
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '.82rem', color: 'rgba(148,163,184,.55)', marginBottom: 26 }}>
              Sign in to manage your clients
            </p>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="wm-form"
              style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
            >
              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{ fontSize: '.72rem', fontWeight: 500, color: 'rgba(148,163,184,.65)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}
                >
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@webmaniacs.com"
                    disabled={loading}
                    className="wm-inp"
                    style={{
                      width: '100%', height: 44,
                      background: 'rgba(255,255,255,.04)',
                      border: '1px solid rgba(124,58,237,.18)',
                      borderRadius: 11,
                      padding: '0 40px 0 14px',
                      fontSize: '.88rem',
                      color: '#f1f5f9',
                      outline: 'none',
                      transition: 'all .25s',
                    }}
                  />
                  <Mail size={15} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,.3)', pointerEvents: 'none' }} />
                </div>
                {errors.email && (
                  <p style={{ color: '#f87171', fontSize: '.72rem', marginTop: 4 }}>{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '.72rem', fontWeight: 500, color: 'rgba(148,163,184,.65)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    Password
                  </label>
                  <Link href="/forgot-password" style={{ fontSize: '.72rem', color: '#a78bfa', textDecoration: 'none' }}>
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    {...register('password')}
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    disabled={loading}
                    className="wm-inp"
                    style={{
                      width: '100%', height: 44,
                      background: 'rgba(255,255,255,.04)',
                      border: '1px solid rgba(124,58,237,.18)',
                      borderRadius: 11,
                      padding: '0 40px 0 14px',
                      fontSize: '.88rem',
                      color: '#f1f5f9',
                      outline: 'none',
                      transition: 'all .25s',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,.35)', padding: 2 }}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p style={{ color: '#f87171', fontSize: '.72rem', marginTop: 4 }}>{errors.password.message}</p>
                )}
              </div>

              {/* Remember me */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <input type="checkbox" id="remember" style={{ accentColor: '#7c3aed', cursor: 'pointer' }} />
                <label htmlFor="remember" style={{ fontSize: '.78rem', color: 'rgba(148,163,184,.55)', cursor: 'pointer' }}>
                  Keep me signed in
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="wm-btn"
                style={{
                  width: '100%', height: 46,
                  border: 'none', borderRadius: 13,
                  background: 'linear-gradient(135deg,#7c3aed 0%,#4f46e5 45%,#2563eb 100%)',
                  color: '#fff', fontSize: '.9rem', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  position: 'relative', overflow: 'hidden',
                  letterSpacing: '.03em',
                  transition: 'transform .15s, box-shadow .25s',
                  opacity: loading ? .7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                Sign in to Portal →
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(139,92,246,.25),transparent)' }} />
              <span style={{ fontSize: '.7rem', color: 'rgba(100,116,139,.5)' }}>need help?</span>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(139,92,246,.25),transparent)' }} />
            </div>

            <p style={{ textAlign: 'center', fontSize: '.75rem', color: 'rgba(100,116,139,.55)' }}>
              No access yet?{' '}
              <span
                style={{ color: '#a78bfa', cursor: 'pointer' }}
                onClick={() => toast.info('Contact hello@webmaniacs.com')}
              >
                Contact your account manager
              </span>
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16, fontSize: '.7rem', color: 'rgba(100,116,139,.4)' }}>
              <Lock size={11} />
              256-bit encrypted connection
            </div>
          </div>
        </div>
      </div>
    </>
  );
}