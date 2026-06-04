'use client';
import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, X, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

type NoteFile = { id: string; title: string; content: string; updated_at: string };

const KEY = 'wm_notepad_files';
const load = (): NoteFile[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const persist = (n: NoteFile[]) => { try { localStorage.setItem(KEY, JSON.stringify(n)); } catch {} };

export default function NotepadPage() {
  const [files, setFiles]       = useState<NoteFile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [content, setContent]   = useState('');
  const [title, setTitle]       = useState('');
  const [saved, setSaved]       = useState(true);
  const timer                   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const s = load();
    if (s.length === 0) {
      const f: NoteFile = { id: Date.now().toString(), title: 'My Notes', content: '', updated_at: new Date().toISOString() };
      persist([f]); setFiles([f]); open(f);
    } else { setFiles(s); open(s[0]); }
  }, []);

  const open = (f: NoteFile) => { setActiveId(f.id); setTitle(f.title); setContent(f.content); setSaved(true); };

  const autosave = (nc: string, nt: string, id: string, cur: NoteFile[]) => {
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const u = cur.map(f => f.id === id ? { ...f, title: nt, content: nc, updated_at: new Date().toISOString() } : f);
      setFiles(u); persist(u); setSaved(true);
    }, 500);
  };

  const onContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (activeId) autosave(e.target.value, title, activeId, files);
  };

  const onTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (activeId) autosave(content, e.target.value, activeId, files);
  };

  const newNote = () => {
    const f: NoteFile = { id: Date.now().toString(), title: 'Untitled', content: '', updated_at: new Date().toISOString() };
    const u = [f, ...files]; setFiles(u); persist(u); open(f);
  };

  const del = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length === 1) { toast.error("Can't delete last note."); return; }
    const u = files.filter(f => f.id !== id); persist(u); setFiles(u);
    if (activeId === id) open(u[0]);
    toast.success('Note deleted.');
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-AU', { day:'2-digit', month:'short' }) + ' · ' + d.toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' });
  };

  const words = content.split(/\s+/).filter(Boolean).length;
  const lines = content.split('\n').length;

  return (
    <div style={{ display:'flex', height:'calc(100vh - 60px)', overflow:'hidden', background:'var(--bg-base)' }}>

      {/* ── Sidebar ── */}
      <div style={{ width:230, display:'flex', flexDirection:'column', flexShrink:0, borderRight:'1px solid var(--border-subtle)', background:'var(--bg-sidebar)' }}>

        {/* Sidebar header */}
        <div style={{ padding:'16px 14px 12px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <BookOpen size={13} style={{ color:'var(--text-muted)' }} />
            <span style={{ fontSize:'.72rem', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.07em' }}>Notes</span>
            <span style={{ padding:'1px 7px', borderRadius:99, background:'rgba(124,58,237,.12)', color:'#a78bfa', fontSize:'.65rem', fontWeight:700 }}>{files.length}</span>
          </div>
          <button onClick={newNote} title="New note"
            style={{ width:28, height:28, borderRadius:8, border:'none', background:'linear-gradient(135deg,#7c3aed,#3b82f6)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', boxShadow:'0 2px 8px rgba(124,58,237,.3)' }}>
            <Plus size={14}/>
          </button>
        </div>

        {/* Note list */}
        <div style={{ flex:1, overflowY:'auto', padding:'8px 6px' }}>
          {files.map(f => {
            const active = activeId === f.id;
            const preview = f.content.replace(/\n/g,' ').slice(0, 50) || 'Empty note';
            return (
              <div key={f.id} onClick={() => open(f)}
                style={{ padding:'10px 10px', borderRadius:10, cursor:'pointer', marginBottom:4, background: active ? 'rgba(124,58,237,.14)' : 'transparent', border: active ? '1px solid rgba(124,58,237,.25)' : '1px solid transparent', transition:'all .15s', position:'relative' }}
                onMouseEnter={e => { if (!active)(e.currentTarget as HTMLDivElement).style.background='rgba(124,58,237,.06)'; }}
                onMouseLeave={e => { if (!active)(e.currentTarget as HTMLDivElement).style.background='transparent'; }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:6 }}>
                  <div style={{ minWidth:0, flex:1 }}>
                    <p style={{ fontSize:'.82rem', fontWeight:600, color: active?'#a78bfa':'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:3 }}>{f.title}</p>
                    <p style={{ fontSize:'.7rem', color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:3 }}>{preview}</p>
                    <p style={{ fontSize:'.65rem', color:'var(--text-muted)', opacity:.6 }}>{fmt(f.updated_at)}</p>
                  </div>
                  <button onClick={e => del(f.id, e)}
                    style={{ width:18, height:18, borderRadius:4, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', flexShrink:0, opacity:.4, marginTop:1 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity='1'; (e.currentTarget as HTMLButtonElement).style.color='#f87171'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity='.4'; (e.currentTarget as HTMLButtonElement).style.color='var(--text-muted)'; }}>
                    <X size={11}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Editor ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--bg-base)' }}>

        {/* Title bar */}
        <div style={{ padding:'12px 28px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', gap:12, background:'var(--bg-topbar)', backdropFilter:'blur(16px)', flexShrink:0 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background: saved?'#34d399':'#fbbf24', boxShadow: saved?'0 0 6px rgba(52,211,153,.5)':'0 0 6px rgba(251,191,36,.5)', flexShrink:0, transition:'all .3s' }} />
          <input value={title} onChange={onTitle}
            style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:'1rem', fontWeight:700, color:'var(--text-primary)', padding:0, letterSpacing:'-.01em' }}
            placeholder="Note title..." />
          <span style={{ fontSize:'.72rem', color:'var(--text-muted)', opacity:.5 }}>{saved ? 'Saved' : 'Saving…'}</span>
        </div>

        {/* Textarea */}
        <textarea value={content} onChange={onContent}
          placeholder="Start typing…"
          style={{
            flex:1, width:'100%', resize:'none', border:'none', outline:'none',
            background:'transparent', padding:'28px 32px',
            fontSize:'1rem', lineHeight:2, color:'var(--text-primary)',
            fontFamily:"'SF Mono','Consolas','Courier New',monospace",
            letterSpacing:'.01em',
          }}
        />

        {/* Status bar */}
        <div style={{ padding:'7px 28px', borderTop:'1px solid var(--border-subtle)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg-topbar)', backdropFilter:'blur(16px)', flexShrink:0 }}>
          <div style={{ display:'flex', gap:16 }}>
            {[
              { label:'Characters', val: content.length },
              { label:'Words',      val: words },
              { label:'Lines',      val: lines },
            ].map(({ label, val }) => (
              <span key={label} style={{ fontSize:'.7rem', color:'var(--text-muted)', opacity:.6 }}>
                <span style={{ fontWeight:600, opacity:1, color:'var(--text-secondary)' }}>{val}</span> {label}
              </span>
            ))}
          </div>
          <span style={{ fontSize:'.7rem', color:'var(--text-muted)', opacity:.5 }}>
            {activeId && files.find(f => f.id === activeId) ? fmt(files.find(f => f.id === activeId)!.updated_at) : ''}
          </span>
        </div>
      </div>
    </div>
  );
}