'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const PRODUCTS = ['Wealth Management', 'Portfolio Advisory', 'Insurance', 'Mutual Funds', 'PMS', 'AIF', 'Other'];

export default function SalesSubmitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    client_name: '', client_email: '', client_company: '', client_phone: '',
    product: '', deal_amount: '', notes: '',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.client_name || !form.product || !form.deal_amount) {
      toast.error('Client name, product and deal amount are required.');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/sales-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast.success('Sale submitted for manager approval!');
      router.push('/sales/logs');
    } else {
      const err = await res.json();
      toast.error(err.error || 'Submission failed.');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Submit New Sale</h1>
        <p className="text-muted-foreground text-sm">
          Fill in client and deal details. Manager will review and assign an Account Manager.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Client Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Client Name *</Label>
            <Input placeholder="John Doe" value={form.client_name} onChange={e => set('client_name', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Company Name</Label>
            <Input placeholder="Acme Pvt Ltd" value={form.client_company} onChange={e => set('client_company', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" placeholder="john@acme.com" value={form.client_email} onChange={e => set('client_email', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input placeholder="+91 98765 43210" value={form.client_phone} onChange={e => set('client_phone', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Deal Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Product *</Label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              value={form.product}
              onChange={e => set('product', e.target.value)}
            >
              <option value="">Select product…</option>
              {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Deal Amount (₹) *</Label>
            <Input
              type="number" placeholder="500000"
              value={form.deal_amount}
              onChange={e => set('deal_amount', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label>Notes / Context</Label>
            <Textarea
              placeholder="Any additional context about the deal…"
              rows={3}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Submitting…' : 'Submit for Approval'}
        </Button>
      </div>
    </div>
  );
}