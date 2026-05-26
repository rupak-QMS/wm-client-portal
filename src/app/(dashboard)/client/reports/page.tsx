'use client';

import { useQuery }    from '@tanstack/react-query';
import { ReportCard }  from '@/components/reports/ReportCard';
import { Card, CardContent } from '@/components/ui/card';
import type { Report } from '@/types';

export default function ClientReportsPage() {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn:  async () => (await (await fetch('/api/users/me')).json()).data,
  });

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn:  async () => (await (await fetch('/api/reports')).json()).data ?? [],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Reports</h1>
        <p className="text-muted-foreground text-sm">
          All reports uploaded by your account manager
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading...</div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p className="text-lg font-medium">No reports yet</p>
            <p className="text-sm mt-1">
              Your account manager will upload reports here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              currentUserId={currentUser?.id ?? ''}
            />
          ))}
        </div>
      )}
    </div>
  );
}
