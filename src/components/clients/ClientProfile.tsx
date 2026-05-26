'use client';

import { useState }     from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter }    from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge }        from '@/components/ui/badge';
import { Button }       from '@/components/ui/button';
import { Input }        from '@/components/ui/input';
import { Label }        from '@/components/ui/label';
import { Textarea }     from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  ArrowLeft, Building2, Mail, Phone, Globe,
  User, FileText, TrendingUp, Calendar,
  Plus, Pencil, Trash2, Download,
} from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { toast }      from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  active:    'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  completed: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  cancelled: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
};

const CLIENT_STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  inactive:  'bg-gray-100   text-gray-700   dark:bg-gray-900/30   dark:text-gray-400',
  suspended: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
};

const REPORT_TYPE_COLORS: Record<string, string> = {
  seo:            'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  website_update: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  analytics:      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  audit:          'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  other:          'bg-gray-100   text-gray-700   dark:bg-gray-900/30   dark:text-gray-400',
};

const CURRENCIES = ['USD','GBP','EUR','AUD','INR','SGD'];

const emptyUpsell = {
  client_id: '', date: '', product_sold: '',
  total_cost: '', upfront_amount: '',
  project_status: 'pending', currency: 'USD', notes: '',
};

interface Props {
  clientId:  string;
  canEdit:   boolean;
  backHref:  string;
}

