'use client';

import { useState }      from 'react';
import { FileUploader }  from '@/components/shared/FileUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { File, Upload }  from 'lucide-react';
import { toast }         from 'sonner';

interface UploadedFile {
  url:       string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

export default function ClientDocumentsPage() {
  const [uploads, setUploads] = useState<UploadedFile[]>([]);

  const handleUploaded = (file: UploadedFile) => {
    setUploads(prev => [file, ...prev]);
    toast.success('Document uploaded successfully!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground text-sm">
          Upload documents requested by your account manager
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploader
            bucket="attachments"
            onUploaded={handleUploaded}
          />
        </CardContent>
      </Card>

      {uploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploads.map((file, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <File className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.file_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <a href={file.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline">
                  View
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
