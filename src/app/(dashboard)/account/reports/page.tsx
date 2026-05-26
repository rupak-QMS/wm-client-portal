'use client';

import { useState }                 from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button }                   from '@/components/ui/button';
import { ReportCard }               from '@/components/reports/ReportCard';
import { UploadReportModal }        from '@/components/reports/UploadReportModal';
import { Upload }                   from 'lucide-react';
import type { Report, Client }      from '@/types';

export default function AMReportsPage() {
  const [showUpload, setShowUpload] = useState(false);
  const qc = useQueryClient();

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn:  async () => (await (await fetch('/api/reports')).json()).data ?? [],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn:  async () => (await (await fetch('/api/clients')).json()).data ?? [],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm">Upload and manage client reports</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Report
        </Button>
      </div>
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No reports yet</p>
          <p className="text-sm mt-1">Upload your first report</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <ReportCard key={report.id} report={report} currentUserId="" />
          ))}
        </div>
      )}
      <UploadReportModal open={showUpload} onClose={() => setShowUpload(false)} onSuccess={() => qc.invalidateQueries({ queryKey: ['reports'] })} clients={clients} />
    </div>
  );
}
