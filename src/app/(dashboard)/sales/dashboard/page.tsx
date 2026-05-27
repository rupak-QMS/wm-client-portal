'use client';
import { useState }  from 'react';
import { useQuery }  from '@tanstack/react-query';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Users, TrendingUp, Target, CheckCircle, Clock, XCircle, BarChart2, Award, LayoutDashboard } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const NOW = new Date();

const BADGE_STYLE: Record<string, { bg:string; color:string; icon:string }> = {
  gold:             { bg:'rgba(251,191,36,.12)',  color:'#fbbf24', icon:'🥇' },
  silver:           { bg:'rgba(148,163,184,.12)', color:'#94a3b8', icon:'🥈' },
  bronze:           { bg:'rgba(180,120,60,.12)',  color:'#b47c3c', icon:'🥉' },
  top_closer:       { bg:'rgba(52,211,153,.12)',  color:'#34d399', icon:'🏆' },
  highest_revenue:  { bg:'rgba(96,165,250,.12)',  color:'#60a5fa', icon:'💰' },
  most_clients:     { bg:'rgba(167,139,250,.12)', color:'#a78bfa', icon:'👥' },
  best_conversion:  { bg:'rgba(244,114,182,.12)', color:'#f472b6', icon:'🎯' },
};

export default function SalesDashboard() {
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year,  setYear]  = useState(NOW.getFullYear());

  const { data: stats } = useQuery({
    queryKey: ['sales-stats', month, year],
    queryFn:  async () => (await (await fetch(`/api/sales-stats?month=${month}&year=${year}`)).json()).data,
  });

  const { data: target } = useQuery({
    queryKey: ['sales-targets', month, year],
    queryFn:  async () => (await (await fetch(`/api/sales-targets?month=${month}&year=${year}`)).json()).data ?? [],
  });

  const myTarget   = target?.[0];
  const achieved   = stats?.approved_leads  ?? 0;
  const tClients   = myTarget?.target_clients ?? 0;
  const tRevenue   = myTarget?.target_revenue ?? 0;
  const revenue    = stats?.revenue ?? 0;
  const pctClients = tClients > 0 ? Math.min((achieved / tClients) * 100, 100) : 0;
  const pctRevenue = tRevenue > 0 ? Math.min((revenue  / tRevenue) * 100, 100) : 0;

  return (
    <div className="wm-page-inner">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <LayoutDashboard size={15} style={{ color:'#a78bfa' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Sales Portal</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>My Dashboard</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Your sales performance for {MONTHS[month-1]} {year}</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <select style={{ height:36, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, color:'#f1f5f9', fontSize:'.82rem', padding:'0 12px', outline:'none', cursor:'pointer' }}
            value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select style={{ height:36, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, color:'#f1f5f9', fontSize:'.82rem', padding:'0 12px', outline:'none', cursor:'pointer' }}
            value={year} onChange={e => setYear(Number(e.target.value))}>
            {[NOW.getFullYear()-1, NOW.getFullYear(), NOW.getFullYear()+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }} className="wm-fade-up">
        <StatsCard title="Leads Added"     value={stats?.total_leads    ?? '—'} icon={Users}       color="blue"   />
        <StatsCard title="Approved"        value={stats?.approved_leads ?? '—'} icon={CheckCircle} color="green"  />
        <StatsCard title="Pending"         value={stats?.pending_leads  ?? '—'} icon={Clock}       color="amber"  />
        <StatsCard title="Rejected"        value={stats?.rejected_leads ?? '—'} icon={XCircle}     color="red"    />
        <StatsCard title="Revenue (Est.)"  value={`$${(stats?.revenue ?? 0).toLocaleString()}`} icon={TrendingUp} color="purple" />
        <StatsCard title="Conversion Rate" value={`${stats?.conversion_rate ?? 0}%`}            icon={BarChart2}  color="pink"   />
      </div>

      {myTarget && (
        <div className="wm-card wm-fade-up-2" style={{ padding:'22px 24px', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
            <Target size={15} style={{ color:'#a78bfa' }} />
            <p style={{ fontSize:'.95rem', fontWeight:600, color:'#f1f5f9' }}>Monthly Target Progress</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {[
              { label:'Clients Target', achieved, target:tClients, pct:pctClients, unit:'', color:'#a78bfa' },
              { label:'Revenue Target', achieved:revenue, target:tRevenue, pct:pctRevenue, unit:'$', color:'#34d399' },
            ].map(({ label, achieved:ach, target:tgt, pct, unit, color }) => (
              <div key={label}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:'.78rem', color:'rgba(148,163,184,.55)' }}>{label}</span>
                  <span style={{ fontSize:'.78rem', fontWeight:600, color }}>{pct.toFixed(0)}%</span>
                </div>
                <div style={{ height:6, borderRadius:99, background:'rgba(255,255,255,.06)', overflow:'hidden', marginBottom:6 }}>
                  <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, background:color, transition:'width .6s' }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.72rem', color:'rgba(148,163,184,.4)' }}>
                  <span>{unit}{ach.toLocaleString()} achieved</span>
                  <span>Target: {unit}{tgt.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.badges?.length > 0 && (
        <div className="wm-card wm-fade-up-2" style={{ padding:'22px 24px', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <Award size={15} style={{ color:'#fbbf24' }} />
            <p style={{ fontSize:'.95rem', fontWeight:600, color:'#f1f5f9' }}>My Badges — {MONTHS[month-1]}</p>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {stats.badges.map((b: any) => {
              const bs = BADGE_STYLE[b.badge_type] ?? BADGE_STYLE.gold;
              return (
                <div key={b.id} style={{ padding:'8px 14px', borderRadius:12, background:bs.bg, border:`0.5px solid ${bs.color}33`, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:'1.1rem' }}>{bs.icon}</span>
                  <div>
                    <p style={{ fontSize:'.78rem', fontWeight:600, color:bs.color, textTransform:'capitalize' }}>{b.badge_type.replace(/_/g,' ')}</p>
                    {b.note && <p style={{ fontSize:'.7rem', color:'rgba(148,163,184,.5)' }}>{b.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stats?.performance_notes?.length > 0 && (
        <div className="wm-card wm-fade-up-3" style={{ padding:'22px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <Award size={15} style={{ color:'#60a5fa' }} />
            <p style={{ fontSize:'.95rem', fontWeight:600, color:'#f1f5f9' }}>Manager Notes</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {stats.performance_notes.map((n: any) => (
              <div key={n.id} style={{ padding:'14px 16px', borderRadius:12, background:'rgba(255,255,255,.03)', border:'0.5px solid rgba(255,255,255,.06)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:'.78rem', color:'rgba(148,163,184,.55)' }}>From {n.author?.full_name}</span>
                  {n.bonus_amount && <span style={{ fontSize:'.78rem', fontWeight:600, color:'#34d399' }}>Bonus: {n.currency} {parseFloat(n.bonus_amount).toLocaleString()}</span>}
                </div>
                <p style={{ fontSize:'.85rem', color:'#f1f5f9' }}>{n.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}