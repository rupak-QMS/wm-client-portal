'use client';

import { useState }        from 'react';
import { createUserAction } from '@/lib/auth';
import { Loader2 }          from 'lucide-react';
import { toast }            from 'sonner';

interface Props {
  open:      boolean;
  onClose:   () => void;
  onSuccess: () => void;
}

const inp: React.CSSProperties = {
  width: '100%', height: 40,
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(124,58,237,.18)',
  borderRadius: 9, padding: '0 12px',
  fontSize: '.85rem', color: '#f1f5f9', outline: 'none',
};
const lbl: React.CSSProperties = {
  fontSize: '.75rem', color: 'rgba(148,163,184,.55)',
  textTransform: 'uppercase', letterSpacing: '.05em',
  display: 'block', marginBottom: 6,
};

export function AddAMModal({ open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name || form.full_name.length < 2) e.full_name = 'Name must be at least 2 characters';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))  e.email    = 'Enter a valid email';
    if (!form.password || form.password.length < 8)        e.password = 'Password must be at least 8 characters';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    const result = await createUserAction({ ...form, role: 'account_manager' });
    setLoading(false);
    if (result?.error) { toast.error(result.error); return; }
    toast.success('Account manager created!');
    setForm({ full_name: '', email: '', password: '' });
    onSuccess();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)' }} />

      {/* Modal */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, background: '#0e0e20', border: '1px solid rgba(124,58,237,.3)', borderRadius: 18, padding: 28 }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Add Account Manager</h2>
        <p style={{ fontSize: '.82rem', color: 'rgba(148,163,184,.5)', marginBottom: 20 }}>Create a new account manager account.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Full Name</label>
            <input style={inp} placeholder="John Smith" value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} disabled={loading} />
            {errors.full_name && <p style={{ color: '#f87171', fontSize: '.75rem', marginTop: 4 }}>{errors.full_name}</p>}
          </div>
          <div>
            <label style={lbl}>Email</label>
            <input style={inp} type="email" placeholder="john@webmaniacs.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} disabled={loading} />
            {errors.email && <p style={{ color: '#f87171', fontSize: '.75rem', marginTop: 4 }}>{errors.email}</p>}
          </div>
          <div>
            <label style={lbl}>Password</label>
            <input style={inp} type="password" placeholder="Min. 8 characters" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} disabled={loading} />
            {errors.password && <p style={{ color: '#f87171', fontSize: '.75rem', marginTop: 4 }}>{errors.password}</p>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="wm-btn-ghost" onClick={onClose} disabled={loading} style={{ flex: 1, height: 40 }}>
            Cancel
          </button>
          <button className="wm-btn-primary" onClick={handleSubmit} disabled={loading} style={{ flex: 1, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}