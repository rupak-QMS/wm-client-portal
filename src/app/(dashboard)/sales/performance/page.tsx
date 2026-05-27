'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Award, TrendingUp, Users, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const NOW    = new Date();

const BADGE_STYLE: Record<string,{bg:string;color:string;icon:string;label:string}> = {
  gold:             { bg:'rgba(251,191,36,.12)',  color:'#fbbf24', icon:'🥇', label:'Gold'             },
  silver:           { bg:'rgba(148,163,184,.12)', color:'#94a3b8', icon:'🥈', label:'Silver'           },
  bronze:           { bg:'rgba(180,120,60,.12)',  color:'#b47c3c', icon:'🥉', label:'Bronze'           },
  top_closer:       { bg:'rgba(52,211,153,.12)',  color:'#34d399', icon:'🏆', label:'Top Closer'       },
  highest_revenue:  { bg:'rgba(96,165,250,.12)',  color:'#60a5fa', icon:'💰', label:'Highest Revenue'  },
  most_clients:     { bg:'rgba(167,139,250,.12)', color:'#a78bfa', icon:'👥', label:'Most Clients'     },
  best_conversion:  { bg:'rgba(244,114,182,.12)', color:'#f472b6', icon:'🎯', label:'Best Conversion'  },
};

export default function SalesPerformancePage() {
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year,  setYear]  = useState(NOW.getFullYear());

  const prevMonth = () => { if (month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); };

  const { data: stats } = useQuery({
    queryKey: ['sales-stats', month, year],
    queryFn:  async () => (await (await fetch(`/api/sales-stats?month=${month}&year=${year}`)).json()).data,
  });

  const badges = stats?.badges ?? [];
  const notes  = stats?.performance_notes ?? [];

  return (
    <div className="wm-page-inner">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Trophy size={15} style={{ color:'#fbbf24' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Recognition</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>My Performance</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Badges, notes and monthly stats</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:10, padding:'6px 4px' }}>
          <button onClick={prevMonth} style={{ width:28, height:28, borderRadius:7, border:'none', background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.6)' }}><ChevronLeft size={15}/></button>
          <span style={{ fontSize:'.88rem', fontWeight:600, color:'#f1f5f9', minWidth:120, textAlign:'center' }}>{MONTHS[month-1]} {year}</span>
          <button onClick={nextMonth} style={{ width:28, height:28, borderRadius:7, border:'none', background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.6)' }}><ChevronRight size={15}/></button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:24 }} className="wm-fade-up">
        {[
          { label:'Leads Added',     value:stats?.total_leads    ?? '—', color:'#60a5fa', icon:Users       },
          { label:'Approved',        value:stats?.approved_leads ?? '—', color:'#34d399', icon:TrendingUp  },
          { label:'Conversion Rate', value:`${stats?.conversion_rate ?? 0}%`, color:'#a78bfa', icon:BarChart2 },
          { label:'Est. Revenue',    value:`$${(stats?.revenue ?? 0).toLocaleString()}`, color:'#fbbf24', icon:TrendingUp },
        ].map(({ label, value, color, icon:Icon }) => (
          <div key={label} className="wm-stat">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</p>
              <div style={{ width:30, height:30, borderRadius:8, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', color }}>
                <Icon size={14}/>
              </div>
            </div>
            <p style={{ fontSize:'1.5rem', fontWeight:700, color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="wm-card wm-fade-up-2" style={{ padding:'22px 24px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <Award size={15} style={{ color:'#fbbf24' }} />
          <p style={{ fontSize:'.95rem', fontWeight:600, color:'#f1f5f9' }}>Badges Earned</p>
        </div>
        {badges.length === 0 ? (
          <div style={{ textAlign:'center', padding:'30px 0', color:'rgba(148,163,184,.3)', fontSize:'.85rem' }}>No badges yet this month — keep going! 💪</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
            {badges.map((b: any) => {
              const bs = BADGE_STYLE[b.badge_type] ?? BADGE_STYLE.gold;
              return (
                <div key={b.id} style={{ padding:'14px 16px', borderRadius:12, background:bs.bg, border:`0.5px solid ${bs.color}44` }}>
                  <div style={{ fontSize:'1.8rem', marginBottom:6 }}>{bs.icon}</div>
                  <p style={{ fontSize:'.85rem', fontWeight:600, color:bs.color }}>{bs.label}</p>
                  {b.note && <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', marginTop:4 }}>{b.note}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="wm-card wm-fade-up-3" style={{ padding:'22px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <Award size={15} style={{ color:'#60a5fa' }} />
          <p style={{ fontSize:'.95rem', fontWeight:600, color:'#f1f5f9' }}>Manager Feedback</p>
        </div>
        {notes.length === 0 ? (
          <div style={{ textAlign:'center', padding:'30px 0', color:'rgba(148,163,184,.3)', fontSize:'.85rem' }}>No feedback yet this month</div>
        ) : notes.map((n: any) => (
          <div key={n.id} style={{ padding:'14px 16px', borderRadius:12, background:'rgba(255,255,255,.03)', border:'0.5px solid rgba(255,255,255,.06)', marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:'.75rem', color:'rgba(148,163,184,.45)' }}>From {n.author?.full_name}</span>
              {n.bonus_amount && <span style={{ fontSize:'.78rem', fontWeight:600, color:'#34d399' }}>🎁 Bonus: {n.currency} {parseFloat(n.bonus_amount).toLocaleString()}</span>}
            </div>
            <p style={{ fontSize:'.87rem', color:'#f1f5f9', lineHeight:1.6 }}>{n.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}