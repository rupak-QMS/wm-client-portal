'use client';
import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

type NoteFile = { id: string; title: string; content: string; updated_at: string };

const KEY = 'wm_notepad_files';

const load = (): NoteFile[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};
const persist = (notes: NoteFile[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch {}
};

export default function NotepadPage() {
  const [files, setFiles]       = useState<NoteFile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [content, setContent]   = useState('');
  const [title, setTitle]       = useState('');
  const saveTimer               = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = load();
    if (saved.length === 0) {
      const first: NoteFile = { id: Date.now().toString(), title: 'My Notes', content: '', updated_at: new Date().toISOString() };
      persist([first]);
      setFiles([first]);
      setActiveId(first.id);
      setTitle(first.title);
      setContent(first.content);
    } else {
      setFiles(saved);
      setActiveId(saved[0].id);
      setTitle(saved[0].title);
      setContent(saved[0].content);
    }
  }, []);

  const selectFile = (f: NoteFile) => {
    setActiveId(f.id);
    setTitle(f.title);
    setContent(f.content);
  };

  const autosave = (newContent: string, newTitle: string, id: string, currentFiles: NoteFile[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const updated = currentFiles.map(f =>
        f.id === id ? { ...f, title: newTitle, content: newContent, updated_at: new Date().toISOString() } : f
      );
      setFiles(updated);
      persist(updated);
    }, 600);
  };

  const handleContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (activeId) autosave(e.target.value, title, activeId, files);
  };

  const handleTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (activeId) autosave(content, e.target.value, activeId, files);
  };

  const newFile = () => {
    const f: NoteFile = { id: Date.now().toString(), title: 'Untitled', content: '', updated_at: new Date().toISOString() };
    const updated = [f, ...files];
    setFiles(updated);
    persist(updated);
    selectFile(f);
  };

  const deleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length === 1) { toast.error("Can't delete the last note."); return; }
    const updated = files.filter(f => f.id !== id);
    persist(updated);
    setFiles(updated);
    if (activeId === id) selectFile(updated[0]);
    toast.success('Note deleted.');
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-AU', { day:'2-digit', month:'short', year:'numeric' })
      + ' ' + d.toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' });
  };

  return (
    <div style={{ display:'flex', height:'calc(100vh - 60px)', overflow:'hidden' }}>

      {/* ── Sidebar ── */}
      <div style={{ width:220, borderRight:'1px solid rgba(124,58,237,.12)', display:'flex', flexDirection:'column', flexShrink:0, background:'rgba(6,6,15,.6)' }}>
        <div style={{ padding:'14px 12px 10px', borderBottom:'1px solid rgba(124,58,237,.1)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:'.75rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 }}>Notes</span>
          <button onClick={newFile}
            style={{ width:26, height:26, borderRadius:7, border:'none', background:'rgba(124,58,237,.15)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#a78bfa' }}
            title="New note">
            <Plus size={14}/>
          </button>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {files.map(f => (
            <div key={f.id} onClick={() => selectFile(f)}
              style={{ padding:'10px 12px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,.03)', background: activeId===f.id?'rgba(124,58,237,.15)':'transparent', transition:'background .15s', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:6 }}
              onMouseEnter={e => { if (activeId!==f.id)(e.currentTarget as HTMLDivElement).style.background='rgba(124,58,237,.07)'; }}
              onMouseLeave={e => { if (activeId!==f.id)(e.currentTarget as HTMLDivElement).style.background='transparent'; }}>
              <div style={{ minWidth:0 }}>
                <p style={{ fontSize:'.82rem', fontWeight: activeId===f.id?600:400, color: activeId===f.id?'#f1f5f9':'rgba(148,163,184,.8)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.title}</p>
                <p style={{ fontSize:'.68rem', color:'rgba(148,163,184,.3)', marginTop:3 }}>{fmt(f.updated_at)}</p>
              </div>
              <button onClick={e => deleteFile(f.id, e)}
                style={{ width:20, height:20, borderRadius:5, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.25)', flexShrink:0, marginTop:1 }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color='#f87171'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color='rgba(148,163,184,.25)'}>
                <X size={11}/>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main editor ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Title bar */}
        <div style={{ padding:'10px 20px', borderBottom:'1px solid rgba(124,58,237,.1)', display:'flex', alignItems:'center', gap:10, background:'rgba(6,6,15,.4)', flexShrink:0 }}>
          <FileText size={14} style={{ color:'rgba(148,163,184,.4)', flexShrink:0 }} />
          <input value={title} onChange={handleTitle}
            style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:'.9rem', fontWeight:600, color:'#f1f5f9', padding:0 }}
            placeholder="Note title..." />
          <span style={{ fontSize:'.7rem', color:'rgba(148,163,184,.25)', flexShrink:0 }}>Auto-saved</span>
        </div>

        {/* Textarea */}
        <textarea
          value={content}
          onChange={handleContent}
          placeholder={"Start typing your notes here...\n\nCallback notes, client details, reminders — anything you need."}
          style={{
            flex:1, width:'100%', resize:'none', border:'none', outline:'none',
            background:'transparent', padding:'20px 24px',
            fontSize:'.95rem', lineHeight:1.8,
            color:'rgba(241,245,249,.9)',
            fontFamily:"'Consolas','Courier New',monospace",
          }}
        />

        {/* Status bar */}
        <div style={{ padding:'6px 20px', borderTop:'1px solid rgba(124,58,237,.08)', display:'flex', justifyContent:'space-between', background:'rgba(6,6,15,.4)', flexShrink:0 }}>
          <span style={{ fontSize:'.7rem', color:'rgba(148,163,184,.3)' }}>
            {content.length} characters · {content.split(/\s+/).filter(Boolean).length} words · {content.split('\n').length} lines
          </span>
          <span style={{ fontSize:'.7rem', color:'rgba(148,163,184,.3)' }}>
            {activeId && files.find(f => f.id === activeId) ? fmt(files.find(f => f.id === activeId)!.updated_at) : ''}
          </span>
        </div>
      </div>
    </div>
  );
}