'use client';
import { useState }                              from 'react';
import { useQuery, useQueryClient }              from '@tanstack/react-query';
import { UserPlus, Mail, ToggleLeft, ToggleRight, Users, Pencil, Crown, Target } from 'lucide-react';
import { formatTime }                            from '@/lib/utils';
import { createUserAction, toggleUserStatusAction, updateUserAction } from '@/lib/auth';
import { toast }                                 from 'sonner';
import { ConfirmDialog }                         from '@/components/shared/ConfirmDialog';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TEAM_COLORS = [
  { bg:'rgba(52,211,153,.12)',  color:'#34d399', border:'rgba(52,211,153,.25)'  },
  { bg:'rgba(96,165,250,.12)',  color:'#60a5fa', border:'rgba(96,165,250,.25)'  },
  { bg:'rgba(244,114,182,.12)', color:'#f472b6', border:'rgba(244,114,182,.25)' },
  { bg:'rgba(251,191,36,.12)',  color:'#fbbf24', border:'rgba(251,191,36,.25)'  },
  { bg:'rgba(167,139,250,.12)', color:'#a78bfa', border:'rgba(167,139,250,.25)' },
];

const inp: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none', boxSizing:'border-box' };
const sel: React.CSSProperties = { ...inp, cursor:'pointer' };
const lbl: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

type Tab = 'agents' | 'leaders';

