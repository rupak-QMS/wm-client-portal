'use client';
import { useState }                              from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, Building2, UserCheck, CheckSquare, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_STYLE: Record<string,{bg:string;color:string}> = {
  pending_approval: { bg:'rgba(251,191,36,.12)',  color:'#fbbf24' },
  approved:         { bg:'rgba(52,211,153,.12)',  color:'#34d399' },
  rejected:         { bg:'rgba(248,113,113,.12)', color:'#f87171' },
  assigned:         { bg:'rgba(96,165,250,.12)',  color:'#60a5fa' },
  draft:            { bg:'rgba(148,163,184,.1)',  color:'rgba(148,163,184,.6)' },
};
const inpStyle: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none' };
const selStyle: React.CSSProperties = { ...inpStyle, cursor:'pointer' };
const lblStyle: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

export default function SalesApprovalsPage() {
  const qc = useQueryClient();
  const [selected,        setSelected]        = useState<any>(null);
  const [actionModal,     setActionModal]      = useState<'approve'|'reject'|'assign'|'note'|null>(null);
  const [rejectionReason, setRejectionReason]  = useState('');
  const [managerNote,     setManagerNote]      = useState('');
  const [assignedAM,      setAssignedAM]       = useState('');
  const [filterStatus,    setFilterStatus]     = useState('pending_approval');

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['sales-leads', filterStatus],
    queryFn:  async () => (await (await fetch(`/api/sales-leads${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`)).json()).data ?? [],
  });

  const { data: managers = [] } = useQuery({
    queryKey: ['account-managers'],
    queryFn:  async () => (await (await fetch('/api/users?role=account_manager')).json()).data ?? [],
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const res  = await fetch('/api/sales-leads', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey:['sales-leads'] });
      toast.success(vars.status === 'approved' ? 'Lead approved!' : vars.status === 'rejected' ? 'Lead rejected' : vars.assigned_am ? 'AM assigned!' : 'Note added!');
      setActionModal(null); setSelected(null);
      setRejectionReason(''); setManagerNote(''); setAssignedAM('');
    },
    onError: (e:Error) => toast.error(e.message),
  });

  const pending = leads.filter((l:any) => l.status === 'pending_approval');

  return (
    <div className="wm-page-inner">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <CheckSquare size={15} style={{ color:'#fbbf24' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Sales Pipeline</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Sales Approvals</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Review and approve leads submitted by the sales team</p>
        </div>
        <select style={{ ...selStyle, width:200 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="pending_approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="assigned">Assigned</option>
          <option value="all">All Leads</option>
        </select>
      </div>

      {pending.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:12, background:'rgba(251,191,36,.06)', border:'0.5px solid rgba(251,191,36,.2)', marginBottom:20 }} className="wm-fade-up">
          <Clock size={15} style={{ color:'#fbbf24' }} />
          <p style={{ fontSize:'.85rem', color:'rgba(148,163,184,.7)' }}>
            <span style={{ color:'#fbbf24', fontWeight:600 }}>{pending.length} lead{pending.length!==1?'s':''}</span> waiting for your review
          </p>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'rgba(148,163,184,.3)' }}>Loading...</div>
      ) : leads.length === 0 ? (
        <div className="wm-card" style={{ padding:'60px 24px', textAlign:'center' }}>
          <CheckCircle size={36} style={{ color:'rgba(148,163,184,.15)', margin:'0 auto 12px', display:'block' }} />
          <p style={{ color:'rgba(148,163,184,.4)' }}>No leads in this category</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }} className="wm-fade-up-2">
          {leads.map((l: any) => {
            const st = STATUS_STYLE[l.status] ?? STATUS_STYLE.draft;
            return (
              <div key={l.id} className="wm-card" style={{ padding:'18px 20px', borderColor: l.status==='pending_approval' ? 'rgba(251,191,36,.25)' : undefined }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12, flex:1, minWidth:0 }}>
                    <div style={{ width:38, height:38, borderRadius:9, flexShrink:0, background:'rgba(124,58,237,.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#a78bfa' }}>
                      <Building2 size={17}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                        <p style={{ fontWeight:600, color:'#f1f5f9', fontSize:'.92rem' }}>{l.company_name}</p>
                        <span style={{ padding:'2px 9px', borderRadius:99, fontSize:'.7rem', fontWeight:500, background:st.bg, color:st.color, textTransform:'capitalize' }}>{l.status.replace(/_/g,' ')}</span>
                        {l.expected_value && <span style={{ fontSize:'.75rem', color:'#34d399', fontWeight:600 }}>${parseFloat(l.expected_value).toLocaleString()} est.</span>}
                      </div>
                      <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:'.78rem', color:'rgba(148,163,184,.55)' }}>
                        <span>{l.contact_person}</span><span>{l.email}</span>
                        {l.phone && <span>{l.phone}</span>}
                        {l.service_required && <span>· {l.service_required}</span>}
                      </div>
                      <div style={{ display:'flex', gap:10, marginTop:6, fontSize:'.72rem', color:'rgba(148,163,184,.4)' }}>
                        <span>By: {l.creator?.full_name}</span>
                        <span>Stage: {l.sales_stage}</span>
                        {l.assignedAM && <span style={{ color:'#60a5fa' }}>AM: {l.assignedAM?.full_name}</span>}
                      </div>
                      {l.rejection_reason && <p style={{ fontSize:'.75rem', color:'#f87171', marginTop:4 }}>Rejected: {l.rejection_reason}</p>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
                    {l.status === 'pending_approval' && (<>
                      <button className="wm-btn-ghost" onClick={() => { setSelected(l); setActionModal('reject'); }}
                        style={{ padding:'6px 12px', fontSize:'.75rem', color:'#f87171', borderColor:'rgba(248,113,113,.25)', display:'flex', alignItems:'center', gap:5 }}>
                        <XCircle size={13}/> Reject
                      </button>
                      <button className="wm-btn-primary" onClick={() => { setSelected(l); setActionModal('approve'); }}
                        style={{ padding:'6px 12px', fontSize:'.75rem', background:'linear-gradient(135deg,#059669,#10b981)', display:'flex', alignItems:'center', gap:5 }}>
                        <CheckCircle size={13}/> Approve
                      </button>
                    </>)}
                    {l.status === 'approved' && (
                      <button className="wm-btn-primary" onClick={() => { setSelected(l); setActionModal('assign'); }}
                        style={{ padding:'6px 12px', fontSize:'.75rem', display:'flex', alignItems:'center', gap:5 }}>
                        <UserCheck size={13}/> Assign AM
                      </button>
                    )}
                    <button className="wm-btn-ghost" onClick={() => { setSelected(l); setActionModal('note'); }} style={{ padding:'6px 10px', fontSize:'.75rem' }}>
                      <MessageSquare size={13}/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && selected && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={() => { setActionModal(null); setSelected(null); }} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:460, background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28 }}>
            {actionModal === 'approve' && (<>
              <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Approve Lead</h2>
              <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:16 }}>Approve <strong style={{ color:'#f1f5f9' }}>{selected.company_name}</strong>?</p>
              <div style={{ marginBottom:16 }}>
                <label style={lblStyle}>Internal Note (optional)</label>
                <textarea style={{ ...inpStyle, height:'auto', resize:'none', padding:'10px 12px' }} rows={3} value={managerNote} onChange={e => setManagerNote(e.target.value)} placeholder="Add a note for the account manager..." />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="wm-btn-ghost" onClick={() => setActionModal(null)} style={{ flex:1, height:40 }}>Cancel</button>
                <button className="wm-btn-primary" style={{ flex:1, height:40, background:'linear-gradient(135deg,#059669,#10b981)' }}
                  onClick={() => reviewMutation.mutate({ id:selected.id, status:'approved', manager_notes:managerNote })}>Approve</button>
              </div>
            </>)}
            {actionModal === 'reject' && (<>
              <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Reject Lead</h2>
              <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:16 }}>Rejecting <strong style={{ color:'#f1f5f9' }}>{selected.company_name}</strong></p>
              <div style={{ marginBottom:16 }}>
                <label style={lblStyle}>Reason for Rejection *</label>
                <textarea style={{ ...inpStyle, height:'auto', resize:'none', padding:'10px 12px' }} rows={3} value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Why is this lead being rejected?" />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="wm-btn-ghost" onClick={() => setActionModal(null)} style={{ flex:1, height:40 }}>Cancel</button>
                <button style={{ flex:1, height:40, border:'none', borderRadius:10, background:'linear-gradient(135deg,#dc2626,#ef4444)', color:'#fff', fontSize:'.88rem', fontWeight:600, cursor:'pointer' }}
                  disabled={!rejectionReason} onClick={() => reviewMutation.mutate({ id:selected.id, status:'rejected', rejection_reason:rejectionReason })}>Reject Lead</button>
              </div>
            </>)}
            {actionModal === 'assign' && (<>
              <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Assign Account Manager</h2>
              <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:16 }}>Assign an AM to <strong style={{ color:'#f1f5f9' }}>{selected.company_name}</strong></p>
              <div style={{ marginBottom:16 }}>
                <label style={lblStyle}>Account Manager *</label>
                <select style={selStyle} value={assignedAM} onChange={e => setAssignedAM(e.target.value)}>
                  <option value="">Select account manager</option>
                  {managers.map((m:any) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="wm-btn-ghost" onClick={() => setActionModal(null)} style={{ flex:1, height:40 }}>Cancel</button>
                <button className="wm-btn-primary" style={{ flex:1, height:40 }} disabled={!assignedAM}
                  onClick={() => reviewMutation.mutate({ id:selected.id, assigned_am:assignedAM })}>Assign AM</button>
              </div>
            </>)}
            {actionModal === 'note' && (<>
              <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Add Note</h2>
              <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:16 }}>Add internal note for <strong style={{ color:'#f1f5f9' }}>{selected.company_name}</strong></p>
              <div style={{ marginBottom:16 }}>
                <label style={lblStyle}>Note *</label>
                <textarea style={{ ...inpStyle, height:'auto', resize:'none', padding:'10px 12px' }} rows={4} value={managerNote} onChange={e => setManagerNote(e.target.value)} placeholder="Internal note..." />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="wm-btn-ghost" onClick={() => setActionModal(null)} style={{ flex:1, height:40 }}>Cancel</button>
                <button className="wm-btn-primary" style={{ flex:1, height:40 }} disabled={!managerNote}
                  onClick={() => reviewMutation.mutate({ id:selected.id, manager_notes:managerNote })}>Save Note</button>
              </div>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}