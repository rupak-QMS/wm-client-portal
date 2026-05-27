'use client';
import { useState }     from 'react';
import { FileUploader } from '@/components/shared/FileUploader';
import { File, Upload, ExternalLink } from 'lucide-react';
import { toast }        from 'sonner';

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
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ marginBottom: 28 }} className="wm-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Upload size={15} style={{ color: '#a78bfa' }} />
          <span style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Files</span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Documents</h1>
        <p style={{ fontSize: '.875rem', color: 'rgba(148,163,184,.5)' }}>Upload documents requested by your account manager</p>
      </div>

      {/* Upload card */}
      <div className="wm-card wm-fade-up-2" style={{ padding: '24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(167,139,250,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
            <Upload size={14} />
          </div>
          <p style={{ fontSize: '.9rem', fontWeight: 600, color: '#f1f5f9' }}>Upload Document</p>
        </div>
        <FileUploader bucket="attachments" onUploaded={handleUploaded} />
      </div>

      {/* Uploaded list */}
      {uploads.length > 0 && (
        <div className="wm-card wm-fade-up-3" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(124,58,237,.1)' }}>
            <p style={{ fontSize: '.9rem', fontWeight: 600, color: '#f1f5f9' }}>Uploaded Documents</p>
          </div>
          <div style={{ padding: '8px 0' }}>
            {uploads.map((file, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 20px',
                borderBottom: i < uploads.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
                transition: 'background .2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: 'rgba(167,139,250,.1)', border: '0.5px solid rgba(167,139,250,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                  <File size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '.85rem', fontWeight: 500, color: '#f1f5f9', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.file_name}
                  </p>
                  <p style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.4)' }}>
                    {(file.file_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <a href={file.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.75rem', color: '#a78bfa', textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#c4b5fd')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#a78bfa')}>
                  <ExternalLink size={12} /> View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}