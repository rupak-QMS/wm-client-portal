'use client';

import { useCallback, useState } from 'react';
import { useDropzone }           from 'react-dropzone';
import { Upload, X, File, Loader2 } from 'lucide-react';
import { cn, formatFileSize }    from '@/lib/utils';
import { Button }                from '@/components/ui/button';
import { Progress }              from '@/components/ui/progress';
import { toast }                 from 'sonner';

interface UploadResult {
  url:       string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

interface Props {
  bucket?:    string;
  onUploaded: (result: UploadResult) => void;
  accept?:    Record<string, string[]>;
}

export function FileUploader({
  bucket = 'reports',
  onUploaded,
  accept = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
  },
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [file,      setFile]      = useState<File | null>(null);

  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setUploading(true);
    setProgress(20);

    try {
      const fd = new FormData();
      fd.append('file',   f);
      fd.append('bucket', bucket);
      setProgress(50);

      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      setProgress(100);

      if (!res.ok) throw new Error(json.error || 'Upload failed');

      onUploaded(json.data);
      toast.success('File uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
      setFile(null);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [bucket, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize:  50 * 1024 * 1024,
    multiple: false,
    disabled: uploading,
  });

  return (
    <div className="space-y-3">
      <div {...getRootProps()} className={cn(
        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50',
        uploading && 'opacity-50 cursor-not-allowed'
      )}>
        <input {...getInputProps()} />
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">
          {isDragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, DOCX, JPG, PNG up to 50MB
        </p>
      </div>

      {file && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <File className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
          {uploading
            ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
            : (
              <Button size="icon" variant="ghost"
                onClick={() => setFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            )
          }
        </div>
      )}

      {progress > 0 && progress < 100 && (
        <Progress value={progress} className="h-1.5" />
      )}
    </div>
  );
}