'use client';
import { useState }                 from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast }                    from 'sonner';

interface Shift {
  id: string; name: string; start_time: string | null; end_time: string | null;
  description: string | null; is_active: boolean; created_at: string;
}

const EMPTY = { name: '', start_time: '', end_time: '', description: '' };

export default function ShiftsPage() {
  const qc = useQueryClient();
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState<Shift | null>(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);

  const { data: shifts = [], isLoading } = useQuery<Shift[]>({
    queryKey: ['shifts'],
    queryFn: async () => (await fetch('/api/shifts')).json().then((r: any) => r.data ?? []),
  });

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (s: Shift) => {
    setEditing(s);
    setForm({ name: s.name, start_time: s.start_time ?? '', end_time: s.end_time ?? '', description: s.description ?? '' });
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Shift name is required');
    setSaving(true);
    const url    = editing ? `/api/shifts/${editing.id}` : '/api/shifts';
    const method = editing ? 'PATCH' : 'POST';
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const json   = await res.json();
    setSaving(false);
    if (json.error) return toast.error(json.error);
    toast.success(editing ? 'Shift updated' : 'Shift created');
    qc.invalidateQueries({ queryKey: ['shifts'] });
    setModal(false);
  };

  const toggle = async (s: Shift) => {
    const res  = await fetch(`/api/shifts/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !s.is_active }) });
    const json = await res.json();
    if (json.error) return toast.error(json.error);
    toast.success(s.is_active ? 'Shift deactivated' : 'Shift activated');
    qc.invalidateQueries({ queryKey: ['shifts'] });
  };

  const remove = async (s: Shift) => {
    if (!confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    const res  = await fetch(`/api/shifts/${s.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.error) return toast.error(json.error);
    toast.success('Shift deleted');
    qc.invalidateQueries({ queryKey: ['shifts'] });
  };

  return (
    <div className="wm-page-inner">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Clock size={15} style={{ color:'#34d399' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Configuration</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Shifts</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Manage work shifts and assign them to team leaders</p>
        </div>
        <button className="wm-btn-primary" onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:7, height:38 }}>
          <Plus size={15} /> Add Shift
        </button>
      </div>

      {/* Table */}
      <div className="wm-fade-up-2">
        {isLoading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'rgba(148,163,184,.3)' }}>Loading...</div>
        ) : shifts.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px', color:'rgba(148,163,184,.3)' }}>No shifts yet — add one above</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                {['Name','Hours','Description','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'.72rem', color:'rgba(148,163,184,.4)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shifts.map(s => (
                <tr key={s.id} style={{ borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                  <td style={{ padding:'14px', color:'#f1f5f9', fontWeight:600 }}>{s.name}</td>
                  <td style={{ padding:'14px', color:'rgba(148,163,184,.7)', fontSize:'.875rem' }}>
                    {s.start_time && s.end_time ? `${s.start_time} – ${s.end_time}` : '—'}
                  </td>
                  <td style={{ padding:'14px', color:'rgba(148,163,184,.5)', fontSize:'.875rem' }}>{s.description || '—'}</td>
                  <td style={{ padding:'14px' }}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:'.75rem', fontWeight:600,
                      background: s.is_active ? 'rgba(52,211,153,.15)' : 'rgba(148,163,184,.1)',
                      color:      s.is_active ? '#34d399'              : 'rgba(148,163,184,.5)' }}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding:'14px' }}>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => toggle(s)} title={s.is_active ? 'Deactivate' : 'Activate'}
                        style={{ background:'rgba(255,255,255,.06)', border:'none', borderRadius:6, padding:'6px 8px', cursor:'pointer', color:'rgba(148,163,184,.7)' }}>
                        {s.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                      </button>
                      <button onClick={() => openEdit(s)}
                        style={{ background:'rgba(255,255,255,.06)', border:'none', borderRadius:6, padding:'6px 8px', cursor:'pointer', color:'rgba(148,163,184,.7)' }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(s)}
                        style={{ background:'rgba(239,68,68,.1)', border:'none', borderRadius:6, padding:'6px 8px', cursor:'pointer', color:'#ef4444' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#0f1629', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding:32, width:'100%', maxWidth:460 }}>
            <h2 style={{ color:'#f1f5f9', fontWeight:700, fontSize:'1.2rem', marginBottom:24 }}>{editing ? 'Edit Shift' : 'Add Shift'}</h2>
            {[
              { label:'Shift Name *', key:'name',        type:'text',  placeholder:'e.g. Morning Shift' },
              { label:'Start Time',   key:'start_time',  type:'time',  placeholder:'' },
              { label:'End Time',     key:'end_time',    type:'time',  placeholder:'' },
              { label:'Description',  key:'description', type:'text',  placeholder:'Optional notes' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:'.8rem', color:'rgba(148,163,184,.6)', marginBottom:6 }}>{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]} placeholder={f.placeholder}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, padding:'10px 12px', color:'#f1f5f9', fontSize:'.875rem', boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding:'9px 18px', borderRadius:8, background:'rgba(255,255,255,.06)', border:'none', color:'rgba(148,163,184,.7)', cursor:'pointer' }}>Cancel</button>
              <button onClick={save} disabled={saving} className="wm-btn-primary" style={{ padding:'9px 18px' }}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
