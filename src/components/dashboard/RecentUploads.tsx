import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { formatTime, cn } from '@/lib/utils';

interface Report {
  id:          string;
  title:       string;
  report_type: string;
  created_at:  string;
  client?: { company_name: string } | null;
  uploader?: { full_name: string } | null;
}

const typeBadgeColor: Record<string, string> = {
  seo:            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  website_update: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  analytics:      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  audit:          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  other:          'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export function RecentUploads({ reports }: { reports: Report[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Uploads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No reports yet
          </p>
        )}
        {reports.map(r => (
          <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground">
                {r.client?.company_name} · {r.uploader?.full_name}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                typeBadgeColor[r.report_type] ?? typeBadgeColor.other
              )}>
                {r.report_type.replace('_', ' ')}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTime(r.created_at)}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}