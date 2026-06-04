'use client';
import { useState }                               from 'react';
import { useQuery, useQueryClient }               from '@tanstack/react-query';
import { UserPlus, Clock, CheckCircle, XCircle }  from 'lucide-react';
import { toast }                                  from 'sonner';

const inp: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none' };
const lbl: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  active:  { background:'rgba(52,211,153,.12)',  color:'#34d399', border:'1px solid rgba(52,211,153,.25)',  borderRadius:20, padding:'2px 10px', fontSize:'.7rem', fontWeight:600 },
  pending: { background:'rgba(251,191,36,.12)',  color:'#fbbf24', border:'1px solid rgba(251,191,36,.25)',  borderRadius:20, padding:'2px 10px', fontSize:'.7rem', fontWeight:600 },
};

export default function TeamLeaderAgentsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [form, setForm] = useState({ full_name:'', email:'', password:'' });

  const { data: agents = [], isLoading } = useQuery<any[]>({
    queryKey: ['tl-agents'],
    queryFn:  async () => (await (await fetch('/api/team-leader/agents')).json()).data ?? [],
  });

  const handleAdd = async () => {
    if (!form.full_name || !form.email || !form.password)
      return toast.error('All fields are required');
    setLoading(true);
    const res  = await fetch('/api/team-leader/agents', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { toast.error(json.error); return; }
    toast.success('Agent added — pending manager approval');
    qc.invalidateQueries({ queryKey: ['tl-agents'] });
    setShowModal(false);
    setForm({ full_name:'', email:'', password:'' });
  };

  const active  = agents.filter(a => a.status === 'active');
  const pending = agents.filter(a => a.status === 'pending');

  const AgentRow = ({ a }: { a: any }) => (
    <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(124,58,237,.07)', display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(124,58,237,.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.8rem', fontWeight:700, color:'#a78bfa', flexShrink:0 }}>
        {a.full_name.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'.875rem', fontWeight:600, color:'#f1f5f9' }}>{a.full_name}</div>
        <div style={{ fontSize:'.75rem', color:'rgba(148,163,184,.45)', marginTop:2 }}>{a.email}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {a.status === 'active' && (
          <span style={{ fontSize:'.85rem', fontWeight:700, color:'#34d399' }}>
            ${(a.achieved ?? 0).toLocaleString()}
          </span>
        )}
        <span style={STATUS_STYLE[a.status] ?? STATUS_STYLE.pending}>
          {a.status === 'active' ? <><CheckCircle size={10} style={{marginRight:4,verticalAlign:'middle'}}/>Active</> : <><Clock size={10} style={{marginRight:4,verticalAlign:'middle'}}/>Pending</>}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ padding:'32px 28px', maxWidth:800, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:'.72rem', color:'#a78bfa', textTransform:'uppercase', letterSpacing:'.1em', fontWeight:600, marginBottom:6 }}>Team Leader</div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700, color:'#f1f5f9', margin:0 }}>My Agents</h1>
        </div>
        <button className="wm-btn-primary" onClick={() => setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px' }}>
          <UserPlus size={16}/> Add Agent
        </button>
      </div>

      {/* Active agents */}
      <div style={{ marginBottom:24, background:'rgba(255,255,255,.02)', border:'1px solid rgba(124,58,237,.12)', borderRadius:16, overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(124,58,237,.1)', fontSize:'.8rem', fontWeight:600, color:'rgba(148,163,184,.6)', textTransform:'uppercase', letterSpacing:'.06em' }}>
          Active — {active.length}
        </div>
        {isLoading ? (
          <div style={{ padding:32, textAlign:'center', color:'rgba(148,163,184,.4)' }}>Loading…</div>
        ) : active.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:'rgba(148,163,184,.3)', fontSize:'.85rem' }}>No active agents yet</div>
        ) : active.map((a: any) => <AgentRow key={a.id} a={a}/>)}
      </div>

      {/* Pending agents */}
      {pending.length > 0 && (
        <div style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(251,191,36,.15)', borderRadius:16, overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(251,191,36,.1)', fontSize:'.8rem', fontWeight:600, color:'#fbbf24', textTransform:'uppercase', letterSpacing:'.06em' }}>
            Awaiting Approval — {pending.length}
          </div>
          {pending.map((a: any) => <AgentRow key={a.id} a={a}/>)}
          <div style={{ padding:'10px 20px', fontSize:'.75rem', color:'rgba(251,191,36,.6)' }}>
            These agents cannot log in until the manager approves them.
          </div>
        </div>
      )}

      {/* Add Agent modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20 }}>
          <div style={{ background:'#0f0f1a', border:'1px solid rgba(124,58,237,.25)', borderRadius:18, padding:28, width:'100%', maxWidth:420 }}>
            <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#f1f5f9', margin:'0 0 20px' }}>Add New Agent</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lbl}>Full Name</label>
                <input style={inp} value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} placeholder="Jane Smith"/>
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input style={inp} type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="jane@example.com"/>
              </div>
              <div>
                <label style={lbl}>Temporary Password</label>
                <input style={inp} type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="Min 8 characters"/>
              </div>
              <div style={{ background:'rgba(251,191,36,.07)', border:'1px solid rgba(251,191,36,.15)', borderRadius:9, padding:'10px 14px', fontSize:'.78rem', color:'#fbbf24' }}>
                ⏳ This agent will be <strong>pending</strong> until the manager approves their account.
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="wm-btn-ghost" onClick={() => setShowModal(false)} style={{ flex:1, height:40 }}>Cancel</button>
              <button className="wm-btn-primary" onClick={handleAdd} disabled={loading} style={{ flex:1, height:40 }}>
                {loading ? 'Adding…' : 'Add Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}