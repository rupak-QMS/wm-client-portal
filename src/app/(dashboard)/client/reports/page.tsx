'use client';
import { useQuery }   from '@tanstack/react-query';
import { ReportCard } from '@/components/reports/ReportCard';
import { FileText }   from 'lucide-react';
import type { Report } from '@/types';

export default function ClientReportsPage() {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn:  async () => (await (await fetch('/api/users/me')).json()).data,
  });

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn:  async () => (await (await fetch('/api/reports')).json()).data ?? [],
  });

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ marginBottom: 28 }} className="wm-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <FileText size={15} style={{ color: '#60a5fa' }} />
          <span style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Documents</span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>My Reports</h1>
        <p style={{ fontSize: '.875rem', color: 'rgba(148,163,184,.5)' }}>All reports uploaded by your account manager</p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(148,163,184,.3)' }}>Loading...</div>
      ) : reports.length === 0 ? (
        <div className="wm-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(96,165,250,.1)', border: '0.5px solid rgba(96,165,250,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#60a5fa' }}>
            <FileText size={22} />
          </div>
          <p style={{ color: 'rgba(148,163,184,.4)', fontSize: '.9rem', marginBottom: 4 }}>No reports yet</p>
          <p style={{ color: 'rgba(148,163,184,.25)', fontSize: '.8rem' }}>Your account manager will upload reports here</p>
        </div>
      ) : (
        <div className="wm-fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map(r => (
            <ReportCard key={r.id} report={r} currentUserId={currentUser?.id ?? ''} />
          ))}
        </div>
      )}
    </div>
  );
}