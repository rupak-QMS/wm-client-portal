'use client';

import { useQuery }      from '@tanstack/react-query';
import { StatsCard }     from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessageSquare, Bell, Download } from 'lucide-react';
import { ReportCard }    from '@/components/reports/ReportCard';
import type { Report }   from '@/types';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome, {currentUser?.full_name ?? 'Client'}
        </h1>
        <p className="text-muted-foreground text-sm">
          Your client portal overview
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Reports"
          value={reports.length}
          icon={FileText}
          color="blue"
        />
        <StatsCard
          title="Unread Messages"
          value={0}
          icon={MessageSquare}
          color="green"
        />
        <StatsCard
          title="Notifications"
          value={0}
          icon={Bell}
          color="amber"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Latest Reports</h2>
        {latestReports.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No reports yet. Your account manager will upload reports here.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
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
