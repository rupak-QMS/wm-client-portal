import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Report } from '@/types';

export function useReports(clientId?: string) {
  const params = clientId ? `?client_id=${clientId}` : '';
  return useQuery<Report[]>({
    queryKey: ['reports', clientId],
    queryFn:  async () => (await (await fetch(`/api/reports${params}`)).json()).data,
  });
}

export function useUploadReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      client_id:   string;
      report_type: string;
      title:       string;
      description?: string;
      file_url:    string;
      file_name:   string;
      file_size?:  number;
      mime_type?:  string;
    }) => {
      const res = await fetch('/api/reports', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report uploaded successfully');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddComment(reportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (comment: string) => {
      const res = await fetch('/api/comments', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ report_id: reportId, comment }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Comment added');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}