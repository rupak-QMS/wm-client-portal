'use client';

import { useQuery }  from '@tanstack/react-query';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ReportCard } from '@/components/reports/ReportCard';
import { FileText, MessageSquare, Bell, LayoutDashboard, Sparkles } from 'lucide-react';
import type { Report } from '@/types';

export default function ClientDashboard() {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn:  async () => (await (await fetch('/api/users/me')).json()).data,
  });

  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn:  async () => (await (await fetch('/api/reports')).json()).data ?? [],
  });

  const latestReports = reports.slice(0, 3);
  const firstName = currentUser?.full_name?.split(' ')[0] ?? 'there';

  return (
    <div className="wm-page-inner">

      {/* ── Welcome header ── */}
      <div style={{ marginBottom: 28 }} className="wm-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <LayoutDashboard size={15} style={{ color: '#f472b6' }} />
          <span style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            My Portal
          </span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
          Welcome back, {firstName} 👋
        </h1>
        <p style={{ fontSize: '.875rem', color: 'rgba(148,163,184,.5)' }}>
          Here's your client portal overview
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }} className="wm-fade-up">
        <StatsCard title="Total Reports"    value={reports.length} icon={FileText}      color="blue"  />
        <StatsCard title="Unread Messages"  value={0}              icon={MessageSquare} color="green" />
        <StatsCard title="Notifications"    value={0}              icon={Bell}          color="amber" />
      </div>

      {/* ── Latest reports ── */}
      <div className="wm-fade-up-2">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Sparkles size={15} style={{ color: '#a78bfa' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' }}>Latest Reports</h2>
        </div>

        {latestReports.length === 0 ? (
          <div className="wm-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, margin: '0 auto 14px',
              background: 'rgba(96,165,250,.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#60a5fa',
            }}>
              <FileText size={22} aria-hidden />
            </div>
            <p style={{ fontSize: '.9rem', color: 'rgba(148,163,184,.5)', marginBottom: 4 }}>
              No reports yet
            </p>
            <p style={{ fontSize: '.8rem', color: 'rgba(148,163,184,.3)' }}>
              Your account manager will upload reports here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {latestReports.map(report => (
              <ReportCard
                key={report.id}
                report={report}
                currentUserId={currentUser?.id ?? ''}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}