export function ClientProfile({ clientId, canEdit, backHref }: Props) {
  const router = useRouter();
  const qc     = useQueryClient();

  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [editUpsellId,    setEditUpsellId]    = useState<string | null>(null);
  const [upsellForm,      setUpsellForm]      = useState({ ...emptyUpsell });
  const [activeTab,       setActiveTab]       = useState<'overview' | 'upsells' | 'reports'>('overview');

  // Fetch client
  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn:  async () => (await (await fetch(`/api/clients/${clientId}`)).json()).data,
    enabled:  !!clientId,
  });

  // Fetch reports
  const { data: reports = [] } = useQuery({
    queryKey: ['reports', clientId],
    queryFn:  async () => (await (await fetch(`/api/reports?client_id=${clientId}`)).json()).data ?? [],
    enabled:  !!clientId,
  });

  // Fetch upsells
  const { data: upsells = [] } = useQuery({
    queryKey: ['upsells', clientId],
    queryFn:  async () => (await (await fetch(`/api/upsells?client_id=${clientId}`)).json()).data ?? [],
    enabled:  !!clientId,
  });

  const totalRevenue  = upsells.reduce((s: number, u: any) => s + parseFloat(u.total_cost    || 0), 0);
  const totalUpfront  = upsells.reduce((s: number, u: any) => s + parseFloat(u.upfront_amount|| 0), 0);
  const totalDue      = upsells.reduce((s: number, u: any) => s + parseFloat(u.remaining_due || 0), 0);

  // Save upsell
  const saveUpsell = useMutation({
    mutationFn: async (data: any) => {
      const method = editUpsellId ? 'PATCH' : 'POST';
      const body   = editUpsellId ? { id: editUpsellId, ...data } : { ...data, client_id: clientId };
      const res    = await fetch('/api/upsells', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['upsells', clientId] });
      toast.success(editUpsellId ? 'Upsell updated!' : 'Upsell logged!');
      setShowUpsellModal(false);
      setEditUpsellId(null);
      setUpsellForm({ ...emptyUpsell });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Delete upsell
  const deleteUpsell = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/upsells?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['upsells', clientId] });
      toast.success('Upsell deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEditUpsell = (u: any) => {
    setEditUpsellId(u.id);
    setUpsellForm({
      client_id:      u.client_id,
      date:           u.date?.split('T')[0] || '',
      product_sold:   u.product_sold,
      total_cost:     String(u.total_cost),
      upfront_amount: String(u.upfront_amount),
      project_status: u.project_status,
      currency:       u.currency,
      notes:          u.notes || '',
    });
    setShowUpsellModal(true);
  };

  if (isLoading) return <div className="text-center py-20 text-muted-foreground">Loading...</div>;
  if (!client)   return <div className="text-center py-20 text-muted-foreground">Client not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(backHref)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{client.company_name}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${CLIENT_STATUS_COLORS[client.status]}`}>
              {client.status}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Account Manager: <span className="font-medium text-foreground">
              {client.assignedManager?.full_name ?? 'Unassigned'}
            </span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold mt-1">${totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Collected</p>
            <p className="text-2xl font-bold mt-1 text-green-400">${totalUpfront.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Remaining Due</p>
            <p className="text-2xl font-bold mt-1 text-amber-400">${totalDue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Reports</p>
            <p className="text-2xl font-bold mt-1">{reports.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['overview', 'upsells', 'reports'] as const).map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {tab}
            {tab === 'upsells' && upsells.length > 0 && (
              <span className="ml-2 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">
                {upsells.length}
              </span>
            )}
            {tab === 'reports' && reports.length > 0 && (
              <span className="ml-2 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">
                {reports.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contact Person</p>
                    <p className="text-sm font-medium">{client.contact_person}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{client.email}</p>
                  </div>
                </div>
                {client.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{client.phone}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {client.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Website</p>
                      <a href={client.website} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline">
                        {client.website.replace('https://', '').replace('http://', '')}
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Account Manager</p>
                    <p className="text-sm font-medium">{client.assignedManager?.full_name ?? 'Unassigned'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Client Since</p>
                    <p className="text-sm font-medium">{formatTime(client.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
            {client.notes && (
              <div className="mt-6 p-4 bg-muted/40 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Notes</p>
                <p className="text-sm">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upsells Tab */}
      {activeTab === 'upsells' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{upsells.length} upsell deal{upsells.length !== 1 ? 's' : ''} recorded</p>
            {canEdit && (
              <Button size="sm" onClick={() => {
                setEditUpsellId(null);
                setUpsellForm({ ...emptyUpsell, client_id: clientId });
                setShowUpsellModal(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Log Upsell
              </Button>
            )}
          </div>

          {upsells.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No upsells recorded</p>
                {canEdit && <p className="text-sm mt-1">Click "Log Upsell" to record a deal</p>}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upsells.map((u: any) => (
                <Card key={u.id} className="border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{u.product_sold}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[u.project_status]}`}>
                            {u.project_status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(u.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                          {u.accountManager && ` · ${u.accountManager.full_name}`}
                        </p>
                        {u.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">"{u.notes}"</p>
                        )}
                      </div>
                      {canEdit && (
                        <div className="flex gap-1 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => openEditUpsell(u)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteUpsell.mutate(u.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 pt-3 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Cost</p>
                        <p className="text-sm font-bold">{u.currency} {parseFloat(u.total_cost).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Upfront Paid</p>
                        <p className="text-sm font-bold text-green-400">{u.currency} {parseFloat(u.upfront_amount).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Remaining Due</p>
                        <p className="text-sm font-bold text-amber-400">{u.currency} {parseFloat(u.remaining_due || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No reports uploaded</p>
              </CardContent>
            </Card>
          ) : (
            reports.map((r: any) => (
              <Card key={r.id} className="border-border/50 hover:border-border transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Uploaded by {r.uploader?.full_name} · {formatTime(r.created_at)}
                      </p>
                      {r.description && (
                        <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${REPORT_TYPE_COLORS[r.report_type] ?? ''}`}>
                        {r.report_type.replace('_', ' ')}
                      </span>
                      <a href={r.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          Download
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Upsell Modal */}
      <Dialog open={showUpsellModal} onOpenChange={setShowUpsellModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editUpsellId ? 'Edit Upsell' : 'Log Upsell'}</DialogTitle>
            <DialogDescription>
              Record an upsell deal for {client.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Product / Service Sold</Label>
              <Input placeholder="e.g. SEO Package, Website Redesign"
                value={upsellForm.product_sold}
                onChange={e => setUpsellForm(f => ({ ...f, product_sold: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date"
                  value={upsellForm.date}
                  onChange={e => setUpsellForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={upsellForm.currency} onValueChange={v => setUpsellForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total Cost</Label>
                <Input type="number" placeholder="0.00"
                  value={upsellForm.total_cost}
                  onChange={e => setUpsellForm(f => ({ ...f, total_cost: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Upfront Amount</Label>
                <Input type="number" placeholder="0.00"
                  value={upsellForm.upfront_amount}
                  onChange={e => setUpsellForm(f => ({ ...f, upfront_amount: e.target.value }))} />
              </div>
            </div>
            {upsellForm.total_cost && upsellForm.upfront_amount && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <span className="text-muted-foreground">Remaining Due: </span>
                <span className="font-bold text-amber-400">
                  {upsellForm.currency} {(parseFloat(upsellForm.total_cost || '0') - parseFloat(upsellForm.upfront_amount || '0')).toLocaleString()}
                </span>
              </div>
            )}
            <div className="space-y-2">
              <Label>Project Status</Label>
              <Select value={upsellForm.project_status} onValueChange={v => setUpsellForm(f => ({ ...f, project_status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Any additional notes..."
                value={upsellForm.notes}
                onChange={e => setUpsellForm(f => ({ ...f, notes: e.target.value }))}
                rows={3} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowUpsellModal(false)}>Cancel</Button>
              <Button className="flex-1"
                disabled={saveUpsell.isPending || !upsellForm.product_sold || !upsellForm.date || !upsellForm.total_cost}
                onClick={() => saveUpsell.mutate(upsellForm)}>
                {editUpsellId ? 'Update' : 'Log Upsell'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
