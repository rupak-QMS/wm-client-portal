'use client';
import { useState }    from 'react';
import { useQuery }    from '@tanstack/react-query';
import { Users, TrendingUp, Clock, Target, DollarSign, PieChart } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function TeamLeaderDashboard() {
  const now   = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());

  const { data: agents = [], isLoading: agentsLoading } = useQuery<any[]>({
    queryKey: ['tl-agents'],
    queryFn:  async () => (await fetch('/api/team-leader/agents')).json().then((r:any) => r.data ?? []),
  });

  const { data: me } = useQuery<any>({
    queryKey: ['me'],
    queryFn:  async () => (await fetch('/api/users/me')).json().then((r:any) => r.data),
  });

  // Per-agent allocation breakdown (used for the leaderboard below)
  const { data: tlData } = useQuery<any>({
    queryKey: ['tl-allocations', me?.id, month, year],
    enabled:  !!me?.id,
    queryFn:  async () => {
      const res = await fetch(`/api/team-leader/allocations?team_leader_id=${me.id}&month=${month}&year=${year}`);
      return res.json();
    },
  });

  // TL's own target — sourced from the Account Manager's allocation
  // (replaces the old /api/manager/team-leader-targets flow)
  const { data: tlTarget } = useQuery<any>({
    queryKey: ['tl-target', month, year],
    queryFn:  async () => {
      const res = await fetch(`/api/team-leader/target?month=${month}&year=${year}`);
      return res.json();
    },
  });

  const active  = agents.filter((a:any) => a.status === 'active');
  const pending = agents.filter((a:any) => a.status === 'pending');
  const teamName = me?.team?.name ?? 'My Team';
  const teamAchieved = active.reduce((s:number, a:any) => s + (a.achieved ?? 0), 0);

  const totalAssigned  = tlTarget?.assigned_target ?? 0;
  const totalAllocated = tlTarget?.allocated_to_team ?? 0;
  const totalRemaining = tlTarget?.remaining_to_allocate ?? 0;
  const allocationPct  = totalAssigned > 0 ? Math.min((totalAllocated / totalAssigned) * 100, 100) : 0;
  const fromAM          = tlTarget?.from_account_manager;

  const prevMonth = () => { if (month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); };

  return (
    <div style={{ padding:'32px 28px', maxWidth:1000, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:'.72rem', color:'#a78bfa', textTransform:'uppercase', letterSpacing:'.1em', fontWeight:600, marginBottom:6 }}>Team Leader Portal</div>
          <h1 style={{ fontSize:'1.6rem', fontWeight:700, color:'#f1f5f9', margin:0 }}>{teamName}</h1>
        </div>
        {/* Month selector */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.03)', border:'1px solid rgba(124,58,237,.15)', borderRadius:12, padding:'6px 14px' }}>
          <button onClick={prevMonth} style={{ background:'none', border:'none', color:'rgba(148,163,184,.5)', cursor:'pointer', fontSize:'1rem' }}>‹</button>
          <span style={{ fontSize:'.85rem', fontWeight:600, color:'#f1f5f9', minWidth:90, textAlign:'center' }}>{MONTHS[month-1]} {year}</span>
          <button onClick={nextMonth} style={{ background:'none', border:'none', color:'rgba(148,163,184,.5)', cursor:'pointer', fontSize:'1rem' }}>›</button>
        </div>
      </div>

      {/* Target summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:28 }}>
        {[
          { icon:<Target size={20}/>,     label:'Assigned Target',   value: totalAssigned>0  ? `$${totalAssigned.toLocaleString()}`  : '—',  color:'#a78bfa' },
          { icon:<DollarSign size={20}/>, label:'Allocated to Team', value: totalAllocated>0 ? `$${totalAllocated.toLocaleString()}` : '$0', color:'#60a5fa' },
          { icon:<PieChart size={20}/>,   label:'Remaining to Alloc',value: totalAssigned>0  ? `$${totalRemaining.toLocaleString()}` : '—',  color:'#fbbf24' },
          { icon:<TrendingUp size={20}/>, label:'Team Achieved',     value: `$${teamAchieved.toLocaleString()}`,                            color:'#34d399' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(124,58,237,.15)', borderRadius:14, padding:'20px 24px', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', color }}>{icon}</div>
            <div>
              <div style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</div>
              <div style={{ fontSize:'1.35rem', fontWeight:700, color:'#f1f5f9', marginTop:2 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Allocation progress */}
      {totalAssigned > 0 && (
        <div style={{ marginBottom:28, background:'rgba(255,255,255,.02)', border:'1px solid rgba(124,58,237,.12)', borderRadius:14, padding:'20px 24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ fontSize:'.85rem', fontWeight:600, color:'#f1f5f9' }}>Target Allocation Progress</span>
            <span style={{ fontSize:'.85rem', color:'#a78bfa', fontWeight:600 }}>{allocationPct.toFixed(1)}%</span>
          </div>
          <div style={{ height:8, background:'rgba(255,255,255,.06)', borderRadius:99 }}>
            <div style={{ height:'100%', width:`${allocationPct}%`, background:'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius:99, transition:'width .5s' }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:'.75rem', color:'rgba(148,163,184,.4)' }}>
            <span>Allocated: ${totalAllocated.toLocaleString()}</span>
            <span>Remaining: ${Math.max(totalRemaining,0).toLocaleString()}</span>
          </div>
          {/* Source of this target */}
          {fromAM?.full_name && (
            <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:8, fontSize:'.8rem', padding:'8px 12px', background:'rgba(124,58,237,.06)', borderRadius:8 }}>
              <span style={{ color:'rgba(148,163,184,.7)' }}>Target assigned by:</span>
              <span style={{ color:'#a78bfa', fontWeight:600 }}>{fromAM.full_name}</span>
            </div>
          )}
        </div>
      )}

      {/* Agent stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:28 }}>
        {[
          { icon:<Users size={18}/>,     label:'Active Agents',    value: active.length,  color:'#34d399' },
          { icon:<Clock size={18}/>,     label:'Pending Approval', value: pending.length, color:'#fbbf24' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(124,58,237,.15)', borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', color }}>{icon}</div>
            <div>
              <div style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</div>
              <div style={{ fontSize:'1.25rem', fontWeight:700, color:'#f1f5f9' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Team leaderboard */}
      <div style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(124,58,237,.12)', borderRadius:16, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(124,58,237,.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:600, color:'#f1f5f9' }}>Team Performance</span>
          <span style={{ fontSize:'.75rem', color:'rgba(148,163,184,.4)' }}>{active.length} active agents</span>
        </div>
        {agentsLoading ? (
          <div style={{ padding:40, textAlign:'center', color:'rgba(148,163,184,.4)' }}>Loading…</div>
        ) : active.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'rgba(148,163,184,.3)', fontSize:'.85rem' }}>No active agents yet.</div>
        ) : (
          <div>
            {[...active].sort((a:any,b:any) => b.achieved-a.achieved).map((a:any, i:number) => {
              const allocation = (tlData?.data ?? []).find((x:any) => x.team_member_id === a.id);
              const allocated  = Number(allocation?.allocated_target ?? 0);
              const achieved   = a.achieved ?? 0;
              const pct        = allocated > 0 ? Math.min((achieved/allocated)*100,100) : 0;
              return (
                <div key={a.id} style={{ padding:'14px 20px', borderBottom:'1px solid rgba(124,58,237,.07)', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(124,58,237,.18)', color:'#a78bfa', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.75rem', fontWeight:700, flexShrink:0 }}>{i+1}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:'.875rem', fontWeight:600, color:'#f1f5f9' }}>{a.full_name}</span>
                      <span style={{ fontSize:'.8rem', color:'rgba(148,163,184,.4)' }}>Target: {allocated>0?`$${allocated.toLocaleString()}`:'—'}</span>
                    </div>
                    <div style={{ height:5, background:'rgba(255,255,255,.06)', borderRadius:9 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#34d399,#10b981)', borderRadius:9, transition:'width .4s' }}/>
                    </div>
                  </div>
                  <div style={{ fontSize:'.95rem', fontWeight:700, color:'#34d399', flexShrink:0 }}>${achieved.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        )}
        {pending.length > 0 && (
          <div style={{ padding:'12px 20px', background:'rgba(251,191,36,.04)', borderTop:'1px solid rgba(251,191,36,.1)' }}>
            <span style={{ fontSize:'.78rem', color:'#fbbf24' }}>⏳ {pending.length} agent{pending.length>1?'s':''} awaiting manager approval</span>
          </div>
        )}
      </div>
    </div>
  );
}
