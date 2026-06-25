'use client';
import { useState }                              from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle, XCircle, Trash2, Clock,
  Building2, UserCheck, CheckSquare, MessageSquare, Users,
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── shared inline styles (matches your app's wm-* design system) ─── */
const inpStyle: React.CSSProperties  = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none' };
const selStyle: React.CSSProperties  = { ...inpStyle, cursor:'pointer' };
const lblStyle: React.CSSProperties  = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };
const taStyle: React.CSSProperties   = { ...inpStyle, height:'auto', resize:'none' as const, padding:'10px 12px' };

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending_approval: { bg:'rgba(251,191,36,.12)',  color:'#fbbf24' },
  approved:         { bg:'rgba(52,211,153,.12)',  color:'#34d399' },
  rejected:         { bg:'rgba(248,113,113,.12)', color:'#f87171' },
  assigned:         { bg:'rgba(96,165,250,.12)',  color:'#60a5fa' },
  pending:          { bg:'rgba(251,191,36,.12)',  color:'#fbbf24' },
};

type Lead = {
  id: string; company_name: string; contact_person: string; email: string;
  phone?: string; service_required?: string; expected_value?: string;
  sales_stage: string; status: string; rejection_reason?: string; manager_notes?: string;
  creator?: { full_name: string }; assignedAM?: { full_name: string };
};
type DeleteReq = {
  id: string; status: string; reason?: string; created_at: string;
  client: { id: string; company_name: string; email: string };
  requester: { full_name: string };
};
type AM = { id: string; full_name: string };

