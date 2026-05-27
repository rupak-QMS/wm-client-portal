'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Target, ChevronLeft, ChevronRight, TrendingUp, Users, CheckCircle } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const NOW    = new Date();

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
  const achieved   = stats?.approved_leads ?? 0;
  const revenue    = stats?.revenue ?? 0;
  const tClients   = myTarget?.target_clients ?? 0;
  const tRevenue   = parseFloat(myTarget?.target_revenue ?? 0);
  const tDeals     = myTarget?.target_deals ?? 0;
  const pctClients = tClients > 0 ? Math.min((achieved / tClients) * 100, 100) : 0;
  const pctRevenue = tRevenue > 0 ? Math.min((revenue  / tRevenue) * 100, 100) : 0;
  const pctDeals   = tDeals   > 0 ? Math.min((achieved / tDeals  ) * 100, 100) : 0;

  const metrics = [
    { label:'Clients Target',  icon:Users,       achieved, target:tClients, pct:pctClients, unit:'',  color:'#a78bfa', suffix:' clients' },
    { label:'Revenue Target',  icon:TrendingUp,  achieved:revenue, target:tRevenue, pct:pctRevenue, unit:'$', color:'#34d399', suffix:'' },
    { label:'Deals Target',    icon:CheckCircle, achieved, target:tDeals,   pct:pctDeals,   unit:'',  color:'#60a5fa', suffix:' deals'   },
  ];

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Target size={15} style={{ color:'#a78bfa' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Goals</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>My Targets</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Your monthly sales targets set by the manager</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:10, padding:'6px 4px' }}>
          <button onClick={prevMonth} style={{ width:28, height:28, borderRadius:7, border:'none', background:'none', cursor:'pointer', color:'rgba(148,163,184,.6)', display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronLeft size={15}/></button>
          <span style={{ fontSize:'.88rem', fontWeight:600, color:'#f1f5f9', minWidth:120, textAlign:'center' }}>{MONTHS[month-1]} {year}</span>
          <button onClick={nextMonth} style={{ width:28, height:28, borderRadius:7, border:'none', background:'none', cursor:'pointer', color:'rgba(148,163,184,.6)', display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronRight size={15}/></button>
        </div>
      </div>

      {!myTarget ? (
        <div className="wm-card" style={{ padding:'60px 24px', textAlign:'center' }}>
          <Target size={36} style={{ color:'rgba(148,163,184,.15)', margin:'0 auto 12px', display:'block' }} />
          <p style={{ color:'rgba(148,163,184,.4)', fontSize:'.9rem', marginBottom:4 }}>No target set for {MONTHS[month-1]} {year}</p>
          <p style={{ color:'rgba(148,163,184,.25)', fontSize:'.8rem' }}>Your manager will set your monthly targets</p>
        </div>
      ) : (
        <>
          {/* Progress cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginBottom:24 }} className="wm-fade-up">
            {metrics.map(({ label, icon:Icon, achieved:ach, target:tgt, pct, unit, color, suffix }) => (
              <div key={label} className="wm-card" style={{ padding:'22px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', color }}>
                    <Icon size={17}/>
                  </div>
                  <span style={{ fontSize:'.85rem', fontWeight:700, color: pct >= 100 ? '#34d399' : color }}>{pct.toFixed(0)}%</span>
                </div>
                <p style={{ fontSize:'.8rem', color:'rgba(148,163,184,.5)', marginBottom:8 }}>{label}</p>
                <div style={{ height:6, borderRadius:99, background:'rgba(255,255,255,.06)', overflow:'hidden', marginBottom:8 }}>
                  <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, background:color, transition:'width .6s' }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.72rem', color:'rgba(148,163,184,.4)' }}>
                  <span>{unit}{ach.toLocaleString()}{suffix} achieved</span>
                  <span>Target: {unit}{tgt.toLocaleString()}{suffix}</span>
                </div>
                {pct >= 100 && (
                  <div style={{ marginTop:8, padding:'4px 10px', borderRadius:99, background:'rgba(52,211,153,.1)', border:'0.5px solid rgba(52,211,153,.25)', fontSize:'.72rem', color:'#34d399', textAlign:'center', fontWeight:600 }}>
                    🎉 Target Achieved!
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Target details */}
          <div className="wm-card wm-fade-up-2" style={{ padding:'22px 24px' }}>
            <p style={{ fontSize:'.95rem', fontWeight:600, color:'#f1f5f9', marginBottom:16 }}>Target Details — {MONTHS[month-1]} {year}</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14 }}>
              {[
                { label:'Clients to Add',    value:`${myTarget.target_clients} clients`,                              color:'#a78bfa' },
                { label:'Revenue Goal',      value:`${myTarget.currency} ${parseFloat(myTarget.target_revenue).toLocaleString()}`, color:'#34d399' },
                { label:'Deals to Close',    value:`${myTarget.target_deals} deals`,                                  color:'#60a5fa' },
                { label:'Conversion Rate',   value:`${stats?.conversion_rate ?? 0}%`,                                 color:'#f472b6' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding:'14px 16px', borderRadius:11, background:'rgba(255,255,255,.03)', border:'0.5px solid rgba(255,255,255,.06)' }}>
                  <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.45)', marginBottom:6 }}>{label}</p>
                  <p style={{ fontSize:'1.1rem', fontWeight:700, color }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}