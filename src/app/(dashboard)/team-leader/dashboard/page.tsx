'use client';
import { useQuery }                                    from '@tanstack/react-query';
import { Users, TrendingUp, Clock, CheckCircle }      from 'lucide-react';

const TEAM_LABELS: Record<string, string> = {
  aus_nz:    'Aus/NZ Sales Team',
  uk:        'UK Sales Team',
  us_canada: 'US/Canada Sales Team',
};
const TEAM_COLORS: Record<string, string> = {
  aus_nz: '#34d399', uk: '#60a5fa', us_canada: '#f472b6',
};

export default function TeamLeaderDashboard() {
  const { data: agents = [], isLoading } = useQuery<any[]>({
    queryKey: ['tl-agents'],
    queryFn:  async () => (await (await fetch('/api/team-leader/agents')).json()).data ?? [],
  });

  const active  = agents.filter(a => a.status === 'active');
  const pending = agents.filter(a => a.status === 'pending');
  const total   = active.reduce((s: number, a: any) => s + (a.achieved ?? 0), 0);
  const team = agents[0]?.team?.name ?? "";
  const color   = TEAM_COLORS[team] ?? '#7c3aed';

  const card = (icon: React.ReactNode, label: string, value: string | number) => (
    <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(124,58,237,.15)', borderRadius:14, padding:'20px 24px', display:'flex', alignItems:'center', gap:16 }}>
      <div style={{ width:44, height:44, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', color }}>{icon}</div>
      <div>
        <div style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</div>
        <div style={{ fontSize:'1.45rem', fontWeight:700, color:'#f1f5f9', marginTop:2 }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding:'32px 28px', maxWidth:960, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:'.72rem', color, textTransform:'uppercase', letterSpacing:'.1em', fontWeight:600, marginBottom:6 }}>
          Team Leader Portal
        </div>
        <h1 style={{ fontSize:'1.6rem', fontWeight:700, color:'#f1f5f9', margin:0 }}>
          {TEAM_LABELS[team] ?? 'My Team'}
        </h1>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:32 }}>
        {card(<Users size={20}/>,       'Active Agents',   active.length)}
        {card(<Clock size={20}/>,       'Pending Approval', pending.length)}
        {card(<TrendingUp size={20}/>,  'Team Achieved',   `$${total.toLocaleString()}`)}
        {card(<CheckCircle size={20}/>, 'Total Agents',    agents.length)}
      </div>

      {/* Agent leaderboard */}
      <div style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(124,58,237,.12)', borderRadius:16, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(124,58,237,.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:600, color:'#f1f5f9' }}>Team Performance</span>
          <span style={{ fontSize:'.75rem', color:'rgba(148,163,184,.4)' }}>{active.length} active agents</span>
        </div>

        {isLoading ? (
          <div style={{ padding:40, textAlign:'center', color:'rgba(148,163,184,.4)' }}>Loading…</div>
        ) : active.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'rgba(148,163,184,.3)', fontSize:'.85rem' }}>
            No active agents yet. Add agents from the Agents page.
          </div>
        ) : (
          <div>
            {[...active].sort((a, b) => b.achieved - a.achieved).map((a: any, i: number) => {
              const pct = total > 0 ? (a.achieved / total) * 100 : 0;
              return (
                <div key={a.id} style={{ padding:'14px 20px', borderBottom:'1px solid rgba(124,58,237,.07)', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:`${color}18`, color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.75rem', fontWeight:700, flexShrink:0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'.875rem', fontWeight:600, color:'#f1f5f9', marginBottom:5 }}>{a.full_name}</div>
                    <div style={{ height:5, background:'rgba(255,255,255,.06)', borderRadius:9 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}99)`, borderRadius:9, transition:'width .4s' }}/>
                    </div>
                  </div>
                  <div style={{ fontSize:'.95rem', fontWeight:700, color, flexShrink:0 }}>
                    ${a.achieved.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pending.length > 0 && (
          <div style={{ padding:'12px 20px', background:'rgba(251,191,36,.04)', borderTop:'1px solid rgba(251,191,36,.1)' }}>
            <span style={{ fontSize:'.78rem', color:'#fbbf24' }}>
              ⏳ {pending.length} agent{pending.length > 1 ? 's' : ''} awaiting manager approval
            </span>
          </div>
        )}
      </div>
    </div>
  );
}