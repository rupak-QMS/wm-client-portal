'use client';

import { useQuery }        from '@tanstack/react-query';
import { StatsCard }       from '@/components/dashboard/StatsCard';
import { RecentUploads }   from '@/components/dashboard/RecentUploads';
import { Users, FileText, MessageSquare, Clock } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground text-sm">Your clients and recent activity</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Assigned Clients" value={clients.length} icon={Users} color="blue" />
        <StatsCard title="Reports Uploaded" value={reports.length} icon={FileText} color="green" />
        <StatsCard title="Pending Tasks" value={0} icon={Clock} color="amber" />
        <StatsCard title="Messages" value={0} icon={MessageSquare} color="purple" />
      </div>
      <RecentUploads reports={recentReports} />
    </div>
  );
}
