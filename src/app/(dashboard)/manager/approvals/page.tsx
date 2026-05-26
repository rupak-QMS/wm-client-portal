'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button }   from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Clock, Building2 } from 'lucide-react';
import { formatTime, getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import type { DeleteRequest } from '@/types';

const statusColors = {
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100   text-red-700   dark:bg-red-900/30   dark:text-red-400',
};

export default function ApprovalsPage() {
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery<DeleteRequest[]>({
    queryKey: ['delete-requests'],
    queryFn:  async () => (await (await fetch('/api/delete-requests')).json()).data,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      const res  = await fetch('/api/delete-requests', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: ['delete-requests'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
      toast.success(`Request ${action}d successfully`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending  = requests.filter(r => r.status === 'pending');
  const reviewed = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Approvals</h1>
        <p className="text-muted-foreground text-sm">
          Review and manage client deletion requests
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading...</div>
      ) : (
        <>
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Pending ({pending.length})
            </h2>

            {pending.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No pending requests 🎉
                </CardContent>
              </Card>
            )}

            {pending.map(req => (
              <Card key={req.id} className="border-amber-200 dark:border-amber-900/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{(req as any).client?.company_name}</p>
                        <p className="text-sm text-muted-foreground">{(req as any).client?.email}</p>
                        {req.reason && (
                          <p className="text-sm mt-1 text-muted-foreground">
                            <span className="font-medium">Reason:</span> {req.reason}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {getInitials((req as any).requester?.full_name ?? '?')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            Requested by {(req as any).requester?.full_name} · {formatTime(req.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => reviewMutation.mutate({ id: req.id, action: 'reject' })}
                        disabled={reviewMutation.isPending}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => reviewMutation.mutate({ id: req.id, action: 'approve' })}
                        disabled={reviewMutation.isPending}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {reviewed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Reviewed ({reviewed.length})
              </h2>
              {reviewed.map(req => (
                <Card key={req.id} className="opacity-75">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {(req as any).client?.company_name ?? 'Deleted client'}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {(req as any).requester?.full_name} · {formatTime(req.created_at)}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[req.status]}`}>
                        {req.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
