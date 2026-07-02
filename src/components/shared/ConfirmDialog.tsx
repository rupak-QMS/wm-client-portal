'use client';
import { Loader2 } from 'lucide-react';

interface Props {
  open:        boolean;
  title:       string;
  description: string;
  onConfirm:   () => void;
  onCancel:    () => void;
  loading?:    boolean;
}

export function ConfirmDialog({ open, title, description, onConfirm, onCancel, loading }: Props) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={onCancel} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:420, background:'#0e0e20', border:'1px solid rgba(248,113,113,.25)', borderRadius:18, padding:28 }}>
        <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#f1f5f9', marginBottom:8 }}>{title}</h2>
        <p style={{ fontSize:'.85rem', color:'rgba(148,163,184,.6)', marginBottom:24 }}>{description}</p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} disabled={loading}
            style={{ flex:1, height:40, borderRadius:10, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'rgba(148,163,184,.7)', fontSize:'.88rem', fontWeight:600, cursor:'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ flex:1, height:40, borderRadius:10, border:'none', background:'linear-gradient(135deg,#dc2626,#ef4444)', color:'#fff', fontSize:'.88rem', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
