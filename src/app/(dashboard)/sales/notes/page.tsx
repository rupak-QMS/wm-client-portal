'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, Phone, X, Save } from 'lucide-react';
import { toast } from 'sonner';

type Note = {
  id: string;
  client_name: string;
  phone: string;
  callback_date: string;
  callback_time: string;
  note: string;
  created_at: string;
  done: boolean;
};

const STORAGE_KEY = 'wm_sales_notes';

const inp: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none' };
const lbl: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

export default function SalesNotesPage() {
  const [notes, setNotes]         = useState<Note[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote]   = useState<Note | null>(null);
  const [filter, setFilter]       = useState<'all' | 'pending' | 'done'>('all');
  const [form, setForm] = useState({
    client_name: '', phone: '', callback_date: '', callback_time: '', note: '',
  });

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setNotes(JSON.parse(saved));
    } catch {}
  }, []);

  const save = (updated: Note[]) => {
    setNotes(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  };

  const openAdd = () => {
    setEditNote(null);
    const today = new Date().toISOString().split('T')[0];
    setForm({ client_name:'', phone:'', callback_date: today, callback_time:'', note:'' });
    setShowModal(true);
  };

  const openEdit = (n: Note) => {
    setEditNote(n);
    setForm({ client_name: n.client_name, phone: n.phone, callback_date: n.callback_date, callback_time: n.callback_time, note: n.note });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.client_name || !form.note) {
      toast.error('Client name and note are required.');
      return;
    }
    if (editNote) {
      save(notes.map(n => n.id === editNote.id ? { ...n, ...form } : n));
      toast.success('Note updated!');
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        ...form,
        created_at: new Date().toISOString(),
        done: false,
      };
      save([newNote, ...notes]);
      toast.success('Note saved!');
    }
    setShowModal(false);
  };

  const toggleDone = (id: string) => {
    save(notes.map(n => n.id === id ? { ...n, done: !n.done } : n));
  };

  const deleteNote = (id: string) => {
    save(notes.filter(n => n.id !== id));
    toast.success('Note deleted.');
  };

  const filtered = notes.filter(n =>
    filter === 'all' ? true : filter === 'done' ? n.done : !n.done
  );

  const pending = notes.filter(n => !n.done).length;

  const formatDate = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const isOverdue = (n: Note) => {
    if (!n.callback_date || n.done) return false;
    return new Date(n.callback_date) < new Date(new Date().toDateString());
  };

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Phone size={15} style={{ color:'#a78bfa' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Notepad</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Callback Notes</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Track your client callbacks and follow-ups</p>
        </div>
        <button className="wm-btn-primary" onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:7, height:38 }}>
          <Plus size={15}/> Add Note
        </button>
      </div>

      {/* Filter tabs + stats */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:10 }} className="wm-fade-up">
        <div style={{ display:'flex', gap:6 }}>
          {(['all','pending','done'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'6px 14px', borderRadius:99, border:`1px solid ${filter===f?'rgba(124,58,237,.4)':'rgba(124,58,237,.15)'}`, background: filter===f?'rgba(124,58,237,.15)':'transparent', color: filter===f?'#a78bfa':'rgba(148,163,184,.5)', fontSize:'.78rem', fontWeight:600, cursor:'pointer', textTransform:'capitalize', transition:'all .2s' }}>
              {f}
            </button>
          ))}
        </div>
        {pending > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:99, background:'rgba(251,191,36,.08)', border:'0.5px solid rgba(251,191,36,.2)' }}>
            <Clock size={13} style={{ color:'#fbbf24' }} />
            <span style={{ fontSize:'.78rem', color:'#fbbf24', fontWeight:600 }}>{pending} pending callback{pending !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Notes list */}
      {filtered.length === 0 ? (
        <div className="wm-card" style={{ padding:'60px 24px', textAlign:'center' }} >
          <Phone size={36} style={{ color:'rgba(148,163,184,.15)', margin:'0 auto 12px', display:'block' }} />
          <p style={{ color:'rgba(148,163,184,.4)', fontSize:'.9rem' }}>
            {filter === 'done' ? 'No completed callbacks yet.' : filter === 'pending' ? 'No pending callbacks — all clear!' : 'No notes yet. Add your first callback note.'}
          </p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }} className="wm-fade-up-2">
          {filtered.map(n => (
            <div key={n.id} className="wm-card" style={{ padding:'16px 20px', opacity: n.done ? .65 : 1, borderColor: isOverdue(n) ? 'rgba(248,113,113,.4)' : undefined }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, flex:1 }}>

                  {/* Checkbox */}
                  <button onClick={() => toggleDone(n.id)}
                    style={{ width:20, height:20, borderRadius:6, border:`2px solid ${n.done?'#34d399':'rgba(124,58,237,.35)'}`, background: n.done?'#34d399':'transparent', flexShrink:0, cursor:'pointer', marginTop:2, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s' }}>
                    {n.done && <span style={{ color:'#fff', fontSize:11, fontWeight:700 }}>✓</span>}
                  </button>

                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                      <p style={{ fontWeight:600, color: n.done?'rgba(148,163,184,.5)':'#f1f5f9', fontSize:'.92rem', textDecoration: n.done?'line-through':'none' }}>
                        {n.client_name}
                      </p>
                      {isOverdue(n) && (
                        <span style={{ fontSize:'.68rem', padding:'1px 8px', borderRadius:99, background:'rgba(248,113,113,.12)', color:'#f87171', border:'0.5px solid rgba(248,113,113,.3)' }}>Overdue</span>
                      )}
                      {n.done && (
                        <span style={{ fontSize:'.68rem', padding:'1px 8px', borderRadius:99, background:'rgba(52,211,153,.12)', color:'#34d399', border:'0.5px solid rgba(52,211,153,.3)' }}>Done</span>
                      )}
                    </div>

                    <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:'.78rem', color:'rgba(148,163,184,.55)', marginBottom:8 }}>
                      {n.phone && <span>📞 {n.phone}</span>}
                      {n.callback_date && (
                        <span style={{ color: isOverdue(n)?'#f87171':'rgba(148,163,184,.55)' }}>
                          📅 {formatDate(n.callback_date)}{n.callback_time ? ` at ${n.callback_time}` : ''}
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize:'.85rem', color:'rgba(148,163,184,.7)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{n.note}</p>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button onClick={() => openEdit(n)}
                    style={{ width:30, height:30, borderRadius:7, border:'none', background:'rgba(255,255,255,.04)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.4)', transition:'all .2s' }}
                    onMouseEnter={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background='rgba(167,139,250,.12)';b.style.color='#a78bfa';}}
                    onMouseLeave={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background='rgba(255,255,255,.04)';b.style.color='rgba(148,163,184,.4)';}}>
                    <Save size={13}/>
                  </button>
                  <button onClick={() => deleteNote(n.id)}
                    style={{ width:30, height:30, borderRadius:7, border:'none', background:'rgba(255,255,255,.04)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.4)', transition:'all .2s' }}
                    onMouseEnter={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background='rgba(248,113,113,.12)';b.style.color='#f87171';}}
                    onMouseLeave={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background='rgba(255,255,255,.04)';b.style.color='rgba(148,163,184,.4)';}}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={() => setShowModal(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:500, background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9' }}>{editNote ? 'Edit Note' : 'New Callback Note'}</h2>
              <button onClick={() => setShowModal(false)} style={{ width:28, height:28, borderRadius:7, border:'none', background:'rgba(255,255,255,.06)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.5)' }}>
                <X size={14}/>
              </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>Client Name *</label>
                  <input style={inp} value={form.client_name} onChange={e => setForm(f=>({...f,client_name:e.target.value}))} placeholder="John Smith" />
                </div>
                <div>
                  <label style={lbl}>Phone</label>
                  <input style={inp} value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="+61 400 000 000" />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>Callback Date</label>
                  <input style={inp} type="date" value={form.callback_date} onChange={e => setForm(f=>({...f,callback_date:e.target.value}))} />
                </div>
                <div>
                  <label style={lbl}>Callback Time</label>
                  <input style={inp} type="time" value={form.callback_time} onChange={e => setForm(f=>({...f,callback_time:e.target.value}))} />
                </div>
              </div>
              <div>
                <label style={lbl}>Note *</label>
                <textarea
                  style={{ ...inp, height:'auto', resize:'none' as const, padding:'10px 12px', lineHeight:1.6 }}
                  rows={4} value={form.note}
                  onChange={e => setForm(f=>({...f,note:e.target.value}))}
                  placeholder="e.g. Called about SEO package, interested in 3-month plan. Call back Tuesday after 2pm." />
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button className="wm-btn-ghost" onClick={() => setShowModal(false)} style={{ flex:1, height:40 }}>Cancel</button>
                <button className="wm-btn-primary" onClick={handleSave} style={{ flex:1, height:40 }}>
                  {editNote ? 'Update Note' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}