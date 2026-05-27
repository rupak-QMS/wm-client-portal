'use client';
import { useState }                              from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Phone, Users, Calendar, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const LOG_TYPE_STYLE: Record<string,{bg:string;color:string;icon:any;label:string}> = {
  call_log:       { bg:'rgba(96,165,250,.12)',  color:'#60a5fa', icon:Phone,     label:'Call Log'        },
  meeting_notes:  { bg:'rgba(167,139,250,.12)', color:'#a78bfa', icon:Users,     label:'Meeting Notes'   },
  proposal:       { bg:'rgba(52,211,153,.12)',  color:'#34d399', icon:FileText,  label:'Proposal'        },
  follow_up:      { bg:'rgba(251,191,36,.12)',  color:'#fbbf24', icon:Calendar,  label:'Follow Up'       },
  revenue_update: { bg:'rgba(244,114,182,.12)', color:'#f472b6', icon:TrendingUp,label:'Revenue Update'  },
  closing_update: { bg:'rgba(52,211,153,.12)',  color:'#34d399', icon:TrendingUp,label:'Closing Update'  },
  other:          { bg:'rgba(148,163,184,.1)',  color:'rgba(148,163,184,.6)', icon:FileText, label:'Other' },
};

const inpStyle: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none' };
const selStyle: React.CSSProperties = { ...inpStyle, cursor:'pointer' };
const lblStyle: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

