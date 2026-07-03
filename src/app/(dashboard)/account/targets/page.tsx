'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Target, Users, User, TrendingUp, AlertCircle, Pencil, Trash2, Check, X,
  Info, Calendar, Search, Wand2,
} from 'lucide-react';

const CURRENCIES = ['USD', 'AUD', 'NZD', 'GBP', 'EUR'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface TLAllocation {
  id: string;
  team_leader_id: string;
  allocated_amount: number;
  achieved_amount: number;
  currency: string;
  team_leader: { id: string; full_name: string; email?: string };
}
interface TeamLeaderOption { id: string; full_name: string; email: string; }
interface AllocationsResponse {
  total_target: number;
  total_target_currency: string;
  self_allocation: { allocated_amount: number; achieved_amount: number; currency?: string };
  tl_allocations: TLAllocation[];
  allocated_total: number;
  remaining: number;
}
type TLRow = {
  key: string; name: string; subtitle: string; initial: string;
  target: number; achieved: number; currency: string; teamLeaderId: string;
};
type Tab = 'distribute' | 'progress' | 'history';

function daysInMonth(month: number, year: number) { return new Date(year, month, 0).getDate(); }

function DonutChart({ segments, centerLabel, centerValue }: {
  segments: { value: number; color: string }[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  // Split "USD 10,000" into currency + amount so long values don't
  // overflow the ring — render on two lines instead of squeezing one.
  const parts = centerValue.split(' ');
  const amountPart = parts.length > 1 ? parts.slice(1).join(' ') : centerValue;
  const currencyPart = parts.length > 1 ? parts[0] : null;
  const amountFontSize = amountPart.length > 9 ? '1.05rem' : amountPart.length > 6 ? '1.15rem' : '1.3rem';
  return (
    <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
      <svg width={180} height={180} viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={90} cy={90} r={radius} fill="none" stroke="rgba(148,163,184,.12)" strokeWidth={20} />
        {segments.map((seg, i) => {
          const frac = seg.value / total;
          const dash = frac * circumference;
          const circle = (
            <circle key={i} cx={90} cy={90} r={radius} fill="none" stroke={seg.color} strokeWidth={20}
              strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset} strokeLinecap="butt" />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center' }}>
        {currencyPart && <div style={{ fontSize: '.68rem', color: 'rgba(148,163,184,.55)', fontWeight: 600, letterSpacing: '.03em' }}>{currencyPart}</div>}
        <div style={{ fontSize: amountFontSize, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.15, wordBreak: 'break-word' }}>{amountPart}</div>
        <div style={{ fontSize: '.68rem', color: 'rgba(148,163,184,.5)', marginTop: 2 }}>{centerLabel}</div>
      </div>
    </div>
  );
}

export default function AccountManagerTargetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<AllocationsResponse | null>(null);
  const [teamLeaders, setTeamLeaders] = useState<TeamLeaderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('distribute');
  const [search, setSearch] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editCurrency, setEditCurrency] = useState('USD');
  const [selfInput, setSelfInput] = useState('');
  const [selfCurrency, setSelfCurrency] = useState('USD');
  const [history, setHistory] = useState<{ label: string; total: number; allocated: number }[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [allocRes, tlRes] = await Promise.all([
        fetch(`/api/account-manager/allocations?month=${month}&year=${year}`),
        fetch('/api/account-manager/team-leaders'),
      ]);
      if (!allocRes.ok) {
        let detail = '';
        try { const b = await allocRes.json(); detail = b?.error ?? JSON.stringify(b); } catch { detail = await allocRes.text().catch(() => ''); }
        throw new Error(`Failed to load allocations — HTTP ${allocRes.status}${detail ? `: ${detail}` : ''}`);
      }
      if (!tlRes.ok) {
        let detail = '';
        try { const b = await tlRes.json(); detail = b?.error ?? JSON.stringify(b); } catch { detail = await tlRes.text().catch(() => ''); }
        throw new Error(`Failed to load team leaders — HTTP ${tlRes.status}${detail ? `: ${detail}` : ''}`);
      }
      const allocData: AllocationsResponse = await allocRes.json();
      setData(allocData);
      setSelfInput(String(allocData.self_allocation.allocated_amount));
      setSelfCurrency(allocData.self_allocation.currency ?? allocData.total_target_currency ?? 'USD');
      setTeamLeaders(await tlRes.json());
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const points: { label: string; total: number; allocated: number }[] = [];
      let m = month, y = year;
      for (let i = 0; i < 6; i++) {
        const res = await fetch(`/api/account-manager/allocations?month=${m}&year=${y}`);
        if (res.ok) {
          const d: AllocationsResponse = await res.json();
          points.unshift({ label: `${MONTHS[m - 1].slice(0, 3)} ${y}`, total: d.total_target, allocated: d.allocated_total });
        }
        m -= 1;
        if (m === 0) { m = 12; y -= 1; }
      }
      setHistory(points);
    } catch {
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  }, [month, year]);

  useEffect(() => { if (tab === 'history' && !history) loadHistory(); }, [tab, history, loadHistory]);

  const postAllocation = async (payload: any) => {
    const res = await fetch('/api/account-manager/allocations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? `Failed to save (HTTP ${res.status})`);
    return body;
  };

  const saveSelf = async () => {
    setSaving(true); setError('');
    try {
      await postAllocation({ month, year, type: 'self', allocated_amount: Number(selfInput) || 0, currency: selfCurrency });
      await load();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const startEdit = (row: TLRow) => { setEditingKey(row.key); setEditValue(String(row.target)); setEditCurrency(row.currency); };
  const cancelEdit = () => { setEditingKey(null); setEditValue(''); };

  const saveTlEdit = async (row: TLRow) => {
    setSaving(true); setError('');
    try {
      await postAllocation({ month, year, type: 'team_leader', team_leader_id: row.teamLeaderId, allocated_amount: Number(editValue) || 0, currency: editCurrency });
      await load();
      setEditingKey(null);
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const removeAllocation = async (row: TLRow) => {
    const ok = window.confirm(`Set ${row.name}'s target back to 0 for ${MONTHS[month - 1]} ${year}?`);
    if (!ok) return;
    setSaving(true); setError('');
    try {
      await postAllocation({ month, year, type: 'team_leader', team_leader_id: row.teamLeaderId, allocated_amount: 0, currency: row.currency });
      await load();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const distributeEvenly = async () => {
    if (teamLeaders.length === 0 || !data) return;
    const pool = Math.max(data.total_target - data.self_allocation.allocated_amount, 0);
    const share = Math.floor(pool / teamLeaders.length);
    const currency = data.total_target_currency ?? 'USD';
    const ok = window.confirm(
      `Set every Team Leader's target to an equal share of ${currency} ${share.toLocaleString()} ` +
      `(overwrites existing individual amounts). Continue?`
    );
    if (!ok) return;
    setSaving(true); setError('');
    try {
      await Promise.all(teamLeaders.map((tl) => postAllocation({ month, year, type: 'team_leader', team_leader_id: tl.id, allocated_amount: share, currency })));
      await load();
    } catch (err: any) { setError(err.message ?? 'Failed to distribute evenly.'); } finally { setSaving(false); }
  };

  const tlRows: TLRow[] = useMemo(() => {
    if (!data) return [];
    return teamLeaders.map((tl) => {
      const existing = data.tl_allocations.find((a) => a.team_leader_id === tl.id);
      return {
        key: tl.id, name: tl.full_name, subtitle: tl.email, initial: tl.full_name.charAt(0).toUpperCase(),
        target: existing?.allocated_amount ?? 0, achieved: existing?.achieved_amount ?? 0,
        currency: existing?.currency ?? data.total_target_currency ?? 'USD', teamLeaderId: tl.id,
      };
    });
  }, [teamLeaders, data]);

  const filteredTlRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tlRows;
    return tlRows.filter((r) => r.name.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q));
  }, [tlRows, search]);

  const totalTarget = data?.total_target ?? 0;
  const currency = data?.total_target_currency ?? 'USD';
  const totalAllocated = data?.allocated_total ?? 0;
  const totalLeft = data?.remaining ?? 0;
  const achievedAll = (data?.self_allocation.achieved_amount ?? 0) + tlRows.reduce((s, r) => s + r.achieved, 0);
  const pctAllocated = totalTarget > 0 ? Math.round((totalAllocated / totalTarget) * 100) : 0;
  const pctAchieved = totalTarget > 0 ? Math.round((achievedAll / totalTarget) * 100) : 0;
  const selfAllocated = data?.self_allocation.allocated_amount ?? 0;
  const selfAchieved = data?.self_allocation.achieved_amount ?? 0;
  const selfProgressPct = selfAllocated > 0 ? Math.round((selfAchieved / selfAllocated) * 100) : 0;

  const totalDays = daysInMonth(month, year);
  const daysPassed = (year === now.getFullYear() && month === now.getMonth() + 1)
    ? Math.min(now.getDate(), totalDays)
    : (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) ? totalDays : 0;
  const daysRemaining = Math.max(totalDays - daysPassed, 0);

  const statCard = (icon: React.ReactNode, iconBg: string, iconColor: string, label: string, value: string, sub: React.ReactNode) => (
    <div className="wm-stat" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '.78rem', color: 'rgba(148,163,184,.55)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.15 }}>{value}</div>
        <div style={{ fontSize: '.75rem', marginTop: 4 }}>{sub}</div>
      </div>
    </div>
  );

  return (
    <div className="wm-page-inner">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }} className="wm-fade-up">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Target size={15} style={{ color: '#a78bfa' }} />
            <span style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Targets</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Distribute Your Target</h1>
          <p style={{ fontSize: '.875rem', color: 'rgba(148,163,184,.5)' }}>Split the bulk target Manager assigned you between yourself and your Team Leaders.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(124,58,237,.18)', borderRadius: 10, padding: '8px 12px' }}>
          <Calendar size={14} style={{ color: 'rgba(148,163,184,.5)' }} />
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ background: 'none', border: 'none', color: '#f1f5f9', fontSize: '.82rem', outline: 'none' }}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ background: 'none', border: 'none', color: '#f1f5f9', fontSize: '.82rem', outline: 'none' }}>
            {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="wm-badge wm-badge-red" style={{ display: 'flex', padding: '12px 16px', borderRadius: 12, fontSize: '.85rem', marginBottom: 20, fontWeight: 500, wordBreak: 'break-word' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'rgba(148,163,184,.4)' }}>Loading…</div>
      ) : !data ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'rgba(148,163,184,.3)', fontSize: '.85rem' }}>Nothing to show for this month yet.</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 20 }} className="wm-fade-up">
            {statCard(<Target size={20} />, 'rgba(96,165,250,.18)', '#60a5fa', 'Total Target from Manager', `${currency} ${totalTarget.toLocaleString()}`, <span style={{ color: 'rgba(148,163,184,.5)' }}>{MONTHS[month - 1]} {year}</span>)}
            {statCard(<Users size={20} />, 'rgba(52,211,153,.18)', '#34d399', 'Allocated to Team Leaders', `${currency} ${totalAllocated.toLocaleString()}`, <span style={{ color: '#34d399', fontWeight: 600 }}>{pctAllocated}% of total</span>)}
            {statCard(<User size={20} />, 'rgba(251,191,36,.18)', '#fbbf24', 'My Target (Remaining)', `${currency} ${Math.max(totalLeft, 0).toLocaleString()}`, <span style={{ color: totalLeft < 0 ? '#f87171' : '#fbbf24', fontWeight: 600 }}>{totalLeft < 0 ? 'Over-allocated' : `${100 - pctAllocated}% of total`}</span>)}
            {statCard(<TrendingUp size={20} />, 'rgba(167,139,250,.18)', '#a78bfa', 'My Progress', `${currency} ${achievedAll.toLocaleString()}`, <span style={{ color: 'rgba(148,163,184,.5)' }}>{pctAchieved}% achieved</span>)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,1fr) minmax(260px,1fr)', gap: 16, marginBottom: 22 }} className="wm-fade-up-2">
            <div className="wm-card" style={{ padding: '20px 22px' }}>
              <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 18 }}>Target Overview</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <DonutChart
                  centerLabel="Total" centerValue={`${currency} ${totalTarget.toLocaleString()}`}
                  segments={[
                    { value: Math.max(totalAllocated - achievedAll, 0), color: '#60a5fa' },
                    { value: Math.max(totalLeft, 0), color: '#34d399' },
                    { value: Math.max(achievedAll, 0), color: '#a78bfa' },
                  ]}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 160 }}>
                  {[
                    { color: '#60a5fa', label: 'Allocated to Team Leaders', value: totalAllocated, pct: pctAllocated },
                    { color: '#34d399', label: 'My Target (Remaining)', value: Math.max(totalLeft, 0), pct: totalTarget > 0 ? Math.round((Math.max(totalLeft, 0) / totalTarget) * 100) : 0 },
                    { color: '#a78bfa', label: 'Achieved (All)', value: achievedAll, pct: pctAchieved },
                  ].map((s) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: s.color, marginTop: 4, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '.82rem', color: '#f1f5f9', fontWeight: 600 }}>{s.label}</div>
                        <div style={{ fontSize: '.78rem', color: 'rgba(148,163,184,.5)' }}>{currency} {s.value.toLocaleString()} ({s.pct}%)</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="wm-card" style={{ padding: '20px 22px' }}>
              <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>About This Period</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Period', `1 ${MONTHS[month - 1]} ${year} – ${totalDays} ${MONTHS[month - 1]} ${year}`],
                  ['Your Role', 'Account Manager'],
                  ['Total Working Days', String(totalDays)],
                  ['Days Passed', String(daysPassed)],
                  ['Days Remaining', String(daysRemaining)],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', paddingBottom: 10, borderBottom: '1px solid rgba(124,58,237,.08)' }}>
                    <span style={{ color: 'rgba(148,163,184,.5)' }}>{k}</span>
                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(124,58,237,.12)', marginBottom: 18 }} className="wm-fade-up-3">
            {([['distribute', 'Distribute to Team Leaders'], ['progress', 'My Target & Progress'], ['history', 'Distribution History']] as [Tab, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 4px', marginRight: 20, fontSize: '.85rem', fontWeight: 600, color: tab === key ? '#a78bfa' : 'rgba(148,163,184,.5)', borderBottom: tab === key ? '2px solid #a78bfa' : '2px solid transparent' }}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'distribute' && (
            <>
              <div className="wm-card" style={{ padding: '18px 20px', marginBottom: 16 }}>
                <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 10 }}>My Own Target</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input type="number" min={0} value={selfInput} onChange={(e) => setSelfInput(e.target.value)} className="wm-input" style={{ width: 160 }} />
                  <select value={selfCurrency} onChange={(e) => setSelfCurrency(e.target.value)} className="wm-input" style={{ width: 'auto', minWidth: 90 }}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={saveSelf} disabled={saving} className="wm-btn-primary">{saving ? 'Saving…' : 'Save'}</button>
                  <span style={{ fontSize: '.8rem', color: 'rgba(148,163,184,.5)' }}>Achieved: <strong style={{ color: '#34d399' }}>{selfCurrency} {selfAchieved.toLocaleString()}</strong></span>
                </div>
              </div>

              <div className="wm-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(124,58,237,.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, color: '#f1f5f9' }}>Your Team Leaders</span>
                    <button onClick={distributeEvenly} disabled={saving || teamLeaders.length === 0} className="wm-btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '.78rem', padding: '8px 14px' }}>
                      <Wand2 size={13} /> Distribute Remaining Evenly
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 320 }}>
                      <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,.4)' }} />
                      <input className="wm-input" placeholder="Search Team Leaders…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
                    </div>
                    <span style={{ fontSize: '.75rem', color: 'rgba(148,163,184,.4)' }}>Showing {filteredTlRows.length} of {teamLeaders.length} Team Leader{teamLeaders.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {teamLeaders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'rgba(148,163,184,.4)', fontSize: '.85rem' }}>No Team Leaders are assigned to you yet — ask your Manager to link one via Staff Management.</div>
                ) : (
                  <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                    <table className="wm-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th style={{ textAlign: 'right' }}>Target</th>
                          <th style={{ textAlign: 'right' }}>Achieved</th>
                          <th style={{ textAlign: 'right' }}>Left</th>
                          <th style={{ textAlign: 'right' }}>Achievement</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTlRows.length === 0 ? (
                          <tr><td colSpan={6} style={{ textAlign: 'center', padding: 28, color: 'rgba(148,163,184,.4)' }}>No Team Leaders match "{search}"</td></tr>
                        ) : filteredTlRows.map((row) => {
                          const left = row.target - row.achieved;
                          const pct = row.target > 0 ? Math.min(100, Math.round((row.achieved / row.target) * 100)) : 0;
                          const isEditing = editingKey === row.key;
                          return (
                            <tr key={row.key}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.78rem', flexShrink: 0 }}>{row.initial}</div>
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '.87rem', color: '#f1f5f9' }}>{row.name}</div>
                                    <div style={{ fontSize: '.75rem', color: 'rgba(148,163,184,.45)' }}>{row.subtitle}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                {isEditing ? (
                                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                    <input type="number" min={0} autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} className="wm-input" style={{ width: 100 }} />
                                    <select value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)} className="wm-input" style={{ width: 'auto', minWidth: 76 }}>
                                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                  </div>
                                ) : `${row.currency} ${row.target.toLocaleString()}`}
                              </td>
                              <td style={{ textAlign: 'right', color: '#34d399', fontWeight: 600 }}>{row.achieved > 0 ? `${row.currency} ${row.achieved.toLocaleString()}` : '—'}</td>
                              <td style={{ textAlign: 'right' }}>{row.target > 0 ? `${row.currency} ${left.toLocaleString()}` : '—'}</td>
                              <td style={{ textAlign: 'right', color: 'rgba(148,163,184,.5)' }}>{pct}%</td>
                              <td style={{ textAlign: 'right' }}>
                                {isEditing ? (
                                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                    <button onClick={() => saveTlEdit(row)} disabled={saving} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(52,211,153,.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={13} /></button>
                                    <button onClick={cancelEdit} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,.06)', color: 'rgba(148,163,184,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                    <button onClick={() => startEdit(row)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,.06)', color: 'rgba(148,163,184,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={12} /></button>
                                    <button onClick={() => removeAllocation(row)} disabled={saving} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(248,113,113,.1)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={12} /></button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderTop: '1px solid rgba(124,58,237,.1)' }} className="wm-badge wm-badge-blue">
                  <Info size={14} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '.78rem', fontWeight: 500 }}>Your total allocation to Team Leaders + your remaining target must equal {currency} {totalTarget.toLocaleString()}.</span>
                </div>
              </div>
            </>
          )}

          {tab === 'progress' && (
            <div className="wm-card" style={{ padding: '22px 24px' }}>
              <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 18 }}>My Target &amp; Progress</div>
              <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: '.85rem' }}>
                <span style={{ color: 'rgba(148,163,184,.6)' }}>Achieved: <strong style={{ color: '#34d399' }}>{selfCurrency} {selfAchieved.toLocaleString()}</strong> of <strong style={{ color: '#f1f5f9' }}>{selfCurrency} {selfAllocated.toLocaleString()}</strong></span>
                <span style={{ color: '#a78bfa', fontWeight: 700 }}>{selfProgressPct}%</span>
              </div>
              <div style={{ height: 10, background: 'rgba(255,255,255,.08)', borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${Math.min(selfProgressPct, 100)}%`, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius: 99, transition: 'width .4s' }} />
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div className="wm-card" style={{ padding: '22px 24px' }}>
              <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Distribution History</div>
              <div style={{ fontSize: '.78rem', color: 'rgba(148,163,184,.45)', marginBottom: 18 }}>Last 6 months, total target vs. what you allocated to Team Leaders.</div>
              {historyLoading ? (
                <div style={{ padding: 30, textAlign: 'center', color: 'rgba(148,163,184,.4)' }}>Loading…</div>
              ) : !history || history.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: 'rgba(148,163,184,.4)', fontSize: '.85rem' }}>No history available.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {history.map((h) => {
                    const pct = h.total > 0 ? Math.min(100, Math.round((h.allocated / h.total) * 100)) : 0;
                    return (
                      <div key={h.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 5 }}>
                          <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{h.label}</span>
                          <span style={{ color: 'rgba(148,163,184,.5)' }}>{currency} {h.allocated.toLocaleString()} / {currency} {h.total.toLocaleString()}</span>
                        </div>
                        <div style={{ height: 8, background: 'rgba(255,255,255,.08)', borderRadius: 99 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#60a5fa,#3b82f6)', borderRadius: 99 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}