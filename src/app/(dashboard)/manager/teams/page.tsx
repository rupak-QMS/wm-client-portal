'use client';
import { useState }                 from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast }                    from 'sonner';

const inp: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none', boxSizing:'border-box' };
const lbl: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

const EMPTY = { name:'', description:'' };

export default function TeamsPage() {
  const qc = useQueryClient();
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [confirmTeam, setConfirmTeam] = useState<any>(null);

  const { data: teams = [], isLoading } = useQuery<any[]>({
    queryKey: ['teams'],
    queryFn:  async () => (await fetch('/api/teams')).json().then((r:any) => r.data ?? []),
  });

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (t: any) => { setEditing(t); setForm({ name: t.name, description: t.description ?? '' }); setModal(true); };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Team name is required');
    setSaving(true);
    const url    = editing ? `/api/teams/${editing.id}` : '/api/teams';
    const method = editing ? 'PATCH' : 'POST';
    const res    = await fetch(url, { method, headers: { 'Content-Type':'application/json' }, body: JSON.stringify(form) });
    const json   = await res.json();
    setSaving(false);
    if (json.error) return toast.error(json.error);
    toast.success(editing ? 'Team updated' : 'Team created');
    qc.invalidateQueries({ queryKey: ['teams'] });
    setModal(false);
  };

  const toggle = async (t: any) => {
    const res  = await fetch(`/api/teams/${t.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ is_active: !t.is_active }) });
    const json = await res.json();
    if (json.error) return toast.error(json.error);
    toast.success(t.is_active ? 'Team deactivated' : 'Team activated');
    qc.invalidateQueries({ queryKey: ['teams'] });
  };

  const remove = async (t: any) => {
    const res  = await fetch(`/api/teams/${t.id}`, { method:'DELETE' });
    const json = await res.json();
    if (json.error) return toast.error(json.error);
    toast.success('Team deleted');
    qc.invalidateQueries({ queryKey: ['teams'] });
    setConfirmTeam(null);
  };

  return (
    <div className="wm-page-inner">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Users size={15} style={{ color:'#60a5fa' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Configuration</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Teams</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Create and manage sales teams — assign team leaders and members</p>
        </div>
        <button className="wm-btn-primary" onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:7, height:38 }}>
          <Plus size={15}/> Add Team
        </button>
      </div>

      {/* Table */}
      <div className="wm-fade-up-2">
        {isLoading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'rgba(148,163,184,.3)' }}>Loading...</div>
        ) : teams.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px', color:'rgba(148,163,184,.3)' }}>No teams yet — add one above</div>
        ) : (
          <div className="wm-card" style={{ overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                  {['Name','Description','Status','Actions'].map(h => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'.72rem', color:'rgba(148,163,184,.4)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teams.map((t:any) => (
                  <tr key={t.id} style={{ borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                    <td style={{ padding:'14px 16px', color:'#f1f5f9', fontWeight:600 }}>{t.name}</td>
                    <td style={{ padding:'14px 16px', color:'rgba(148,163,184,.5)', fontSize:'.875rem' }}>{t.description || '—'}</td>
                    <td style={{ padding:'14px 16px' }}>
                      <span style={{ padding:'3px 10px', borderRadius:20, fontSize:'.75rem', fontWeight:600,
                        background: t.is_active ? 'rgba(52,211,153,.15)' : 'rgba(148,163,184,.1)',
                        color:      t.is_active ? '#34d399'              : 'rgba(148,163,184,.5)' }}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => toggle(t)} title={t.is_active ? 'Deactivate' : 'Activate'}
                          style={{ background:'rgba(255,255,255,.06)', border:'none', borderRadius:6, padding:'6px 8px', cursor:'pointer', color: t.is_active ? '#f87171' : '#34d399' }}>
                          {t.is_active ? <ToggleRight size={15}/> : <ToggleLeft size={15}/>}
                        </button>
                        <button onClick={() => openEdit(t)}
                          style={{ background:'rgba(255,255,255,.06)', border:'none', borderRadius:6, padding:'6px 8px', cursor:'pointer', color:'rgba(148,163,184,.7)' }}>
                          <Pencil size={14}/>
                        </button>
                        <button onClick={() => setConfirmTeam(t)}
                          style={{ background:'rgba(239,68,68,.1)', border:'none', borderRadius:6, padding:'6px 8px', cursor:'pointer', color:'#ef4444' }}>
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#0f1629', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding:32, width:'100%', maxWidth:460 }}>
            <h2 style={{ color:'#f1f5f9', fontWeight:700, fontSize:'1.2rem', marginBottom:24 }}>{editing ? 'Edit Team' : 'Add Team'}</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={lbl}>Team Name *</label>
                <input style={inp} value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Aus/NZ Sales Team"/>
              </div>
              <div>
                <label style={lbl}>Description</label>
                <input style={inp} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Optional"/>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding:'9px 18px', borderRadius:8, background:'rgba(255,255,255,.06)', border:'none', color:'rgba(148,163,184,.7)', cursor:'pointer' }}>Cancel</button>
              <button onClick={save} disabled={saving} className="wm-btn-primary" style={{ padding:'9px 18px' }}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmTeam && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#0f1629', border:'1px solid rgba(239,68,68,.25)', borderRadius:16, padding:28, width:'100%', maxWidth:420 }}>
            <h2 style={{ color:'#f1f5f9', fontWeight:700, fontSize:'1.05rem', marginBottom:8 }}>Delete Team</h2>
            <p style={{ color:'rgba(148,163,184,.6)', fontSize:'.85rem', marginBottom:24 }}>Delete <strong style={{ color:'#f1f5f9' }}>{confirmTeam.name}</strong>? Members assigned to this team will be unassigned.</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setConfirmTeam(null)} style={{ flex:1, height:40, borderRadius:10, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'rgba(148,163,184,.7)', cursor:'pointer' }}>Cancel</button>
              <button onClick={() => remove(confirmTeam)} style={{ flex:1, height:40, borderRadius:10, border:'none', background:'linear-gradient(135deg,#dc2626,#ef4444)', color:'#fff', fontWeight:600, cursor:'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
