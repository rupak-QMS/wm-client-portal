import { redirect }       from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import prisma             from '@/lib/prisma';
import { StatsCard }      from '@/components/dashboard/StatsCard';
import { ActivityFeed }   from '@/components/dashboard/ActivityFeed';
import { RecentUploads }  from '@/components/dashboard/RecentUploads';
import { Users, UserCheck, ClipboardCheck, FileText } from 'lucide-react';

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
        include: {
          user: { select: { full_name: true, avatar_url: true } },
        },
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manager Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of all portal activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Total Clients"     value={clientCount}      icon={Users}         color="blue" />
        <StatsCard title="Account Managers"  value={amCount}          icon={UserCheck}     color="green" />
        <StatsCard title="Pending Approvals" value={pendingApprovals} icon={ClipboardCheck} color="amber" trend={pendingApprovals > 0 ? 'up' : undefined} />
        <StatsCard title="Total Reports"     value={reportCount}      icon={FileText}      color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed  logs={serializedLogs} />
        <RecentUploads reports={serializedReports} />
      </div>
    </div>
  );
}
