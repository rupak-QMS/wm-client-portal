'use client';
import { useState }                 from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ReportCard }               from '@/components/reports/ReportCard';
import { UploadReportModal }        from '@/components/reports/UploadReportModal';
import { Upload, FileText }         from 'lucide-react';
import { useAuthStore }             from '@/store/authStore';
import type { Report, Client }      from '@/types';

export default function ManagerReportsPage() {
  const [showUpload, setShowUpload] = useState(false);
  const user = useAuthStore(s => s.user);
  const qc   = useQueryClient();

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn:  async () => (await (await fetch('/api/reports')).json()).data,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn:  async () => (await (await fetch('/api/clients')).json()).data,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['reports'] });

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <FileText size={15} style={{ color:'#60a5fa' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Analytics</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Reports</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>All client reports and uploads</p>
        </div>
        <button className="wm-btn-primary" onClick={() => setShowUpload(true)}
          style={{ display:'flex', alignItems:'center', gap:7, height:38 }}>
          <Upload size={15}/> Upload Report
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'rgba(148,163,184,.3)' }}>Loading...</div>
      ) : reports.length === 0 ? (
        <div className="wm-card" style={{ padding:'60px 24px', textAlign:'center' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'rgba(96,165,250,.1)', border:'0.5px solid rgba(96,165,250,.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', color:'#60a5fa' }}>
            <FileText size={22} />
          </div>
          <p style={{ fontSize:'.95rem', color:'rgba(148,163,184,.4)', marginBottom:4 }}>No reports yet</p>
          <p style={{ fontSize:'.8rem', color:'rgba(148,163,184,.25)' }}>Upload your first report to get started</p>
        </div>
      ) : (
        <div className="wm-fade-up-2" style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {reports.map(r => (
            <ReportCard key={r.id} report={r} currentUserId={user?.id ?? ''} />
          ))}
        </div>
      )}

      <UploadReportModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={refresh}
        clients={clients}
      />
    </div>
  );
}