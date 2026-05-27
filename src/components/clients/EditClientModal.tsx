'use client';

import { useState, useEffect } from 'react';
import { useForm }             from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 }             from 'lucide-react';
import { toast }               from 'sonner';
import type { Client, User }   from '@/types';

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
const selStyle: React.CSSProperties = { ...inpStyle, cursor: 'pointer' };

const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = 'rgba(124,58,237,.65)';
  e.currentTarget.style.background  = 'rgba(124,58,237,.07)';
};
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = 'rgba(124,58,237,.18)';
  e.currentTarget.style.background  = 'rgba(255,255,255,.04)';
};

interface Props {
  open:      boolean;
  onClose:   () => void;
  onSuccess: () => void;
  client:    Client | null;
  managers:  User[];
}

export function EditClientModal({ open, onClose, onSuccess, client, managers }: Props) {
  const [loading,    setLoading]    = useState(false);
  const [assignedAM, setAssignedAM] = useState('');
  const [status,     setStatus]     = useState('active');

  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    if (client) {
      reset({
        company_name:   client.company_name,
        contact_person: client.contact_person,
        email:          client.email,
        phone:          client.phone   ?? '',
        website:        client.website ?? '',
        notes:          client.notes   ?? '',
      });
      setAssignedAM(client.assigned_account_manager ?? '');
      setStatus(client.status ?? 'active');
    }
  }, [client, reset]);

  const onSubmit = async (data: any) => {
    if (!client) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/clients/${client.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success('Client updated!');
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
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>Update client details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>

          {/* Company Name */}
          <div>
            <label style={lblStyle}>Company Name</label>
            <input style={inpStyle} {...register('company_name')} disabled={loading} onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lblStyle}>Contact Person</label>
              <input style={inpStyle} {...register('contact_person')} disabled={loading} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label style={lblStyle}>Email</label>
              <input style={inpStyle} type="email" {...register('email')} disabled={loading} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label style={lblStyle}>Phone</label>
              <input style={inpStyle} {...register('phone')} disabled={loading} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label style={lblStyle}>Website</label>
              <input style={inpStyle} {...register('website')} disabled={loading} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>

          {/* Account Manager */}
          <div>
            <label style={lblStyle}>Assign Account Manager</label>
            <select style={selStyle} value={assignedAM} disabled={loading}
              onChange={e => { setAssignedAM(e.target.value); setValue('assigned_account_manager', e.target.value); }}>
              <option value="">Select account manager</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={lblStyle}>Status</label>
            <select style={selStyle} value={status} disabled={loading}
              onChange={e => { setStatus(e.target.value); setValue('status', e.target.value); }}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label style={lblStyle}>Notes</label>
            <textarea {...register('notes')} disabled={loading} rows={3}
              style={{ ...inpStyle, height: 'auto', resize: 'none', padding: '10px 12px' }}
              onFocus={onFocus} onBlur={onBlur} />
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
              Save Changes
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}