'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Target, Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@/types';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const CURRENCIES = ['USD','GBP','EUR','AUD','INR','SGD'];

const currentYear  = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function TargetsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    account_manager_id: '',
    month:    String(currentMonth),
    year:     String(currentYear),
    target_amount: '',
    currency: 'USD',
  });

  const { data: managers = [] } = useQuery<User[]>({
    queryKey: ['account-managers'],
    queryFn:  async () => (await (await fetch('/api/users?role=account_manager')).json()).data ?? [],
  });

  const { data: targets = [], isLoading } = useQuery({
    queryKey: ['revenue-targets'],
    queryFn:  async () => (await (await fetch('/api/revenue-targets')).json()).data ?? [],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res  = await fetch('/api/revenue-targets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['revenue-targets'] });
      toast.success('Target saved!');
      setShowModal(false);
      setForm({ account_manager_id: '', month: String(currentMonth), year: String(currentYear), target_amount: '', currency: 'USD' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Revenue Targets</h1>
          <p className="text-muted-foreground text-sm">Set monthly revenue targets for account managers</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Set Target
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading...</div>
      ) : targets.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No targets set yet</p>
            <p className="text-sm mt-1">Click "Set Target" to create a revenue target</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {targets.map((t: any) => (
            <Card key={t.id} className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{t.accountManager?.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {MONTHS[t.month - 1]} {t.year}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon"
                    onClick={() => {
                      setForm({
                        account_manager_id: t.account_manager_id,
                        month:    String(t.month),
                        year:     String(t.year),
                        target_amount: String(t.target_amount),
                        currency: t.currency,
                      });
                      setShowModal(true);
                    }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold">
                    {t.currency} {parseFloat(t.target_amount).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Monthly target</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Revenue Target</DialogTitle>
            <DialogDescription>Set a monthly revenue target for an account manager</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Account Manager</Label>
              <Select value={form.account_manager_id} onValueChange={v => setForm(f => ({ ...f, account_manager_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select AM" /></SelectTrigger>
                <SelectContent>
                  {managers.map((m: User) => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={form.month} onValueChange={v => setForm(f => ({ ...f, month: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={form.year} onValueChange={v => setForm(f => ({ ...f, year: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Amount</Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={form.target_amount}
                  onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1"
                disabled={saveMutation.isPending || !form.account_manager_id || !form.target_amount}
                onClick={() => saveMutation.mutate(form)}>
                Save Target
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
