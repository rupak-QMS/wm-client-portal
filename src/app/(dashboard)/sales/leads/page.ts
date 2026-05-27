'use client';
import { useState }                          from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Search, ArrowUpRight, FileText } from 'lucide-react';
import { toast } from 'sonner';

const STAGES  = ['prospecting','qualification','proposal','negotiation','closed'];
const STATUS_STYLE: Record<string,{bg:string;color:string}> = {
  draft:            { bg:'rgba(148,163,184,.1)',  color:'rgba(148,163,184,.7)' },
  pending_approval: { bg:'rgba(251,191,36,.12)',  color:'#fbbf24' },
  approved:         { bg:'rgba(52,211,153,.12)',  color:'#34d399' },
  rejected:         { bg:'rgba(248,113,113,.12)', color:'#f87171' },
  assigned:         { bg:'rgba(96,165,250,.12)',  color:'#60a5fa' },
};

const inpStyle: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none' };
const selStyle: React.CSSProperties = { ...inpStyle, cursor:'pointer' };
const lblStyle: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

const emptyForm = { company_name:'', contact_person:'', email:'', phone:'', website:'', service_required:'', expected_value:'', currency:'USD', sales_stage:'prospecting', notes:'' };

export default function SalesLeadsPage() {
  const qc = useQueryClient();
  const [search,    setSearch]    = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<string|null>(null);
  const [form,      setForm]      = useState({ ...emptyForm });
  const [selected,  setSelected]  = useState<any>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['sales-leads'],
    queryFn:  async () => (await (await fetch('/api/sales-leads')).json()).data ?? [],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editId ? 'PATCH' : 'POST';
      const body   = editId ? { id:editId, ...data } : data;
      const res    = await fetch('/api/sales-leads', { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const json   = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey:['sales-leads'] }); toast.success(editId ? 'Lead updated!' : 'Lead created!'); setShowModal(false); setEditId(null); setForm({ ...emptyForm }); },
    onError: (e:Error) => toast.error(e.message),
  });

  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const res  = await fetch('/api/sales-leads', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id, status:'pending_approval' }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey:['sales-leads'] }); toast.success('Lead submitted for approval!'); setSelected(null); },
    onError: (e:Error) => toast.error(e.message),
  });

  const filtered = leads.filter((l: any) =>
    l.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.contact_person?.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (l: any) => {
    setEditId(l.id);
    setForm({ company_name:l.company_name, contact_person:l.contact_person, email:l.email, phone:l.phone||'', website:l.website||'', service_required:l.service_required||'', expected_value:String(l.expected_value||''), currency:l.currency||'USD', sales_stage:l.sales_stage||'prospecting', notes:l.notes||'' });
    setShowModal(true);
  };

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Users size={15} style={{ color:'#a78bfa' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Pipeline</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>My Leads</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Manage and submit leads for approval</p>
        </div>
        <button className="wm-btn-primary" onClick={() => { setEditId(null); setForm({ ...emptyForm }); setShowModal(true); }}
          style={{ display:'flex', alignItems:'center', gap:7, height:38 }}>
          <Plus size={15}/> Add Lead
        </button>
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:20 }} className="wm-fade-up">
        <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'rgba(148,163,184,.35)', pointerEvents:'none' }} />
        <input className="wm-input" style={{ paddingLeft:36, height:40 }} placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Leads grid */}
      {isLoading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'rgba(148,163,184,.3)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="wm-card" style={{ padding:'60px 24px', textAlign:'center' }}>
          <Users size={36} style={{ color:'rgba(148,163,184,.15)', margin:'0 auto 12px', display:'block' }} />
          <p style={{ color:'rgba(148,163,184,.4)', fontSize:'.9rem' }}>No leads yet</p>
          <p style={{ color:'rgba(148,163,184,.25)', fontSize:'.8rem', marginTop:4 }}>Click "Add Lead" to create your first lead</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }} className="wm-fade-up-2">
          {filtered.map((l: any) => {
            const st = STATUS_STYLE[l.status] ?? STATUS_STYLE.draft;
            return (
              <div key={l.id} className="wm-card" style={{ padding:'16px 20px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                      <p style={{ fontWeight:600, color:'#f1f5f9', fontSize:'.92rem' }}>{l.company_name}</p>
                      <span style={{ padding:'2px 9px', borderRadius:99, fontSize:'.7rem', fontWeight:500, background:st.bg, color:st.color, textTransform:'capitalize' }}>
                        {l.status.replace(/_/g,' ')}
                      </span>
                      <span style={{ padding:'2px 9px', borderRadius:99, fontSize:'.7rem', background:'rgba(255,255,255,.04)', color:'rgba(148,163,184,.5)', textTransform:'capitalize' }}>
                        {l.sales_stage}
                      </span>
                    </div>
                    <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:'.78rem', color:'rgba(148,163,184,.55)' }}>
                      <span>{l.contact_person}</span>
                      <span>{l.email}</span>
                      {l.expected_value && <span style={{ color:'#34d399', fontWeight:600 }}>${parseFloat(l.expected_value).toLocaleString()} est.</span>}
                    </div>
                    {l.service_required && <p style={{ fontSize:'.75rem', color:'rgba(148,163,184,.4)', marginTop:4 }}>{l.service_required}</p>}
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    {['draft','pending_approval'].includes(l.status) && (
                      <button className="wm-btn-ghost" onClick={() => openEdit(l)}
                        style={{ padding:'5px 12px', fontSize:'.75rem', height:'auto' }}>Edit</button>
                    )}
                    {l.status === 'draft' && (
                      <button className="wm-btn-primary" onClick={() => submitMutation.mutate(l.id)}
                        style={{ padding:'5px 12px', fontSize:'.75rem', height:'auto', display:'flex', alignItems:'center', gap:5 }}>
                        Submit <ArrowUpRight size={12}/>
                      </button>
                    )}
                    <button className="wm-btn-ghost" onClick={() => setSelected(l)}
                      style={{ padding:'5px 10px', fontSize:'.75rem', height:'auto' }}>
                      <FileText size={13}/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead detail panel */}
      {selected && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={() => setSelected(null)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:500, maxHeight:'85vh', overflowY:'auto', background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28 }}>
            <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>{selected.company_name}</h2>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:20 }}>Lead Details</p>
            {[
              { label:'Contact',  value:selected.contact_person },
              { label:'Email',    value:selected.email },
              { label:'Phone',    value:selected.phone || '—' },
              { label:'Website',  value:selected.website || '—' },
              { label:'Service',  value:selected.service_required || '—' },
              { label:'Est. Value', value:selected.expected_value ? `$${parseFloat(selected.expected_value).toLocaleString()}` : '—' },
              { label:'Stage',    value:selected.sales_stage },
              { label:'Status',   value:selected.status.replace(/_/g,' ') },
              ...(selected.rejection_reason ? [{ label:'Rejection Reason', value:selected.rejection_reason }] : []),
              ...(selected.manager_notes    ? [{ label:'Manager Notes',    value:selected.manager_notes    }] : []),
            ].map(({ label, value }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                <span style={{ fontSize:'.78rem', color:'rgba(148,163,184,.45)' }}>{label}</span>
                <span style={{ fontSize:'.82rem', color:'#f1f5f9', maxWidth:'60%', textAlign:'right' }}>{value}</span>
              </div>
            ))}
            <button className="wm-btn-ghost" onClick={() => setSelected(null)} style={{ width:'100%', height:40, marginTop:16 }}>Close</button>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={() => setShowModal(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28 }}>
            <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>{editId ? 'Edit Lead' : 'Add New Lead'}</h2>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:20 }}>Fill in the lead details</p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={lblStyle}>Company Name *</label><input style={inpStyle} value={form.company_name} onChange={e => setForm(f=>({...f,company_name:e.target.value}))} placeholder="Acme Corp" /></div>
                <div><label style={lblStyle}>Contact Person *</label><input style={inpStyle} value={form.contact_person} onChange={e => setForm(f=>({...f,contact_person:e.target.value}))} placeholder="John Smith" /></div>
                <div><label style={lblStyle}>Email *</label><input style={inpStyle} type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="john@acme.com" /></div>
                <div><label style={lblStyle}>Phone</label><input style={inpStyle} value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="+1 234 567 890" /></div>
                <div><label style={lblStyle}>Website</label><input style={inpStyle} value={form.website} onChange={e => setForm(f=>({...f,website:e.target.value}))} placeholder="https://acme.com" /></div>
                <div><label style={lblStyle}>Service Required</label><input style={inpStyle} value={form.service_required} onChange={e => setForm(f=>({...f,service_required:e.target.value}))} placeholder="SEO, Web Design..." /></div>
                <div><label style={lblStyle}>Expected Value</label><input style={inpStyle} type="number" value={form.expected_value} onChange={e => setForm(f=>({...f,expected_value:e.target.value}))} placeholder="5000" /></div>
                <div><label style={lblStyle}>Currency</label>
                  <select style={selStyle} value={form.currency} onChange={e => setForm(f=>({...f,currency:e.target.value}))}>
                    {['USD','GBP','EUR','AUD','INR','SGD'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={lblStyle}>Sales Stage</label>
                <select style={selStyle} value={form.sales_stage} onChange={e => setForm(f=>({...f,sales_stage:e.target.value}))}>
                  {STAGES.map(s => <option key={s} value={s} style={{ textTransform:'capitalize' }}>{s}</option>)}
                </select>
              </div>
              <div><label style={lblStyle}>Notes</label>
                <textarea style={{ ...inpStyle, height:'auto', resize:'none', padding:'10px 12px' }} rows={3} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} placeholder="Additional notes..." />
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button className="wm-btn-ghost" onClick={() => setShowModal(false)} style={{ flex:1, height:40 }}>Cancel</button>
                <button className="wm-btn-primary" style={{ flex:1, height:40 }}
                  disabled={saveMutation.isPending || !form.company_name || !form.contact_person || !form.email}
                  onClick={() => saveMutation.mutate(form)}>
                  {editId ? 'Update Lead' : 'Save Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}