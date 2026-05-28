'use client';
import { useState }                              from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, Plus, Pencil, ChevronLeft, ChevronRight, Trophy, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { toast }                                 from 'sonner';

const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CURRENCIES = ['USD','GBP','EUR','AUD','INR','SGD'];
const NOW        = new Date();

const inpStyle: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none' };
const selStyle: React.CSSProperties = { ...inpStyle, cursor:'pointer' };
const lblStyle: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

export default function SalesTargetsPage() {
  const qc = useQueryClient();
  const [month, setMonth]         = useState(NOW.getMonth() + 1);
  const [year,  setYear]          = useState(NOW.getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({
    sales_member_id: '', month: String(NOW.getMonth() + 1), year: String(NOW.getFullYear()),
    target_clients: '0', target_revenue: '0', target_deals: '0', currency: 'USD',
  });

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const { data: members = [] } = useQuery({
    queryKey: ['sales-members'],
    queryFn:  async () => (await (await fetch('/api/sales-members')).json()).data ?? [],
  });

  const { data: targets = [], isLoading } = useQuery({
    queryKey: ['sales-targets', month, year],
    queryFn:  async () => (await (await fetch(`/api/sales-targets?month=${month}&year=${year}`)).json()).data ?? [],
  });

  // Summary stats
  const totalRevenue = targets.reduce((s: number, t: any) => s + parseFloat(t.target_revenue || 0), 0);
  const totalDeals   = targets.reduce((s: number, t: any) => s + (t.target_deals || 0), 0);
  const totalClients = targets.reduce((s: number, t: any) => s + (t.target_clients || 0), 0);

  // Top performer by target_revenue
  const topPerformer = targets.length > 0
    ? targets.reduce((best: any, t: any) => parseFloat(t.target_revenue) > parseFloat(best?.target_revenue ?? 0) ? t : best, null)
    : null;

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res  = await fetch('/api/sales-targets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-targets'] });
      toast.success('Target saved!');
      setShowModal(false);
      setEditTarget(null);
      setForm({ sales_member_id:'', month:String(month), year:String(year), target_clients:'0', target_revenue:'0', target_deals:'0', currency:'USD' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (t: any) => {
    setEditTarget(t);
    setForm({ sales_member_id:t.sales_member_id, month:String(t.month), year:String(t.year), target_clients:String(t.target_clients), target_revenue:String(t.target_revenue), target_deals:String(t.target_deals), currency:t.currency });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm({ sales_member_id:'', month:String(month), year:String(year), target_clients:'0', target_revenue:'0', target_deals:'0', currency:'USD' });
    setShowModal(true);
  };

  return (
    <div className="wm-page-inner">

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Target size={15} style={{ color:'#f472b6' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Goals</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Sales Team Targets</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Set and track monthly targets for your sales team</p>
        </div>

        {/* Month navigator */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:10, padding:'6px 4px' }}>
            <button onClick={prevMonth} style={{ width:28, height:28, borderRadius:7, border:'none', background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.6)' }}
              onMouseEnter={e => (e.currentTarget.style.background='rgba(124,58,237,.12)')}
              onMouseLeave={e => (e.currentTarget.style.background='none')}>
              <ChevronLeft size={15}/>
            </button>
            <span style={{ fontSize:'.88rem', fontWeight:600, color:'#f1f5f9', minWidth:110, textAlign:'center' }}>
              {MONTHS[month-1]} {year}
            </span>
            <button onClick={nextMonth} style={{ width:28, height:28, borderRadius:7, border:'none', background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.6)' }}
              onMouseEnter={e => (e.currentTarget.style.background='rgba(124,58,237,.12)')}
              onMouseLeave={e => (e.currentTarget.style.background='none')}>
              <ChevronRight size={15}/>
            </button>
          </div>
          <button className="wm-btn-primary" onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:7, height:42 }}>
            <Plus size={15}/> Set Target
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:24 }} className="wm-fade-up">
        {[
          { label:'Total Revenue Target', value: totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : '—',    sub:`Target for ${MONTHS[month-1]}`, icon:Target,     color:'#f472b6' },
          { label:'Total Deals Target',   value: totalDeals   > 0 ? String(totalDeals)                 : '—',    sub:'Deals to close',                icon:TrendingUp, color:'#34d399' },
          { label:'Total Clients Target', value: totalClients > 0 ? String(totalClients)               : '—',    sub:'New clients to add',            icon:Users,      color:'#60a5fa' },
          { label:'Team Members',         value: String(members.length),                                          sub:'Sales team members',            icon:Users,      color:'#a78bfa' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="wm-stat">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</p>
              <div style={{ width:32, height:32, borderRadius:8, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', color }}>
                <Icon size={15}/>
              </div>
            </div>
            <p style={{ fontSize:'1.6rem', fontWeight:700, color, marginBottom:4 }}>{value}</p>
            <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.4)' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Top performer banner ── */}
      {topPerformer && parseFloat(topPerformer.target_revenue) > 0 && (
        <div className="wm-fade-up" style={{ marginBottom:20, padding:'14px 20px', borderRadius:14, background:'linear-gradient(135deg,rgba(244,114,182,.08),rgba(124,58,237,.08))', border:'1px solid rgba(244,114,182,.2)', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'rgba(244,114,182,.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#f472b6', flexShrink:0 }}>
            <Trophy size={18}/>
          </div>
          <div>
            <p style={{ fontSize:'.82rem', fontWeight:600, color:'#f472b6', marginBottom:2 }}>🏆 Highest Target — {MONTHS[month-1]} {year}</p>
            <p style={{ fontSize:'.78rem', color:'rgba(148,163,184,.6)' }}>
              <span style={{ color:'#f1f5f9', fontWeight:600 }}>{topPerformer.salesMember?.full_name}</span>
              {' '}has a revenue target of{' '}
              <span style={{ color:'#34d399', fontWeight:600 }}>{topPerformer.currency} {parseFloat(topPerformer.target_revenue).toLocaleString()}</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Sales Team Table ── */}
      <div className="wm-card wm-fade-up-2" style={{ overflow:'hidden' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(124,58,237,.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ fontSize:'.95rem', fontWeight:600, color:'#f1f5f9' }}>Sales Team Members</p>
          <p style={{ fontSize:'.75rem', color:'rgba(148,163,184,.4)' }}>Targets reset on the 1st of every month</p>
        </div>

        {isLoading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'rgba(148,163,184,.3)' }}>Loading...</div>
        ) : targets.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 24px' }}>
            <Target size={36} style={{ color:'rgba(148,163,184,.15)', margin:'0 auto 12px', display:'block' }} />
            <p style={{ color:'rgba(148,163,184,.4)', fontSize:'.9rem', marginBottom:4 }}>No targets set for {MONTHS[month-1]} {year}</p>
            <p style={{ color:'rgba(148,163,184,.25)', fontSize:'.8rem' }}>Click "Set Target" to add targets for your sales team</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="wm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sales Member</th>
                  <th style={{ textAlign:'right' }}>Revenue Target</th>
                  <th style={{ textAlign:'right' }}>Deals</th>
                  <th style={{ textAlign:'right' }}>Clients</th>
                  <th style={{ textAlign:'right' }}>Currency</th>
                  <th style={{ textAlign:'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((t: any, i: number) => {
                  const isTop = topPerformer && t.sales_member_id === topPerformer.sales_member_id && parseFloat(t.target_revenue) > 0;
                  return (
                    <tr key={t.id} style={{ background: isTop ? 'rgba(244,114,182,.03)' : 'transparent' }}>
                      <td style={{ color:'rgba(148,163,184,.4)', fontSize:'.82rem' }}>{i + 1}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:9, flexShrink:0, background:'linear-gradient(135deg,rgba(244,114,182,.3),rgba(167,139,250,.3))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#f1f5f9' }}>
                            {t.salesMember?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <p style={{ fontSize:'.87rem', fontWeight:500, color:'#f1f5f9' }}>{t.salesMember?.full_name}</p>
                              {isTop && <span style={{ fontSize:'.65rem', padding:'1px 7px', borderRadius:99, background:'rgba(244,114,182,.15)', color:'#f472b6', border:'0.5px solid rgba(244,114,182,.3)' }}>🏆 Top</span>}
                            </div>
                            <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.4)' }}>{t.salesMember?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign:'right', fontWeight:600, color:'#34d399' }}>
                        {parseFloat(t.target_revenue) > 0 ? `${t.currency} ${parseFloat(t.target_revenue).toLocaleString()}` : <span style={{ color:'rgba(148,163,184,.3)', fontSize:'.8rem' }}>Not set</span>}
                      </td>
                      <td style={{ textAlign:'right', fontWeight:600, color:'#60a5fa' }}>{t.target_deals || '—'}</td>
                      <td style={{ textAlign:'right', fontWeight:600, color:'#a78bfa' }}>{t.target_clients || '—'}</td>
                      <td style={{ textAlign:'right', fontSize:'.8rem', color:'rgba(148,163,184,.5)' }}>{t.currency}</td>
                      <td style={{ textAlign:'right' }}>
                        <button onClick={() => openEdit(t)}
                          style={{ width:30, height:30, borderRadius:7, border:'none', background:'rgba(255,255,255,.04)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.4)', transition:'all .2s', marginLeft:'auto' }}
                          onMouseEnter={e => { const b=e.currentTarget as HTMLButtonElement; b.style.background='rgba(244,114,182,.12)'; b.style.color='#f472b6'; }}
                          onMouseLeave={e => { const b=e.currentTarget as HTMLButtonElement; b.style.background='rgba(255,255,255,.04)'; b.style.color='rgba(148,163,184,.4)'; }}>
                          <Pencil size={13}/>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Totals row */}
                {targets.length > 0 && (
                  <tr style={{ borderTop:'2px solid rgba(124,58,237,.15)', background:'rgba(124,58,237,.04)' }}>
                    <td colSpan={2} style={{ fontWeight:700, color:'#f1f5f9', fontSize:'.88rem' }}>Total</td>
                    <td style={{ textAlign:'right', fontWeight:700, color:'#34d399' }}>${totalRevenue.toLocaleString()}</td>
                    <td style={{ textAlign:'right', fontWeight:700, color:'#60a5fa' }}>{totalDeals}</td>
                    <td style={{ textAlign:'right', fontWeight:700, color:'#a78bfa' }}>{totalClients}</td>
                    <td colSpan={2} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Info note ── */}
      <div style={{ marginTop:16, padding:'12px 16px', borderRadius:10, background:'rgba(96,165,250,.06)', border:'0.5px solid rgba(96,165,250,.15)', display:'flex', alignItems:'center', gap:10 }}>
        <AlertCircle size={14} style={{ color:'#60a5fa', flexShrink:0 }} />
        <p style={{ fontSize:'.78rem', color:'rgba(148,163,184,.55)' }}>
          Targets are reset to zero on the 1st of every month. You can update targets anytime during the month.
        </p>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={() => setShowModal(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:480, background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28, boxShadow:'0 0 60px rgba(124,58,237,.2)' }}>
            <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>
              {editTarget ? 'Update Target' : 'Set Sales Target'}
            </h2>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:20 }}>
              Set a monthly target for a sales team member
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lblStyle}>Sales Member</label>
                <select style={selStyle} value={form.sales_member_id} onChange={e => setForm(f => ({ ...f, sales_member_id:e.target.value }))}>
                  <option value="">Select member</option>
                  {members.map((m: any) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lblStyle}>Month</label>
                  <select style={selStyle} value={form.month} onChange={e => setForm(f => ({ ...f, month:e.target.value }))}>
                    {MONTHS.map((m,i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lblStyle}>Year</label>
                  <select style={selStyle} value={form.year} onChange={e => setForm(f => ({ ...f, year:e.target.value }))}>
                    {[NOW.getFullYear()-1, NOW.getFullYear(), NOW.getFullYear()+1].map(y => <option key={y} value={String(y)}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lblStyle}>Target Clients</label>
                  <input style={inpStyle} type="number" value={form.target_clients} onChange={e => setForm(f => ({ ...f, target_clients:e.target.value }))} />
                </div>
                <div>
                  <label style={lblStyle}>Target Deals</label>
                  <input style={inpStyle} type="number" value={form.target_deals} onChange={e => setForm(f => ({ ...f, target_deals:e.target.value }))} />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lblStyle}>Revenue Target</label>
                  <input style={inpStyle} type="number" value={form.target_revenue} onChange={e => setForm(f => ({ ...f, target_revenue:e.target.value }))} />
                </div>
                <div>
                  <label style={lblStyle}>Currency</label>
                  <select style={selStyle} value={form.currency} onChange={e => setForm(f => ({ ...f, currency:e.target.value }))}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button className="wm-btn-ghost" onClick={() => setShowModal(false)} style={{ flex:1, height:40 }}>Cancel</button>
                <button className="wm-btn-primary" style={{ flex:1, height:40 }}
                  disabled={saveMutation.isPending || !form.sales_member_id}
                  onClick={() => saveMutation.mutate(form)}>
                  Save Target
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}