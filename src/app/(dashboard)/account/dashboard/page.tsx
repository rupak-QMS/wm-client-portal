'use client';

import { useQuery }      from '@tanstack/react-query';
import { StatsCard }     from '@/components/dashboard/StatsCard';
import { RecentUploads } from '@/components/dashboard/RecentUploads';
import { Users, FileText, MessageSquare, Clock, LayoutDashboard } from 'lucide-react';

export default function AMDashboard() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn:  async () => (await (await fetch('/api/clients')).json()).data ?? [],
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn:  async () => (await (await fetch('/api/reports')).json()).data ?? [],
  });

  const recentReports = reports.slice(0, 5);

  return (
    <div className="wm-page-inner">

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }} className="wm-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <LayoutDashboard size={15} style={{ color: '#60a5fa' }} />
          <span style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Overview
          </span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
          My Dashboard
        </h1>
        <p style={{ fontSize: '.875rem', color: 'rgba(148,163,184,.5)' }}>
          Your clients and recent activity
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }} className="wm-fade-up">
        <StatsCard title="Assigned Clients"  value={clients.length} icon={Users}         color="blue"   />
        <StatsCard title="Reports Uploaded"  value={reports.length} icon={FileText}      color="green"  />
        <StatsCard title="Pending Tasks"     value={0}              icon={Clock}         color="amber"  />
        <StatsCard title="Messages"          value={0}              icon={MessageSquare} color="purple" />
      </div>

      {/* ── Recent uploads ── */}
      <div className="wm-fade-up-2">
        <RecentUploads reports={recentReports} />
      </div>
    </div>
  );
}