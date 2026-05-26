'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button }  from '@/components/ui/button';
import { Input }   from '@/components/ui/input';
import { Label }   from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import type { Client } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  active:    'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  completed: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  cancelled: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
};

const CURRENCIES = ['USD','GBP','EUR','AUD','INR','SGD'];

const emptyForm = {
  client_id: '', date: '', product_sold: '',
  total_cost: '', upfront_amount: '',
  project_status: 'pending', currency: 'USD', notes: '',
};

export default function AMUpsellsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState({ ...emptyForm });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn:  async () => (await (await fetch('/api/clients')).json()).data ?? [],
  });

  const { data: upsells = [], isLoading } = useQuery({
    queryKey: ['upsells'],
    queryFn:  async () => (await (await fetch('/api/upsells')).json()).data ?? [],
  });

  const { data: targets = [] } = useQuery({
    queryKey: ['revenue-targets'],
    queryFn:  async () => (await (await fetch('/api/revenue-targets')).json()).data ?? [],
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear  = new Date().getFullYear();

  const monthUpsells = upsells.filter((u: any) => {
    const d = new Date(u.date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const monthRevenue = monthUpsells.reduce((s: number, u: any) => s + parseFloat(u.total_cost || 0), 0);
  const monthTarget  = targets.find((t: any) => t.month === currentMonth && t.year === currentYear);
  const targetAmount = monthTarget ? parseFloat(monthTarget.target_amount) : 0;
  const progress     = targetAmount > 0 ? Math.min((monthRevenue / targetAmount) * 100, 100) : 0;

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editId) {
        const res = await fetch('/api/upsells', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...data }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        return json.data;
      } else {
        const res = await fetch('/api/upsells', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        return json.data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['upsells'] });
      toast.success(editId ? 'Upsell updated!' : 'Upsell logged!');
      setShowModal(false);
      setEditId(null);
      setForm({ ...emptyForm });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/upsells?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['upsells'] });
      toast.success('Upsell deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (u: any) => {
    setEditId(u.id);
    setForm({
      client_id:      u.client_id,
      date:           u.date?.split('T')[0] || '',
      product_sold:   u.product_sold,
      total_cost:     String(u.total_cost),
      upfront_amount: String(u.upfront_amount),
      project_status: u.project_status,
      currency:       u.currency,
      notes:          u.notes || '',
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Upsell Tracker</h1>
          <p className="text-muted-foreground text-sm">Log and track upsell deals per client</p>
        </div>
        <Button onClick={() => { setEditId(null); setForm({ ...emptyForm }); setShowModal(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Log Upsell
        </Button>
      </div>

      {/* This month summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">This Month Revenue</p>
            <p className="text-2xl font-bold mt-1">${monthRevenue.toLocaleString()}</p>
            {targetAmount > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>vs Target ${targetAmount.toLocaleString()}</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${progress >= 100 ? 'bg-green-400' : 'bg-primary'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Deals This Month</p>
            <p className="text-2xl font-bold mt-1">{monthUpsells.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Target</p>
            <p className="text-2xl font-bold mt-1">
              {targetAmount > 0 ? `$${targetAmount.toLocaleString()}` : 'Not set'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upsells table */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading...</div>
      ) : upsells.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No upsells logged yet</p>
            <p className="text-sm mt-1">Click "Log Upsell" to record a deal</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Upfront</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Due</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {upsells.map((u: any) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 font-medium">{u.client?.company_name}</td>
                  <td className="px-4 py-3">{u.product_sold}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {u.currency} {parseFloat(u.total_cost).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-green-400 hidden lg:table-cell">
                    {u.currency} {parseFloat(u.upfront_amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-400 hidden lg:table-cell">
                    {u.currency} {parseFloat(u.remaining_due || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[u.project_status]}`}>
                      {u.project_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary"
                        onClick={() => openEdit(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(u.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Upsell' : 'Log Upsell'}</DialogTitle>
            <DialogDescription>Record an upsell deal for a client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Client</Label>
                <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c: Client) => (
                      <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Product / Service Sold</Label>
                <Input placeholder="e.g. SEO Package, Website Redesign"
                  value={form.product_sold}
                  onChange={e => setForm(f => ({ ...f, product_sold: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total Cost</Label>
                <Input type="number" placeholder="0.00"
                  value={form.total_cost}
                  onChange={e => setForm(f => ({ ...f, total_cost: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Upfront Amount</Label>
                <Input type="number" placeholder="0.00"
                  value={form.upfront_amount}
                  onChange={e => setForm(f => ({ ...f, upfront_amount: e.target.value }))} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Project Status</Label>
                <Select value={form.project_status} onValueChange={v => setForm(f => ({ ...f, project_status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Notes</Label>
                <Textarea placeholder="Any additional notes..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1"
                disabled={saveMutation.isPending || !form.client_id || !form.product_sold || !form.date || !form.total_cost}
                onClick={() => saveMutation.mutate(form)}>
                {editId ? 'Update' : 'Log Upsell'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
