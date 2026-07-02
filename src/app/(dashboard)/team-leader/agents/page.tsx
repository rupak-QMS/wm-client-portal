'use client';
import { useState }                               from 'react';
import { useQuery, useQueryClient }               from '@tanstack/react-query';
import { UserPlus, Clock, CheckCircle, Target }   from 'lucide-react';
import { toast }                                  from 'sonner';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const inp: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none', boxSizing:'border-box' };
const sel: React.CSSProperties = { ...inp, cursor:'pointer' };
const lbl: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  active:  { background:'rgba(52,211,153,.12)',  color:'#34d399', border:'1px solid rgba(52,211,153,.25)',  borderRadius:20, padding:'2px 10px', fontSize:'.7rem', fontWeight:600 },
  pending: { background:'rgba(251,191,36,.12)',  color:'#fbbf24', border:'1px solid rgba(251,191,36,.25)',  borderRadius:20, padding:'2px 10px', fontSize:'.7rem', fontWeight:600 },
};

export default function TeamLeaderAgentsPage() {
  const qc  = useQueryClient();
  const now = new Date();
  const [showModal,    setShowModal]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [form,         setForm]         = useState({ full_name:'', email:'', password:'' });
  const [allocModal,   setAllocModal]   = useState<any>(null);
  const [allocForm,    setAllocForm]    = useState({ month: now.getMonth()+1, year: now.getFullYear(), allocated_target:'', currency:'USD' });
  const [allocSaving,  setAllocSaving]  = useState(false);

  const { data: agents = [], isLoading } = useQuery<any[]>({
    queryKey: ['tl-agents'],
    queryFn:  async () => (await fetch('/api/team-leader/agents')).json().then((r:any) => r.data ?? []),
  });

  const { data: me } = useQuery<any>({
    queryKey: ['me'],
    queryFn:  async () => (await fetch('/api/users/me')).json().then((r:any) => r.data),
  });

  // Existing per-member allocation records (for prefilling the modal input)
  const { data: allocData } = useQuery<any>({
    queryKey: ['tl-allocations', me?.id, allocForm.month, allocForm.year],
    enabled:  !!me?.id && !!allocModal,
    queryFn:  async () => {
      const res = await fetch(`/api/team-leader/allocations?team_leader_id=${me.id}&month=${allocForm.month}&year=${allocForm.year}`);
      return res.json();
    },
  });

  // TL's own target — now sourced from the Account Manager's allocation,
  // not the old TeamLeaderTarget flow. This is the real ceiling for
  // "sum of allocations to agents" going forward.
  const { data: tlTarget } = useQuery<any>({
    queryKey: ['tl-target', allocForm.month, allocForm.year],
    enabled:  !!allocModal,
    queryFn:  async () => {
      const res = await fetch(`/api/team-leader/target?month=${allocForm.month}&year=${allocForm.year}`);
      return res.json();
    },
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

  const openAlloc = async (agent: any) => {
    setAllocModal(agent);
    // Prefill existing allocation
    if (me?.id) {
      const res  = await fetch(`/api/team-leader/allocations?team_leader_id=${me.id}&month=${allocForm.month}&year=${allocForm.year}`);
      const json = await res.json();
      const existing = (json.data ?? []).find((a:any) => a.team_member_id === agent.id);
      setAllocForm(f => ({ ...f, allocated_target: existing ? String(existing.allocated_target) : '' }));
    }
  };

  const saveAlloc = async () => {
    if (!allocForm.allocated_target) return toast.error('Enter a target amount');
    if (!me?.id) return toast.error('Session error — please refresh');
    setAllocSaving(true);
    const res  = await fetch('/api/team-leader/allocations', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        team_leader_id:  me.id,
        team_id:         me.team_id,
        team_member_id:  allocModal.id,
        month:           allocForm.month,
        year:            allocForm.year,
        allocated_target: parseFloat(allocForm.allocated_target),
        currency:        allocForm.currency,
        created_by:      me.id,
      }),
    });
    const json = await res.json();
    setAllocSaving(false);
    if (json.error) return toast.error(json.error);
    toast.success('Target allocated!');
    qc.invalidateQueries({ queryKey: ['tl-allocations'] });
    qc.invalidateQueries({ queryKey: ['tl-target'] });
    setAllocModal(null);
  };

  const active  = agents.filter(a => a.status === 'active');
  const pending = agents.filter(a => a.status === 'pending');

  const overAllocated =
    !!tlTarget &&
    !!allocForm.allocated_target &&
    parseFloat(allocForm.allocated_target) > (tlTarget.remaining_to_allocate ?? 0);

  const AgentRow = ({ a }: { a: any }) => (
    <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(124,58,237,.07)', display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(124,58,237,.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.8rem', fontWeight:700, color:'#a78bfa', flexShrink:0 }}>
        {a.full_name.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'.875rem', fontWeight:600, color:'#f1f5f9' }}>{a.full_name}</div>
        <div style={{ fontSize:'.75rem', color:'rgba(148,163,184,.45)', marginTop:2 }}>{a.email}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {a.status === 'active' && (
          <>
            <span style={{ fontSize:'.85rem', fontWeight:700, color:'#34d399' }}>${(a.achieved ?? 0).toLocaleString()}</span>
            <button onClick={() => openAlloc(a)}
              style={{ height:30, padding:'0 10px', borderRadius:7, border:'none', background:'rgba(167,139,250,.1)', cursor:'pointer', display:'flex', alignItems:'center', gap:5, color:'#a78bfa', fontSize:'.75rem', fontWeight:600 }}>
              <Target size={12}/> Allocate
            </button>
          </>
        )}
        <span style={STATUS_STYLE[a.status] ?? STATUS_STYLE.pending}>
          {a.status === 'active'
            ? <><CheckCircle size={10} style={{marginRight:4,verticalAlign:'middle'}}/>Active</>
            : <><Clock size={10} style={{marginRight:4,verticalAlign:'middle'}}/>Pending</>}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ padding:'32px 28px', maxWidth:800, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:'.72rem', color:'#a78bfa', textTransform:'uppercase', letterSpacing:'.1em', fontWeight:600, marginBottom:6 }}>Team Leader</div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700, color:'#f1f5f9', margin:0 }}>My Agents</h1>
        </div>
        <button className="wm-btn-primary" onClick={() => setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px' }}>
          <UserPlus size={16}/> Add Agent
        </button>
      </div>

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

      {/* Add Agent Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20 }}>
          <div style={{ background:'#0f0f1a', border:'1px solid rgba(124,58,237,.25)', borderRadius:18, padding:28, width:'100%', maxWidth:420 }}>
            <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#f1f5f9', margin:'0 0 20px' }}>Add New Agent</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div><label style={lbl}>Full Name</label><input style={inp} value={form.full_name} onChange={e => setForm(f=>({...f,full_name:e.target.value}))} placeholder="Jane Smith"/></div>
              <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="jane@example.com"/></div>
              <div><label style={lbl}>Temporary Password</label><input style={inp} type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="Min 8 characters"/></div>
              <div style={{ background:'rgba(251,191,36,.07)', border:'1px solid rgba(251,191,36,.15)', borderRadius:9, padding:'10px 14px', fontSize:'.78rem', color:'#fbbf24' }}>
                This agent will be pending until the manager approves their account.
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="wm-btn-ghost" onClick={() => setShowModal(false)} style={{ flex:1, height:40 }}>Cancel</button>
              <button className="wm-btn-primary" onClick={handleAdd} disabled={loading} style={{ flex:1, height:40 }}>{loading ? 'Adding…' : 'Add Agent'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Allocate Target Modal */}
      {allocModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20 }}>
          <div style={{ background:'#0f0f1a', border:'1px solid rgba(167,139,250,.25)', borderRadius:18, padding:28, width:'100%', maxWidth:420 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <Target size={16} style={{ color:'#a78bfa' }}/>
              <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#f1f5f9', margin:0 }}>Allocate Target</h2>
            </div>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:20 }}>{allocModal.full_name}</p>

            {tlTarget && (
              <div style={{ marginBottom:16, padding:'10px 14px', background:'rgba(167,139,250,.06)', border:'1px solid rgba(167,139,250,.15)', borderRadius:9, fontSize:'.8rem', display:'flex', flexDirection:'column', gap:4 }}>
                <div>
                  <span style={{ color:'rgba(148,163,184,.5)' }}>Your target from AM: </span>
                  <span style={{ color:'#a78bfa', fontWeight:700 }}>${(tlTarget.assigned_target ?? 0).toLocaleString()}</span>
                </div>
                <div>
                  <span style={{ color:'rgba(148,163,184,.5)' }}>Remaining to allocate: </span>
                  <span style={{ color: overAllocated ? '#f87171' : '#34d399', fontWeight:700 }}>
                    ${(tlTarget.remaining_to_allocate ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'flex', gap:12 }}>
                <div style={{ flex:1 }}>
                  <label style={lbl}>Month</label>
                  <select style={sel} value={allocForm.month} onChange={e => setAllocForm(f=>({...f,month:parseInt(e.target.value)}))}>
                    {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div style={{ flex:1 }}>
                  <label style={lbl}>Year</label>
                  <select style={sel} value={allocForm.year} onChange={e => setAllocForm(f=>({...f,year:parseInt(e.target.value)}))}>
                    {[2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Target Amount *</label>
                <input style={inp} type="number" min="0" value={allocForm.allocated_target}
                  onChange={e => setAllocForm(f=>({...f,allocated_target:e.target.value}))} placeholder="e.g. 5000"/>
                {overAllocated && (
                  <div style={{ fontSize:'.72rem', color:'#f87171', marginTop:6 }}>
                    This exceeds what your AM has allocated you — the server will reject it.
                  </div>
                )}
              </div>
              <div>
                <label style={lbl}>Currency</label>
                <select style={sel} value={allocForm.currency} onChange={e => setAllocForm(f=>({...f,currency:e.target.value}))}>
                  {['USD','AUD','NZD','GBP','EUR'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="wm-btn-ghost" onClick={() => setAllocModal(null)} style={{ flex:1, height:40 }}>Cancel</button>
              <button className="wm-btn-primary" onClick={saveAlloc} disabled={allocSaving} style={{ flex:1, height:40 }}>
                {allocSaving ? 'Saving…' : 'Allocate Target'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
