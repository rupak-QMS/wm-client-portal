'use client';
import { useState }                              from 'react';
import { useQuery, useQueryClient }              from '@tanstack/react-query';
import { UserPlus, Mail, ToggleLeft, ToggleRight, Pencil, Users, Crown, UserCheck, Shield } from 'lucide-react';
import { formatTime }                            from '@/lib/utils';
import { createUserAction, toggleUserStatusAction, updateUserAction } from '@/lib/auth';
import { toast }                                 from 'sonner';
import { ConfirmDialog }                         from '@/components/shared/ConfirmDialog';

const ROLES = [
  { value:'account_manager', label:'Account Manager', icon: UserCheck, color:'#60a5fa' },
  { value:'team_leader',     label:'Team Leader',     icon: Crown,      color:'#fbbf24' },
  { value:'sales_team',      label:'Sales Agent',     icon: Users,      color:'#f472b6' },
];

const inp: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none', boxSizing:'border-box' };
const sel: React.CSSProperties = { ...inp, cursor:'pointer' };
const lbl: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

type RoleFilter = 'all' | 'account_manager' | 'team_leader' | 'sales_team';

export default function StaffPage() {
  const qc = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [showModal,  setShowModal]  = useState(false);
  const [editUser,   setEditUser]   = useState<any>(null);
  const [confirmId,  setConfirmId]  = useState<string|null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [form,  setForm]  = useState({ full_name:'', email:'', password:'', role:'sales_team', team_id:'' });
  const [eForm, setEForm] = useState({ full_name:'', role:'', team_id:'', new_password:'' });

  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ['teams'],
    queryFn:  async () => (await fetch('/api/teams')).json().then((r:any) => r.data ?? []),
  });

  const { data: staff = [], isLoading } = useQuery<any[]>({
    queryKey: ['staff', roleFilter],
    queryFn:  async () => {
      const url = roleFilter === 'all'
        ? '/api/staff'
        : `/api/staff?role=${roleFilter}`;
      return (await fetch(url)).json().then((r:any) => r.data ?? []);
    },
  });

  const handleCreate = async () => {
    if (!form.full_name || !form.email || !form.password || !form.role)
      return toast.error('All fields are required');
    setLoading(true);
    const result = await createUserAction({ ...form } as any);
    setLoading(false);
    if (result?.error) { toast.error(result.error); return; }
    toast.success('Staff member created!');
    qc.invalidateQueries({ queryKey: ['staff'] });
    setShowModal(false);
    setForm({ full_name:'', email:'', password:'', role:'sales_team', team_id:'' });
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setLoading(true);
    const result = await updateUserAction({
      id:           editUser.id,
      full_name:    eForm.full_name    || undefined,
      team_id:      eForm.team_id      || null,
      new_password: eForm.new_password || undefined,
    } as any);
    setLoading(false);
    if (result?.error) { toast.error(result.error); return; }
    toast.success('Updated!');
    qc.invalidateQueries({ queryKey: ['staff'] });
    setEditUser(null);
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    setIsToggling(true);
    const result = await toggleUserStatusAction(id, currentStatus);
    if (result?.error) toast.error(result.error);
    else { toast.success(currentStatus === 'active' ? 'Account deactivated' : 'Account activated'); qc.invalidateQueries({ queryKey: ['staff'] }); }
    setIsToggling(false);
    setConfirmId(null);
  };

  const getRoleStyle = (role: string) => {
    const r = ROLES.find(r => r.value === role);
    return r ? { color: r.color } : { color: 'rgba(148,163,184,.5)' };
  };

  const isCreate = !editUser;

  return (
    <div className="wm-page-inner">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Shield size={15} style={{ color:'#a78bfa' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Management</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Staff Management</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Create and manage all staff — account managers, team leaders, and sales agents</p>
        </div>
        <button className="wm-btn-primary" onClick={() => setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:7, height:38 }}>
          <UserPlus size={15}/> Add Staff
        </button>
      </div>

      {/* Role filter */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {([{ value:'all', label:'All Staff', color:'#a78bfa' }, ...ROLES] as any[]).map((r:any) => (
          <button key={r.value} onClick={() => setRoleFilter(r.value)}
            style={{ padding:'7px 14px', borderRadius:10,
              border:`1px solid ${roleFilter===r.value ? r.color+'80' : 'rgba(124,58,237,.18)'}`,
              background: roleFilter===r.value ? r.color+'18' : 'rgba(255,255,255,.03)',
              color: roleFilter===r.value ? r.color : 'rgba(148,163,184,.6)',
              fontSize:'.82rem', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            {r.label}
            <span style={{ padding:'1px 7px', borderRadius:99, background:'rgba(255,255,255,.06)', fontSize:'.7rem', color:'rgba(148,163,184,.4)' }}>
              {roleFilter === r.value ? staff.length : ''}
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
                  <th>Name</th><th>Email</th><th>Role</th><th>Team</th><th>Status</th><th>Joined</th>
                  <th style={{ textAlign:'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign:'center', padding:'40px', color:'rgba(148,163,184,.3)' }}>No staff found</td></tr>
                )}
                {staff.map((m:any) => {
                  const roleInfo = ROLES.find(r => r.value === m.role);
                  return (
                    <tr key={m.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:9, flexShrink:0,
                            background: `linear-gradient(135deg,${roleInfo?.color ?? '#a78bfa'}30,rgba(167,139,250,.2))`,
                            display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#f1f5f9' }}>
                            {m.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span style={{ fontWeight:500, color:'#f1f5f9', fontSize:'.87rem' }}>{m.full_name}</span>
                        </div>
                      </td>
                      <td><div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.82rem', color:'rgba(148,163,184,.6)' }}><Mail size={12}/>{m.email}</div></td>
                      <td>
                        <span style={{ padding:'3px 10px', borderRadius:99, fontSize:'.7rem', fontWeight:600,
                          background: (roleInfo?.color ?? '#a78bfa') + '18',
                          color: roleInfo?.color ?? '#a78bfa' }}>
                          {roleInfo?.label ?? m.role}
                        </span>
                      </td>
                      <td style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)' }}>{m.team?.name ?? '—'}</td>
                      <td>
                        <span style={{ padding:'3px 10px', borderRadius:99, fontSize:'.7rem', fontWeight:600,
                          background: m.status==='active' ? 'rgba(52,211,153,.12)' : 'rgba(251,191,36,.12)',
                          color:      m.status==='active' ? '#34d399'              : '#fbbf24' }}>
                          {m.status === 'active' ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ fontSize:'.8rem', color:'rgba(148,163,184,.45)' }}>{formatTime(m.created_at)}</td>
                      <td style={{ textAlign:'right' }}>
                        <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                          <button onClick={() => { setEditUser(m); setEForm({ full_name:m.full_name, role:m.role, team_id:m.team_id??'', new_password:'' }); }}
                            style={{ width:30, height:30, borderRadius:7, border:'none', background:'rgba(255,255,255,.04)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.4)' }}>
                            <Pencil size={13}/>
                          </button>
                          <button onClick={() => setConfirmId(m.id)}
                            title={m.status==='active'?'Deactivate':'Activate'}
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
      {(showModal || editUser) && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={() => { setShowModal(false); setEditUser(null); }} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:440, background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28 }}>
            <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>
              {isCreate ? 'Add Staff Member' : 'Edit Staff Member'}
            </h2>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:20 }}>
              {isCreate ? 'Create a new staff account' : editUser?.email}
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lbl}>Full Name *</label>
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
                <div>
                  <label style={lbl}>Role *</label>
                  <select style={sel} value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </>}
              {!isCreate && (
                <div>
                  <label style={lbl}>New Password (leave blank to keep)</label>
                  <input style={inp} type="password" value={eForm.new_password} onChange={e => setEForm(f=>({...f,new_password:e.target.value}))} placeholder="Min. 8 characters" />
                </div>
              )}
              <div>
                <label style={lbl}>Assign Team</label>
                <select style={sel} value={isCreate ? form.team_id : eForm.team_id}
                  onChange={e => isCreate ? setForm(f=>({...f,team_id:e.target.value})) : setEForm(f=>({...f,team_id:e.target.value}))}>
                  <option value="">No team</option>
                  {teams.map((t:any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="wm-btn-ghost" onClick={() => { setShowModal(false); setEditUser(null); }} style={{ flex:1, height:40 }}>Cancel</button>
              <button className="wm-btn-primary" style={{ flex:1, height:40 }} disabled={loading} onClick={isCreate ? handleCreate : handleEdit}>
                {loading ? 'Saving...' : isCreate ? 'Create Staff' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmId}
      title="Deactivate / Activate Staff"
        description="Deactivating will block login but preserve all data."
        confirmLabel="Confirm"
        onConfirm={() => { if (confirmId) { const m = staff.find((x:any)=>x.id===confirmId); handleToggle(confirmId, m?.status??'active'); } }}
        onCancel={() => setConfirmId(null)}
        loading={isToggling}
      />
    </div>
  );
}
