'use client';
import { useState, useEffect, useCallback }      from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Target, Plus, Pencil, ChevronLeft, ChevronRight,
  Trophy, TrendingUp, Users, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@/types';

const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CURRENCIES = ['USD','GBP','EUR','AUD','INR','SGD'];
const NOW        = new Date();

function daysInMonth(month: number, year: number) { return new Date(year, month, 0).getDate(); }

/** Small hand-rolled SVG donut — same one used on the AM/TL/Sales target pages. */
function DonutChart({ segments, centerLabel, centerValue }: {
  segments: { value: number; color: string }[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div style={{ position:'relative', width:160, height:160, flexShrink:0 }}>
      <svg width={160} height={160} viewBox="0 0 160 160" style={{ transform:'rotate(-90deg)' }}>
        <circle cx={80} cy={80} r={radius} fill="none" stroke="rgba(148,163,184,.12)" strokeWidth={20} />
        {segments.map((seg, i) => {
          const frac = seg.value / total;
          const dash = frac * circumference;
          const circle = (
            <circle key={i} cx={80} cy={80} r={radius} fill="none" stroke={seg.color} strokeWidth={20}
              strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset} strokeLinecap="butt" />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:'1.05rem', fontWeight:800, color:'#f1f5f9', textAlign:'center' }}>{centerValue}</div>
        <div style={{ fontSize:'.68rem', color:'rgba(148,163,184,.5)' }}>{centerLabel}</div>
      </div>
    </div>
  );
}

/** Reusable "About This Period" panel — same pattern as the other three dashboards. */
function PeriodPanel({ month, year, role }: { month: number; year: number; role: string }) {
  const totalDays = daysInMonth(month, year);
  const daysPassed = (year === NOW.getFullYear() && month === NOW.getMonth() + 1)
    ? Math.min(NOW.getDate(), totalDays)
    : (year < NOW.getFullYear() || (year === NOW.getFullYear() && month < NOW.getMonth() + 1)) ? totalDays : 0;
  const daysRemaining = Math.max(totalDays - daysPassed, 0);
  return (
    <div className="wm-card" style={{ padding:'20px 22px' }}>
      <div style={{ fontWeight:700, color:'#f1f5f9', marginBottom:16, fontSize:'.95rem' }}>About This Period</div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {[
          ['Period', `1 ${MONTHS[month-1]} ${year} – ${totalDays} ${MONTHS[month-1]} ${year}`],
          ['Your Role', role],
          ['Total Working Days', String(totalDays)],
          ['Days Passed', String(daysPassed)],
          ['Days Remaining', String(daysRemaining)],
        ].map(([k, v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:'.85rem', paddingBottom:10, borderBottom:'1px solid rgba(124,58,237,.08)' }}>
            <span style={{ color:'rgba(148,163,184,.5)' }}>{k}</span>
            <span style={{ color:'#f1f5f9', fontWeight:600 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none' };
const sel: React.CSSProperties = { ...inp, cursor:'pointer' };
const lbl: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

export default function TargetsPage() {
  const qc = useQueryClient();
  const [tab,   setTab]   = useState<'am' | 'sales' | 'history'>('am');
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year,  setYear]  = useState(NOW.getFullYear());
  const [salesTeam, setSalesTeam] = useState<string>('');
  const [history, setHistory] = useState<{ label: string; amTarget: number; amAchieved: number }[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { data: teams = [] } = useQuery<any[]>({ queryKey: ['teams'], queryFn: async () => (await fetch('/api/teams')).json().then((r) => r.data ?? []) });


  // AM modal state
  const [showAMModal,  setShowAMModal]  = useState(false);
  const [editAMTarget, setEditAMTarget] = useState<any>(null);
  const [amForm, setAmForm] = useState({ account_manager_id:'', month:String(NOW.getMonth()+1), year:String(NOW.getFullYear()), target_amount:'', currency:'USD' });

  // Sales modal state — now targets a TEAM, assigned to that team's Team Leader,
  // not an individual agent. Distributing to individual agents happens on the
  // Team Leader's own Targets page instead.
  const [showSalesModal,  setShowSalesModal]  = useState(false);
  const [editSalesTarget, setEditSalesTarget] = useState<any>(null);
  const [salesForm, setSalesForm] = useState({ team_id:'', team_leader_id:'', month:String(NOW.getMonth()+1), year:String(NOW.getFullYear()), target_amount:'0', currency:'USD' });

  const prevMonth = () => { if (month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); };

  // ── AM queries ──
  const { data: managers=[] } = useQuery<User[]>({
    queryKey: ['account-managers'],
    queryFn:  async () => (await (await fetch('/api/users?role=account_manager')).json()).data ?? [],
  });
  const { data: amTargets=[], isLoading: amLoading } = useQuery({
    queryKey: ['revenue-targets', month, year],
    queryFn:  async () => (await (await fetch(`/api/revenue-targets?month=${month}&year=${year}`)).json()).data ?? [],
  });
  const { data: upsells=[] } = useQuery({
    queryKey: ['upsells', month, year],
    queryFn:  async () => (await (await fetch(`/api/upsells?month=${month}&year=${year}`)).json()).data ?? [],
  });

  // Build AM rows with achieved
  const achievedMap: Record<string,number> = {};
  upsells.forEach((u:any) => {
    const id = u.account_manager_id ?? u.accountManager?.id;
    if (id) achievedMap[id] = (achievedMap[id]??0) + parseFloat(u.upfront_amount||0);
  });
  const amRows = amTargets.map((t:any) => {
    const achieved = achievedMap[t.account_manager_id]??0;
    const target   = parseFloat(t.target_amount);
    const left     = Math.max(target-achieved,0);
    const pct      = target>0 ? Math.min((achieved/target)*100,100) : 0;
    return { ...t, achieved, left, pct };
  });
  managers.forEach((m:User) => {
    if (!amTargets.some((t:any)=>t.account_manager_id===m.id) && achievedMap[m.id]) {
      amRows.push({ account_manager_id:m.id, accountManager:m, target_amount:0, currency:'USD', achieved:achievedMap[m.id], left:0, pct:0, month, year });
    }
  });
  const amTotalTarget   = amRows.reduce((s:number,r:any)=>s+parseFloat(r.target_amount||0),0);
  const amTotalAchieved = amRows.reduce((s:number,r:any)=>s+r.achieved,0);
  const amTotalLeft     = Math.max(amTotalTarget-amTotalAchieved,0);
  const amTeamPct       = amTotalTarget>0 ? Math.min((amTotalAchieved/amTotalTarget)*100,100) : 0;
  const amTop           = amRows.length>0 ? amRows.reduce((b:any,r:any)=>r.achieved>(b?.achieved??0)?r:b,null) : null;

  // ── TL targets queries ──
  const { data: tlTargets=[], isLoading: tlLoading } = useQuery({
    queryKey: ['tl-targets', month, year, salesTeam],
    queryFn:  async () => {
      const url = salesTeam
        ? `/api/manager/team-leader-targets?month=${month}&year=${year}&team_id=${salesTeam}`
        : `/api/manager/team-leader-targets?month=${month}&year=${year}`;
      return (await (await fetch(url)).json()).data ?? [];
    },
  });
  const { data: tlLeaders=[] } = useQuery<any[]>({
    queryKey: ['team-leaders'],
    queryFn:  async () => (await fetch('/api/sales-members?role=team_leader')).json().then((r:any) => r.data ?? []),
  });

  const { data: currentUser } = useQuery<any>({
    queryKey: ['me'],
    queryFn: async () => (await fetch('/api/users/me')).json().then((r:any) => r.data),
  });

  const tlRows = tlTargets.map((t:any) => {
    const target   = parseFloat(t.target_amount||0);
    const achieved = 0; // TODO: sum from allocations achieved
    const left     = Math.max(target-achieved,0);
    const pct      = target>0 ? Math.min((achieved/target)*100,100) : 0;
    return { ...t, target, achieved, left, pct };
  });
  const salesTotalTarget   = tlRows.reduce((s:number,r:any)=>s+r.target,0);
  const salesTotalAchieved = tlRows.reduce((s:number,r:any)=>s+r.achieved,0);
  const salesTotalLeft     = Math.max(salesTotalTarget-salesTotalAchieved,0);
  const salesTeamPct       = salesTotalTarget>0 ? Math.min((salesTotalAchieved/salesTotalTarget)*100,100) : 0;
  const salesTop           = tlRows.length>0 ? tlRows.reduce((b:any,r:any)=>r.target>(b?.target||0)?r:b,null) : null;
  const salesMembers       = tlRows; // alias for JSX compatibility
  const membersLoading     = tlLoading;
  const salesLoading       = tlLoading;

  // ── AM mutations ──
  const amMutation = useMutation({
    mutationFn: async (data:any) => {
      const res=await fetch('/api/revenue-targets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      const json=await res.json(); if(!res.ok) throw new Error(json.error); return json.data;
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:['revenue-targets']}); toast.success('Target saved!'); setShowAMModal(false); setEditAMTarget(null); },
    onError: (e:Error) => toast.error(e.message),
  });

  // ── Team Leader target mutation (Manager -> Team -> its Team Leader) ──
  const salesMutation = useMutation({
    mutationFn: async (data:any) => {
      const res=await fetch('/api/manager/team-leader-targets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        team_leader_id: data.team_leader_id,
        team_id: data.team_id,
        month: Number(data.month),
        year: Number(data.year),
        target_amount: data.target_amount,
        currency: data.currency,
        created_by: currentUser?.id,
      })});
      const json=await res.json(); if(!res.ok) throw new Error(json.error); return json.data;
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:['tl-targets']}); toast.success('Target saved!'); setShowSalesModal(false); setEditSalesTarget(null); },
    onError: (e:Error) => toast.error(e.message),
  });

  const pctColor = (p:number) => p>=100?'#34d399':p>=60?'#60a5fa':p>=30?'#fbbf24':'#f87171';

  // Lightweight 6-month history for the Account Managers total, reusing the
  // same revenue-targets + upsells endpoints already used above.
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const points: { label: string; amTarget: number; amAchieved: number }[] = [];
      let m = month, y = year;
      for (let i = 0; i < 6; i++) {
        const [targetsRes, upsellsRes] = await Promise.all([
          fetch(`/api/revenue-targets?month=${m}&year=${y}`),
          fetch(`/api/upsells?month=${m}&year=${y}`),
        ]);
        const targets = targetsRes.ok ? (await targetsRes.json()).data ?? [] : [];
        const ups = upsellsRes.ok ? (await upsellsRes.json()).data ?? [] : [];
        const target = targets.reduce((s: number, t: any) => s + parseFloat(t.target_amount || 0), 0);
        const achieved = ups.reduce((s: number, u: any) => s + parseFloat(u.upfront_amount || 0), 0);
        points.unshift({ label: `${MONTHS[m - 1].slice(0, 3)} ${y}`, amTarget: target, amAchieved: achieved });
        m -= 1;
        if (m === 0) { m = 12; y -= 1; }
      }
      setHistory(points);
    } catch {
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    if (tab === 'history' && !history) loadHistory();
  }, [tab, history, loadHistory]);

  return (
    <div className="wm-page-inner">

      {/* ── Header ── */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24,flexWrap:'wrap',gap:12}} className="wm-fade-up">
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <Target size={15} style={{color:'#a78bfa'}}/>
            <span style={{fontSize:'.72rem',color:'rgba(148,163,184,.5)',textTransform:'uppercase',letterSpacing:'.06em'}}>Goals</span>
          </div>
          <h1 style={{fontSize:'1.65rem',fontWeight:700,color:'#f1f5f9',marginBottom:4}}>Monthly Targets</h1>
          <p style={{fontSize:'.875rem',color:'rgba(148,163,184,.5)'}}>Set and track monthly targets for your team</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,.04)',border:'1px solid rgba(124,58,237,.18)',borderRadius:10,padding:'6px 4px'}}>
            <button onClick={prevMonth} style={{width:28,height:28,borderRadius:7,border:'none',background:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(148,163,184,.6)'}}
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(124,58,237,.12)')} onMouseLeave={e=>(e.currentTarget.style.background='none')}>
              <ChevronLeft size={15}/>
            </button>
            <span style={{fontSize:'.88rem',fontWeight:600,color:'#f1f5f9',minWidth:110,textAlign:'center'}}>{MONTHS[month-1]} {year}</span>
            <button onClick={nextMonth} style={{width:28,height:28,borderRadius:7,border:'none',background:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(148,163,184,.6)'}}
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(124,58,237,.12)')} onMouseLeave={e=>(e.currentTarget.style.background='none')}>
              <ChevronRight size={15}/>
            </button>
          </div>
          <button className="wm-btn-primary" onClick={() => tab==='am' ? (setEditAMTarget(null),setAmForm({account_manager_id:'',month:String(month),year:String(year),target_amount:'',currency:'USD'}),setShowAMModal(true)) : (setEditSalesTarget(null),setSalesForm({team_id:salesTeam||'',team_leader_id:'',month:String(month),year:String(year),target_amount:'0',currency:'USD'}),setShowSalesModal(true))}
            style={{display:'flex',alignItems:'center',gap:7,height:42}}>
            <Plus size={15}/> {tab==='am'?'Add / Update Target':'Set Target'}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{display:'flex',gap:6,marginBottom:22,borderBottom:'1px solid rgba(255,255,255,.06)'}}>
        {([{key:'am',label:'Account Managers'},{key:'sales',label:'Sales Teams'},{key:'history',label:'History'}] as const).map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{padding:'8px 18px',fontSize:'.85rem',fontWeight:600,border:'none',background:'none',cursor:'pointer',color:tab===t.key?'#f1f5f9':'rgba(148,163,184,.4)',borderBottom:tab===t.key?'2px solid #a78bfa':'2px solid transparent',marginBottom:-1,transition:'all .2s'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════ AM TAB ══════════ */}
      {tab==='am' && (<>
        {/* Summary cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14,marginBottom:24}} className="wm-fade-up">
          {[
            {label:'Total Team Target',value:amTotalTarget>0?`$${amTotalTarget.toLocaleString()}`:'—',sub:`Target for ${MONTHS[month-1]}`,icon:Target,color:'#a78bfa'},
            {label:'Total Achieved',value:amTotalAchieved>0?`$${amTotalAchieved.toLocaleString()}`:'$0',sub:`${amTeamPct.toFixed(1)}% of total target`,icon:TrendingUp,color:'#34d399'},
            {label:'Total Left',value:amTotalLeft>0?`$${amTotalLeft.toLocaleString()}`:'$0',sub:`${(100-amTeamPct).toFixed(1)}% remaining`,icon:AlertCircle,color:'#fbbf24'},
            {label:'Team Members',value:String(managers.length),sub:'Account managers',icon:Users,color:'#60a5fa'},
          ].map(({label,value,sub,icon:Icon,color})=>(
            <div key={label} className="wm-stat">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <p style={{fontSize:'.72rem',color:'rgba(148,163,184,.5)',textTransform:'uppercase',letterSpacing:'.05em'}}>{label}</p>
                <div style={{width:32,height:32,borderRadius:8,background:color+'18',display:'flex',alignItems:'center',justifyContent:'center',color}}><Icon size={15}/></div>
              </div>
              <p style={{fontSize:'1.6rem',fontWeight:700,color,marginBottom:4}}>{value}</p>
              <p style={{fontSize:'.72rem',color:'rgba(148,163,184,.4)'}}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Target overview donut + period info */}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(280px,1fr) minmax(240px,1fr)', gap:16, marginBottom:20 }} className="wm-fade-up-2">
          <div className="wm-card" style={{ padding:'20px 22px' }}>
            <div style={{ fontWeight:700, color:'#f1f5f9', marginBottom:16, fontSize:'.95rem' }}>Target Overview</div>
            <div style={{ display:'flex', alignItems:'center', gap:22, flexWrap:'wrap' }}>
              <DonutChart
                centerLabel="Total"
                centerValue={amTotalTarget>0?`$${amTotalTarget.toLocaleString()}`:'—'}
                segments={[
                  { value: amTotalAchieved, color: '#34d399' },
                  { value: amTotalLeft, color: 'rgba(148,163,184,.18)' },
                ]}
              />
              <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1, minWidth:140 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', background:'#34d399', marginTop:4, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:'.82rem', color:'#f1f5f9', fontWeight:600 }}>Achieved</div>
                    <div style={{ fontSize:'.78rem', color:'rgba(148,163,184,.5)' }}>${amTotalAchieved.toLocaleString()} ({amTeamPct.toFixed(0)}%)</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', background:'rgba(148,163,184,.4)', marginTop:4, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:'.82rem', color:'#f1f5f9', fontWeight:600 }}>Left</div>
                    <div style={{ fontSize:'.78rem', color:'rgba(148,163,184,.5)' }}>${amTotalLeft.toLocaleString()} ({(100-amTeamPct).toFixed(0)}%)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <PeriodPanel month={month} year={year} role="Manager" />
        </div>

        {/* Top performer */}
        {amTop && amTop.achieved>0 && (
          <div style={{marginBottom:20,padding:'14px 20px',borderRadius:14,background:'linear-gradient(135deg,rgba(251,191,36,.08),rgba(124,58,237,.08))',border:'1px solid rgba(251,191,36,.2)',display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:40,height:40,borderRadius:10,background:'rgba(251,191,36,.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fbbf24',flexShrink:0}}><Trophy size={18}/></div>
            <div>
              <p style={{fontSize:'.82rem',fontWeight:600,color:'#fbbf24',marginBottom:2}}>🏆 Top Performer — {MONTHS[month-1]} {year}</p>
              <p style={{fontSize:'.78rem',color:'rgba(148,163,184,.6)'}}>
                <span style={{color:'#f1f5f9',fontWeight:600}}>{amTop.accountManager?.full_name}</span> achieved <span style={{color:'#34d399',fontWeight:600}}>${amTop.achieved.toLocaleString()}</span> · {amTop.pct.toFixed(1)}% of target
              </p>
            </div>
            {amTop.pct>=100&&<div style={{marginLeft:'auto',padding:'4px 12px',borderRadius:99,background:'rgba(52,211,153,.12)',border:'0.5px solid rgba(52,211,153,.3)',fontSize:'.75rem',color:'#34d399',fontWeight:600,flexShrink:0}}>Target Achieved ✓</div>}
          </div>
        )}

        {/* AM Table */}
        <div className="wm-card wm-fade-up-2" style={{overflow:'hidden'}}>
          <div style={{padding:'18px 22px',borderBottom:'1px solid rgba(124,58,237,.1)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <p style={{fontSize:'.95rem',fontWeight:600,color:'#f1f5f9'}}>Account Managers</p>
            <p style={{fontSize:'.75rem',color:'rgba(148,163,184,.4)'}}>Targets reset on the 1st of every month</p>
          </div>
          {amLoading ? <div style={{textAlign:'center',padding:40,color:'rgba(148,163,184,.3)'}}>Loading...</div>
          : amRows.length===0 ? (
            <div style={{textAlign:'center',padding:'60px 24px'}}>
              <Target size={36} style={{color:'rgba(148,163,184,.15)',margin:'0 auto 12px',display:'block'}}/>
              <p style={{color:'rgba(148,163,184,.4)',fontSize:'.9rem'}}>No targets set for {MONTHS[month-1]} {year}</p>
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table className="wm-table">
                <thead><tr><th>#</th><th>Account Manager</th><th style={{textAlign:'right'}}>Target</th><th style={{textAlign:'right'}}>Achieved</th><th style={{textAlign:'right'}}>Left</th><th style={{minWidth:160}}>Achievement</th><th style={{textAlign:'right'}}>Action</th></tr></thead>
                <tbody>
                  {amRows.map((r:any,i:number)=>{
                    const isTop=amTop&&r.account_manager_id===amTop.account_manager_id&&r.achieved>0;
                    const pc=pctColor(r.pct);
                    return (
                      <tr key={r.account_manager_id} style={{background:isTop?'rgba(251,191,36,.03)':'transparent'}}>
                        <td style={{color:'rgba(148,163,184,.4)',fontSize:'.82rem'}}>{i+1}</td>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{width:34,height:34,borderRadius:9,flexShrink:0,background:'linear-gradient(135deg,rgba(124,58,237,.4),rgba(59,130,246,.4))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#f1f5f9'}}>
                              {r.accountManager?.full_name?.charAt(0)?.toUpperCase()??'?'}
                            </div>
                            <div>
                              <div style={{display:'flex',alignItems:'center',gap:6}}>
                                <p style={{fontSize:'.87rem',fontWeight:500,color:'#f1f5f9'}}>{r.accountManager?.full_name}</p>
                                {isTop&&<span style={{fontSize:'.65rem',padding:'1px 7px',borderRadius:99,background:'rgba(251,191,36,.15)',color:'#fbbf24',border:'0.5px solid rgba(251,191,36,.3)'}}>🏆 Top</span>}
                              </div>
                              <p style={{fontSize:'.72rem',color:'rgba(148,163,184,.4)'}}>{r.accountManager?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{textAlign:'right',fontWeight:600,color:'#f1f5f9'}}>{parseFloat(r.target_amount)>0?`${r.currency} ${parseFloat(r.target_amount).toLocaleString()}`:<span style={{color:'rgba(148,163,184,.3)',fontSize:'.8rem'}}>Not set</span>}</td>
                        <td style={{textAlign:'right',fontWeight:600,color:'#34d399'}}>{r.achieved>0?`${r.currency} ${r.achieved.toLocaleString()}`:'—'}</td>
                        <td style={{textAlign:'right',fontWeight:600,color:'#fbbf24'}}>{r.left>0?`${r.currency} ${r.left.toLocaleString()}`:r.achieved>0?<span style={{color:'#34d399'}}>✓ Done</span>:'—'}</td>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{flex:1,height:6,borderRadius:99,background:'rgba(255,255,255,.06)',overflow:'hidden',minWidth:80}}>
                              <div style={{height:'100%',width:`${r.pct}%`,borderRadius:99,background:`linear-gradient(90deg,${pc}88,${pc})`,transition:'width .6s'}}/>
                            </div>
                            <span style={{fontSize:'.78rem',fontWeight:600,color:pc,minWidth:38,textAlign:'right'}}>{r.pct.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td style={{textAlign:'right'}}>
                          <button onClick={()=>{setEditAMTarget(r);setAmForm({account_manager_id:r.account_manager_id,month:String(r.month),year:String(r.year),target_amount:String(r.target_amount),currency:r.currency});setShowAMModal(true);}}
                            style={{width:30,height:30,borderRadius:7,border:'none',background:'rgba(255,255,255,.04)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(148,163,184,.4)',marginLeft:'auto'}}
                            onMouseEnter={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background='rgba(167,139,250,.12)';b.style.color='#a78bfa';}}
                            onMouseLeave={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background='rgba(255,255,255,.04)';b.style.color='rgba(148,163,184,.4)';}}>
                            <Pencil size={13}/>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {amRows.length>0&&(
                    <tr style={{borderTop:'2px solid rgba(124,58,237,.15)',background:'rgba(124,58,237,.04)'}}>
                      <td colSpan={2} style={{fontWeight:700,color:'#f1f5f9',fontSize:'.88rem'}}>Total</td>
                      <td style={{textAlign:'right',fontWeight:700,color:'#f1f5f9'}}>${amTotalTarget.toLocaleString()}</td>
                      <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>${amTotalAchieved.toLocaleString()}</td>
                      <td style={{textAlign:'right',fontWeight:700,color:'#fbbf24'}}>${amTotalLeft.toLocaleString()}</td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{flex:1,height:6,borderRadius:99,background:'rgba(255,255,255,.06)',overflow:'hidden',minWidth:80}}>
                            <div style={{height:'100%',width:`${amTeamPct}%`,borderRadius:99,background:'linear-gradient(90deg,#7c3aed,#3b82f6)',transition:'width .6s'}}/>
                          </div>
                          <span style={{fontSize:'.78rem',fontWeight:700,color:'#a78bfa',minWidth:38,textAlign:'right'}}>{amTeamPct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td/>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>)}

      {/* ══════════ SALES TAB ══════════ */}
      {tab==='sales' && (<>
        {/* Team selector */}
        <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
          {(teams as any[]).map(t=>(
            <button key={t.value} onClick={()=>setSalesTeam(t.id)}
              style={{padding:'8px 16px',borderRadius:10,border:`1px solid ${salesTeam===t.id?'rgba(244,114,182,.5)':'rgba(124,58,237,.18)'}`,background:salesTeam===t.id?'rgba(244,114,182,.1)':'rgba(255,255,255,.03)',color:salesTeam===t.id?'#f472b6':'rgba(148,163,184,.6)',fontSize:'.82rem',fontWeight:600,cursor:'pointer',transition:'all .2s'}}>
              {t.name}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14,marginBottom:24}} className="wm-fade-up">
          {[
            {label:'Team Revenue Target',value:salesTotalTarget>0?`$${salesTotalTarget.toLocaleString()}`:'—',sub:`Target for ${MONTHS[month-1]}`,icon:Target,color:'#f472b6'},
            {label:'Total Collected',value:salesTotalAchieved>0?`$${salesTotalAchieved.toLocaleString()}`:'$0',sub:`${salesTeamPct.toFixed(1)}% of target`,icon:TrendingUp,color:'#34d399'},
            {label:'Total Left',value:salesTotalLeft>0?`$${salesTotalLeft.toLocaleString()}`:'$0',sub:`${(100-salesTeamPct).toFixed(1)}% remaining`,icon:AlertCircle,color:'#fbbf24'},
            {label:'Team Members',value:String(salesMembers.length),sub:(teams as any[]).find(t=>t.id===salesTeam)?.name??'',icon:Users,color:'#60a5fa'},
          ].map(({label,value,sub,icon:Icon,color})=>(
            <div key={label} className="wm-stat">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <p style={{fontSize:'.72rem',color:'rgba(148,163,184,.5)',textTransform:'uppercase',letterSpacing:'.05em'}}>{label}</p>
                <div style={{width:32,height:32,borderRadius:8,background:color+'18',display:'flex',alignItems:'center',justifyContent:'center',color}}><Icon size={15}/></div>
              </div>
              <p style={{fontSize:'1.6rem',fontWeight:700,color,marginBottom:4}}>{value}</p>
              <p style={{fontSize:'.72rem',color:'rgba(148,163,184,.4)'}}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Target overview donut + period info */}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(280px,1fr) minmax(240px,1fr)', gap:16, marginBottom:20 }} className="wm-fade-up-2">
          <div className="wm-card" style={{ padding:'20px 22px' }}>
            <div style={{ fontWeight:700, color:'#f1f5f9', marginBottom:16, fontSize:'.95rem' }}>Target Overview</div>
            <div style={{ display:'flex', alignItems:'center', gap:22, flexWrap:'wrap' }}>
              <DonutChart
                centerLabel="Total"
                centerValue={salesTotalTarget>0?`$${salesTotalTarget.toLocaleString()}`:'—'}
                segments={[
                  { value: salesTotalAchieved, color: '#f472b6' },
                  { value: salesTotalLeft, color: 'rgba(148,163,184,.18)' },
                ]}
              />
              <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1, minWidth:140 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', background:'#f472b6', marginTop:4, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:'.82rem', color:'#f1f5f9', fontWeight:600 }}>Collected</div>
                    <div style={{ fontSize:'.78rem', color:'rgba(148,163,184,.5)' }}>${salesTotalAchieved.toLocaleString()} ({salesTeamPct.toFixed(0)}%)</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', background:'rgba(148,163,184,.4)', marginTop:4, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:'.82rem', color:'#f1f5f9', fontWeight:600 }}>Left</div>
                    <div style={{ fontSize:'.78rem', color:'rgba(148,163,184,.5)' }}>${salesTotalLeft.toLocaleString()} ({(100-salesTeamPct).toFixed(0)}%)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <PeriodPanel month={month} year={year} role="Manager" />
        </div>

        {/* Top performer */}
        {salesTop && salesTop.achieved>0 && (
          <div style={{marginBottom:20,padding:'14px 20px',borderRadius:14,background:'linear-gradient(135deg,rgba(244,114,182,.08),rgba(124,58,237,.08))',border:'1px solid rgba(244,114,182,.2)',display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:40,height:40,borderRadius:10,background:'rgba(244,114,182,.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#f472b6',flexShrink:0}}><Trophy size={18}/></div>
            <div>
              <p style={{fontSize:'.82rem',fontWeight:600,color:'#f472b6',marginBottom:2}}>🏆 Top Performer — {MONTHS[month-1]} {year}</p>
              <p style={{fontSize:'.78rem',color:'rgba(148,163,184,.6)'}}>
                <span style={{color:'#f1f5f9',fontWeight:600}}>{salesTop.full_name}</span> collected <span style={{color:'#34d399',fontWeight:600}}>${salesTop.achieved.toLocaleString()}</span>
                {salesTop.pct>0&&<span> · {salesTop.pct.toFixed(1)}% of target</span>}
              </p>
            </div>
          </div>
        )}

        {/* Sales Table */}
        <div className="wm-card wm-fade-up-2" style={{overflow:'hidden'}}>
          <div style={{padding:'18px 22px',borderBottom:'1px solid rgba(124,58,237,.1)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <p style={{fontSize:'.95rem',fontWeight:600,color:'#f1f5f9'}}>{(teams as any[]).find(t=>t.id===salesTeam)?.name}</p>
            <p style={{fontSize:'.75rem',color:'rgba(148,163,184,.4)'}}>Targets reset on the 1st of every month</p>
          </div>
          {(salesLoading||membersLoading) ? <div style={{textAlign:'center',padding:40,color:'rgba(148,163,184,.3)'}}>Loading...</div>
          : tlRows.length===0 ? (
            <div style={{textAlign:'center',padding:'60px 24px'}}>
              <Target size={36} style={{color:'rgba(148,163,184,.15)',margin:'0 auto 12px',display:'block'}}/>
              <p style={{color:'rgba(148,163,184,.4)',fontSize:'.9rem'}}>No members in this team yet</p>
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table className="wm-table">
                <thead><tr><th>#</th><th>Team Leader</th><th style={{textAlign:'right'}}>Target</th><th style={{textAlign:'right'}}>Collected</th><th style={{textAlign:'right'}}>Left</th><th style={{minWidth:160}}>Achievement</th><th style={{textAlign:'right'}}>Action</th></tr></thead>
                <tbody>
                  {tlRows.map((r:any,i:number)=>{
                    const isTop=salesTop&&r.id===salesTop.id&&r.achieved>0;
                    const pc=pctColor(r.pct);
                    return (
                      <tr key={r.id} style={{background:isTop?'rgba(244,114,182,.03)':'transparent'}}>
                        <td style={{color:'rgba(148,163,184,.4)',fontSize:'.82rem'}}>{i+1}</td>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{width:34,height:34,borderRadius:9,flexShrink:0,background:'linear-gradient(135deg,rgba(244,114,182,.3),rgba(167,139,250,.3))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#f1f5f9'}}>
                              {r.full_name?.charAt(0)?.toUpperCase()??'?'}
                            </div>
                            <div>
                              <div style={{display:'flex',alignItems:'center',gap:6}}>
                                <p style={{fontSize:'.87rem',fontWeight:500,color:'#f1f5f9'}}>{r.full_name}</p>
                                {isTop&&<span style={{fontSize:'.65rem',padding:'1px 7px',borderRadius:99,background:'rgba(244,114,182,.15)',color:'#f472b6',border:'0.5px solid rgba(244,114,182,.3)'}}>🏆 Top</span>}
                              </div>
                              <p style={{fontSize:'.72rem',color:'rgba(148,163,184,.4)'}}>{r.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{textAlign:'right',fontWeight:600,color:'#f1f5f9'}}>{r.targetRevenue>0?`$${r.targetRevenue.toLocaleString()}`:<span style={{color:'rgba(148,163,184,.3)',fontSize:'.8rem'}}>Not set</span>}</td>
                        <td style={{textAlign:'right',fontWeight:600,color:'#34d399'}}>{r.achieved>0?`$${r.achieved.toLocaleString()}`:'—'}</td>
                        <td style={{textAlign:'right',fontWeight:600,color:'#fbbf24'}}>{r.left>0?`$${r.left.toLocaleString()}`:r.achieved>0?<span style={{color:'#34d399'}}>✓ Done</span>:'—'}</td>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{flex:1,height:6,borderRadius:99,background:'rgba(255,255,255,.06)',overflow:'hidden',minWidth:80}}>
                              <div style={{height:'100%',width:`${r.pct}%`,borderRadius:99,background:`linear-gradient(90deg,${pc}88,${pc})`,transition:'width .6s'}}/>
                            </div>
                            <span style={{fontSize:'.78rem',fontWeight:600,color:pc,minWidth:38,textAlign:'right'}}>{r.pct.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td style={{textAlign:'right'}}>
                          <button onClick={()=>{setEditSalesTarget(r.target??r??null);setSalesForm({team_id:r.team_id??salesTeam??'',team_leader_id:r.team_leader_id??r.id,month:String(month),year:String(year),target_amount:String(r.target||r.targetRevenue||0),currency:r.target?.currency??r.currency??'USD'});setShowSalesModal(true);}}
                            style={{width:30,height:30,borderRadius:7,border:'none',background:'rgba(255,255,255,.04)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(148,163,184,.4)',marginLeft:'auto'}}
                            onMouseEnter={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background='rgba(244,114,182,.12)';b.style.color='#f472b6';}}
                            onMouseLeave={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background='rgba(255,255,255,.04)';b.style.color='rgba(148,163,184,.4)';}}>
                            <Pencil size={13}/>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {tlRows.length>0&&(
                    <tr style={{borderTop:'2px solid rgba(124,58,237,.15)',background:'rgba(124,58,237,.04)'}}>
                      <td colSpan={2} style={{fontWeight:700,color:'#f1f5f9',fontSize:'.88rem'}}>Total</td>
                      <td style={{textAlign:'right',fontWeight:700,color:'#f1f5f9'}}>${salesTotalTarget.toLocaleString()}</td>
                      <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>${salesTotalAchieved.toLocaleString()}</td>
                      <td style={{textAlign:'right',fontWeight:700,color:'#fbbf24'}}>${salesTotalLeft.toLocaleString()}</td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{flex:1,height:6,borderRadius:99,background:'rgba(255,255,255,.06)',overflow:'hidden',minWidth:80}}>
                            <div style={{height:'100%',width:`${salesTeamPct}%`,borderRadius:99,background:'linear-gradient(90deg,#f472b6,#a78bfa)',transition:'width .6s'}}/>
                          </div>
                          <span style={{fontSize:'.78rem',fontWeight:700,color:'#f472b6',minWidth:38,textAlign:'right'}}>{salesTeamPct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td/>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>)}

      {/* ══════════ HISTORY TAB ══════════ */}
      {tab==='history' && (
        <div className="wm-card wm-fade-up" style={{ padding:'22px 24px' }}>
          <div style={{ fontWeight:700, color:'#f1f5f9', marginBottom:4, fontSize:'.95rem' }}>Target History — Account Managers</div>
          <div style={{ fontSize:'.78rem', color:'rgba(148,163,184,.45)', marginBottom:18 }}>Last 6 months, total AM target vs. total achieved.</div>
          {historyLoading ? (
            <div style={{ padding:30, textAlign:'center', color:'rgba(148,163,184,.4)' }}>Loading…</div>
          ) : !history || history.length===0 ? (
            <div style={{ padding:30, textAlign:'center', color:'rgba(148,163,184,.4)', fontSize:'.85rem' }}>No history available.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {history.map((h) => {
                const pct = h.amTarget>0 ? Math.min(100, Math.round((h.amAchieved/h.amTarget)*100)) : 0;
                return (
                  <div key={h.label}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.82rem', marginBottom:5 }}>
                      <span style={{ color:'#f1f5f9', fontWeight:600 }}>{h.label}</span>
                      <span style={{ color:'rgba(148,163,184,.5)' }}>${h.amAchieved.toLocaleString()} / ${h.amTarget.toLocaleString()}</span>
                    </div>
                    <div style={{ height:8, background:'rgba(255,255,255,.08)', borderRadius:99 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#7c3aed,#3b82f6)', borderRadius:99 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Info note */}
      <div style={{marginTop:16,padding:'12px 16px',borderRadius:10,background:'rgba(96,165,250,.06)',border:'0.5px solid rgba(96,165,250,.15)',display:'flex',alignItems:'center',gap:10}}>
        <AlertCircle size={14} style={{color:'#60a5fa',flexShrink:0}}/>
        <p style={{fontSize:'.78rem',color:'rgba(148,163,184,.55)'}}>Targets are reset to zero on the 1st of every month. You can update targets anytime during the month.</p>
      </div>

      {/* ── AM Modal ── */}
      {showAMModal&&(
        <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div onClick={()=>setShowAMModal(false)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.75)',backdropFilter:'blur(6px)'}}/>
          <div style={{position:'relative',zIndex:1,width:'100%',maxWidth:460,background:'#0e0e20',border:'1px solid rgba(124,58,237,.3)',borderRadius:18,padding:28,boxShadow:'0 0 60px rgba(124,58,237,.2)'}}>
            <h2 style={{fontSize:'1.1rem',fontWeight:700,color:'#f1f5f9',marginBottom:4}}>{editAMTarget?'Update Target':'Set Revenue Target'}</h2>
            <p style={{fontSize:'.82rem',color:'rgba(148,163,184,.5)',marginBottom:20}}>Set a monthly revenue target for an account manager</p>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div><label style={lbl}>Account Manager</label>
                <select style={sel} value={amForm.account_manager_id} onChange={e=>setAmForm(f=>({...f,account_manager_id:e.target.value}))}>
                  <option value="">Select AM</option>
                  {managers.map((m:User)=><option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label style={lbl}>Month</label>
                  <select style={sel} value={amForm.month} onChange={e=>setAmForm(f=>({...f,month:e.target.value}))}>
                    {MONTHS.map((m,i)=><option key={i+1} value={String(i+1)}>{m}</option>)}
                  </select></div>
                <div><label style={lbl}>Year</label>
                  <select style={sel} value={amForm.year} onChange={e=>setAmForm(f=>({...f,year:e.target.value}))}>
                    {[NOW.getFullYear()-1,NOW.getFullYear(),NOW.getFullYear()+1].map(y=><option key={y} value={String(y)}>{y}</option>)}
                  </select></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label style={lbl}>Target Amount</label>
                  <input style={inp} type="number" placeholder="5000" value={amForm.target_amount} onChange={e=>setAmForm(f=>({...f,target_amount:e.target.value}))}/></div>
                <div><label style={lbl}>Currency</label>
                  <select style={sel} value={amForm.currency} onChange={e=>setAmForm(f=>({...f,currency:e.target.value}))}>
                    {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select></div>
              </div>
              <div style={{display:'flex',gap:10,marginTop:4}}>
                <button className="wm-btn-ghost" onClick={()=>setShowAMModal(false)} style={{flex:1,height:40}}>Cancel</button>
                <button className="wm-btn-primary" style={{flex:1,height:40}} disabled={amMutation.isPending||!amForm.account_manager_id||!amForm.target_amount}
                  onClick={()=>amMutation.mutate(amForm)}>Save Target</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sales Modal ── */}
      {showSalesModal&&(
        <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div onClick={()=>setShowSalesModal(false)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.75)',backdropFilter:'blur(6px)'}}/>
          <div style={{position:'relative',zIndex:1,width:'100%',maxWidth:460,background:'#0e0e20',border:'1px solid rgba(124,58,237,.3)',borderRadius:18,padding:28,boxShadow:'0 0 60px rgba(124,58,237,.2)'}}>
            <h2 style={{fontSize:'1.1rem',fontWeight:700,color:'#f1f5f9',marginBottom:4}}>{editSalesTarget?'Update Target':'Set Team Target'}</h2>
            <p style={{fontSize:'.82rem',color:'rgba(148,163,184,.5)',marginBottom:20}}>Set a monthly revenue target for a team — it's assigned to that team's Team Leader, who distributes it to their agents from their own Targets page.</p>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div><label style={lbl}>Team</label>
                <select style={sel} value={salesForm.team_id} onChange={e=>setSalesForm(f=>({...f,team_id:e.target.value,team_leader_id:''}))}>
                  <option value="">Select team</option>
                  {(teams as any[]).map((t:any)=><option key={t.id} value={t.id}>{t.name}</option>)}
                </select></div>
              <div><label style={lbl}>Team Leader</label>
                {(() => {
                  const teamLeadersForTeam = tlLeaders.filter((tl:any) => tl.team_id === salesForm.team_id);
                  return (
                    <select style={sel} value={salesForm.team_leader_id} disabled={!salesForm.team_id}
                      onChange={e=>setSalesForm(f=>({...f,team_leader_id:e.target.value}))}>
                      <option value="">{!salesForm.team_id ? 'Select a team first' : teamLeadersForTeam.length===0 ? 'No Team Leader assigned to this team' : 'Select Team Leader'}</option>
                      {teamLeadersForTeam.map((tl:any)=><option key={tl.id} value={tl.id}>{tl.full_name}</option>)}
                    </select>
                  );
                })()}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label style={lbl}>Month</label>
                  <select style={sel} value={salesForm.month} onChange={e=>setSalesForm(f=>({...f,month:e.target.value}))}>
                    {MONTHS.map((m,i)=><option key={i+1} value={String(i+1)}>{m}</option>)}
                  </select></div>
                <div><label style={lbl}>Year</label>
                  <select style={sel} value={salesForm.year} onChange={e=>setSalesForm(f=>({...f,year:e.target.value}))}>
                    {[NOW.getFullYear()-1,NOW.getFullYear(),NOW.getFullYear()+1].map(y=><option key={y} value={String(y)}>{y}</option>)}
                  </select></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label style={lbl}>Revenue Target</label>
                  <input style={inp} type="number" placeholder="5000" value={salesForm.target_amount} onChange={e=>setSalesForm(f=>({...f,target_amount:e.target.value}))}/></div>
                <div><label style={lbl}>Currency</label>
                  <select style={sel} value={salesForm.currency} onChange={e=>setSalesForm(f=>({...f,currency:e.target.value}))}>
                    {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select></div>
              </div>
              <div style={{display:'flex',gap:10,marginTop:4}}>
                <button className="wm-btn-ghost" onClick={()=>setShowSalesModal(false)} style={{flex:1,height:40}}>Cancel</button>
                <button className="wm-btn-primary" style={{flex:1,height:40}} disabled={salesMutation.isPending||!salesForm.team_id||!salesForm.team_leader_id}
                  onClick={()=>salesMutation.mutate(salesForm)}>Save Target</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}