export default function SalesLogsPage() {
  const qc = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showModal,    setShowModal]    = useState(false);
  const [expandedLog,  setExpandedLog]  = useState<string|null>(null);
  const [form, setForm] = useState({ log_type:'call_log', title:'', content:'', next_action:'', closing_pct:'50' });

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['sales-leads'],
    queryFn:  async () => (await (await fetch('/api/sales-leads')).json()).data ?? [],
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['sales-logs', selectedLead?.id],
    queryFn:  async () => {
      if (!selectedLead?.id) return [];
      return (await (await fetch(`/api/sales-logs?lead_id=${selectedLead.id}`)).json()).data ?? [];
    },
    enabled: !!selectedLead?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res  = await fetch('/api/sales-logs', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...data, lead_id:selectedLead.id }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['sales-logs', selectedLead?.id] });
      toast.success('Log added!');
      setShowModal(false);
      setForm({ log_type:'call_log', title:'', content:'', next_action:'', closing_pct:'50' });
    },
    onError: (e:Error) => toast.error(e.message),
  });

  const activeleads = leads.filter((l:any) => ['pending_approval','approved','assigned','draft'].includes(l.status));

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ marginBottom:28 }} className="wm-fade-up">
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <FileText size={15} style={{ color:'#60a5fa' }} />
          <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Activity</span>
        </div>
        <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Sales Logs</h1>
        <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Track calls, meetings and deal progress per lead</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:16, minHeight:500 }} className="wm-fade-up-2">

        {/* Lead list */}
        <div className="wm-card" style={{ overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(124,58,237,.1)' }}>
            <p style={{ fontSize:'.85rem', fontWeight:600, color:'#f1f5f9' }}>Select Lead</p>
            <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.4)', marginTop:2 }}>{activeleads.length} active leads</p>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {leadsLoading ? (
              <div style={{ textAlign:'center', padding:'30px', color:'rgba(148,163,184,.3)', fontSize:'.82rem' }}>Loading...</div>
            ) : activeleads.length === 0 ? (
              <div style={{ textAlign:'center', padding:'30px', color:'rgba(148,163,184,.3)', fontSize:'.82rem' }}>No leads yet</div>
            ) : activeleads.map((l:any) => {
              const isSelected = selectedLead?.id === l.id;
              return (
                <button key={l.id} onClick={() => setSelectedLead(l)}
                  style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'flex-start', gap:3, padding:'12px 16px', border:'none', cursor:'pointer', textAlign:'left', background: isSelected ? 'rgba(124,58,237,.12)' : 'transparent', borderLeft: isSelected ? '2px solid #a78bfa' : '2px solid transparent', transition:'all .2s' }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background='rgba(124,58,237,.06)'; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background='transparent'; }}>
                  <p style={{ fontSize:'.83rem', fontWeight:500, color: isSelected ? '#f1f5f9' : 'rgba(241,245,249,.75)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', width:'100%' }}>{l.company_name}</p>
                  <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.4)', textTransform:'capitalize' }}>{l.sales_stage} · {l.status.replace(/_/g,' ')}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Logs panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {!selectedLead ? (
            <div className="wm-card" style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px' }}>
              <FileText size={36} style={{ color:'rgba(148,163,184,.15)', marginBottom:12 }} />
              <p style={{ color:'rgba(148,163,184,.4)', fontSize:'.9rem' }}>Select a lead to view logs</p>
            </div>
          ) : (
            <>
              {/* Lead header */}
              <div className="wm-card" style={{ padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ fontWeight:600, color:'#f1f5f9', fontSize:'.95rem', marginBottom:2 }}>{selectedLead.company_name}</p>
                  <p style={{ fontSize:'.78rem', color:'rgba(148,163,184,.5)' }}>{selectedLead.contact_person} · {selectedLead.email}</p>
                </div>
                <button className="wm-btn-primary" onClick={() => setShowModal(true)}
                  style={{ display:'flex', alignItems:'center', gap:6, height:36, padding:'0 14px', fontSize:'.82rem' }}>
                  <Plus size={13}/> Add Log
                </button>
              </div>

              {/* Logs list */}
              {logsLoading ? (
                <div style={{ textAlign:'center', padding:'40px', color:'rgba(148,163,184,.3)' }}>Loading logs...</div>
              ) : logs.length === 0 ? (
                <div className="wm-card" style={{ padding:'40px 24px', textAlign:'center' }}>
                  <p style={{ color:'rgba(148,163,184,.3)', fontSize:'.85rem' }}>No logs yet — add your first activity log</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {logs.map((log:any) => {
                    const lt  = LOG_TYPE_STYLE[log.log_type] ?? LOG_TYPE_STYLE.other;
                    const Icon = lt.icon;
                    const isExpanded = expandedLog === log.id;
                    return (
                      <div key={log.id} className="wm-card" style={{ padding:'14px 18px' }}>
                        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                          <div style={{ width:34, height:34, borderRadius:9, flexShrink:0, background:lt.bg, display:'flex', alignItems:'center', justifyContent:'center', color:lt.color }}>
                            <Icon size={15}/>
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <p style={{ fontWeight:600, color:'#f1f5f9', fontSize:'.87rem' }}>{log.title}</p>
                                <span style={{ padding:'2px 8px', borderRadius:99, fontSize:'.68rem', background:lt.bg, color:lt.color }}>{lt.label}</span>
                              </div>
                              <button onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                                style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(148,163,184,.4)', display:'flex', alignItems:'center' }}>
                                {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                              </button>
                            </div>
                            <div style={{ display:'flex', gap:12, fontSize:'.72rem', color:'rgba(148,163,184,.4)' }}>
                              <span>By {log.author?.full_name}</span>
                              <span>{new Date(log.created_at).toLocaleDateString()}</span>
                              {log.closing_pct !== null && (
                                <span style={{ color:'#34d399', fontWeight:600 }}>🎯 {log.closing_pct}% closing probability</span>
                              )}
                            </div>
                            {isExpanded && (
                              <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,.05)' }}>
                                <p style={{ fontSize:'.83rem', color:'rgba(148,163,184,.75)', lineHeight:1.6, marginBottom:8 }}>{log.content}</p>
                                {log.next_action && (
                                  <div style={{ padding:'8px 12px', borderRadius:8, background:'rgba(251,191,36,.06)', border:'0.5px solid rgba(251,191,36,.15)' }}>
                                    <p style={{ fontSize:'.72rem', color:'#fbbf24', marginBottom:2 }}>Next Action</p>
                                    <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.7)' }}>{log.next_action}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Log Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={() => setShowModal(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28 }}>
            <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Add Activity Log</h2>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:20 }}>Log activity for {selectedLead?.company_name}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div><label style={lblStyle}>Log Type</label>
                <select style={selStyle} value={form.log_type} onChange={e => setForm(f=>({...f,log_type:e.target.value}))}>
                  {Object.entries(LOG_TYPE_STYLE).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              <div><label style={lblStyle}>Title *</label>
                <input style={inpStyle} value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Discovery call with John" />
              </div>
              <div><label style={lblStyle}>Notes *</label>
                <textarea style={{ ...inpStyle, height:'auto', resize:'none', padding:'10px 12px' }} rows={4}
                  value={form.content} onChange={e => setForm(f=>({...f,content:e.target.value}))} placeholder="What happened? Key points discussed..." />
              </div>
              <div><label style={lblStyle}>Next Action</label>
                <input style={inpStyle} value={form.next_action} onChange={e => setForm(f=>({...f,next_action:e.target.value}))} placeholder="e.g. Send proposal by Friday" />
              </div>
              <div>
                <label style={lblStyle}>Closing Probability: {form.closing_pct}%</label>
                <input type="range" min="0" max="100" step="5" value={form.closing_pct}
                  onChange={e => setForm(f=>({...f,closing_pct:e.target.value}))}
                  style={{ width:'100%', accentColor:'#7c3aed' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.68rem', color:'rgba(148,163,184,.35)', marginTop:3 }}>
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button className="wm-btn-ghost" onClick={() => setShowModal(false)} style={{ flex:1, height:40 }}>Cancel</button>
                <button className="wm-btn-primary" style={{ flex:1, height:40 }}
                  disabled={saveMutation.isPending || !form.title || !form.content}
                  onClick={() => saveMutation.mutate(form)}>Save Log</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}