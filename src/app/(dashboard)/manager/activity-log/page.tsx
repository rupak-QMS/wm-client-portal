import { useState, useEffect, useCallback } from 'react';
import {
  ScrollText, Search, Filter, ChevronLeft, ChevronRight, Calendar,
  Plus, Pencil, Trash2, CheckCircle, XCircle, RefreshCw, UserPlus, Target,
} from 'lucide-react';

const ACTIONS = [
  { value: '',                label: 'All Actions' },
  { value: 'created',         label: 'Created' },
  { value: 'updated',         label: 'Updated' },
  { value: 'deleted',         label: 'Deleted' },
  { value: 'approved',        label: 'Approved' },
  { value: 'rejected',        label: 'Rejected' },
  { value: 'status_changed',  label: 'Status Changed' },
  { value: 'assigned',        label: 'Assigned' },
  { value: 'target_set',      label: 'Target Set' },
];

const ACTION_ICON: Record<string, { icon: any; color: string }> = {
  created:        { icon: Plus,        color: '#34d399' },
  updated:        { icon: Pencil,      color: '#60a5fa' },
  deleted:        { icon: Trash2,      color: '#f87171' },
  approved:       { icon: CheckCircle, color: '#34d399' },
  rejected:       { icon: XCircle,     color: '#f87171' },
  status_changed: { icon: RefreshCw,   color: '#fbbf24' },
  assigned:       { icon: UserPlus,    color: '#a78bfa' },
  target_set:     { icon: Target,      color: '#a78bfa' },
};

interface LogEntry {
  id: string;
  action: string;
  entity: string;
  entity_id?: string;
  created_at: string;
  user?: { id: string; full_name: string; email: string; role: string; avatar_url?: string | null };
  metadata?: { description?: string; [key: string]: any };
}

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '30' });
      if (search) params.set('search', search);
      if (action) params.set('action', action);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/activity-logs?${params.toString()}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Failed to load activity log (HTTP ${res.status})`);
      setEntries(body.data ?? []);
      setTotalPages(body.totalPages ?? 1);
      setTotal(body.total ?? 0);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [page, search, action, from, to]);

  useEffect(() => { load(); }, [load]);

  const applyFilters = () => { setPage(1); load(); };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="wm-page-inner">
      {/* Header */}
      <div style={{ marginBottom: 24 }} className="wm-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <ScrollText size={15} style={{ color: '#a78bfa' }} />
          <span style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Audit</span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Activity Log</h1>
        <p style={{ fontSize: '.875rem', color: 'rgba(148,163,184,.5)' }}>
          Every create, update, delete, approval, and status change across the platform.
        </p>
      </div>

      {/* Filters */}
      <div className="wm-card wm-fade-up" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ position: 'relative', flex: '2 1 240px' }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,.4)' }} />
            <input
              className="wm-input" placeholder="Search description…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              style={{ paddingLeft: 32 }}
            />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <select className="wm-input" value={action} onChange={(e) => setAction(e.target.value)}>
              {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 220px' }}>
            <Calendar size={13} style={{ color: 'rgba(148,163,184,.4)', flexShrink: 0 }} />
            <input className="wm-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span style={{ color: 'rgba(148,163,184,.4)', fontSize: '.8rem' }}>to</span>
            <input className="wm-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button onClick={applyFilters} className="wm-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Filter size={13} /> Apply
          </button>
        </div>
      </div>

      {error && (
        <div className="wm-badge wm-badge-red" style={{ display: 'flex', padding: '12px 16px', borderRadius: 12, fontSize: '.85rem', marginBottom: 20, fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="wm-card wm-fade-up-2" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(124,58,237,.1)' }}>
          <span style={{ fontWeight: 700, color: '#f1f5f9' }}>Log Entries</span>
          <span style={{ fontSize: '.75rem', color: 'rgba(148,163,184,.4)' }}>{total.toLocaleString()} total</span>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'rgba(148,163,184,.4)' }}>Loading…</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'rgba(148,163,184,.3)', fontSize: '.85rem' }}>No activity found for these filters.</div>
        ) : (
          <table className="wm-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const meta = ACTION_ICON[e.action] ?? { icon: RefreshCw, color: 'rgba(148,163,184,.6)' };
                const Icon = meta.icon;
                return (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'rgba(148,163,184,.6)', fontSize: '.82rem' }}>{formatTime(e.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {e.user?.avatar_url ? (
                          <img src={e.user.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(124,58,237,.15)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 700, flexShrink: 0 }}>
                            {e.user?.full_name?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#f1f5f9' }}>{e.user?.full_name ?? 'Unknown'}</div>
                          <div style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.45)', textTransform: 'capitalize' }}>{e.user?.role?.replace('_', ' ') ?? ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: `${meta.color}18`, color: meta.color, fontSize: '.72rem', fontWeight: 600, textTransform: 'capitalize' }}>
                        <Icon size={11} /> {e.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '.85rem', color: 'rgba(226,232,240,.85)' }}>{e.metadata?.description ?? `${e.action.replace('_', ' ')} ${e.entity}${e.entity_id ? ` (${e.entity_id.slice(0, 8)})` : ''}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid rgba(124,58,237,.1)' }}>
            <span style={{ fontSize: '.78rem', color: 'rgba(148,163,184,.5)' }}>Page {page} of {totalPages}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(124,58,237,.18)', background: 'rgba(255,255,255,.04)', color: 'rgba(148,163,184,.7)', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(124,58,237,.18)', background: 'rgba(255,255,255,.04)', color: 'rgba(148,163,184,.7)', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}