export default function ApprovalsPage() {
  const qc = useQueryClient();
  const [tab,             setTab]             = useState<'sales' | 'deletions' | 'agents'>('sales');
  const [selected,        setSelected]        = useState<Lead | null>(null);
  const [deleteSelected,  setDeleteSelected]  = useState<DeleteReq | null>(null);
  const [actionModal,     setActionModal]      = useState<'approve' | 'reject' | 'assign' | 'note' | 'confirmDelete' | null>(null);
  const [filterStatus,    setFilterStatus]     = useState('pending_approval');
  const [rejectionReason, setRejectionReason]  = useState('');
  const [managerNote,     setManagerNote]      = useState('');
  const [assignedAM,      setAssignedAM]       = useState('');

  /* ── queries ── */
  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['sales-leads', filterStatus],
    queryFn:  async () => (await (await fetch(`/api/sales-leads${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`)).json()).data ?? [],
  });

  const { data: deleteReqs = [], isLoading: deleteLoading } = useQuery<DeleteReq[]>({
    queryKey: ['delete-requests'],
    queryFn:  async () => (await (await fetch('/api/delete-requests')).json()).data ?? [],
  });

  const { data: ams = [] } = useQuery<AM[]>({
    queryKey: ['account-managers'],
    queryFn:  async () => (await (await fetch('/api/users?role=account_manager')).json()).data ?? [],
  });

  const { data: pendingAgents = [], isLoading: agentsLoading } = useQuery<any[]>({
    queryKey: ['pending-agents'],
    queryFn:  async () => (await (await fetch('/api/users/pending')).json()).data ?? [],
  });

  /* ── mutations ── */
  const leadMutation = useMutation({
    mutationFn: async (data: any) => {
      const res  = await fetch('/api/sales-leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['sales-leads'] });
      toast.success(
        vars.status === 'approved' ? 'Lead approved!' :
        vars.status === 'rejected' ? 'Lead rejected' :
        vars.assigned_am           ? 'AM assigned!'   : 'Note saved!'
      );
      closeModal();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const res  = await fetch('/api/delete-requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['delete-requests'] });
      toast.success(vars.action === 'approve' ? 'Client deleted.' : 'Request rejected.');
      closeModal();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeModal = () => {
    setActionModal(null); setSelected(null); setDeleteSelected(null);
    setRejectionReason(''); setManagerNote(''); setAssignedAM('');
  };

  const pendingLeads   = leads.filter((l: any) => l.status === 'pending_approval');
  const pendingDeletes = deleteReqs.filter(r => r.status === 'pending');
  const pendingAgentsList = pendingAgents.filter((a:any) => a.status === "pending");
  const totalPending   = pendingLeads.length + pendingDeletes.length + pendingAgentsList.length;

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <CheckSquare size={15} style={{ color:'#fbbf24' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Approvals</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Approvals</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Sales leads & client deletion requests — all in one place</p>
        </div>
        {totalPending > 0 && (
          <div style={{ padding:'6px 14px', borderRadius:99, background:'rgba(248,113,113,.12)', border:'0.5px solid rgba(248,113,113,.25)', fontSize:'.8rem', fontWeight:600, color:'#f87171' }}>
            {totalPending} pending
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:22, borderBottom:'1px solid rgba(255,255,255,.06)', paddingBottom:0 }}>
        {([
          { key:'sales',     label:'Sales Leads',      count: pendingLeads.length,   color:'#fbbf24' },
          { key:'deletions', label:'Delete Requests',  count: pendingDeletes.length, color:'#f87171' },
          { key:'agents',    label:'New Agents',       count: pendingAgentsList.length, color:'#34d399' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'8px 16px', fontSize:'.85rem', fontWeight:600, border:'none', background:'none', cursor:'pointer', color: tab === t.key ? '#f1f5f9' : 'rgba(148,163,184,.4)', borderBottom: tab === t.key ? '2px solid #a78bfa' : '2px solid transparent', marginBottom:-1, display:'flex', alignItems:'center', gap:7, transition:'all .2s' }}>
            {t.label}
            {t.count > 0 && (
              <span style={{ padding:'1px 7px', borderRadius:99, fontSize:'.68rem', background: t.key === 'sales' ? 'rgba(251,191,36,.18)' : 'rgba(248,113,113,.18)', color: t.color }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── SALES LEADS TAB ── */}
      {tab === 'sales' && (
        <>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
            <select style={{ ...selStyle, width:200 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="assigned">Assigned</option>
              <option value="all">All Leads</option>
            </select>
          </div>

          {pendingLeads.length > 0 && filterStatus === 'pending_approval' && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:12, background:'rgba(251,191,36,.06)', border:'0.5px solid rgba(251,191,36,.2)', marginBottom:16 }}>
              <Clock size={15} style={{ color:'#fbbf24' }} />
              <p style={{ fontSize:'.85rem', color:'rgba(148,163,184,.7)' }}>
                <span style={{ color:'#fbbf24', fontWeight:600 }}>{pendingLeads.length} lead{pendingLeads.length !== 1 ? 's' : ''}</span> waiting for your review
              </p>
            </div>
          )}

          {leadsLoading ? (
            <div style={{ textAlign:'center', padding:40, color:'rgba(148,163,184,.3)' }}>Loading...</div>
          ) : leads.length === 0 ? (
            <div className="wm-card" style={{ padding:'60px 24px', textAlign:'center' }}>
              <CheckCircle size={36} style={{ color:'rgba(148,163,184,.15)', margin:'0 auto 12px', display:'block' }} />
              <p style={{ color:'rgba(148,163,184,.4)' }}>No leads in this category</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {leads.map((l: any) => {
                const st = STATUS_STYLE[l.status] ?? STATUS_STYLE.pending;
                return (
                  <div key={l.id} className="wm-card" style={{ padding:'18px 20px', borderColor: l.status === 'pending_approval' ? 'rgba(251,191,36,.25)' : undefined }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:12, flex:1, minWidth:0 }}>
                        <div style={{ width:38, height:38, borderRadius:9, flexShrink:0, background:'rgba(124,58,237,.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#a78bfa' }}>
                          <Building2 size={17} />
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
                            <XCircle size={13} /> Reject
                          </button>
                          <button className="wm-btn-primary" onClick={() => { setSelected(l); setActionModal('approve'); }}
                            style={{ padding:'6px 12px', fontSize:'.75rem', background:'linear-gradient(135deg,#059669,#10b981)', display:'flex', alignItems:'center', gap:5 }}>
                            <CheckCircle size={13} /> Approve
                          </button>
                        </>)}
                        {l.status === 'approved' && (
                          <button className="wm-btn-primary" onClick={() => { setSelected(l); setActionModal('assign'); }}
                            style={{ padding:'6px 12px', fontSize:'.75rem', display:'flex', alignItems:'center', gap:5 }}>
                            <UserCheck size={13} /> Assign AM
                          </button>
                        )}
                        <button className="wm-btn-ghost" onClick={() => { setSelected(l); setActionModal('note'); }} style={{ padding:'6px 10px', fontSize:'.75rem' }}>
                          <MessageSquare size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── DELETE REQUESTS TAB ── */}
      {tab === 'deletions' && (
        <>
          {pendingDeletes.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:12, background:'rgba(248,113,113,.06)', border:'0.5px solid rgba(248,113,113,.2)', marginBottom:16 }}>
              <Clock size={15} style={{ color:'#f87171' }} />
              <p style={{ fontSize:'.85rem', color:'rgba(148,163,184,.7)' }}>
                <span style={{ color:'#f87171', fontWeight:600 }}>{pendingDeletes.length} request{pendingDeletes.length !== 1 ? 's' : ''}</span> waiting for your review
              </p>
            </div>
          )}

          {deleteLoading ? (
            <div style={{ textAlign:'center', padding:40, color:'rgba(148,163,184,.3)' }}>Loading...</div>
          ) : deleteReqs.length === 0 ? (
            <div className="wm-card" style={{ padding:'60px 24px', textAlign:'center' }}>
              <Trash2 size={36} style={{ color:'rgba(148,163,184,.15)', margin:'0 auto 12px', display:'block' }} />
              <p style={{ color:'rgba(148,163,184,.4)' }}>No deletion requests</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {deleteReqs.map(req => {
                const st = STATUS_STYLE[req.status] ?? STATUS_STYLE.pending;
                return (
                  <div key={req.id} className="wm-card" style={{ padding:'18px 20px', borderColor: req.status === 'pending' ? 'rgba(248,113,113,.25)' : undefined }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:12, flex:1 }}>
                        <div style={{ width:38, height:38, borderRadius:9, flexShrink:0, background:'rgba(248,113,113,.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'#f87171' }}>
                          <Trash2 size={17} />
                        </div>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                            <p style={{ fontWeight:600, color:'#f1f5f9', fontSize:'.92rem' }}>{req.client?.company_name}</p>
                            <span style={{ padding:'2px 9px', borderRadius:99, fontSize:'.7rem', fontWeight:500, background:st.bg, color:st.color, textTransform:'capitalize' }}>{req.status}</span>
                          </div>
                          <div style={{ fontSize:'.78rem', color:'rgba(148,163,184,.55)' }}>
                            {req.client?.email} · Requested by <strong style={{ color:'rgba(148,163,184,.75)' }}>{req.requester?.full_name}</strong>
                          </div>
                          {req.reason && (
                            <p style={{ fontSize:'.78rem', color:'rgba(148,163,184,.45)', marginTop:6, borderLeft:'2px solid rgba(248,113,113,.3)', paddingLeft:8, fontStyle:'italic' }}>{req.reason}</p>
                          )}
                        </div>
                      </div>
                      {req.status === 'pending' && (
                        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                          <button className="wm-btn-ghost" onClick={() => { setDeleteSelected(req); setActionModal('confirmDelete'); }}
                            style={{ padding:'6px 12px', fontSize:'.75rem', display:'flex', alignItems:'center', gap:5 }}>
                            <XCircle size={13} /> Reject
                          </button>
                          <button style={{ padding:'6px 12px', fontSize:'.75rem', border:'none', borderRadius:9, background:'linear-gradient(135deg,#dc2626,#ef4444)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontWeight:600 }}
                            onClick={() => { setDeleteSelected(req); setActionModal('confirmDelete'); }}>
                            <Trash2 size={13} /> Review
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}


      {/* ── NEW AGENTS TAB ── */}
      {tab === 'agents' && (
        <>
          {pendingAgentsList.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:12, background:'rgba(52,211,153,.06)', border:'0.5px solid rgba(52,211,153,.2)', marginBottom:16 }}>
              <Clock size={15} style={{ color:'#34d399' }} />
              <p style={{ fontSize:'.85rem', color:'rgba(148,163,184,.7)' }}>
                <span style={{ color:'#34d399', fontWeight:600 }}>{pendingAgentsList.length} agent{pendingAgentsList.length !== 1 ? 's' : ''}</span> waiting for approval
              </p>
            </div>
          )}
          {agentsLoading ? (
            <div style={{ textAlign:'center', padding:40, color:'rgba(148,163,184,.3)' }}>Loading...</div>
          ) : pendingAgents.length === 0 ? (
            <div className="wm-card" style={{ padding:'60px 24px', textAlign:'center' }}>
              <Users size={36} style={{ color:'rgba(148,163,184,.15)', margin:'0 auto 12px', display:'block' }} />
              <p style={{ color:'rgba(148,163,184,.4)' }}>No pending agents</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {pendingAgents.map((a:any) => (
                <div key={a.id} className="wm-card" style={{ padding:'18px 20px', borderColor:'rgba(52,211,153,.2)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:38, height:38, borderRadius:9, flexShrink:0, background:'rgba(52,211,153,.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'#34d399', fontWeight:700, fontSize:'.9rem' }}>
                        {a.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight:600, color:'#f1f5f9', fontSize:'.92rem', marginBottom:2 }}>{a.full_name}</p>
                        <p style={{ fontSize:'.78rem', color:'rgba(148,163,184,.5)' }}>{a.email}</p>
                        {a.team?.name && <p style={{ fontSize:'.72rem', color:'#a78bfa', marginTop:2 }}>Team: {a.team.name}</p>}
                        {a.leader_name && a.leader_name !== '—' && <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.4)', marginTop:1 }}>Added by: {a.leader_name}</p>}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <button className="wm-btn-ghost"
                        style={{ padding:'6px 12px', fontSize:'.75rem', color:'#f87171', borderColor:'rgba(248,113,113,.25)', display:'flex', alignItems:'center', gap:5 }}
                        onClick={async () => {
                          const res = await fetch('/api/users/pending', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: a.id, action:'reject' }) });
                          const json = await res.json();
                          if (json.error) { toast.error(json.error); return; }
                          toast.success('Agent rejected');
                          qc.invalidateQueries({ queryKey: ['pending-agents'] });
                        }}>
                        <XCircle size={13}/> Reject
                      </button>
                      <button className="wm-btn-primary"
                        style={{ padding:'6px 12px', fontSize:'.75rem', background:'linear-gradient(135deg,#059669,#10b981)', display:'flex', alignItems:'center', gap:5 }}
                        onClick={async () => {
                          const res = await fetch('/api/users/pending', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: a.id, action:'approve' }) });
                          const json = await res.json();
                          if (json.error) { toast.error(json.error); return; }
                          toast.success('Agent approved — they can now log in');
                          qc.invalidateQueries({ queryKey: ['pending-agents'] });
                        }}>
                        <CheckCircle size={13}/> Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── MODALS ── */}
      {actionModal && (selected || deleteSelected) && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={closeModal} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:460, background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28 }}>

            {/* Approve Lead */}
            {actionModal === 'approve' && selected && (<>
              <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Approve Lead</h2>
              <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:16 }}>Approve <strong style={{ color:'#f1f5f9' }}>{selected.company_name}</strong>?</p>
              <div style={{ marginBottom:16 }}>
                <label style={lblStyle}>Internal Note (optional)</label>
                <textarea style={taStyle} rows={3} value={managerNote} onChange={e => setManagerNote(e.target.value)} placeholder="Add a note for the account manager..." />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="wm-btn-ghost" onClick={closeModal} style={{ flex:1, height:40 }}>Cancel</button>
                <button className="wm-btn-primary" style={{ flex:1, height:40, background:'linear-gradient(135deg,#059669,#10b981)' }}
                  onClick={() => leadMutation.mutate({ id: selected.id, status:'approved', manager_notes: managerNote })}>
                  Approve
                </button>
              </div>
            </>)}

            {/* Reject Lead */}
            {actionModal === 'reject' && selected && (<>
              <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Reject Lead</h2>
              <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:16 }}>Rejecting <strong style={{ color:'#f1f5f9' }}>{selected.company_name}</strong></p>
              <div style={{ marginBottom:16 }}>
                <label style={lblStyle}>Reason *</label>
                <textarea style={taStyle} rows={3} value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Why is this lead being rejected?" />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="wm-btn-ghost" onClick={closeModal} style={{ flex:1, height:40 }}>Cancel</button>
                <button style={{ flex:1, height:40, border:'none', borderRadius:10, background:'linear-gradient(135deg,#dc2626,#ef4444)', color:'#fff', fontSize:'.88rem', fontWeight:600, cursor:'pointer' }}
                  disabled={!rejectionReason || leadMutation.isPending}
                  onClick={() => leadMutation.mutate({ id: selected.id, status:'rejected', rejection_reason: rejectionReason })}>
                  Reject Lead
                </button>
              </div>
            </>)}

            {/* Assign AM */}
            {actionModal === 'assign' && selected && (<>
              <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Assign Account Manager</h2>
              <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:16 }}>Assign an AM to <strong style={{ color:'#f1f5f9' }}>{selected.company_name}</strong></p>
              <div style={{ marginBottom:16 }}>
                <label style={lblStyle}>Account Manager *</label>
                <select style={selStyle} value={assignedAM} onChange={e => setAssignedAM(e.target.value)}>
                  <option value="">Select account manager</option>
                  {ams.map(am => <option key={am.id} value={am.id}>{am.full_name}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="wm-btn-ghost" onClick={closeModal} style={{ flex:1, height:40 }}>Cancel</button>
                <button className="wm-btn-primary" style={{ flex:1, height:40 }} disabled={!assignedAM || leadMutation.isPending}
                  onClick={() => leadMutation.mutate({ id: selected.id, assigned_am: assignedAM })}>
                  Assign AM
                </button>
              </div>
            </>)}

            {/* Add Note */}
            {actionModal === 'note' && selected && (<>
              <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Add Note</h2>
              <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:16 }}>Internal note for <strong style={{ color:'#f1f5f9' }}>{selected.company_name}</strong></p>
              <div style={{ marginBottom:16 }}>
                <label style={lblStyle}>Note *</label>
                <textarea style={taStyle} rows={4} value={managerNote} onChange={e => setManagerNote(e.target.value)} placeholder="Internal note..." />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="wm-btn-ghost" onClick={closeModal} style={{ flex:1, height:40 }}>Cancel</button>
                <button className="wm-btn-primary" style={{ flex:1, height:40 }} disabled={!managerNote || leadMutation.isPending}
                  onClick={() => leadMutation.mutate({ id: selected.id, manager_notes: managerNote })}>
                  Save Note
                </button>
              </div>
            </>)}

            {/* Confirm Delete Request */}
            {actionModal === 'confirmDelete' && deleteSelected && (<>
              <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Review Deletion Request</h2>
              <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:4 }}>
                <strong style={{ color:'#f1f5f9' }}>{deleteSelected.requester?.full_name}</strong> wants to delete client{' '}
                <strong style={{ color:'#f1f5f9' }}>{deleteSelected.client?.company_name}</strong>.
              </p>
              {deleteSelected.reason && (
                <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.4)', marginBottom:16, borderLeft:'2px solid rgba(124,58,237,.3)', paddingLeft:10, fontStyle:'italic' }}>
                  "{deleteSelected.reason}"
                </p>
              )}
              <p style={{ fontSize:'.8rem', color:'#f87171', marginBottom:20 }}>
                ⚠ Approving will permanently delete this client and all their data.
              </p>
              <div style={{ display:'flex', gap:10 }}>
                <button className="wm-btn-ghost" onClick={() => deleteMutation.mutate({ id: deleteSelected.id, action: 'reject' })}
                  style={{ flex:1, height:40 }} disabled={deleteMutation.isPending}>
                  Reject Request
                </button>
                <button style={{ flex:1, height:40, border:'none', borderRadius:10, background:'linear-gradient(135deg,#dc2626,#ef4444)', color:'#fff', fontSize:'.88rem', fontWeight:600, cursor:'pointer' }}
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate({ id: deleteSelected.id, action: 'approve' })}>
                  <Trash2 size={13} style={{ display:'inline', marginRight:5 }} /> Approve & Delete
                </button>
              </div>
            </>)}

          </div>
        </div>
      )}
    </div>
  );
}