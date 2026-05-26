'use client';

import { useState }        from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge }           from '@/components/ui/badge';
import { Button }          from '@/components/ui/button';
import { CommentSection }  from './CommentSection';
import { formatTime, formatFileSize } from '@/lib/utils';
import { FileText, Download, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import type { Report } from '@/types';

const typeBadgeColor: Record<string, string> = {
  seo:            'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  website_update: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  analytics:      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  audit:          'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  other:          'bg-gray-100   text-gray-700   dark:bg-gray-900/30   dark:text-gray-400',
};

interface Props {
  report:        Report;
  currentUserId: string;
}

export function ReportCard({ report, currentUserId }: Props) {
  const [showComments, setShowComments] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
            <FileText className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{report.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {report.client?.company_name} · Uploaded by {report.uploader?.full_name}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${typeBadgeColor[report.report_type] ?? typeBadgeColor.other}`}>
                {report.report_type.replace('_', ' ')}
              </span>
            </div>

            {report.description && (
              <p className="text-sm text-muted-foreground mt-2">{report.description}</p>
            )}

            <div className="flex items-center gap-4 mt-3">
              <span className="text-xs text-muted-foreground">
                {formatTime(report.created_at)}
              </span>
              {report.file_size && (
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(Number(report.file_size))}
                </span>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm"
                  onClick={() => setShowComments(!showComments)}>
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />
                  {report.comments?.length ?? 0}
                  {showComments
                    ? <ChevronUp className="h-3.5 w-3.5 ml-1" />
                    : <ChevronDown className="h-3.5 w-3.5 ml-1" />
                  }
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download
                  </a>
                </Button>
              </div>
            </div>

            {showComments && (
              <div className="mt-4 pt-4 border-t border-border">
                <CommentSection
                  reportId={report.id}
                  comments={report.comments ?? []}
                  currentUserId={currentUserId}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}