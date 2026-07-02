'use client';
import { useState }  from 'react';
import { useQuery }  from '@tanstack/react-query';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Users, TrendingUp, Target, CheckCircle, Clock, XCircle, BarChart2, Award, LayoutDashboard, PieChart } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const NOW = new Date();

const BADGE_STYLE: Record<string, { bg:string; color:string; icon:string }> = {
  gold:            { bg:'rgba(251,191,36,.12)',  color:'#fbbf24', icon:'🥇' },
  silver:          { bg:'rgba(148,163,184,.12)', color:'#94a3b8', icon:'🥈' },
  bronze:          { bg:'rgba(180,120,60,.12)',  color:'#b47c3c', icon:'🥉' },
  top_closer:      { bg:'rgba(52,211,153,.12)',  color:'#34d399', icon:'🏆' },
  highest_revenue: { bg:'rgba(96,165,250,.12)',  color:'#60a5fa', icon:'💰' },
  most_clients:    { bg:'rgba(167,139,250,.12)', color:'#a78bfa', icon:'👥' },
  best_conversion: { bg:'rgba(244,114,182,.12)', color:'#f472b6', icon:'🎯' },
};

function daysInMonth(month: number, year: number) { return new Date(year, month, 0).getDate(); }

/** Small hand-rolled SVG donut — same one used on the AM/TL target pages. */
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