export default function SalesTeamPage() {
  const qc  = useQueryClient();
  const now = new Date();
  const [tab,          setTab]          = useState<Tab>('agents');
  const [filterTeam,   setFilterTeam]   = useState<string>('all');
  const [showModal,    setShowModal]    = useState(false);
  const [editMember,   setEditMember]   = useState<any>(null);
  const [confirmId,    setConfirmId]    = useState<string|null>(null);
  const [isToggling,   setIsToggling]   = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [form,  setForm]  = useState({ full_name:'', email:'', password:'', team_id:'' });
  const [eForm, setEForm] = useState({ full_name:'', team_id:'', new_password:'' });
  const [targetModal,  setTargetModal]  = useState<any>(null);
  const [targetForm,   setTargetForm]   = useState({ team_id:'', month: now.getMonth()+1, year: now.getFullYear(), target_amount:'', currency:'USD' });
  const [targetSaving, setTargetSaving] = useState(false);

  const { data: currentUser } = useQuery<any>({
    queryKey: ['me'],
    queryFn:  async () => (await fetch('/api/users/me')).json().then((r:any) => r.data),
  });

  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ['teams'],
    queryFn:  async () => (await fetch('/api/teams')).json().then((r:any) => r.data ?? []),
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['sales-members'],
    queryFn:  async () => (await fetch('/api/sales-members')).json().then((r:any) => r.data ?? []),
  });

  const { data: leaders = [], isLoading: leadersLoading } = useQuery({
    queryKey: ['team-leaders'],
    queryFn:  async () => (await fetch('/api/sales-members?role=team_leader')).json().then((r:any) => r.data ?? []),
  });

  const isLoading = tab === 'agents' ? membersLoading : leadersLoading;
  const list      = tab === 'agents' ? members : leaders;
  const filtered  = filterTeam === 'all' ? list : list.filter((m:any) => m.team_id === filterTeam);

  const teamColor = (idx: number) => TEAM_COLORS[idx % TEAM_COLORS.length];
  const teamName  = (team_id: string) => teams.find((t:any) => t.id === team_id)?.name ?? 'Unassigned';
  const teamIdx   = (team_id: string) => teams.findIndex((t:any) => t.id === team_id);

  const handleCreate = async () => {
    if (!form.full_name || !form.email || !form.password || !form.team_id)
      return toast.error('All fields including team are required');
    setLoading(true);
    const role   = tab === 'leaders' ? 'team_leader' : 'sales_team';
    const result = await createUserAction({ ...form, role } as any);
    setLoading(false);
    if (result?.error) { toast.error(result.error); return; }
    toast.success(tab === 'leaders' ? 'Team leader created!' : 'Sales member created!');
    qc.invalidateQueries({ queryKey: ['sales-members'] });
    qc.invalidateQueries({ queryKey: ['team-leaders'] });
    setShowModal(false);
    setForm({ full_name:'', email:'', password:'', team_id:'' });
  };

  const handleEdit = async () => {
    if (!editMember) return;
    setLoading(true);
    const result = await updateUserAction({
      id:           editMember.id,
      full_name:    eForm.full_name   || undefined,
      team_id:      eForm.team_id     || null,
      new_password: eForm.new_password || undefined,
    } as any);
    setLoading(false);
    if (result?.error) { toast.error(result.error); return; }
    toast.success('Updated!');
    qc.invalidateQueries({ queryKey: ['sales-members'] });
    qc.invalidateQueries({ queryKey: ['team-leaders'] });
    setEditMember(null);
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    setIsToggling(true);
    const result = await toggleUserStatusAction(id, currentStatus);
    if (result?.error) toast.error(result.error);
    else {
      toast.success(currentStatus === 'active' ? 'Account deactivated' : 'Account activated');
      qc.invalidateQueries({ queryKey: ['sales-members'] });
      qc.invalidateQueries({ queryKey: ['team-leaders'] });
    }
    setIsToggling(false);
    setConfirmId(null);
  };

  const openTarget = async (tl: any) => {
    setTargetModal(tl);
    // Prefill team from TL's assigned team
    const defaultTeamId = tl.team_id ?? '';
    setTargetForm({ team_id: defaultTeamId, month: now.getMonth()+1, year: now.getFullYear(), target_amount:'', currency:'USD' });
  };

  const saveTarget = async () => {
    if (!targetForm.team_id)      return toast.error('Select a team');
    if (!targetForm.target_amount) return toast.error('Enter a target amount');
    setTargetSaving(true);
    const res  = await fetch('/api/manager/team-leader-targets', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        team_leader_id: targetModal.id,
        team_id:        targetForm.team_id,
        month:          targetForm.month,
        year:           targetForm.year,
        target_amount:  parseFloat(targetForm.target_amount),
        currency:       targetForm.currency,
        created_by:     currentUser?.id,
      }),
    });
    const json = await res.json();
    setTargetSaving(false);
    if (json.error) return toast.error(json.error);
    toast.success('Target assigned!');
    setTargetModal(null);
  };

  const isCreate = !editMember;

  return (
    <div className="wm-page-inner">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Users size={15} style={{ color:'#f472b6' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Team</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Sales Team</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Manage sales agents and team leaders across all teams</p>
        </div>
        <button className="wm-btn-primary" onClick={() => setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:7, height:38 }}>
          <UserPlus size={15}/> {tab === 'leaders' ? 'Add Team Leader' : 'Add Sales Member'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'rgba(255,255,255,.03)', border:'1px solid rgba(124,58,237,.12)', borderRadius:12, padding:4, width:'fit-content' }}>
        {([['agents','Sales Agents'],['leaders','Team Leaders']] as const).map(([val,label]) => (
          <button key={val} onClick={() => { setTab(val); setFilterTeam('all'); }}
            style={{ padding:'7px 18px', borderRadius:9, border:'none', cursor:'pointer', fontSize:'.82rem', fontWeight:600, transition:'all .2s',
              background: tab===val ? 'rgba(124,58,237,.25)' : 'transparent',
              color:      tab===val ? '#a78bfa' : 'rgba(148,163,184,.5)',
              display:'flex', alignItems:'center', gap:6 }}>
            {val === 'leaders' && <Crown size={13}/>}
            {label}
            <span style={{ padding:'1px 7px', borderRadius:99, background:'rgba(255,255,255,.06)', fontSize:'.7rem', color:'rgba(148,163,184,.4)' }}>
              {val === 'agents' ? members.length : leaders.length}
            </span>
          </button>
        ))}
      </div>

      {/* Team filter */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {[{ id:'all', name:'All Teams' }, ...teams].map((t:any) => (
          <button key={t.id} onClick={() => setFilterTeam(t.id)}
            style={{ padding:'7px 14px', borderRadius:10,
              border:`1px solid ${filterTeam===t.id ? 'rgba(167,139,250,.5)' : 'rgba(124,58,237,.18)'}`,
              background: filterTeam===t.id ? 'rgba(124,58,237,.12)' : 'rgba(255,255,255,.03)',
              color: filterTeam===t.id ? '#a78bfa' : 'rgba(148,163,184,.6)', fontSize:'.82rem', fontWeight:600, cursor:'pointer' }}>
            {t.name}
            <span style={{ marginLeft:6, padding:'1px 7px', borderRadius:99, background:'rgba(255,255,255,.06)', fontSize:'.7rem', color:'rgba(148,163,184,.4)' }}>
              {t.id==='all' ? list.length : list.filter((m:any) => m.team_id===t.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'rgba(148,163,184,.3)' }}>Loading...</div>
      ) : (
        <div className="wm-card wm-fade-up-2" style={{ overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table className="wm-table">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Team</th><th>Joined</th>
                  <th style={{ textAlign:'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign:'center', padding:'40px', color:'rgba(148,163,184,.3)' }}>
                    No {tab==='leaders' ? 'team leaders' : 'members'} yet
                  </td></tr>
                )}
                {filtered.map((m:any) => {
                  const idx = teamIdx(m.team_id);
                  const tc  = idx >= 0 ? teamColor(idx) : { bg:'rgba(148,163,184,.1)', color:'rgba(148,163,184,.6)', border:'rgba(148,163,184,.2)' };
                  return (
                    <tr key={m.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:9, flexShrink:0,
                            background: tab==='leaders'
                              ? 'linear-gradient(135deg,rgba(251,191,36,.3),rgba(167,139,250,.3))'
                              : 'linear-gradient(135deg,rgba(244,114,182,.3),rgba(167,139,250,.3))',
                            display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#f1f5f9' }}>
                            {m.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontWeight:500, color:'#f1f5f9', fontSize:'.87rem' }}>{m.full_name}</span>
                            {tab==='leaders' && <Crown size={11} style={{ color:'#fbbf24' }}/>}
                          </div>
                        </div>
                      </td>
                      <td><div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.82rem', color:'rgba(148,163,184,.6)' }}><Mail size={12}/>{m.email}</div></td>
                      <td>
                        <span style={{ padding:'3px 10px', borderRadius:99, fontSize:'.7rem', fontWeight:500, background:tc.bg, color:tc.color, border:`0.5px solid ${tc.border}` }}>
                          {m.team?.name ?? teamName(m.team_id)}
                        </span>
                      </td>
                      <td style={{ fontSize:'.8rem', color:'rgba(148,163,184,.45)' }}>{formatTime(m.created_at)}</td>
                      <td style={{ textAlign:'right' }}>
                        <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                          {tab === 'leaders' && (
                            <button onClick={() => openTarget(m)}
                              style={{ height:30, padding:'0 10px', borderRadius:7, border:'none', background:'rgba(52,211,153,.08)', cursor:'pointer', display:'flex', alignItems:'center', gap:5, color:'#34d399', fontSize:'.75rem', fontWeight:600 }}>
                              <Target size={12}/> Target
                            </button>
                          )}
                          <button onClick={() => { setEditMember(m); setEForm({ full_name:m.full_name, team_id:m.team_id??'', new_password:'' }); }}
                            style={{ width:30, height:30, borderRadius:7, border:'none', background:'rgba(255,255,255,.04)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.4)' }}>
                            <Pencil size={13}/>
                          </button>
                          <button onClick={() => setConfirmId(m.id)}
                            title={m.status==='active' ? 'Deactivate' : 'Activate'}
                            style={{ width:30, height:30, borderRadius:7, border:'none', background:m.status==='active'?'rgba(248,113,113,.08)':'rgba(52,211,153,.08)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:m.status==='active'?'#f87171':'#34d399' }}>
                            {m.status==='active' ? <ToggleRight size={15}/> : <ToggleLeft size={15}/>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showModal || editMember) && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={() => { setShowModal(false); setEditMember(null); }} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:440, background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28 }}>
            <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>
              {isCreate ? (tab==='leaders' ? 'Add Team Leader' : 'Add Sales Member') : 'Edit Member'}
            </h2>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:20 }}>
              {isCreate ? (tab==='leaders' ? 'Team leader can manage agents and distribute targets' : 'Create a new sales team account') : editMember?.email}
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lbl}>Full Name{isCreate && ' *'}</label>
                <input style={inp} value={isCreate ? form.full_name : eForm.full_name}
                  onChange={e => isCreate ? setForm(f=>({...f,full_name:e.target.value})) : setEForm(f=>({...f,full_name:e.target.value}))}
                  placeholder="Jane Smith" />
              </div>
              {isCreate && <>
                <div>
                  <label style={lbl}>Email *</label>
                  <input style={inp} type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="jane@webmaniacs.com" />
                </div>
                <div>
                  <label style={lbl}>Password *</label>
                  <input style={inp} type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="Min. 8 characters" />
                </div>
              </>}
              {!isCreate && (
                <div>
                  <label style={lbl}>New Password (leave blank to keep)</label>
                  <input style={inp} type="password" value={eForm.new_password} onChange={e => setEForm(f=>({...f,new_password:e.target.value}))} placeholder="Min. 8 characters" />
                </div>
              )}
              <div>
                <label style={lbl}>Assign Team *</label>
                <select style={sel} value={isCreate ? form.team_id : eForm.team_id}
                  onChange={e => isCreate ? setForm(f=>({...f,team_id:e.target.value})) : setEForm(f=>({...f,team_id:e.target.value}))}>
                  <option value="">Select team...</option>
                  {teams.map((t:any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="wm-btn-ghost" onClick={() => { setShowModal(false); setEditMember(null); }} style={{ flex:1, height:40 }}>Cancel</button>
              <button className="wm-btn-primary" style={{ flex:1, height:40 }} disabled={loading} onClick={isCreate ? handleCreate : handleEdit}>
                {loading ? 'Saving...' : isCreate ? (tab==='leaders' ? 'Create Team Leader' : 'Create Member') : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Target Modal */}
      {targetModal && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={() => setTargetModal(null)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:420, background:'#0e0e20', border:'1px solid rgba(52,211,153,.25)', borderRadius:18, padding:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <Target size={16} style={{ color:'#34d399' }}/>
              <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9' }}>Assign Target</h2>
            </div>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:20 }}>{targetModal.full_name}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lbl}>Team *</label>
                <select style={sel} value={targetForm.team_id} onChange={e => setTargetForm(f=>({...f,team_id:e.target.value}))}>
                  <option value="">Select team...</option>
                  {teams.map((t:any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <div style={{ flex:1 }}>
                  <label style={lbl}>Month</label>
                  <select style={sel} value={targetForm.month} onChange={e => setTargetForm(f=>({...f,month:parseInt(e.target.value)}))}>
                    {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div style={{ flex:1 }}>
                  <label style={lbl}>Year</label>
                  <select style={sel} value={targetForm.year} onChange={e => setTargetForm(f=>({...f,year:parseInt(e.target.value)}))}>
                    {[2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Target Amount *</label>
                <input style={inp} type="number" min="0" value={targetForm.target_amount}
                  onChange={e => setTargetForm(f=>({...f,target_amount:e.target.value}))} placeholder="e.g. 20000" />
              </div>
              <div>
                <label style={lbl}>Currency</label>
                <select style={sel} value={targetForm.currency} onChange={e => setTargetForm(f=>({...f,currency:e.target.value}))}>
                  {['USD','AUD','NZD','GBP','EUR'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="wm-btn-ghost" onClick={() => setTargetModal(null)} style={{ flex:1, height:40 }}>Cancel</button>
              <button className="wm-btn-primary" onClick={saveTarget} disabled={targetSaving} style={{ flex:1, height:40 }}>
                {targetSaving ? 'Saving...' : 'Assign Target'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmId}
        title={tab==='leaders' ? 'Deactivate Team Leader' : 'Deactivate Sales Member'}
        description="Their account will be disabled but all data will be preserved."
        confirmLabel="Deactivate"
        confirmColor="linear-gradient(135deg,#dc2626,#ef4444)"
        onConfirm={() => { if (confirmId) { const m = filtered.find((x:any)=>x.id===confirmId); handleToggle(confirmId, m?.status??'active'); } }}
        onCancel={() => setConfirmId(null)}
        loading={isToggling}
      />
    </div>
  );
}
