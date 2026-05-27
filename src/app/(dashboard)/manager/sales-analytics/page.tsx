'use client';
import { useState }                              from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, TrendingUp, Users, BarChart2, ChevronLeft, ChevronRight, Award, Plus } from 'lucide-react';
import { toast } from 'sonner';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const NOW    = new Date();
const BADGE_OPTIONS = [
  { value:'gold',            label:'🥇 Gold'             },
  { value:'silver',          label:'🥈 Silver'           },
  { value:'bronze',          label:'🥉 Bronze'           },
  { value:'top_closer',      label:'🏆 Top Closer'       },
  { value:'highest_revenue', label:'💰 Highest Revenue'  },
  { value:'most_clients',    label:'👥 Most Clients'     },
  { value:'best_conversion', label:'🎯 Best Conversion'  },
];
const RANK_COLORS = ['#fbbf24','#94a3b8','#b47c3c'];
const RANK_ICONS  = ['🥇','🥈','🥉'];
const inpStyle: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none' };
const selStyle: React.CSSProperties = { ...inpStyle, cursor:'pointer' };
const lblStyle: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

export default function SalesAnalyticsPage() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year,  setYear]  = useState(NOW.getFullYear());
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showNoteModal,  setShowNoteModal]  = useState(false);
  const [badgeForm, setBadgeForm] = useState({ sales_member_id:'', badge_type:'gold', note:'' });
  const [noteForm,  setNoteForm]  = useState({ target_user_id:'', note:'', bonus_amount:'', currency:'USD' });

  const prevMonth = () => { if (month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); };

  const { data: stats } = useQuery({
    queryKey: ['sales-stats', month, year],
    queryFn:  async () => (await (await fetch(`/api/sales-stats?month=${month}&year=${year}`)).json()).data,
  });
  const { data: members = [] } = useQuery({
    queryKey: ['sales-members'],
    queryFn:  async () => (await (await fetch('/api/sales-members')).json()).data ?? [],
  });

  const badgeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res  = await fetch('/api/sales-performance', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...data, month, year }) });
      const json = await res.json(); if (!res.ok) throw new Error(json.error); return json.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey:['sales-stats'] }); toast.success('Badge awarded!'); setShowBadgeModal(false); setBadgeForm({ sales_member_id:'', badge_type:'gold', note:'' }); },
    onError: (e:Error) => toast.error(e.message),
  });
  const noteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res  = await fetch('/api/sales-performance', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...data, month, year }) });
      const json = await res.json(); if (!res.ok) throw new Error(json.error); return json.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey:['sales-stats'] }); toast.success('Note added!'); setShowNoteModal(false); setNoteForm({ target_user_id:'', note:'', bonus_amount:'', currency:'USD' }); },
    onError: (e:Error) => toast.error(e.message),
  });

  const leaderboard  = stats?.leaderboard ?? [];
  const topPerformer = leaderboard[0];

  return (
    <div className="wm-page-inner">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <BarChart2 size={15} style={{ color:'#a78bfa' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Sales Intelligence</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Sales Analytics</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Team performance, leaderboard and recognition</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:10, padding:'6px 4px' }}>
            <button onClick={prevMonth} style={{ width:28, height:28, borderRadius:7, border:'none', background:'none', cursor:'pointer', color:'rgba(148,163,184,.6)', display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronLeft size={15}/></button>
            <span style={{ fontSize:'.88rem', fontWeight:600, color:'#f1f5f9', minWidth:120, textAlign:'center' }}>{MONTHS[month-1]} {year}</span>
            <button onClick={nextMonth} style={{ width:28, height:28, borderRadius:7, border:'none', background:'none', cursor:'pointer', color:'rgba(148,163,184,.6)', display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronRight size={15}/></button>
          </div>
          <button className="wm-btn-primary" onClick={() => setShowBadgeModal(true)} style={{ display:'flex', alignItems:'center', gap:6, height:38 }}><Award size={14}/> Award Badge</button>
          <button className="wm-btn-ghost" onClick={() => setShowNoteModal(true)} style={{ display:'flex', alignItems:'center', gap:6, height:38 }}><Plus size={14}/> Add Note</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:24 }} className="wm-fade-up">
        {[
          { label:'Total Leads',     value:stats?.total_leads    ?? '—', color:'#60a5fa' },
          { label:'Approved',        value:stats?.approved_leads ?? '—', color:'#34d399' },
          { label:'Pending',         value:stats?.pending_leads  ?? '—', color:'#fbbf24' },
          { label:'Rejected',        value:stats?.rejected_leads ?? '—', color:'#f87171' },
          { label:'Est. Revenue',    value:`$${(stats?.revenue ?? 0).toLocaleString()}`, color:'#a78bfa' },
          { label:'Team Conversion', value:`${stats?.conversion_rate ?? 0}%`, color:'#f472b6' },
        ].map(({ label, value, color }) => (
          <div key={label} className="wm-stat">
            <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>{label}</p>
            <p style={{ fontSize:'1.5rem', fontWeight:700, color }}>{value}</p>
          </div>
        ))}
      </div>

      {topPerformer && topPerformer.approved_leads > 0 && (
        <div style={{ marginBottom:20, padding:'14px 20px', borderRadius:14, background:'linear-gradient(135deg,rgba(251,191,36,.08),rgba(124,58,237,.08))', border:'1px solid rgba(251,191,36,.2)', display:'flex', alignItems:'center', gap:14 }} className="wm-fade-up">
          <div style={{ width:42, height:42, borderRadius:11, background:'rgba(251,191,36,.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fbbf24', flexShrink:0, fontSize:'1.2rem' }}>🏆</div>
          <div>
            <p style={{ fontSize:'.82rem', fontWeight:600, color:'#fbbf24', marginBottom:2 }}>Top Performer — {MONTHS[month-1]} {year}</p>
            <p style={{ fontSize:'.78rem', color:'rgba(148,163,184,.6)' }}>
              <span style={{ color:'#f1f5f9', fontWeight:600 }}>{topPerformer.member?.full_name}</span>
              {' · '}{topPerformer.approved_leads} approved · {topPerformer.conversion_rate}% conversion
              {topPerformer.revenue > 0 && ` · $${topPerformer.revenue.toLocaleString()} revenue`}
            </p>
          </div>
        </div>
      )}

      <div className="wm-card wm-fade-up-2" style={{ overflow:'hidden', marginBottom:20 }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(124,58,237,.1)', display:'flex', alignItems:'center', gap:8 }}>
          <Trophy size={15} style={{ color:'#fbbf24' }} />
          <p style={{ fontSize:'.95rem', fontWeight:600, color:'#f1f5f9' }}>Monthly Leaderboard</p>
        </div>
        {leaderboard.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px', color:'rgba(148,163,184,.3)' }}>No data for this month</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="wm-table">
              <thead><tr><th>#</th><th>Sales Member</th><th style={{ textAlign:'right' }}>Leads</th><th style={{ textAlign:'right' }}>Approved</th><th style={{ textAlign:'right' }}>Revenue</th><th style={{ minWidth:140 }}>Conversion</th></tr></thead>
              <tbody>
                {leaderboard.map((r: any, i: number) => {
                  const rankColor = RANK_COLORS[i] ?? 'rgba(148,163,184,.5)';
                  const pct       = r.conversion_rate;
                  const pctColor  = pct >= 70 ? '#34d399' : pct >= 40 ? '#60a5fa' : pct >= 20 ? '#fbbf24' : '#f87171';
                  return (
                    <tr key={r.member?.id} style={{ background: i===0 ? 'rgba(251,191,36,.03)' : 'transparent' }}>
                      <td><span style={{ fontSize:i<3?'1.1rem':'.85rem', color:rankColor }}>{i<3?RANK_ICONS[i]:i+1}</span></td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,rgba(124,58,237,.4),rgba(59,130,246,.4))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#f1f5f9' }}>
                            {r.member?.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize:'.87rem', fontWeight:500, color:'#f1f5f9' }}>{r.member?.full_name}</p>
                            <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.4)' }}>{r.member?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign:'right', color:'rgba(148,163,184,.7)' }}>{r.total_leads}</td>
                      <td style={{ textAlign:'right', fontWeight:600, color:'#34d399' }}>{r.approved_leads}</td>
                      <td style={{ textAlign:'right', color:'#a78bfa', fontWeight:600 }}>{r.revenue>0?`$${r.revenue.toLocaleString()}`:'—'}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:5, borderRadius:99, background:'rgba(255,255,255,.06)', overflow:'hidden', minWidth:60 }}>
                            <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, background:pctColor, transition:'width .5s' }} />
                          </div>
                          <span style={{ fontSize:'.75rem', fontWeight:600, color:pctColor, minWidth:35 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {stats?.badges?.length > 0 && (
        <div className="wm-card wm-fade-up-3" style={{ padding:'22px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <Award size={15} style={{ color:'#fbbf24' }} />
            <p style={{ fontSize:'.95rem', fontWeight:600, color:'#f1f5f9' }}>Badges Awarded This Month</p>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {stats.badges.map((b: any) => (
              <div key={b.id} style={{ padding:'8px 14px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'0.5px solid rgba(255,255,255,.07)', fontSize:'.78rem', color:'rgba(148,163,184,.7)' }}>
                {BADGE_OPTIONS.find(o=>o.value===b.badge_type)?.label} → <span style={{ color:'#f1f5f9', fontWeight:500 }}>{b.salesMember?.full_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badge Modal */}
      {showBadgeModal && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={() => setShowBadgeModal(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:440, background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28 }}>
            <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Award Badge</h2>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:20 }}>Recognise outstanding performance</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div><label style={lblStyle}>Sales Member</label>
                <select style={selStyle} value={badgeForm.sales_member_id} onChange={e => setBadgeForm(f=>({...f,sales_member_id:e.target.value}))}>
                  <option value="">Select member</option>
                  {members.map((m:any) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select></div>
              <div><label style={lblStyle}>Badge Type</label>
                <select style={selStyle} value={badgeForm.badge_type} onChange={e => setBadgeForm(f=>({...f,badge_type:e.target.value}))}>
                  {BADGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select></div>
              <div><label style={lblStyle}>Note (optional)</label>
                <input style={inpStyle} value={badgeForm.note} onChange={e => setBadgeForm(f=>({...f,note:e.target.value}))} placeholder="Why are you awarding this?" /></div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="wm-btn-ghost" onClick={() => setShowBadgeModal(false)} style={{ flex:1, height:40 }}>Cancel</button>
                <button className="wm-btn-primary" style={{ flex:1, height:40 }} disabled={badgeMutation.isPending || !badgeForm.sales_member_id} onClick={() => badgeMutation.mutate(badgeForm)}>Award Badge</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={() => setShowNoteModal(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:440, background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28 }}>
            <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Add Performance Note</h2>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:20 }}>Add feedback or bonus for a sales member</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div><label style={lblStyle}>Sales Member</label>
                <select style={selStyle} value={noteForm.target_user_id} onChange={e => setNoteForm(f=>({...f,target_user_id:e.target.value}))}>
                  <option value="">Select member</option>
                  {members.map((m:any) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select></div>
              <div><label style={lblStyle}>Note *</label>
                <textarea style={{ ...inpStyle, height:'auto', resize:'none', padding:'10px 12px' }} rows={3} value={noteForm.note} onChange={e => setNoteForm(f=>({...f,note:e.target.value}))} placeholder="Performance feedback..." /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={lblStyle}>Bonus Amount</label><input style={inpStyle} type="number" value={noteForm.bonus_amount} onChange={e => setNoteForm(f=>({...f,bonus_amount:e.target.value}))} placeholder="0.00" /></div>
                <div><label style={lblStyle}>Currency</label>
                  <select style={selStyle} value={noteForm.currency} onChange={e => setNoteForm(f=>({...f,currency:e.target.value}))}>
                    {['USD','GBP','EUR','AUD','INR','SGD'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="wm-btn-ghost" onClick={() => setShowNoteModal(false)} style={{ flex:1, height:40 }}>Cancel</button>
                <button className="wm-btn-primary" style={{ flex:1, height:40 }} disabled={noteMutation.isPending || !noteForm.target_user_id || !noteForm.note} onClick={() => noteMutation.mutate(noteForm)}>Save Note</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}