export default function SalesDashboard() {
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year,  setYear]  = useState(NOW.getFullYear());

  const { data: stats } = useQuery({
    queryKey: ['sales-stats', month, year],
    queryFn:  async () => (await (await fetch(`/api/sales-stats?month=${month}&year=${year}`)).json()).data,
  });

  const { data: targetData } = useQuery({
    queryKey: ['sales-targets', month, year],
    queryFn:  async () => (await (await fetch(`/api/sales-targets?month=${month}&year=${year}`)).json()).data ?? [],
  });

  const myTarget   = targetData?.[0];
  const tRevenue   = parseFloat(myTarget?.target_revenue ?? 0);
  const revenue    = stats?.revenue ?? 0;
  const pctRevenue = tRevenue > 0 ? Math.min((revenue / tRevenue) * 100, 100) : 0;
  const pctColor   = pctRevenue >= 100 ? '#34d399' : pctRevenue >= 60 ? '#60a5fa' : pctRevenue >= 30 ? '#fbbf24' : '#f87171';
  const remaining  = Math.max(tRevenue - revenue, 0);

  const totalDays = daysInMonth(month, year);
  const daysPassed = (year === NOW.getFullYear() && month === NOW.getMonth() + 1)
    ? Math.min(NOW.getDate(), totalDays)
    : (year < NOW.getFullYear() || (year === NOW.getFullYear() && month < NOW.getMonth() + 1)) ? totalDays : 0;
  const daysRemaining = Math.max(totalDays - daysPassed, 0);

  return (
    <div className="wm-page-inner">

      {/* Header */}
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

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:20 }} className="wm-fade-up">
        <StatsCard title="Leads Added"     value={stats?.total_leads    ?? '—'} icon={Users}       color="blue"   />
        <StatsCard title="Approved"        value={stats?.approved_leads ?? '—'} icon={CheckCircle} color="green"  />
        <StatsCard title="Pending"         value={stats?.pending_leads  ?? '—'} icon={Clock}       color="amber"  />
        <StatsCard title="Rejected"        value={stats?.rejected_leads ?? '—'} icon={XCircle}     color="red"    />
        <StatsCard title="Revenue (Est.)"  value={`$${(stats?.revenue ?? 0).toLocaleString()}`} icon={TrendingUp} color="purple" />
        <StatsCard title="Conversion Rate" value={`${stats?.conversion_rate ?? 0}%`}            icon={BarChart2}  color="pink"   />
      </div>

      {/* NEW: Revenue breakdown donut + About This Period */}
      {myTarget && (
        <div style={{ display:'grid', gridTemplateColumns:'minmax(280px,1fr) minmax(240px,1fr)', gap:16, marginBottom:20 }} className="wm-fade-up-2">
          <div className="wm-card" style={{ padding:'20px 22px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <PieChart size={15} style={{ color:'#a78bfa' }} />
              <p style={{ fontSize:'.95rem', fontWeight:600, color:'#f1f5f9' }}>Revenue Breakdown</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:22, flexWrap:'wrap' }}>
              <DonutChart
                centerLabel="Target"
                centerValue={`${myTarget.currency} ${tRevenue.toLocaleString()}`}
                segments={[
                  { value: revenue, color: pctColor },
                  { value: remaining, color: 'rgba(148,163,184,.18)' },
                ]}
              />
              <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1, minWidth:140 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', background:pctColor, marginTop:4, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:'.82rem', color:'#f1f5f9', fontWeight:600 }}>Collected</div>
                    <div style={{ fontSize:'.78rem', color:'rgba(148,163,184,.5)' }}>{myTarget.currency} {revenue.toLocaleString()} ({pctRevenue.toFixed(0)}%)</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', background:'rgba(148,163,184,.4)', marginTop:4, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:'.82rem', color:'#f1f5f9', fontWeight:600 }}>Remaining</div>
                    <div style={{ fontSize:'.78rem', color:'rgba(148,163,184,.5)' }}>{myTarget.currency} {remaining.toLocaleString()} ({(100-pctRevenue).toFixed(0)}%)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="wm-card" style={{ padding:'20px 22px' }}>
            <div style={{ fontWeight:700, color:'#f1f5f9', marginBottom:16, fontSize:'.95rem' }}>About This Period</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                ['Period', `1 ${MONTHS[month-1]} ${year} – ${totalDays} ${MONTHS[month-1]} ${year}`],
                ['Your Role', 'Sales Agent'],
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
        </div>
      )}

      {/* Revenue target progress */}
      {myTarget && (
        <div className="wm-card wm-fade-up-2" style={{ padding:'22px 24px', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <Target size={15} style={{ color:'#a78bfa' }} />
            <p style={{ fontSize:'.95rem', fontWeight:600, color:'#f1f5f9' }}>Monthly Revenue Target</p>
            <span style={{ marginLeft:'auto', fontSize:'.82rem', fontWeight:700, color:pctColor }}>{pctRevenue.toFixed(1)}%</span>
          </div>

          {/* Progress bar */}
          <div style={{ height:8, borderRadius:99, background:'rgba(255,255,255,.06)', overflow:'hidden', marginBottom:12 }}>
            <div style={{ height:'100%', width:`${pctRevenue}%`, borderRadius:99, background:`linear-gradient(90deg,${pctColor}88,${pctColor})`, transition:'width .8s ease' }} />
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.78rem' }}>
            <span style={{ color:'rgba(148,163,184,.55)' }}>
              Collected: <strong style={{ color:'#34d399' }}>{myTarget.currency} {revenue.toLocaleString()}</strong>
            </span>
            <span style={{ color:'rgba(148,163,184,.55)' }}>
              Target: <strong style={{ color:'#f1f5f9' }}>{myTarget.currency} {tRevenue.toLocaleString()}</strong>
            </span>
            <span style={{ color:'rgba(148,163,184,.55)' }}>
              Remaining: <strong style={{ color:'#fbbf24' }}>{myTarget.currency} {remaining.toLocaleString()}</strong>
            </span>
          </div>

          {pctRevenue >= 100 && (
            <div style={{ marginTop:14, padding:'10px', borderRadius:10, background:'rgba(52,211,153,.08)', border:'0.5px solid rgba(52,211,153,.25)', textAlign:'center', fontSize:'.85rem', color:'#34d399', fontWeight:600 }}>
              🎉 Target Achieved! Great work this month!
            </div>
          )}
        </div>
      )}

      {/* Badges */}
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

      {/* Manager notes */}
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
