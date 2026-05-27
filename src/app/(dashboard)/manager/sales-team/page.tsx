'use client';
import { useState }                              from 'react';
import { useQuery, useQueryClient }              from '@tanstack/react-query';
import { UserPlus, UserCheck, Mail, Trash2, Users } from 'lucide-react';
import { formatTime }                            from '@/lib/utils';
import { createUserAction, deleteUserAction }    from '@/lib/auth';
import { toast }                                 from 'sonner';
import { ConfirmDialog }                         from '@/components/shared/ConfirmDialog';

const inpStyle: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none' };
const lblStyle: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

export default function SalesTeamPage() {
  const qc = useQueryClient();
  const [showModal,  setShowModal]  = useState(false);
  const [confirmId,  setConfirmId]  = useState<string|null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [form, setForm] = useState({ full_name:'', email:'', password:'' });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['sales-members'],
    queryFn:  async () => (await (await fetch('/api/sales-members')).json()).data ?? [],
  });

  const handleCreate = async () => {
    if (!form.full_name || !form.email || !form.password) return toast.error('All fields required');
    setLoading(true);
    const result = await createUserAction({ ...form, role: 'sales_team' } as any);
    setLoading(false);
    if (result?.error) { toast.error(result.error); return; }
    toast.success('Sales team member created!');
    qc.invalidateQueries({ queryKey: ['sales-members'] });
    setShowModal(false);
    setForm({ full_name:'', email:'', password:'' });
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const result = await deleteUserAction(id);
    if (result?.error) toast.error(result.error);
    else { toast.success('Member removed'); qc.invalidateQueries({ queryKey: ['sales-members'] }); }
    setIsDeleting(false);
    setConfirmId(null);
  };

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
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Manage your sales team members</p>
        </div>
        <button className="wm-btn-primary" onClick={() => setShowModal(true)}
          style={{ display:'flex', alignItems:'center', gap:7, height:38 }}>
          <UserPlus size={15}/> Add Sales Member
        </button>
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
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th style={{ textAlign:'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign:'center', padding:'40px', color:'rgba(148,163,184,.3)' }}>No sales team members yet</td></tr>
                )}
                {members.map((m: any) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:9, flexShrink:0, background:'linear-gradient(135deg,rgba(244,114,182,.3),rgba(167,139,250,.3))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#f1f5f9' }}>
                          {m.full_name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight:500, color:'#f1f5f9', fontSize:'.87rem' }}>{m.full_name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.82rem', color:'rgba(148,163,184,.6)' }}>
                        <Mail size={12}/> {m.email}
                      </div>
                    </td>
                    <td style={{ fontSize:'.8rem', color:'rgba(148,163,184,.45)' }}>{formatTime(m.created_at)}</td>
                    <td>
                      <span style={{ padding:'3px 10px', borderRadius:99, fontSize:'.7rem', fontWeight:500, background:'rgba(244,114,182,.12)', color:'#f472b6', border:'0.5px solid rgba(244,114,182,.25)' }}>
                        Sales Team
                      </span>
                    </td>
                    <td style={{ textAlign:'right' }}>
                      <button onClick={() => setConfirmId(m.id)}
                        style={{ width:30, height:30, borderRadius:7, border:'none', background:'rgba(255,255,255,.04)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.4)', transition:'all .2s', marginLeft:'auto' }}
                        onMouseEnter={e => { const b=e.currentTarget as HTMLButtonElement; b.style.background='rgba(248,113,113,.12)'; b.style.color='#f87171'; }}
                        onMouseLeave={e => { const b=e.currentTarget as HTMLButtonElement; b.style.background='rgba(255,255,255,.04)'; b.style.color='rgba(148,163,184,.4)'; }}>
                        <Trash2 size={13}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={() => setShowModal(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:440, background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28 }}>
            <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Add Sales Team Member</h2>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:20 }}>Create a new sales team account</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lblStyle}>Full Name *</label>
                <input style={inpStyle} value={form.full_name} onChange={e => setForm(f=>({...f,full_name:e.target.value}))} placeholder="Sarah Johnson" />
              </div>
              <div>
                <label style={lblStyle}>Email *</label>
                <input style={inpStyle} type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="sarah@webmaniacs.com" />
              </div>
              <div>
                <label style={lblStyle}>Password *</label>
                <input style={inpStyle} type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="Min. 8 characters" />
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button className="wm-btn-ghost" onClick={() => setShowModal(false)} style={{ flex:1, height:40 }}>Cancel</button>
                <button className="wm-btn-primary" style={{ flex:1, height:40 }} disabled={loading}
                  onClick={handleCreate}>
                  {loading ? 'Creating...' : 'Create Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmId}
        title="Remove Sales Team Member"
        description="This will permanently delete this sales team member and all their data."
        onConfirm={() => confirmId && handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
        loading={isDeleting}
      />
    </div>
  );
}