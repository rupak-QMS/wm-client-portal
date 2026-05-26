import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, formatTime } from '@/lib/utils';

interface Log {
  id:         string;
  action:     string;
  created_at: string;
  user?: {
    full_name:  string;
    avatar_url?: string | null;
  } | null;
}

export function ActivityFeed({ logs }: { logs: Log[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {logs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No activity yet
          </p>
        )}
        {logs.map(log => (
          <div key={log.id} className="flex items-start gap-3">
            <Avatar className="h-7 w-7 mt-0.5">
              <AvatarImage src={log.user?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">
                {log.user ? getInitials(log.user.full_name) : '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{log.user?.full_name ?? 'System'}</span>
                {' '}{log.action}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatTime(log.created_at)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}