'use client';
import { useQuery }      from '@tanstack/react-query';
import { StatsCard }     from '@/components/dashboard/StatsCard';
import { ActivityFeed }  from '@/components/dashboard/ActivityFeed';
import { RecentUploads } from '@/components/dashboard/RecentUploads';
import { Users, UserCheck, ClipboardCheck, FileText, LayoutDashboard } from 'lucide-react';

export default function ManagerDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['manager-stats'],
    queryFn:  async () => (await (await fetch('/api/dashboard/stats')).json()).data,
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ['activity-logs'],
    queryFn:  async () => (await (await fetch('/api/activity-logs')).json()).data ?? [],
  });

  const { data: recentReports = [] } = useQuery({
    queryKey: ['recent-reports'],
    queryFn:  async () => (await (await fetch('/api/reports?limit=5')).json()).data ?? [],
  });

  const clientCount      = stats?.clientCount      ?? '—';
  const amCount          = stats?.amCount          ?? '—';
  const pendingApprovals = stats?.pendingApprovals ?? 0;
  const reportCount      = stats?.reportCount      ?? '—';

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ marginBottom: 28 }} className="wm-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <LayoutDashboard size={15} style={{ color: '#a78bfa' }} />
          <span style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Overview
          </span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
          Manager Dashboard
        </h1>
        <p style={{ fontSize: '.875rem', color: 'rgba(148,163,184,.5)' }}>
          Overview of all portal activity
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }} className="wm-fade-up">
        <StatsCard title="Total Clients"     value={clientCount}      icon={Users}          color="blue"   />
        <StatsCard title="Account Managers"  value={amCount}          icon={UserCheck}      color="green"  />
        <StatsCard title="Pending Approvals" value={pendingApprovals} icon={ClipboardCheck} color="amber"  trend={pendingApprovals > 0 ? 'up' : undefined} />
        <StatsCard title="Total Reports"     value={reportCount}      icon={FileText}       color="purple" />
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }} className="wm-fade-up-2">
        <ActivityFeed  logs={recentLogs} />
        <RecentUploads reports={recentReports} />
      </div>
    </div>
  );
}