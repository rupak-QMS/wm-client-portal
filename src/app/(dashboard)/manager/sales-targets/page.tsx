'use client';
import { useState }                              from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, Plus, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CURRENCIES = ['USD','GBP','EUR','AUD','INR','SGD'];
const NOW        = new Date();
const inpStyle: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none' };
const selStyle: React.CSSProperties = { ...inpStyle, cursor:'pointer' };
const lblStyle: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

export default function ManagerSalesTargetsPage() {
  const qc = useQueryClient();
  const [month, setMonth]         = useState(NOW.getMonth() + 1);
  const [year,  setYear]          = useState(NOW.getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ sales_member_id:'', month:String(NOW.getMonth()+1), year:String(NOW.getFullYear()), target_clients:'0', target_revenue:'0', target_deals:'0', currency:'USD' });

  const prevMonth = () => { if (month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); };

  const { data: members = [] } = useQuery({
    queryKey: ['sales-members'],
    queryFn:  async () => (await (await fetch('/api/sales-members')).json()).data ?? [],
  });
  const { data: targets = [], isLoading } = useQuery({
    queryKey: ['sales-targets', month, year],
    queryFn:  async () => (await (await fetch(`/api/sales-targets?month=${month}&year=${year}`)).json()).data ?? [],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res  = await fetch('/api/sales-targets', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
      const json = await res.json(); if (!res.ok) throw new Error(json.error); return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['sales-targets'] }); toast.success('Target saved!'); setShowModal(false);
      setForm({ sales_member_id:'', month:String(month), year:String(year), target_clients:'0', target_revenue:'0', target_deals:'0', currency:'USD' });
    },
    onError: (e:Error) => toast.error(e.message),
  });

  const openEdit = (t: any) => {
    setForm({ sales_member_id:t.sales_member_id, month:String(t.month), year:String(t.year), target_clients:String(t.target_clients), target_revenue:String(t.target_revenue), target_deals:String(t.target_deals), currency:t.currency });
    setShowModal(true);
  };

  return (
    <div className="wm-page-inner">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Target size={15} style={{ color:'#f472b6' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Sales Goals</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Sales Team Targets</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Set monthly targets for your sales team members</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:10, padding:'6px 4px' }}>
            <button onClick={prevMonth} style={{ width:28, height:28, borderRadius:7, border:'none', background:'none', cursor:'pointer', color:'rgba(148,163,184,.6)', display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronLeft size={15}/></button>
            <span style={{ fontSize:'.88rem', fontWeight:600, color:'#f1f5f9', minWidth:120, textAlign:'center' }}>{MONTHS[month-1]} {year}</span>
            <button onClick={nextMonth} style={{ width:28, height:28, borderRadius:7, border:'none', background:'none', cursor:'pointer', color:'rgba(148,163,184,.6)', display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronRight size={15}/></button>
          </div>
          <button className="wm-btn-primary" onClick={() => { setForm({ sales_member_id:'', month:String(month), year:String(year), target_clients:'0', target_revenue:'0', target_deals:'0', currency:'USD' }); setShowModal(true); }}
            style={{ display:'flex', alignItems:'center', gap:7, height:42 }}>
            <Plus size={15}/> Set Target
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'rgba(148,163,184,.3)' }}>Loading...</div>
      ) : targets.length === 0 ? (
        <div className="wm-card" style={{ padding:'60px 24px', textAlign:'center' }}>
          <Target size={36} style={{ color:'rgba(148,163,184,.15)', margin:'0 auto 12px', display:'block' }} />
          <p style={{ color:'rgba(148,163,184,.4)', fontSize:'.9rem', marginBottom:4 }}>No targets set for {MONTHS[month-1]} {year}</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }} className="wm-fade-up-2">
          {targets.map((t: any) => (
            <div key={t.id} className="wm-card" style={{ padding:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:'linear-gradient(135deg,rgba(244,114,182,.3),rgba(167,139,250,.3))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#f1f5f9' }}>
                    {t.salesMember?.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight:600, color:'#f1f5f9', fontSize:'.9rem' }}>{t.salesMember?.full_name}</p>
                    <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.45)' }}>{MONTHS[t.month-1]} {t.year}</p>
                  </div>
                </div>
                <button onClick={() => openEdit(t)} style={{ width:28, height:28, borderRadius:7, background:'rgba(255,255,255,.04)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.4)', transition:'all .2s' }}
                  onMouseEnter={e => { const b=e.currentTarget as HTMLButtonElement; b.style.background='rgba(167,139,250,.12)'; b.style.color='#a78bfa'; }}
                  onMouseLeave={e => { const b=e.currentTarget as HTMLButtonElement; b.style.background='rgba(255,255,255,.04)'; b.style.color='rgba(148,163,184,.4)'; }}>
                  <Pencil size={12}/>
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, paddingTop:14, borderTop:'1px solid rgba(255,255,255,.05)' }}>
                {[
                  { label:'Clients', value:t.target_clients, color:'#a78bfa' },
                  { label:'Revenue', value:`${t.currency} ${parseFloat(t.target_revenue).toLocaleString()}`, color:'#34d399' },
                  { label:'Deals',   value:t.target_deals,   color:'#60a5fa' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign:'center' }}>
                    <p style={{ fontSize:'.68rem', color:'rgba(148,163,184,.4)', marginBottom:4 }}>{label}</p>
                    <p style={{ fontSize:'.9rem', fontWeight:700, color }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={() => setShowModal(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:480, background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28 }}>
            <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Set Sales Target</h2>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:20 }}>Set a monthly target for a sales team member</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div><label style={lblStyle}>Sales Member</label>
                <select style={selStyle} value={form.sales_member_id} onChange={e => setForm(f=>({...f,sales_member_id:e.target.value}))}>
                  <option value="">Select member</option>
                  {members.map((m:any) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={lblStyle}>Month</label>
                  <select style={selStyle} value={form.month} onChange={e => setForm(f=>({...f,month:e.target.value}))}>
                    {MONTHS.map((m,i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
                  </select></div>
                <div><label style={lblStyle}>Year</label>
                  <select style={selStyle} value={form.year} onChange={e => setForm(f=>({...f,year:e.target.value}))}>
                    {[NOW.getFullYear()-1,NOW.getFullYear(),NOW.getFullYear()+1].map(y => <option key={y} value={String(y)}>{y}</option>)}
                  </select></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={lblStyle}>Target Clients</label><input style={inpStyle} type="number" value={form.target_clients} onChange={e => setForm(f=>({...f,target_clients:e.target.value}))} /></div>
                <div><label style={lblStyle}>Target Deals</label><input style={inpStyle} type="number" value={form.target_deals} onChange={e => setForm(f=>({...f,target_deals:e.target.value}))} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={lblStyle}>Revenue Target</label><input style={inpStyle} type="number" value={form.target_revenue} onChange={e => setForm(f=>({...f,target_revenue:e.target.value}))} /></div>
                <div><label style={lblStyle}>Currency</label>
                  <select style={selStyle} value={form.currency} onChange={e => setForm(f=>({...f,currency:e.target.value}))}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button className="wm-btn-ghost" onClick={() => setShowModal(false)} style={{ flex:1, height:40 }}>Cancel</button>
                <button className="wm-btn-primary" style={{ flex:1, height:40 }} disabled={saveMutation.isPending || !form.sales_member_id} onClick={() => saveMutation.mutate(form)}>Save Target</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}