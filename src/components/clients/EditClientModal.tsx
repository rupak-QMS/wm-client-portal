'use client';

import { useState, useEffect } from 'react';
import { useForm }             from 'react-hook-form';
import { Button }              from '@/components/ui/button';
import { Input }               from '@/components/ui/input';
import { Label }               from '@/components/ui/label';
import { Textarea }            from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast }   from 'sonner';
import type { Client, User } from '@/types';

interface Props {
  open:      boolean;
  onClose:   () => void;
  onSuccess: () => void;
  client:    Client | null;
  managers:  User[];
}

export function EditClientModal({ open, onClose, onSuccess, client, managers }: Props) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    if (client) {
      reset({
        company_name:   client.company_name,
        contact_person: client.contact_person,
        email:          client.email,
        phone:          client.phone ?? '',
        website:        client.website ?? '',
        notes:          client.notes ?? '',
      });
    }
  }, [client, reset]);

  const onSubmit = async (data: any) => {
    if (!client) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Company Name</Label>
              <Input {...register('company_name')} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input {...register('contact_person')} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register('email')} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register('phone')} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input {...register('website')} disabled={loading} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Assign Account Manager</Label>
              <Select
                defaultValue={client?.assigned_account_manager ?? ''}
                onValueChange={v => setValue('assigned_account_manager', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Status</Label>
              <Select
                defaultValue={client?.status ?? 'active'}
                onValueChange={v => setValue('status', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Notes</Label>
              <Textarea {...register('notes')} disabled={loading} rows={3} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1"
              onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}