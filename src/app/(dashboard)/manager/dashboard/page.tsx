import { redirect }       from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import prisma             from '@/lib/prisma';
import { StatsCard }      from '@/components/dashboard/StatsCard';
import { ActivityFeed }   from '@/components/dashboard/ActivityFeed';
import { RecentUploads }  from '@/components/dashboard/RecentUploads';
import { Users, UserCheck, ClipboardCheck, FileText, LayoutDashboard } from 'lucide-react';

export default async function ManagerDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'manager') redirect('/login');

  const [clientCount, amCount, pendingApprovals, reportCount, recentLogs, recentReports] =
    await Promise.all([
      prisma.client.count(),
      prisma.user.count({ where: { role: 'account_manager' } }),
      prisma.deleteRequest.count({ where: { status: 'pending' } }),
      prisma.report.count(),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: { user: { select: { full_name: true, avatar_url: true } } },
      }),
      prisma.report.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          client:   { select: { company_name: true } },
          uploader: { select: { full_name: true } },
        },
      }),
    ]);

  const serializedLogs = recentLogs.map(log => ({
    ...log,
    created_at: log.created_at.toISOString(),
  }));

  const serializedReports = recentReports.map(r => ({
    ...r,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
    file_size:  r.file_size ? Number(r.file_size) : null,
  }));

  return (
    <div className="wm-page-inner">

      {/* ── Header ── */}
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

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }} className="wm-fade-up">
        <StatsCard title="Total Clients"     value={clientCount}      icon={Users}          color="blue"   />
        <StatsCard title="Account Managers"  value={amCount}          icon={UserCheck}      color="green"  />
        <StatsCard title="Pending Approvals" value={pendingApprovals} icon={ClipboardCheck} color="amber"  trend={pendingApprovals > 0 ? 'up' : undefined} />
        <StatsCard title="Total Reports"     value={reportCount}      icon={FileText}       color="purple" />
      </div>

      {/* ── Bottom grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }} className="wm-fade-up-2">
        <ActivityFeed  logs={serializedLogs} />
        <RecentUploads reports={serializedReports} />
      </div>
    </div>
  );
}