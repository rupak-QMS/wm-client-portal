'use client';

import { useState }     from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter }    from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  ArrowLeft, Building2, Mail, Phone, Globe,
  User, FileText, TrendingUp, Calendar,
  Plus, Pencil, Trash2, Download, Phone as PhoneIcon,
  Users, ChevronDown, ChevronUp,
} from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { toast }      from 'sonner';

/* ── style maps ── */
const UPSELL_STATUS: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(251,191,36,.12)',  color: '#fbbf24' },
  active:    { bg: 'rgba(96,165,250,.12)',  color: '#60a5fa' },
  completed: { bg: 'rgba(52,211,153,.12)',  color: '#34d399' },
  cancelled: { bg: 'rgba(248,113,113,.12)', color: '#f87171' },
};
const CLIENT_STATUS: Record<string, { bg: string; color: string }> = {
  active:    { bg: 'rgba(52,211,153,.12)',  color: '#34d399' },
  inactive:  { bg: 'rgba(148,163,184,.1)',  color: 'rgba(148,163,184,.6)' },
  suspended: { bg: 'rgba(248,113,113,.12)', color: '#f87171' },
};
const REPORT_TYPE: Record<string, { bg: string; color: string }> = {
  seo:            { bg: 'rgba(96,165,250,.12)',  color: '#60a5fa' },
  website_update: { bg: 'rgba(52,211,153,.12)',  color: '#34d399' },
  analytics:      { bg: 'rgba(167,139,250,.12)', color: '#a78bfa' },
  audit:          { bg: 'rgba(251,191,36,.12)',  color: '#fbbf24' },
  other:          { bg: 'rgba(148,163,184,.1)',  color: 'rgba(148,163,184,.6)' },
};
const LOG_TYPE: Record<string, { bg: string; color: string; label: string }> = {
  call_log:       { bg: 'rgba(96,165,250,.12)',  color: '#60a5fa', label: 'Call Log'       },
  meeting_notes:  { bg: 'rgba(167,139,250,.12)', color: '#a78bfa', label: 'Meeting Notes'  },
  proposal:       { bg: 'rgba(52,211,153,.12)',  color: '#34d399', label: 'Proposal'       },
  follow_up:      { bg: 'rgba(251,191,36,.12)',  color: '#fbbf24', label: 'Follow Up'      },
  revenue_update: { bg: 'rgba(244,114,182,.12)', color: '#f472b6', label: 'Revenue Update' },
  closing_update: { bg: 'rgba(52,211,153,.12)',  color: '#34d399', label: 'Closing Update' },
  other:          { bg: 'rgba(148,163,184,.1)',  color: 'rgba(148,163,184,.6)', label: 'Other' },
};

const CURRENCIES = ['USD','GBP','EUR','AUD','INR','SGD'];
const emptyUpsell = { client_id:'', date:'', product_sold:'', total_cost:'', upfront_amount:'', project_status:'pending', currency:'USD', notes:'' };

const inpStyle: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none' };
const selStyle: React.CSSProperties = { ...inpStyle, cursor:'pointer' };
const lblStyle: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

interface Props { clientId: string; canEdit: boolean; backHref: string; }

