'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Target, ChevronLeft, ChevronRight, TrendingUp, ShoppingBag, PieChart } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const NOW    = new Date();

function daysInMonth(month: number, year: number) { return new Date(year, month, 0).getDate(); }

/** Same hand-rolled SVG donut used on the Dashboard/TL/AM pages. */
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

export default function SalesTargetsPage() {
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year,  setYear]  = useState(NOW.getFullYear());

  const prevMonth = () => { if (month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); };

  const { data: targets = [] } = useQuery({
    queryKey: ['sales-targets', month, year],
    queryFn:  async () => (await (await fetch(`/api/sales-targets?month=${month}&year=${year}`)).json()).data ?? [],
  });

  const { data: stats } = useQuery({
    queryKey: ['sales-stats', month, year],
    queryFn:  async () => (await (await fetch(`/api/sales-stats?month=${month}&year=${year}`)).json()).data,
  });

  const myTarget   = targets[0];
  const revenue    = stats?.revenue ?? 0;
  const totalSales = stats?.approved_leads ?? 0;
  const tRevenue   = parseFloat(myTarget?.target_revenue ?? 0);
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
            <Target size={15} style={{ color:'#f472b6' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Goals</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>My Targets</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Your monthly revenue target set by the manager</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:10, padding:'6px 4px' }}>
          <button onClick={prevMonth} style={{ width:28, height:28, borderRadius:7, border:'none', background:'none', cursor:'pointer', color:'rgba(148,163,184,.6)', display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseEnter={e=>(e.currentTarget.style.background='rgba(124,58,237,.12)')} onMouseLeave={e=>(e.currentTarget.style.background='none')}>
            <ChevronLeft size={15}/>
          </button>
          <span style={{ fontSize:'.88rem', fontWeight:600, color:'#f1f5f9', minWidth:120, textAlign:'center' }}>{MONTHS[month-1]} {year}</span>
          <button onClick={nextMonth} style={{ width:28, height:28, borderRadius:7, border:'none', background:'none', cursor:'pointer', color:'rgba(148,163,184,.6)', display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseEnter={e=>(e.currentTarget.style.background='rgba(124,58,237,.12)')} onMouseLeave={e=>(e.currentTarget.style.background='none')}>
            <ChevronRight size={15}/>
          </button>
        </div>
      </div>

      {!myTarget ? (
        <div className="wm-card" style={{ padding:'60px 24px', textAlign:'center' }}>
          <Target size={36} style={{ color:'rgba(148,163,184,.15)', margin:'0 auto 12px', display:'block' }} />
          <p style={{ color:'rgba(148,163,184,.4)', fontSize:'.9rem', marginBottom:4 }}>No target set for {MONTHS[month-1]} {year}</p>
          <p style={{ color:'rgba(148,163,184,.25)', fontSize:'.8rem' }}>Your manager will set your monthly target</p>
        </div>
      ) : (<>

        {/* NEW: Donut breakdown + About This Period */}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(280px,1fr) minmax(240px,1fr)', gap:16, marginBottom:16 }} className="wm-fade-up">
          <div className="wm-card" style={{ padding:'20px 22px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <PieChart size={15} style={{ color:'#f472b6' }} />
              <p style={{ fontSize:'.95rem', fontWeight:600, color:'#f1f5f9' }}>Target Breakdown</p>
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

        {/* Main revenue progress card */}
        <div className="wm-card wm-fade-up" style={{ padding:'28px', marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'rgba(244,114,182,.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'#f472b6' }}>
                <TrendingUp size={20}/>
              </div>
              <div>
                <p style={{ fontSize:'.8rem', color:'rgba(148,163,184,.5)', marginBottom:2 }}>Revenue Target</p>
                <p style={{ fontSize:'1.5rem', fontWeight:700, color:'#f1f5f9' }}>
                  {myTarget.currency} {tRevenue.toLocaleString()}
                </p>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:'2rem', fontWeight:800, color:pctColor, lineHeight:1 }}>{pctRevenue.toFixed(1)}%</p>
              <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.4)', marginTop:4 }}>of target</p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height:10, borderRadius:99, background:'rgba(255,255,255,.06)', overflow:'hidden', marginBottom:12 }}>
            <div style={{ height:'100%', width:`${pctRevenue}%`, borderRadius:99, background:`linear-gradient(90deg,${pctColor}88,${pctColor})`, transition:'width .8s ease' }} />
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.78rem' }}>
            <span style={{ color:'rgba(148,163,184,.5)' }}>
              Collected: <strong style={{ color:'#34d399' }}>{myTarget.currency} {revenue.toLocaleString()}</strong>
            </span>
            <span style={{ color:'rgba(148,163,184,.5)' }}>
              Remaining: <strong style={{ color:'#fbbf24' }}>{myTarget.currency} {remaining.toLocaleString()}</strong>
            </span>
          </div>

          {pctRevenue >= 100 && (
            <div style={{ marginTop:16, padding:'10px', borderRadius:10, background:'rgba(52,211,153,.08)', border:'0.5px solid rgba(52,211,153,.25)', textAlign:'center', fontSize:'.85rem', color:'#34d399', fontWeight:600 }}>
              🎉 Target Achieved! Great work this month!
            </div>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }} className="wm-fade-up-2">
          <div className="wm-stat">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.05em' }}>Approved Sales</p>
              <div style={{ width:32, height:32, borderRadius:8, background:'rgba(96,165,250,.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'#60a5fa' }}>
                <ShoppingBag size={14}/>
              </div>
            </div>
            <p style={{ fontSize:'1.6rem', fontWeight:700, color:'#60a5fa', marginBottom:4 }}>{totalSales}</p>
            <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.4)' }}>Sales approved this month</p>
          </div>
          <div className="wm-stat">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.05em' }}>Conversion Rate</p>
              <div style={{ width:32, height:32, borderRadius:8, background:'rgba(244,114,182,.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'#f472b6' }}>
                <Target size={14}/>
              </div>
            </div>
            <p style={{ fontSize:'1.6rem', fontWeight:700, color:'#f472b6', marginBottom:4 }}>{stats?.conversion_rate ?? 0}%</p>
            <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.4)' }}>Leads approved vs submitted</p>
          </div>
        </div>

        {/* Info note */}
        <div style={{ padding:'12px 16px', borderRadius:10, background:'rgba(96,165,250,.06)', border:'0.5px solid rgba(96,165,250,.15)', display:'flex', alignItems:'center', gap:10 }} className="wm-fade-up-3">
          <Target size={14} style={{ color:'#60a5fa', flexShrink:0 }}/>
          <p style={{ fontSize:'.78rem', color:'rgba(148,163,184,.55)' }}>
            Revenue is calculated from the <strong style={{ color:'rgba(148,163,184,.75)' }}>collected upfront amount</strong> on your approved sales. Targets reset on the 1st of every month.
          </p>
        </div>

      </>)}
    </div>
  );
}
