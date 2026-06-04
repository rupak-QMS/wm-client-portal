'use client';
import { useState }        from 'react';
import { useQuery }        from '@tanstack/react-query';
import { useAuthStore }    from '@/store/authStore';
import { Trophy, Target, TrendingUp, ChevronLeft, ChevronRight, Users, Flame, Medal } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const NOW    = new Date();

const TEAM_LABEL: Record<string, string> = {
  aus_nz:    'Aus/NZ Sales Team',
  uk:        'UK Sales Team',
  us_canada: 'US/Canada Sales Team',
};

const RANK_STYLE = [
  { bg: 'linear-gradient(135deg,rgba(251,191,36,.2),rgba(251,191,36,.05))', border: 'rgba(251,191,36,.4)', color: '#fbbf24', icon: '🥇', label: '1st Place' },
  { bg: 'linear-gradient(135deg,rgba(148,163,184,.15),rgba(148,163,184,.03))', border: 'rgba(148,163,184,.3)', color: '#94a3b8', icon: '🥈', label: '2nd Place' },
  { bg: 'linear-gradient(135deg,rgba(180,120,60,.15),rgba(180,120,60,.03))', border: 'rgba(180,120,60,.3)', color: '#b47c3c', icon: '🥉', label: '3rd Place' },
];

