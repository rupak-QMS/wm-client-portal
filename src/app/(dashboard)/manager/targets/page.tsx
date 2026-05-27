'use client';
import { useState }                              from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, Plus, Pencil, ChevronLeft, ChevronRight, Trophy, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { toast }                                 from 'sonner';
import type { User }                             from '@/types';

const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CURRENCIES = ['USD','GBP','EUR','AUD','INR','SGD'];
const NOW        = new Date();

const inpStyle: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none' };
const selStyle: React.CSSProperties = { ...inpStyle, cursor:'pointer' };
const lblStyle: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

export default function TargetsPage() {
  const qc = useQueryClient();
  const [month, setMonth]       = useState(NOW.getMonth() + 1);
  const [year,  setYear]        = useState(NOW.getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({ account_manager_id:'', month:String(NOW.getMonth()+1), year:String(NOW.getFullYear()), target_amount:'', currency:'USD' });

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y+1); } else setMonth(m => m+1); };

  const { data: managers = [] } = useQuery<User[]>({
    queryKey: ['account-managers'],
    queryFn:  async () => (await (await fetch('/api/users?role=account_manager')).json()).data ?? [],
  });

  const { data: targets = [], isLoading: targetsLoading } = useQuery({
    queryKey: ['revenue-targets', month, year],
    queryFn:  async () => (await (await fetch(`/api/revenue-targets?month=${month}&year=${year}`)).json()).data ?? [],
  });

  const { data: upsells = [] } = useQuery({
    queryKey: ['upsells', month, year],
    queryFn:  async () => (await (await fetch(`/api/upsells?month=${month}&year=${year}`)).json()).data ?? [],
  });

  // Build per-AM achieved map from upsells
  const achievedMap: Record<string, number> = {};
  upsells.forEach((u: any) => {
    const amId = u.account_manager_id ?? u.accountManager?.id;
    if (amId) achievedMap[amId] = (achievedMap[amId] ?? 0) + parseFloat(u.total_cost || 0);
  });

  // Merge targets with achieved data
  const rows = targets.map((t: any) => {
    const achieved = achievedMap[t.account_manager_id] ?? 0;
    const target   = parseFloat(t.target_amount);
    const left     = Math.max(target - achieved, 0);
    const pct      = target > 0 ? Math.min((achieved / target) * 100, 100) : 0;
    return { ...t, achieved, left, pct };
  });

  // Also add AMs who have upsells but no target set
  managers.forEach((m: User) => {
    const hasTarget = targets.some((t: any) => t.account_manager_id === m.id);
    if (!hasTarget && achievedMap[m.id]) {
      rows.push({ account_manager_id:m.id, accountManager:m, target_amount:0, currency:'USD', achieved:achievedMap[m.id], left:0, pct:0 });
    }
  });

  // Summary stats
  const totalTarget   = rows.reduce((s: number, r: any) => s + parseFloat(r.target_amount||0), 0);
  const totalAchieved = rows.reduce((s: number, r: any) => s + r.achieved, 0);
  const totalLeft     = Math.max(totalTarget - totalAchieved, 0);
  const teamPct       = totalTarget > 0 ? Math.min((totalAchieved/totalTarget)*100, 100) : 0;

  // Top performer
  const topPerformer = rows.length > 0 ? rows.reduce((best: any, r: any) => r.achieved > (best?.achieved ?? 0) ? r : best, null) : null;

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res  = await fetch('/api/revenue-targets', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['revenue-targets'] });
      toast.success('Target saved!');
      setShowModal(false);
      setEditTarget(null);
      setForm({ account_manager_id:'', month:String(month), year:String(year), target_amount:'', currency:'USD' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (t: any) => {
    setEditTarget(t);
    setForm({ account_manager_id:t.account_manager_id, month:String(t.month), year:String(t.year), target_amount:String(t.target_amount), currency:t.currency });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm({ account_manager_id:'', month:String(month), year:String(year), target_amount:'', currency:'USD' });
    setShowModal(true);
  };

  return (
    <div className="wm-page-inner">

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Target size={15} style={{ color:'#a78bfa' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Goals</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Monthly Targets</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Set and track monthly revenue targets for your team</p>
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
            <Plus size={15}/> Add / Update Targets
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:24 }} className="wm-fade-up">
        {[
          { label:'Total Team Target',  value: totalTarget   > 0 ? `$${totalTarget.toLocaleString()}`   : '—', sub:`Target for ${MONTHS[month-1]}`,         icon:Target,    color:'#a78bfa' },
          { label:'Total Achieved',     value: totalAchieved > 0 ? `$${totalAchieved.toLocaleString()}` : '$0', sub:`${teamPct.toFixed(1)}% of total target`, icon:TrendingUp, color:'#34d399' },
          { label:'Total Left',         value: totalLeft     > 0 ? `$${totalLeft.toLocaleString()}`     : '$0', sub:`${(100-teamPct).toFixed(1)}% remaining`,  icon:AlertCircle, color:'#fbbf24' },
          { label:'Team Members',       value: String(managers.length),                                         sub:'Account managers',                        icon:Users,     color:'#60a5fa' },
        ].map(({ label, value, sub, icon:Icon, color }) => (
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
      {topPerformer && topPerformer.achieved > 0 && (
        <div className="wm-fade-up" style={{ marginBottom:20, padding:'14px 20px', borderRadius:14, background:'linear-gradient(135deg,rgba(251,191,36,.08),rgba(124,58,237,.08))', border:'1px solid rgba(251,191,36,.2)', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'rgba(251,191,36,.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fbbf24', flexShrink:0 }}>
            <Trophy size={18}/>
          </div>
          <div>
            <p style={{ fontSize:'.82rem', fontWeight:600, color:'#fbbf24', marginBottom:2 }}>🏆 Top Performer — {MONTHS[month-1]} {year}</p>
            <p style={{ fontSize:'.78rem', color:'rgba(148,163,184,.6)' }}>
              <span style={{ color:'#f1f5f9', fontWeight:600 }}>{topPerformer.accountManager?.full_name}</span>
              {' '}achieved{' '}
              <span style={{ color:'#34d399', fontWeight:600 }}>${topPerformer.achieved.toLocaleString()}</span>
              {topPerformer.pct > 0 && <span> · {topPerformer.pct.toFixed(1)}% of target</span>}
            </p>
          </div>
          {topPerformer.pct >= 100 && (
            <div style={{ marginLeft:'auto', padding:'4px 12px', borderRadius:99, background:'rgba(52,211,153,.12)', border:'0.5px solid rgba(52,211,153,.3)', fontSize:'.75rem', color:'#34d399', fontWeight:600, flexShrink:0 }}>
              Target Achieved ✓
            </div>
          )}
        </div>
      )}

      {/* ── AM Table ── */}
      <div className="wm-card wm-fade-up-2" style={{ overflow:'hidden' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(124,58,237,.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ fontSize:'.95rem', fontWeight:600, color:'#f1f5f9' }}>Account Managers</p>
          <p style={{ fontSize:'.75rem', color:'rgba(148,163,184,.4)' }}>Targets reset on the 1st of every month</p>
        </div>

        {targetsLoading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'rgba(148,163,184,.3)' }}>Loading...</div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 24px' }}>
            <Target size={36} style={{ color:'rgba(148,163,184,.15)', margin:'0 auto 12px', display:'block' }} />
            <p style={{ color:'rgba(148,163,184,.4)', fontSize:'.9rem', marginBottom:4 }}>No targets set for {MONTHS[month-1]} {year}</p>
            <p style={{ color:'rgba(148,163,184,.25)', fontSize:'.8rem' }}>Click "Add / Update Targets" to set targets</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="wm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Account Manager</th>
                  <th style={{ textAlign:'right' }}>Target</th>
                  <th style={{ textAlign:'right' }}>Achieved</th>
                  <th style={{ textAlign:'right' }}>Left</th>
                  <th style={{ minWidth:160 }}>Achievement</th>
                  <th style={{ textAlign:'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any, i: number) => {
                  const isTop = topPerformer && r.account_manager_id === topPerformer.account_manager_id && r.achieved > 0;
                  const pctColor = r.pct >= 100 ? '#34d399' : r.pct >= 60 ? '#60a5fa' : r.pct >= 30 ? '#fbbf24' : '#f87171';
                  return (
                    <tr key={r.account_manager_id} style={{ background: isTop ? 'rgba(251,191,36,.03)' : 'transparent' }}>
                      <td style={{ color:'rgba(148,163,184,.4)', fontSize:'.82rem' }}>{i+1}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:9, flexShrink:0, background:'linear-gradient(135deg,rgba(124,58,237,.4),rgba(59,130,246,.4))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#f1f5f9' }}>
                            {r.accountManager?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <p style={{ fontSize:'.87rem', fontWeight:500, color:'#f1f5f9' }}>{r.accountManager?.full_name}</p>
                              {isTop && <span style={{ fontSize:'.65rem', padding:'1px 7px', borderRadius:99, background:'rgba(251,191,36,.15)', color:'#fbbf24', border:'0.5px solid rgba(251,191,36,.3)' }}>🏆 Top</span>}
                            </div>
                            <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.4)' }}>{r.accountManager?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign:'right', fontWeight:600, color:'#f1f5f9' }}>
                        {parseFloat(r.target_amount) > 0 ? `${r.currency} ${parseFloat(r.target_amount).toLocaleString()}` : <span style={{ color:'rgba(148,163,184,.3)', fontSize:'.8rem' }}>Not set</span>}
                      </td>
                      <td style={{ textAlign:'right', fontWeight:600, color:'#34d399' }}>
                        {r.achieved > 0 ? `${r.currency} ${r.achieved.toLocaleString()}` : '—'}
                      </td>
                      <td style={{ textAlign:'right', fontWeight:600, color:'#fbbf24' }}>
                        {r.left > 0 ? `${r.currency} ${r.left.toLocaleString()}` : r.achieved > 0 ? <span style={{ color:'#34d399' }}>✓ Done</span> : '—'}
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ flex:1, height:6, borderRadius:99, background:'rgba(255,255,255,.06)', overflow:'hidden', minWidth:80 }}>
                            <div style={{ height:'100%', width:`${r.pct}%`, borderRadius:99, background:`linear-gradient(90deg,${pctColor}88,${pctColor})`, transition:'width .6s ease' }} />
                          </div>
                          <span style={{ fontSize:'.78rem', fontWeight:600, color:pctColor, minWidth:38, textAlign:'right' }}>
                            {r.pct.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign:'right' }}>
                        <button onClick={() => openEdit(r)}
                          style={{ width:30, height:30, borderRadius:7, border:'none', background:'rgba(255,255,255,.04)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.4)', transition:'all .2s', marginLeft:'auto' }}
                          onMouseEnter={e => { const b=e.currentTarget as HTMLButtonElement; b.style.background='rgba(167,139,250,.12)'; b.style.color='#a78bfa'; }}
                          onMouseLeave={e => { const b=e.currentTarget as HTMLButtonElement; b.style.background='rgba(255,255,255,.04)'; b.style.color='rgba(148,163,184,.4)'; }}>
                          <Pencil size={13}/>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Totals row */}
                {rows.length > 0 && (
                  <tr style={{ borderTop:'2px solid rgba(124,58,237,.15)', background:'rgba(124,58,237,.04)' }}>
                    <td colSpan={2} style={{ fontWeight:700, color:'#f1f5f9', fontSize:'.88rem' }}>Total</td>
                    <td style={{ textAlign:'right', fontWeight:700, color:'#f1f5f9' }}>${totalTarget.toLocaleString()}</td>
                    <td style={{ textAlign:'right', fontWeight:700, color:'#34d399' }}>${totalAchieved.toLocaleString()}</td>
                    <td style={{ textAlign:'right', fontWeight:700, color:'#fbbf24' }}>${totalLeft.toLocaleString()}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ flex:1, height:6, borderRadius:99, background:'rgba(255,255,255,.06)', overflow:'hidden', minWidth:80 }}>
                          <div style={{ height:'100%', width:`${teamPct}%`, borderRadius:99, background:'linear-gradient(90deg,#7c3aed,#3b82f6)', transition:'width .6s' }} />
                        </div>
                        <span style={{ fontSize:'.78rem', fontWeight:700, color:'#a78bfa', minWidth:38, textAlign:'right' }}>{teamPct.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td />
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

      {/* ── Custom Modal ── */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={() => setShowModal(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:460, background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28, boxShadow:'0 0 60px rgba(124,58,237,.2)' }}>
            <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>
              {editTarget ? 'Update Target' : 'Set Revenue Target'}
            </h2>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:20 }}>
              Set a monthly revenue target for an account manager
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lblStyle}>Account Manager</label>
                <select style={selStyle} value={form.account_manager_id} onChange={e => setForm(f => ({ ...f, account_manager_id:e.target.value }))}>
                  <option value="">Select AM</option>
                  {managers.map((m: User) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
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
                  <label style={lblStyle}>Target Amount</label>
                  <input style={inpStyle} type="number" placeholder="5000" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount:e.target.value }))} />
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
                  disabled={saveMutation.isPending || !form.account_manager_id || !form.target_amount}
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