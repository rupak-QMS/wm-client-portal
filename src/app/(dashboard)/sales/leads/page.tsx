'use client';
import { useState }                              from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ShoppingBag, ArrowUpRight, Pencil, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

const CURRENCIES = ['USD','GBP','EUR','AUD','INR','SGD'];
const SERVICES   = ['SEO','Website Design','Website Development','Google Ads','Social Media','Content Marketing','Email Marketing','Other'];

const STATUS_STYLE: Record<string, { bg:string; color:string }> = {
  draft:            { bg:'rgba(148,163,184,.1)',  color:'rgba(148,163,184,.7)' },
  pending_approval: { bg:'rgba(251,191,36,.12)',  color:'#fbbf24' },
  approved:         { bg:'rgba(52,211,153,.12)',  color:'#34d399' },
  rejected:         { bg:'rgba(248,113,113,.12)', color:'#f87171' },
  assigned:         { bg:'rgba(96,165,250,.12)',  color:'#60a5fa' },
};

const inp: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none' };
const sel: React.CSSProperties = { ...inp, cursor:'pointer' };
const lbl: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };
const sec: React.CSSProperties = { fontSize:'.72rem', color:'rgba(148,163,184,.4)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10, marginTop:4, paddingBottom:6, borderBottom:'1px solid rgba(124,58,237,.1)' };

const emptyForm = {
  // Client details
  company_name:'', contact_person:'', email:'', phone:'', website:'', service_required:'',
  // Sale details
  project_cost:'', collected_amount:'', currency:'USD', notes:'',
};

export default function MySalesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<string|null>(null);
  const [selected,  setSelected]  = useState<any>(null);
  const [form,      setForm]      = useState({ ...emptyForm });

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['sales-leads'],
    queryFn:  async () => (await (await fetch('/api/sales-leads')).json()).data ?? [],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editId ? 'PATCH' : 'POST';
      const body   = editId ? { id: editId, ...data } : data;
      const res    = await fetch('/api/sales-leads', { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const json   = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['sales-leads'] });
      toast.success(editId ? 'Sale updated!' : 'Sale saved as draft!');
      setShowModal(false); setEditId(null); setForm({ ...emptyForm });
    },
    onError: (e:Error) => toast.error(e.message),
  });

  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const res  = await fetch('/api/sales-leads', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id, status:'pending_approval' }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['sales-leads'] });
      toast.success('Submitted for manager approval!');
    },
    onError: (e:Error) => toast.error(e.message),
  });

  const openAdd = () => {
    setEditId(null); setForm({ ...emptyForm }); setShowModal(true);
  };

  const openEdit = (l: any) => {
    setEditId(l.id);
    setForm({
      company_name:     l.company_name     ?? '',
      contact_person:   l.contact_person   ?? '',
      email:            l.email            ?? '',
      phone:            l.phone            ?? '',
      website:          l.website          ?? '',
      service_required: l.service_required ?? '',
      project_cost:     l.project_cost     ? String(l.project_cost)     : '',
      collected_amount: l.collected_amount ? String(l.collected_amount) : '',
      currency:         l.currency         ?? 'USD',
      notes:            l.notes            ?? '',
    });
    setShowModal(true);
  };

  const drafts   = leads.filter((l:any) => l.status === 'draft');
  const pending  = leads.filter((l:any) => l.status === 'pending_approval');
  const approved = leads.filter((l:any) => ['approved','assigned'].includes(l.status));
  const rejected = leads.filter((l:any) => l.status === 'rejected');

  const SaleCard = ({ l }: { l: any }) => {
    const st = STATUS_STYLE[l.status] ?? STATUS_STYLE.draft;
    return (
      <div className="wm-card" style={{ padding:'16px 20px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
              <p style={{ fontWeight:600, color:'#f1f5f9', fontSize:'.92rem' }}>{l.company_name}</p>
              <span style={{ padding:'2px 9px', borderRadius:99, fontSize:'.7rem', fontWeight:500, background:st.bg, color:st.color, textTransform:'capitalize' }}>
                {l.status.replace(/_/g,' ')}
              </span>
            </div>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:'.78rem', color:'rgba(148,163,184,.55)' }}>
              <span>{l.contact_person}</span>
              <span>{l.email}</span>
              {l.service_required && <span>· {l.service_required}</span>}
            </div>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:'.78rem', marginTop:5 }}>
              {l.project_cost && (
                <span style={{ color:'rgba(148,163,184,.5)' }}>
                  Project: <strong style={{ color:'#f1f5f9' }}>{l.currency} {parseFloat(l.project_cost).toLocaleString()}</strong>
                </span>
              )}
              {l.collected_amount && (
                <span style={{ color:'rgba(148,163,184,.5)' }}>
                  Collected: <strong style={{ color:'#34d399' }}>{l.currency} {parseFloat(l.collected_amount).toLocaleString()}</strong>
                </span>
              )}
            </div>
            {l.rejection_reason && (
              <p style={{ fontSize:'.75rem', color:'#f87171', marginTop:5, borderLeft:'2px solid rgba(248,113,113,.3)', paddingLeft:8 }}>
                {l.rejection_reason}
              </p>
            )}
            {l.manager_notes && (
              <p style={{ fontSize:'.75rem', color:'#60a5fa', marginTop:5, borderLeft:'2px solid rgba(96,165,250,.3)', paddingLeft:8 }}>
                {l.manager_notes}
              </p>
            )}
          </div>
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            {['draft','rejected'].includes(l.status) && (
              <button className="wm-btn-ghost" onClick={() => openEdit(l)}
                style={{ padding:'5px 10px', fontSize:'.75rem', height:'auto', display:'flex', alignItems:'center', gap:4 }}>
                <Pencil size={12}/> Edit
              </button>
            )}
            {l.status === 'draft' && (
              <button className="wm-btn-primary" onClick={() => submitMutation.mutate(l.id)}
                style={{ padding:'5px 12px', fontSize:'.75rem', height:'auto', display:'flex', alignItems:'center', gap:4 }}>
                Submit <ArrowUpRight size={12}/>
              </button>
            )}
            <button className="wm-btn-ghost" onClick={() => setSelected(l)}
              style={{ padding:'5px 10px', fontSize:'.75rem', height:'auto' }}>
              <Eye size={13}/>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Section = ({ title, items, color }: { title:string; items:any[]; color:string }) =>
    items.length === 0 ? null : (
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <span style={{ fontSize:'.72rem', fontWeight:600, color, textTransform:'uppercase', letterSpacing:'.06em' }}>{title}</span>
          <span style={{ padding:'1px 8px', borderRadius:99, background:color+'18', fontSize:'.7rem', color }}>{items.length}</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {items.map(l => <SaleCard key={l.id} l={l} />)}
        </div>
      </div>
    );

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <ShoppingBag size={15} style={{ color:'#a78bfa' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Sales</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>My Sales</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Submit client & sale details for manager approval</p>
        </div>
        <button className="wm-btn-primary" onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:7, height:38 }}>
          <Plus size={15}/> New Sale
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign:'center', padding:40, color:'rgba(148,163,184,.3)' }}>Loading...</div>
      ) : leads.length === 0 ? (
        <div className="wm-card" style={{ padding:'60px 24px', textAlign:'center' }}>
          <ShoppingBag size={36} style={{ color:'rgba(148,163,184,.15)', margin:'0 auto 12px', display:'block' }} />
          <p style={{ color:'rgba(148,163,184,.4)', fontSize:'.9rem' }}>No sales yet</p>
          <p style={{ color:'rgba(148,163,184,.25)', fontSize:'.8rem', marginTop:4 }}>Click "New Sale" to submit your first sale</p>
        </div>
      ) : (
        <div className="wm-fade-up-2">
          <Section title="Drafts"             items={drafts}   color="rgba(148,163,184,.7)" />
          <Section title="Pending Approval"   items={pending}  color="#fbbf24" />
          <Section title="Approved / Assigned" items={approved} color="#34d399" />
          <Section title="Rejected"           items={rejected} color="#f87171" />
        </div>
      )}

      {/* Detail view */}
      {selected && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={() => setSelected(null)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:480, maxHeight:'85vh', overflowY:'auto', background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#f1f5f9', marginBottom:2 }}>{selected.company_name}</h2>
                <p style={{ fontSize:'.78rem', color:'rgba(148,163,184,.4)' }}>Sale Details</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ width:30, height:30, borderRadius:8, border:'none', background:'rgba(255,255,255,.06)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.5)' }}>
                <X size={14}/>
              </button>
            </div>
            <p style={sec}>Client Information</p>
            {[
              { label:'Contact',  value: selected.contact_person },
              { label:'Email',    value: selected.email },
              { label:'Phone',    value: selected.phone || '—' },
              { label:'Website',  value: selected.website || '—' },
              { label:'Service',  value: selected.service_required || '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                <span style={{ fontSize:'.78rem', color:'rgba(148,163,184,.45)' }}>{label}</span>
                <span style={{ fontSize:'.82rem', color:'#f1f5f9' }}>{value}</span>
              </div>
            ))}
            <p style={{ ...sec, marginTop:16 }}>Sale Information</p>
            {[
              { label:'Project Cost',     value: selected.project_cost     ? `${selected.currency} ${parseFloat(selected.project_cost).toLocaleString()}`     : '—' },
              { label:'Collected Amount', value: selected.collected_amount ? `${selected.currency} ${parseFloat(selected.collected_amount).toLocaleString()}` : '—' },
              { label:'Remaining',        value: selected.project_cost && selected.collected_amount ? `${selected.currency} ${(parseFloat(selected.project_cost) - parseFloat(selected.collected_amount)).toLocaleString()}` : '—' },
              { label:'Status',           value: selected.status.replace(/_/g,' ') },
              ...(selected.assigned_am_name ? [{ label:'Assigned AM', value: selected.assignedAM?.full_name ?? '—' }] : []),
            ].map(({ label, value }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                <span style={{ fontSize:'.78rem', color:'rgba(148,163,184,.45)' }}>{label}</span>
                <span style={{ fontSize:'.82rem', color:'#f1f5f9' }}>{value}</span>
              </div>
            ))}
            {selected.notes && (
              <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginTop:12, fontStyle:'italic', borderLeft:'2px solid rgba(124,58,237,.3)', paddingLeft:10 }}>{selected.notes}</p>
            )}
            {selected.rejection_reason && (
              <p style={{ fontSize:'.82rem', color:'#f87171', marginTop:10, borderLeft:'2px solid rgba(248,113,113,.3)', paddingLeft:10 }}>Rejected: {selected.rejection_reason}</p>
            )}
            {selected.manager_notes && (
              <p style={{ fontSize:'.82rem', color:'#60a5fa', marginTop:10, borderLeft:'2px solid rgba(96,165,250,.3)', paddingLeft:10 }}>Manager note: {selected.manager_notes}</p>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={() => setShowModal(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:580, maxHeight:'90vh', overflowY:'auto', background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28 }}>
            <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>{editId ? 'Edit Sale' : 'New Sale'}</h2>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:20 }}>Fill in client and sale details — saved as draft until you submit</p>

            {/* Client details */}
            <p style={sec}>Client Details</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div><label style={lbl}>Company Name *</label><input style={inp} value={form.company_name} onChange={e => setForm(f=>({...f,company_name:e.target.value}))} placeholder="Acme Corp" /></div>
              <div><label style={lbl}>Contact Person *</label><input style={inp} value={form.contact_person} onChange={e => setForm(f=>({...f,contact_person:e.target.value}))} placeholder="John Smith" /></div>
              <div><label style={lbl}>Email *</label><input style={inp} type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="john@acme.com" /></div>
              <div><label style={lbl}>Phone</label><input style={inp} value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="+61 400 000 000" /></div>
              <div><label style={lbl}>Website</label><input style={inp} value={form.website} onChange={e => setForm(f=>({...f,website:e.target.value}))} placeholder="https://acme.com" /></div>
              <div><label style={lbl}>Service</label>
                <select style={sel} value={form.service_required} onChange={e => setForm(f=>({...f,service_required:e.target.value}))}>
                  <option value="">Select service...</option>
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Sale details */}
            <p style={sec}>Sale Details</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div><label style={lbl}>Project Cost *</label><input style={inp} type="number" value={form.project_cost} onChange={e => setForm(f=>({...f,project_cost:e.target.value}))} placeholder="2000" /></div>
              <div><label style={lbl}>Collected Upfront *</label><input style={inp} type="number" value={form.collected_amount} onChange={e => setForm(f=>({...f,collected_amount:e.target.value}))} placeholder="500" /></div>
              <div><label style={lbl}>Currency</label>
                <select style={sel} value={form.currency} onChange={e => setForm(f=>({...f,currency:e.target.value}))}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Notes</label>
              <textarea style={{ ...inp, height:'auto', resize:'none' as const, padding:'10px 12px' }} rows={3}
                value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} placeholder="Any additional context for the manager..." />
            </div>

            {/* Remaining calc preview */}
            {form.project_cost && form.collected_amount && (
              <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(52,211,153,.06)', border:'0.5px solid rgba(52,211,153,.2)', marginBottom:14, display:'flex', justifyContent:'space-between', fontSize:'.82rem' }}>
                <span style={{ color:'rgba(148,163,184,.6)' }}>Remaining to collect:</span>
                <span style={{ color:'#34d399', fontWeight:600 }}>
                  {form.currency} {Math.max(parseFloat(form.project_cost||'0') - parseFloat(form.collected_amount||'0'), 0).toLocaleString()}
                </span>
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button className="wm-btn-ghost" onClick={() => setShowModal(false)} style={{ flex:1, height:40 }}>Cancel</button>
              <button className="wm-btn-ghost" style={{ flex:1, height:40 }}
                disabled={saveMutation.isPending || !form.company_name || !form.contact_person || !form.email}
                onClick={() => saveMutation.mutate(form)}>
                Save Draft
              </button>
              <button className="wm-btn-primary" style={{ flex:1, height:40, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                disabled={saveMutation.isPending || !form.company_name || !form.contact_person || !form.email || !form.project_cost || !form.collected_amount}
                onClick={async () => {
                  const saved = await saveMutation.mutateAsync(form);
                  if (saved?.id) submitMutation.mutate(saved.id);
                  else if (editId) submitMutation.mutate(editId);
                }}>
                Submit <ArrowUpRight size={14}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}