export default function SalesTeamPage() {
  const user   = useAuthStore(s => s.user);
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year,  setYear]  = useState(NOW.getFullYear());

  const prevMonth = () => { if (month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); };

  // Fetch team members with their achieved amounts
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['sales-members-team', month, year],
    queryFn:  async () => (await (await fetch('/api/sales-members')).json()).data ?? [],
  });

  // Fetch targets for this month
  const { data: targets = [] } = useQuery({
    queryKey: ['sales-targets', month, year],
    queryFn:  async () => (await (await fetch(`/api/sales-targets?month=${month}&year=${year}`)).json()).data ?? [],
  });

  // Sort by achieved descending
  const ranked = [...members].sort((a: any, b: any) => (b.achieved ?? 0) - (a.achieved ?? 0));
  const topAchiever = ranked[0];
  const myRank      = ranked.findIndex((m: any) => m.id === (user as any)?.id) + 1;
  const myData      = ranked.find((m: any) => m.id === (user as any)?.id);
  const teamTotal   = ranked.reduce((s: number, m: any) => s + (m.achieved ?? 0), 0);
  const teamLabel   = TEAM_LABEL[(user as any)?.sales_team_group] ?? 'Your Team';

  const getTarget = (memberId: string) =>
    parseFloat(targets.find((t: any) => t.sales_member_id === memberId)?.target_revenue ?? 0);

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Users size={15} style={{ color:'#f472b6' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>{teamLabel}</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Team Leaderboard</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>See how your team is performing this month</p>
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

      {isLoading ? (
        <div style={{ textAlign:'center', padding:40, color:'rgba(148,163,184,.3)' }}>Loading...</div>
      ) : members.length === 0 ? (
        <div className="wm-card" style={{ padding:'60px 24px', textAlign:'center' }}>
          <Users size={36} style={{ color:'rgba(148,163,184,.15)', margin:'0 auto 12px', display:'block' }} />
          <p style={{ color:'rgba(148,163,184,.4)' }}>No team members found</p>
        </div>
      ) : (<>

        {/* My position banner */}
        {myData && (
          <div style={{ marginBottom:20, padding:'16px 20px', borderRadius:14, background:'linear-gradient(135deg,rgba(124,58,237,.12),rgba(59,130,246,.08))', border:'1px solid rgba(124,58,237,.3)', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }} className="wm-fade-up">
            <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#7c3aed,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#fff', flexShrink:0 }}>
              {(user as any)?.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:'.82rem', fontWeight:600, color:'#a78bfa', marginBottom:2 }}>Your Position</p>
              <p style={{ fontSize:'.78rem', color:'rgba(148,163,184,.6)' }}>
                You are <strong style={{ color:'#f1f5f9' }}>#{myRank}</strong> on the leaderboard with{' '}
                <strong style={{ color:'#34d399' }}>${(myData.achieved ?? 0).toLocaleString()}</strong> collected
                {myRank === 1 && <span style={{ color:'#fbbf24' }}> 🔥 You're leading!</span>}
                {myRank === 2 && <span style={{ color:'#94a3b8' }}> — Keep pushing to reach #1!</span>}
                {myRank > 2 && <span style={{ color:'rgba(148,163,184,.5)' }}> — {myRank - 1} ahead of you</span>}
              </p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:'1.4rem', fontWeight:800, color: myRank === 1 ? '#fbbf24' : myRank === 2 ? '#94a3b8' : myRank === 3 ? '#b47c3c' : '#a78bfa' }}>
                {myRank === 1 ? '🏆' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : `#${myRank}`}
              </p>
            </div>
          </div>
        )}

        {/* Top 3 podium */}
        {ranked.length >= 2 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:20 }} className="wm-fade-up">
            {ranked.slice(0, Math.min(3, ranked.length)).map((m: any, i: number) => {
              const rs      = RANK_STYLE[i];
              const tgt     = getTarget(m.id);
              const pct     = tgt > 0 ? Math.min((m.achieved / tgt) * 100, 100) : 0;
              const isMe    = m.id === (user as any)?.id;
              return (
                <div key={m.id} style={{ padding:'20px', borderRadius:16, background:rs.bg, border:`1px solid ${rs.border}`, position:'relative', overflow:'hidden' }}>
                  {isMe && (
                    <div style={{ position:'absolute', top:10, right:10, padding:'2px 8px', borderRadius:99, background:'rgba(124,58,237,.3)', fontSize:'.65rem', color:'#a78bfa', fontWeight:600 }}>YOU</div>
                  )}
                  <div style={{ fontSize:'1.8rem', marginBottom:8 }}>{rs.icon}</div>
                  <p style={{ fontSize:'.68rem', color:rs.color, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>{rs.label}</p>
                  <p style={{ fontSize:'.95rem', fontWeight:700, color:'#f1f5f9', marginBottom:2 }}>{m.full_name}</p>
                  <p style={{ fontSize:'1.3rem', fontWeight:800, color:rs.color, marginBottom:8 }}>
                    ${(m.achieved ?? 0).toLocaleString()}
                  </p>
                  {tgt > 0 && (
                    <>
                      <div style={{ height:4, borderRadius:99, background:'rgba(255,255,255,.08)', overflow:'hidden', marginBottom:4 }}>
                        <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, background:rs.color, transition:'width .6s' }} />
                      </div>
                      <p style={{ fontSize:'.68rem', color:'rgba(148,163,184,.4)' }}>{pct.toFixed(0)}% of ${tgt.toLocaleString()} target</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Full leaderboard table */}
        <div className="wm-card wm-fade-up-2" style={{ overflow:'hidden', marginBottom:16 }}>
          <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(124,58,237,.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Flame size={15} style={{ color:'#f472b6' }} />
              <p style={{ fontSize:'.95rem', fontWeight:600, color:'#f1f5f9' }}>Full Rankings — {MONTHS[month-1]} {year}</p>
            </div>
            <p style={{ fontSize:'.75rem', color:'rgba(148,163,184,.4)' }}>
              Team total: <strong style={{ color:'#34d399' }}>${teamTotal.toLocaleString()}</strong>
            </p>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table className="wm-table">
              <thead>
                <tr>
                  <th style={{ width:50 }}>Rank</th>
                  <th>Member</th>
                  <th style={{ textAlign:'right' }}>Collected</th>
                  <th style={{ textAlign:'right' }}>Target</th>
                  <th style={{ minWidth:140 }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((m: any, i: number) => {
                  const isMe  = m.id === (user as any)?.id;
                  const tgt   = getTarget(m.id);
                  const pct   = tgt > 0 ? Math.min((m.achieved / tgt) * 100, 100) : 0;
                  const pctColor = pct >= 100 ? '#34d399' : pct >= 60 ? '#60a5fa' : pct >= 30 ? '#fbbf24' : '#f87171';
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                  return (
                    <tr key={m.id} style={{ background: isMe ? 'rgba(124,58,237,.06)' : 'transparent', borderLeft: isMe ? '3px solid rgba(124,58,237,.4)' : '3px solid transparent' }}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:8,
                          background: i === 0 ? 'rgba(251,191,36,.12)' : i === 1 ? 'rgba(148,163,184,.1)' : i === 2 ? 'rgba(180,120,60,.1)' : 'rgba(255,255,255,.04)',
                          fontSize: medal ? '1rem' : '.82rem', fontWeight:700,
                          color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#b47c3c' : 'rgba(148,163,184,.4)',
                        }}>
                          {medal ?? `#${i+1}`}
                        </div>
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:9, flexShrink:0,
                            background: isMe ? 'linear-gradient(135deg,rgba(124,58,237,.5),rgba(59,130,246,.5))' : 'linear-gradient(135deg,rgba(244,114,182,.3),rgba(167,139,250,.3))',
                            display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#f1f5f9' }}>
                            {m.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <p style={{ fontSize:'.87rem', fontWeight: isMe ? 700 : 500, color: isMe ? '#a78bfa' : '#f1f5f9' }}>{m.full_name}</p>
                              {isMe && <span style={{ fontSize:'.65rem', padding:'1px 7px', borderRadius:99, background:'rgba(124,58,237,.2)', color:'#a78bfa', border:'0.5px solid rgba(124,58,237,.4)' }}>You</span>}
                              {i === 0 && <span style={{ fontSize:'.65rem', padding:'1px 7px', borderRadius:99, background:'rgba(251,191,36,.15)', color:'#fbbf24', border:'0.5px solid rgba(251,191,36,.3)' }}>🔥 Leader</span>}
                            </div>
                            <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.4)' }}>{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign:'right', fontWeight:700, color:'#34d399', fontSize:'.9rem' }}>
                        ${(m.achieved ?? 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign:'right', color:'rgba(148,163,184,.5)', fontSize:'.82rem' }}>
                        {tgt > 0 ? `$${tgt.toLocaleString()}` : <span style={{ color:'rgba(148,163,184,.25)' }}>—</span>}
                      </td>
                      <td>
                        {tgt > 0 ? (
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ flex:1, height:6, borderRadius:99, background:'rgba(255,255,255,.06)', overflow:'hidden', minWidth:60 }}>
                              <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, background:`linear-gradient(90deg,${pctColor}88,${pctColor})`, transition:'width .6s' }} />
                            </div>
                            <span style={{ fontSize:'.75rem', fontWeight:600, color:pctColor, minWidth:36, textAlign:'right' }}>{pct.toFixed(0)}%</span>
                          </div>
                        ) : (
                          <span style={{ fontSize:'.75rem', color:'rgba(148,163,184,.25)' }}>No target set</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Motivation note */}
        <div style={{ padding:'14px 18px', borderRadius:12, background:'rgba(244,114,182,.06)', border:'0.5px solid rgba(244,114,182,.2)', display:'flex', alignItems:'center', gap:12 }} className="wm-fade-up-3">
          <Medal size={18} style={{ color:'#f472b6', flexShrink:0 }} />
          <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.6)', lineHeight:1.5 }}>
            <strong style={{ color:'#f472b6' }}>Top performer</strong> of the month gets recognised by the manager with a badge and bonus. Keep pushing — only collected amounts on <strong style={{ color:'rgba(148,163,184,.8)' }}>approved sales</strong> count toward your score.
          </p>
        </div>

      </>)}
    </div>
  );
}