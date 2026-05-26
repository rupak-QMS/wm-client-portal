'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';
import type { User } from '@/types';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  active:    'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  completed: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  cancelled: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
};

const currentYear  = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function ManagerUpsellsPage() {
  const [filterAM,    setFilterAM]    = useState('all');
  const [filterMonth, setFilterMonth] = useState(String(currentMonth));
  const [filterYear,  setFilterYear]  = useState(String(currentYear));

  const { data: managers = [] } = useQuery<User[]>({
    queryKey: ['account-managers'],
    queryFn:  async () => (await (await fetch('/api/users?role=account_manager')).json()).data ?? [],
  });

  const params = new URLSearchParams();
  if (filterAM !== 'all') params.set('am_id', filterAM);
  if (filterMonth) params.set('month', filterMonth);
  if (filterYear)  params.set('year',  filterYear);

  const { data: upsells = [], isLoading } = useQuery({
    queryKey: ['upsells', filterAM, filterMonth, filterYear],
    queryFn:  async () => (await (await fetch(`/api/upsells?${params}`)).json()).data ?? [],
  });

  const { data: targets = [] } = useQuery({
    queryKey: ['revenue-targets', filterAM, filterMonth, filterYear],
    queryFn:  async () => {
      const p = new URLSearchParams();
      if (filterAM !== 'all') p.set('am_id', filterAM);
      if (filterMonth) p.set('month', filterMonth);
      if (filterYear)  p.set('year',  filterYear);
      return (await (await fetch(`/api/revenue-targets?${p}`)).json()).data ?? [];
    },
  });

  const totalRevenue = upsells.reduce((sum: number, u: any) => sum + parseFloat(u.total_cost || 0), 0);
  const totalUpfront = upsells.reduce((sum: number, u: any) => sum + parseFloat(u.upfront_amount || 0), 0);
  const totalDue     = upsells.reduce((sum: number, u: any) => sum + parseFloat(u.remaining_due || 0), 0);
  const targetAmount = targets.reduce((sum: number, t: any) => sum + parseFloat(t.target_amount || 0), 0);
  const progress     = targetAmount > 0 ? Math.min((totalRevenue / targetAmount) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upsell Tracker</h1>
        <p className="text-muted-foreground text-sm">Internal revenue tracking — not visible to clients</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterAM} onValueChange={setFilterAM}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All AMs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Account Managers</SelectItem>
            {managers.map((m: User) => (
              <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold mt-1">${totalRevenue.toLocaleString()}</p>
            {targetAmount > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Target</p>
            <p className="text-2xl font-bold mt-1">${targetAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Upfront Collected</p>
            <p className="text-2xl font-bold mt-1 text-green-400">${totalUpfront.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Remaining Due</p>
            <p className="text-2xl font-bold mt-1 text-amber-400">${totalDue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upsells Table */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading...</div>
      ) : upsells.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No upsells recorded</p>
            <p className="text-sm mt-1">Account managers can log upsells from their portal</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Account Manager</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Upfront</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Due</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {upsells.map((u: any) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 font-medium">{u.client?.company_name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{u.accountManager?.full_name}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