export function ClientProfile({ clientId, canEdit, backHref }: Props) {
  const router = useRouter();
  const qc     = useQueryClient();
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [editUpsellId,    setEditUpsellId]    = useState<string | null>(null);
  const [upsellForm,      setUpsellForm]      = useState({ ...emptyUpsell });
  const [activeTab,       setActiveTab]       = useState<'overview'|'upsells'|'reports'|'sales_history'>('overview');
  const [expandedLog,     setExpandedLog]     = useState<string|null>(null);

  const { data: client, isLoading } = useQuery({ queryKey:['client',clientId], queryFn: async () => (await (await fetch(`/api/clients/${clientId}`)).json()).data, enabled:!!clientId });
  const { data: reports = [] }      = useQuery({ queryKey:['reports',clientId], queryFn: async () => (await (await fetch(`/api/reports?client_id=${clientId}`)).json()).data ?? [], enabled:!!clientId });
  const { data: upsells = [] }      = useQuery({ queryKey:['upsells',clientId], queryFn: async () => (await (await fetch(`/api/upsells?client_id=${clientId}`)).json()).data ?? [], enabled:!!clientId });

  // Fetch sales lead + logs if this client came from sales team
  const { data: salesLead } = useQuery({
    queryKey: ['sales-lead-for-client', clientId],
    queryFn:  async () => {
      if (!client?.sales_lead_id) return null;
      const res = await fetch(`/api/sales-leads?id=${client.sales_lead_id}`);
      const json = await res.json();
      return json.data?.[0] ?? null;
    },
    enabled: !!client?.sales_lead_id,
  });

  const totalRevenue = upsells.reduce((s:number,u:any) => s + parseFloat(u.total_cost||0), 0);
  const totalUpfront = upsells.reduce((s:number,u:any) => s + parseFloat(u.upfront_amount||0), 0);
  const totalDue     = upsells.reduce((s:number,u:any) => s + parseFloat(u.remaining_due||0), 0);

  const saveUpsell = useMutation({
    mutationFn: async (data:any) => {
      const method = editUpsellId ? 'PATCH' : 'POST';
      const body   = editUpsellId ? { id:editUpsellId, ...data } : { ...data, client_id:clientId };
      const res    = await fetch('/api/upsells', { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const json   = await res.json(); if (!res.ok) throw new Error(json.error); return json.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey:['upsells',clientId] }); toast.success(editUpsellId ? 'Upsell updated!' : 'Upsell logged!'); setShowUpsellModal(false); setEditUpsellId(null); setUpsellForm({ ...emptyUpsell }); },
    onError: (e:Error) => toast.error(e.message),
  });

  const deleteUpsell = useMutation({
    mutationFn: async (id:string) => { const res = await fetch(`/api/upsells?id=${id}`,{ method:'DELETE' }); if (!res.ok) throw new Error('Delete failed'); },
    onSuccess: () => { qc.invalidateQueries({ queryKey:['upsells',clientId] }); toast.success('Upsell deleted'); },
    onError: (e:Error) => toast.error(e.message),
  });

  const openEditUpsell = (u:any) => {
    setEditUpsellId(u.id);
    setUpsellForm({ client_id:u.client_id, date:u.date?.split('T')[0]||'', product_sold:u.product_sold, total_cost:String(u.total_cost), upfront_amount:String(u.upfront_amount), project_status:u.project_status, currency:u.currency, notes:u.notes||'' });
    setShowUpsellModal(true);
  };

  if (isLoading) return <div style={{ textAlign:'center', padding:'80px', color:'rgba(148,163,184,.3)' }}>Loading...</div>;
  if (!client)   return <div style={{ textAlign:'center', padding:'80px', color:'rgba(148,163,184,.3)' }}>Client not found</div>;

  const cst = CLIENT_STATUS[client.status] ?? CLIENT_STATUS.inactive;
  const salesLogs = salesLead?.logs ?? [];
  const hasSalesHistory = !!client.sales_lead_id;

  const tabs: Array<{key: 'overview'|'upsells'|'reports'|'sales_history'; label: string; count?: number}> = [
    { key:'overview',       label:'Overview' },
    { key:'upsells',        label:'Upsells',       count: upsells.length  },
    { key:'reports',        label:'Reports',        count: reports.length  },
    ...(hasSalesHistory ? [{ key:'sales_history' as const, label:'Sales History', count: salesLogs.length }] : []),
  ];

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28 }} className="wm-fade-up">
        <button onClick={() => router.push(backHref)} style={{ width:36, height:36, borderRadius:9, border:'none', background:'rgba(255,255,255,.05)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.6)', flexShrink:0, transition:'all .2s' }}
          onMouseEnter={e => { const b=e.currentTarget as HTMLButtonElement; b.style.background='rgba(124,58,237,.12)'; b.style.color='#a78bfa'; }}
          onMouseLeave={e => { const b=e.currentTarget as HTMLButtonElement; b.style.background='rgba(255,255,255,.05)'; b.style.color='rgba(148,163,184,.6)'; }}>
          <ArrowLeft size={16}/>
        </button>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
            <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9' }}>{client.company_name}</h1>
            <span style={{ padding:'3px 10px', borderRadius:99, fontSize:'.72rem', fontWeight:500, background:cst.bg, color:cst.color, textTransform:'capitalize' }}>{client.status}</span>
            {hasSalesHistory && (
              <span style={{ padding:'3px 10px', borderRadius:99, fontSize:'.7rem', background:'rgba(244,114,182,.1)', color:'#f472b6', border:'0.5px solid rgba(244,114,182,.2)' }}>
                🎯 From Sales Team
              </span>
            )}
          </div>
          <p style={{ fontSize:'.83rem', color:'rgba(148,163,184,.5)' }}>
            Account Manager: <span style={{ color:'rgba(148,163,184,.8)', fontWeight:500 }}>{client.assignedManager?.full_name ?? 'Unassigned'}</span>
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }} className="wm-fade-up">
        {[
          { label:'Total Revenue',  value:`$${totalRevenue.toLocaleString()}`, color:'#a78bfa' },
          { label:'Collected',      value:`$${totalUpfront.toLocaleString()}`, color:'#34d399' },
          { label:'Remaining Due',  value:`$${totalDue.toLocaleString()}`,     color:'#fbbf24' },
          { label:'Total Reports',  value:String(reports.length),              color:'#60a5fa' },
        ].map(s => (
          <div key={s.label} className="wm-stat">
            <p style={{ fontSize:'.7rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>{s.label}</p>
            <p style={{ fontSize:'1.6rem', fontWeight:700, color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, borderBottom:'1px solid rgba(124,58,237,.12)', marginBottom:20 }} className="wm-fade-up-2">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding:'9px 16px', border:'none', background:'none', cursor:'pointer',
            fontSize:'.83rem', fontWeight:500, textTransform:'capitalize',
            color: activeTab===tab.key ? '#a78bfa' : 'rgba(148,163,184,.5)',
            borderBottom: activeTab===tab.key ? '2px solid #a78bfa' : '2px solid transparent',
            transition:'all .2s', display:'flex', alignItems:'center', gap:6,
          }}>
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span style={{ padding:'1px 7px', borderRadius:99, fontSize:'.68rem', background: tab.key==='sales_history' ? 'rgba(244,114,182,.15)' : 'rgba(167,139,250,.15)', color: tab.key==='sales_history' ? '#f472b6' : '#a78bfa' }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="wm-card wm-fade-up-2" style={{ padding:'24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'rgba(167,139,250,.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'#a78bfa' }}>
              <Building2 size={15}/>
            </div>
            <p style={{ fontSize:'.95rem', fontWeight:600, color:'#f1f5f9' }}>Client Information</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:20 }}>
            {[
              { icon:User,     label:'Contact Person', value:client.contact_person },
              { icon:Mail,     label:'Email',          value:client.email },
              ...(client.phone   ? [{ icon:Phone,    label:'Phone',          value:client.phone }]   : []),
              ...(client.website ? [{ icon:Globe,    label:'Website',        value:client.website, isLink:true }] : []),
              { icon:User,     label:'Account Manager', value:client.assignedManager?.full_name ?? 'Unassigned' },
              { icon:Calendar, label:'Client Since',    value:formatTime(client.created_at) },
            ].map(({ icon:Icon, label, value, isLink }:any) => (
              <div key={label} style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,.04)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.4)', flexShrink:0, marginTop:2 }}>
                  <Icon size={14}/>
                </div>
                <div>
                  <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.45)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:3 }}>{label}</p>
                  {isLink ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize:'.87rem', fontWeight:500, color:'#a78bfa', textDecoration:'none' }}>
                      {value.replace(/https?:\/\//,'')}
                    </a>
                  ) : (
                    <p style={{ fontSize:'.87rem', fontWeight:500, color:'#f1f5f9' }}>{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {client.notes && (
            <div style={{ marginTop:20, padding:'14px 16px', borderRadius:10, background:'rgba(255,255,255,.03)', border:'0.5px solid rgba(255,255,255,.06)' }}>
              <p style={{ fontSize:'.7rem', color:'rgba(148,163,184,.45)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Notes</p>
              <p style={{ fontSize:'.85rem', color:'rgba(148,163,184,.7)', lineHeight:1.6 }}>{client.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Upsells Tab ── */}
      {activeTab === 'upsells' && (
        <div className="wm-fade-up-2">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.45)' }}>{upsells.length} deal{upsells.length!==1?'s':''} recorded</p>
            {canEdit && (
              <button className="wm-btn-primary" onClick={() => { setEditUpsellId(null); setUpsellForm({ ...emptyUpsell, client_id:clientId }); setShowUpsellModal(true); }}
                style={{ display:'flex', alignItems:'center', gap:6, height:34, padding:'0 14px', fontSize:'.82rem' }}>
                <Plus size={13}/> Log Upsell
              </button>
            )}
          </div>
          {upsells.length === 0 ? (
            <div className="wm-card" style={{ padding:'60px 24px', textAlign:'center' }}>
              <TrendingUp size={36} style={{ color:'rgba(148,163,184,.15)', margin:'0 auto 12px', display:'block' }} />
              <p style={{ color:'rgba(148,163,184,.4)' }}>No upsells recorded</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {upsells.map((u:any) => {
                const st = UPSELL_STATUS[u.project_status] ?? UPSELL_STATUS.pending;
                return (
                  <div key={u.id} className="wm-card" style={{ padding:'16px 20px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:12 }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <p style={{ fontWeight:600, color:'#f1f5f9', fontSize:'.9rem' }}>{u.product_sold}</p>
                          <span style={{ padding:'2px 9px', borderRadius:99, fontSize:'.7rem', fontWeight:500, background:st.bg, color:st.color, textTransform:'capitalize' }}>{u.project_status}</span>
                        </div>
                        <p style={{ fontSize:'.75rem', color:'rgba(148,163,184,.45)' }}>
                          {new Date(u.date).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}
                        </p>
                        {u.notes && <p style={{ fontSize:'.8rem', color:'rgba(148,163,184,.5)', marginTop:6, fontStyle:'italic' }}>"{u.notes}"</p>}
                      </div>
                      {canEdit && (
                        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                          {[
                            { icon:Pencil, action:() => openEditUpsell(u), color:'#a78bfa' },
                            { icon:Trash2, action:() => deleteUpsell.mutate(u.id), color:'#f87171' },
                          ].map(({ icon:Icon, action, color },i) => (
                            <button key={i} onClick={action} style={{ width:28, height:28, borderRadius:7, border:'none', background:'rgba(255,255,255,.04)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.4)', transition:'all .2s' }}
                              onMouseEnter={e => { const b=e.currentTarget as HTMLButtonElement; b.style.background=color+'18'; b.style.color=color; }}
                              onMouseLeave={e => { const b=e.currentTarget as HTMLButtonElement; b.style.background='rgba(255,255,255,.04)'; b.style.color='rgba(148,163,184,.4)'; }}>
                              <Icon size={12}/>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,.05)' }}>
                      {[
                        { label:'Total Cost',    value:`${u.currency} ${parseFloat(u.total_cost).toLocaleString()}`,        color:'#f1f5f9' },
                        { label:'Upfront Paid',  value:`${u.currency} ${parseFloat(u.upfront_amount).toLocaleString()}`,    color:'#34d399' },
                        { label:'Remaining Due', value:`${u.currency} ${parseFloat(u.remaining_due||0).toLocaleString()}`,  color:'#fbbf24' },
                      ].map(({ label,value,color }) => (
                        <div key={label}>
                          <p style={{ fontSize:'.7rem', color:'rgba(148,163,184,.4)', marginBottom:3 }}>{label}</p>
                          <p style={{ fontSize:'.9rem', fontWeight:700, color }}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Reports Tab ── */}
      {activeTab === 'reports' && (
        <div className="wm-fade-up-2" style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {reports.length === 0 ? (
            <div className="wm-card" style={{ padding:'60px 24px', textAlign:'center' }}>
              <FileText size={36} style={{ color:'rgba(148,163,184,.15)', margin:'0 auto 12px', display:'block' }} />
              <p style={{ color:'rgba(148,163,184,.4)' }}>No reports uploaded</p>
            </div>
          ) : reports.map((r:any) => {
            const rt = REPORT_TYPE[r.report_type] ?? REPORT_TYPE.other;
            return (
              <div key={r.id} className="wm-card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, background:rt.bg, border:`0.5px solid ${rt.color}33`, display:'flex', alignItems:'center', justifyContent:'center', color:rt.color }}>
                  <FileText size={17}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:600, color:'#f1f5f9', fontSize:'.88rem', marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.title}</p>
                  <p style={{ fontSize:'.75rem', color:'rgba(148,163,184,.45)' }}>Uploaded by {r.uploader?.full_name} · {formatTime(r.created_at)}</p>
                  {r.description && <p style={{ fontSize:'.78rem', color:'rgba(148,163,184,.4)', marginTop:4 }}>{r.description}</p>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <span style={{ padding:'3px 10px', borderRadius:99, fontSize:'.7rem', fontWeight:500, background:rt.bg, color:rt.color, textTransform:'capitalize' }}>
                    {r.report_type.replace('_',' ')}
                  </span>
                  <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="wm-btn-ghost"
                    style={{ padding:'5px 12px', fontSize:'.75rem', display:'flex', alignItems:'center', gap:5, borderRadius:8, textDecoration:'none' }}>
                    <Download size={13}/> Download
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Sales History Tab ── */}
      {activeTab === 'sales_history' && (
        <div className="wm-fade-up-2">
          {/* Lead summary */}
          {salesLead && (
            <div className="wm-card" style={{ padding:'20px 24px', marginBottom:16, borderColor:'rgba(244,114,182,.2)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'rgba(244,114,182,.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'#f472b6' }}>
                  <Users size={14}/>
                </div>
                <p style={{ fontSize:'.95rem', fontWeight:600, color:'#f1f5f9' }}>Sales Lead Details</p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
                {[
                  { label:'Submitted by',   value:salesLead.creator?.full_name ?? '—' },
                  { label:'Expected Value', value:salesLead.expected_value ? `${salesLead.currency} ${parseFloat(salesLead.expected_value).toLocaleString()}` : '—' },
                  { label:'Service',        value:salesLead.service_required || '—' },
                  { label:'Sales Stage',    value:salesLead.sales_stage || '—' },
                  { label:'Submitted',      value:formatTime(salesLead.created_at) },
                  { label:'Approved by',    value:salesLead.approver?.full_name ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,.03)', border:'0.5px solid rgba(255,255,255,.05)' }}>
                    <p style={{ fontSize:'.7rem', color:'rgba(148,163,184,.45)', marginBottom:4 }}>{label}</p>
                    <p style={{ fontSize:'.85rem', fontWeight:500, color:'#f1f5f9' }}>{value}</p>
                  </div>
                ))}
              </div>
              {salesLead.manager_notes && (
                <div style={{ marginTop:12, padding:'12px 14px', borderRadius:10, background:'rgba(167,139,250,.06)', border:'0.5px solid rgba(167,139,250,.15)' }}>
                  <p style={{ fontSize:'.7rem', color:'#a78bfa', marginBottom:4 }}>Manager Notes</p>
                  <p style={{ fontSize:'.83rem', color:'rgba(148,163,184,.7)' }}>{salesLead.manager_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Sales logs */}
          <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.45)', marginBottom:12 }}>
            {salesLogs.length} activity log{salesLogs.length!==1?'s':''} from sales team
          </p>
          {salesLogs.length === 0 ? (
            <div className="wm-card" style={{ padding:'40px 24px', textAlign:'center' }}>
              <p style={{ color:'rgba(148,163,184,.3)', fontSize:'.85rem' }}>No sales logs recorded</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {salesLogs.map((log:any) => {
                const lt = LOG_TYPE[log.log_type] ?? LOG_TYPE.other;
                const isExpanded = expandedLog === log.id;
                return (
                  <div key={log.id} className="wm-card" style={{ padding:'14px 18px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                      <div style={{ width:34, height:34, borderRadius:9, flexShrink:0, background:lt.bg, display:'flex', alignItems:'center', justifyContent:'center', color:lt.color }}>
                        <PhoneIcon size={14}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <p style={{ fontWeight:600, color:'#f1f5f9', fontSize:'.87rem' }}>{log.title}</p>
                            <span style={{ padding:'2px 8px', borderRadius:99, fontSize:'.68rem', background:lt.bg, color:lt.color }}>{lt.label}</span>
                          </div>
                          <button onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(148,163,184,.4)' }}>
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
        </div>
      )}

      {/* Upsell Modal */}
      <Dialog open={showUpsellModal} onOpenChange={setShowUpsellModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editUpsellId ? 'Edit Upsell' : 'Log Upsell'}</DialogTitle>
            <DialogDescription>Record an upsell deal for {client.company_name}</DialogDescription>
          </DialogHeader>
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:8 }}>
            <div><label style={lblStyle}>Product / Service Sold</label>
              <input style={inpStyle} placeholder="e.g. SEO Package" value={upsellForm.product_sold} onChange={e => setUpsellForm(f => ({ ...f, product_sold:e.target.value }))} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={lblStyle}>Date</label><input style={inpStyle} type="date" value={upsellForm.date} onChange={e => setUpsellForm(f => ({ ...f, date:e.target.value }))} /></div>
              <div><label style={lblStyle}>Currency</label>
                <select style={selStyle} value={upsellForm.currency} onChange={e => setUpsellForm(f => ({ ...f, currency:e.target.value }))}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={lblStyle}>Total Cost</label><input style={inpStyle} type="number" placeholder="0.00" value={upsellForm.total_cost} onChange={e => setUpsellForm(f => ({ ...f, total_cost:e.target.value }))} /></div>
              <div><label style={lblStyle}>Upfront Amount</label><input style={inpStyle} type="number" placeholder="0.00" value={upsellForm.upfront_amount} onChange={e => setUpsellForm(f => ({ ...f, upfront_amount:e.target.value }))} /></div>
            </div>
            {upsellForm.total_cost && upsellForm.upfront_amount && (
              <div style={{ padding:'10px 14px', borderRadius:9, background:'rgba(251,191,36,.08)', border:'0.5px solid rgba(251,191,36,.2)', fontSize:'.83rem' }}>
                <span style={{ color:'rgba(148,163,184,.5)' }}>Remaining Due: </span>
                <span style={{ fontWeight:700, color:'#fbbf24' }}>
                  {upsellForm.currency} {(parseFloat(upsellForm.total_cost||'0') - parseFloat(upsellForm.upfront_amount||'0')).toLocaleString()}
                </span>
              </div>
            )}
            <div><label style={lblStyle}>Project Status</label>
              <select style={selStyle} value={upsellForm.project_status} onChange={e => setUpsellForm(f => ({ ...f, project_status:e.target.value }))}>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select></div>
            <div><label style={lblStyle}>Notes</label>
              <textarea className="wm-input" placeholder="Any additional notes..." value={upsellForm.notes} onChange={e => setUpsellForm(f => ({ ...f, notes:e.target.value }))} rows={3} style={{ height:'auto', resize:'none' }} /></div>
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button className="wm-btn-ghost" onClick={() => setShowUpsellModal(false)} style={{ flex:1, height:40 }}>Cancel</button>
              <button className="wm-btn-primary" style={{ flex:1, height:40 }} disabled={saveUpsell.isPending || !upsellForm.product_sold || !upsellForm.date || !upsellForm.total_cost} onClick={() => saveUpsell.mutate(upsellForm)}>
                {editUpsellId ? 'Update' : 'Log Upsell'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}