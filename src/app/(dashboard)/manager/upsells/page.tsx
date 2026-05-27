'use client';
import { useState }  from 'react';
import { useQuery }  from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import type { User } from '@/types';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(251,191,36,.12)',  color: '#fbbf24' },
  active:    { bg: 'rgba(96,165,250,.12)',  color: '#60a5fa' },
  completed: { bg: 'rgba(52,211,153,.12)',  color: '#34d399' },
  cancelled: { bg: 'rgba(248,113,113,.12)', color: '#f87171' },
};

const currentYear  = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const selStyle: React.CSSProperties = {
  height: 36,
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(124,58,237,.18)',
  borderRadius: 9,
  color: '#f1f5f9',
  fontSize: '.82rem',
  padding: '0 12px',
  outline: 'none',
  cursor: 'pointer',
};

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

  const totalRevenue = upsells.reduce((s: number, u: any) => s + parseFloat(u.total_cost    || 0), 0);
  const totalUpfront = upsells.reduce((s: number, u: any) => s + parseFloat(u.upfront_amount || 0), 0);
  const totalDue     = upsells.reduce((s: number, u: any) => s + parseFloat(u.remaining_due  || 0), 0);
  const targetAmount = targets.reduce((s: number, t: any) => s + parseFloat(t.target_amount  || 0), 0);
  const progress     = targetAmount > 0 ? Math.min((totalRevenue / targetAmount) * 100, 100) : 0;

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ marginBottom: 28 }} className="wm-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <TrendingUp size={15} style={{ color: '#34d399' }} />
          <span style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Revenue</span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Upsell Tracker</h1>
        <p style={{ fontSize: '.875rem', color: 'rgba(148,163,184,.5)' }}>Internal revenue tracking — not visible to clients</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }} className="wm-fade-up">
        <select style={{ ...selStyle, width: 200 }} value={filterAM} onChange={e => setFilterAM(e.target.value)}>
          <option value="all">All Account Managers</option>
          {managers.map((m: User) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
        </select>
        <select style={{ ...selStyle, width: 140 }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          {MONTHS.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
        </select>
        <select style={{ ...selStyle, width: 110 }} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginBottom: 24 }} className="wm-fade-up-2">
        <div className="wm-stat">
          <p style={{ fontSize: '.7rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Total Revenue</p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9' }}>${totalRevenue.toLocaleString()}</p>
          {targetAmount > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: 'rgba(148,163,184,.45)', marginBottom: 5 }}>
                <span>Progress</span><span>{progress.toFixed(0)}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, width: `${progress}%`, background: 'linear-gradient(90deg,#7c3aed,#3b82f6)', transition: 'width .5s' }} />
              </div>
            </div>
          )}
        </div>
        <div className="wm-stat">
          <p style={{ fontSize: '.7rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Target</p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9' }}>${targetAmount.toLocaleString()}</p>
        </div>
        <div className="wm-stat">
          <p style={{ fontSize: '.7rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Upfront Collected</p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#34d399' }}>${totalUpfront.toLocaleString()}</p>
        </div>
        <div className="wm-stat">
          <p style={{ fontSize: '.7rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Remaining Due</p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fbbf24' }}>${totalDue.toLocaleString()}</p>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(148,163,184,.3)' }}>Loading...</div>
      ) : upsells.length === 0 ? (
        <div className="wm-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <TrendingUp size={36} style={{ color: 'rgba(148,163,184,.15)', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: 'rgba(148,163,184,.4)', fontSize: '.9rem' }}>No upsells recorded</p>
          <p style={{ color: 'rgba(148,163,184,.25)', fontSize: '.8rem', marginTop: 4 }}>Account managers can log upsells from their portal</p>
        </div>
      ) : (
        <div className="wm-card wm-fade-up-3" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="wm-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Account Manager</th>
                  <th>Product</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Upfront</th>
                  <th style={{ textAlign: 'right' }}>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upsells.map((u: any) => {
                  const st = STATUS_STYLE[u.project_status] ?? STATUS_STYLE.pending;
                  return (
                    <tr key={u.id}>
                      <td style={{ color: 'rgba(148,163,184,.5)', fontSize: '.8rem' }}>
                        {new Date(u.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ fontWeight: 500 }}>{u.client?.company_name}</td>
                      <td style={{ color: 'rgba(148,163,184,.6)' }}>{u.accountManager?.full_name}</td>
                      <td>{u.product_sold}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{u.currency} {parseFloat(u.total_cost).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: '#34d399' }}>{u.currency} {parseFloat(u.upfront_amount).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: '#fbbf24' }}>{u.currency} {parseFloat(u.remaining_due || 0).toLocaleString()}</td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: '.7rem', fontWeight: 500, background: st.bg, color: st.color, textTransform: 'capitalize' }}>
                          {u.project_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}