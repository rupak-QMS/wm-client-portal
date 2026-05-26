'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClientSchema } from '@/lib/validations/client.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { User, CreateClientFormValues } from '@/types';

interface Props {
  open:     boolean;
  onClose:  () => void;
  onSuccess: () => void;
  managers: User[];
}

export function AddClientModal({ open, onClose, onSuccess, managers }: Props) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } =
    useForm<CreateClientFormValues>({
      resolver: zodResolver(createClientSchema),
    });

  const onSubmit = async (data: CreateClientFormValues) => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success('Client created successfully!');
      reset();
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
          <DialogDescription>
            Fill in the client details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Company Name</Label>
              <Input placeholder="Acme Corporation"
                {...register('company_name')} disabled={loading} />
              {errors.company_name && (
                <p className="text-destructive text-xs">{errors.company_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input placeholder="John Smith"
                {...register('contact_person')} disabled={loading} />
              {errors.contact_person && (
                <p className="text-destructive text-xs">{errors.contact_person.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="john@acme.com"
                {...register('email')} disabled={loading} />
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input placeholder="+44 20 7946 0000"
                {...register('phone')} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input placeholder="https://acme.com"
                {...register('website')} disabled={loading} />
              {errors.website && (
                <p className="text-destructive text-xs">{errors.website.message}</p>
              )}
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Assign Account Manager</Label>
              <Select onValueChange={v => setValue('assigned_account_manager', v)}>
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
              <Label>Notes</Label>
              <Textarea placeholder="Any additional notes..."
                {...register('notes')} disabled={loading} rows={3} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1"
              onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Client
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}