'use client';

import { useState }       from 'react';
import { useForm }        from 'react-hook-form';
import { zodResolver }    from '@hookform/resolvers/zod';
import { createClientSchema } from '@/lib/validations/client.schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 }        from 'lucide-react';
import { toast }          from 'sonner';
import type { User, CreateClientFormValues } from '@/types';

const inpStyle: React.CSSProperties = {
  width: '100%', height: 40,
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(124,58,237,.18)',
  borderRadius: 9, padding: '0 12px',
  fontSize: '.85rem', color: '#f1f5f9', outline: 'none',
  transition: 'all .2s',
};
const lblStyle: React.CSSProperties = {
  fontSize: '.75rem', color: 'rgba(148,163,184,.55)',
  textTransform: 'uppercase', letterSpacing: '.05em',
  display: 'block', marginBottom: 6,
};
const errStyle: React.CSSProperties = {
  fontSize: '.72rem', color: '#f87171', marginTop: 4,
};
const selStyle: React.CSSProperties = { ...inpStyle, cursor: 'pointer' };

interface Props {
  open:      boolean;
  onClose:   () => void;
  onSuccess: () => void;
  managers:  User[];
}

export function AddClientModal({ open, onClose, onSuccess, managers }: Props) {
  const [loading, setLoading] = useState(false);
  const [assignedAM, setAssignedAM] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } =
    useForm<CreateClientFormValues>({ resolver: zodResolver(createClientSchema) });

  const onSubmit = async (data: CreateClientFormValues) => {
    setLoading(true);
    try {
      const res  = await fetch('/api/clients', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success('Client created successfully!');
      reset();
      setAssignedAM('');
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>Fill in the client details below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>

          {/* Company Name */}
          <div>
            <label style={lblStyle}>Company Name</label>
            <input style={inpStyle} placeholder="Acme Corporation"
              {...register('company_name')} disabled={loading}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.65)'; e.currentTarget.style.background = 'rgba(124,58,237,.07)'; }}
              onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.18)'; e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }} />
            {errors.company_name && <p style={errStyle}>{errors.company_name.message}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Contact Person */}
            <div>
              <label style={lblStyle}>Contact Person</label>
              <input style={inpStyle} placeholder="John Smith"
                {...register('contact_person')} disabled={loading}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.65)'; e.currentTarget.style.background = 'rgba(124,58,237,.07)'; }}
                onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.18)'; e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }} />
              {errors.contact_person && <p style={errStyle}>{errors.contact_person.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label style={lblStyle}>Email</label>
              <input style={inpStyle} type="email" placeholder="john@acme.com"
                {...register('email')} disabled={loading}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.65)'; e.currentTarget.style.background = 'rgba(124,58,237,.07)'; }}
                onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.18)'; e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }} />
              {errors.email && <p style={errStyle}>{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label style={lblStyle}>Phone</label>
              <input style={inpStyle} placeholder="+44 20 7946 0000"
                {...register('phone')} disabled={loading}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.65)'; e.currentTarget.style.background = 'rgba(124,58,237,.07)'; }}
                onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.18)'; e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }} />
            </div>

            {/* Website */}
            <div>
              <label style={lblStyle}>Website</label>
              <input style={inpStyle} placeholder="https://acme.com"
                {...register('website')} disabled={loading}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.65)'; e.currentTarget.style.background = 'rgba(124,58,237,.07)'; }}
                onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.18)'; e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }} />
              {errors.website && <p style={errStyle}>{errors.website.message}</p>}
            </div>
          </div>

          {/* Account Manager */}
          <div>
            <label style={lblStyle}>Assign Account Manager</label>
            <select style={selStyle} value={assignedAM}
              onChange={e => { setAssignedAM(e.target.value); setValue('assigned_account_manager', e.target.value); }}
              disabled={loading}>
              <option value="">Select account manager</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label style={lblStyle}>Notes</label>
            <textarea {...register('notes')} disabled={loading} rows={3}
              placeholder="Any additional notes..."
              style={{ ...inpStyle, height: 'auto', resize: 'none', padding: '10px 12px' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.65)'; e.currentTarget.style.background = 'rgba(124,58,237,.07)'; }}
              onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.18)'; e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="wm-btn-ghost" onClick={onClose} disabled={loading}
              style={{ flex: 1, height: 40 }}>
              Cancel
            </button>
            <button type="submit" className="wm-btn-primary" disabled={loading}
              style={{ flex: 1, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              Create Client
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}