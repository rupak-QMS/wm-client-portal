'use client';

import { useState }      from 'react';
import { useForm }       from 'react-hook-form';
import { FileUploader }  from '@/components/shared/FileUploader';
import { Button }        from '@/components/ui/button';
import { Input }         from '@/components/ui/input';
import { Label }         from '@/components/ui/label';
import { Textarea }      from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast }   from 'sonner';
import type { Client } from '@/types';

interface Props {
  open:      boolean;
  onClose:   () => void;
  onSuccess: () => void;
  clients:   Client[];
}

export function UploadReportModal({ open, onClose, onSuccess, clients }: Props) {
  const [loading,     setLoading]     = useState(false);
  const [fileData,    setFileData]    = useState<any>(null);
  const [clientId,    setClientId]    = useState('');
  const [reportType,  setReportType]  = useState('');

  const { register, handleSubmit, reset } = useForm<{
    title: string;
    description: string;
  }>();

  const handleClose = () => {
    reset();
    setFileData(null);
    setClientId('');
    setReportType('');
    onClose();
  };

  const onSubmit = async (data: { title: string; description: string }) => {
    if (!fileData)     { toast.error('Please upload a file');       return; }
    if (!clientId)     { toast.error('Please select a client');     return; }
    if (!reportType)   { toast.error('Please select a report type'); return; }
    if (!data.title)   { toast.error('Please enter a title');       return; }

    setLoading(true);
    try {
      const res = await fetch('/api/reports', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          client_id:   clientId,
          report_type: reportType,
          title:       data.title,
          description: data.description,
          file_url:    fileData.url,
          file_name:   fileData.file_name,
          file_size:   fileData.file_size,
          mime_type:   fileData.mime_type,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      toast.success('Report uploaded successfully!');
      handleClose();
      onSuccess();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Report</DialogTitle>
          <DialogDescription>Upload a new report for a client.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Client</Label>
            <Select onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seo">SEO Report</SelectItem>
                <SelectItem value="website_update">Website Update</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="Monthly SEO Report - June 2025"
              {...register('title')} disabled={loading} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="Brief description..."
              {...register('description')} disabled={loading} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>File</Label>
            <FileUploader bucket="reports" onUploaded={setFileData} />
            {fileData && (
              <p className="text-xs text-green-600 font-medium">
                ✓ {fileData.file_name} uploaded
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1"
              onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload Report
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}