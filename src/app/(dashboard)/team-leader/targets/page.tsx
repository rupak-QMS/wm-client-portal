// src/app/(dashboard)/team-leader/targets/page.tsx
// Mirrors the Manager Targets / AM Targets pattern exactly, scoped to
// this Team Leader's own team members.
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Target, Users, TrendingUp, AlertCircle, Pencil, Trash2, Check, X,
  Info, Calendar, Search, Wand2,
} from 'lucide-react';

// Currency is inherited from the AM's target, not chosen — see the
// read-only currency badge next to each amount instead of a picker.
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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

type MemberRow = {
  key: string; name: string; subtitle: string; initial: string;
  target: number; achieved: number; currency: string; memberId: string;
};

export default function TeamLeaderTargetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [me, setMe] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [tlTarget, setTlTarget] = useState<any>(null);
  const [allocData, setAllocData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const meRes = await fetch('/api/users/me');
      if (!meRes.ok) throw new Error(`Failed to load your profile — HTTP ${meRes.status}`);
      const meJson = await meRes.json();
      const meData = meJson.data;
      setMe(meData);

      const [agentsRes, targetRes, allocRes] = await Promise.all([
        fetch('/api/team-leader/agents'),
        fetch(`/api/team-leader/target?month=${month}&year=${year}`),
        meData?.id ? fetch(`/api/team-leader/allocations?team_leader_id=${meData.id}&month=${month}&year=${year}`) : Promise.resolve(null),
      ]);

      if (!agentsRes.ok) {
        const b = await agentsRes.json().catch(() => ({}));
        throw new Error(b.error ?? `Failed to load agents — HTTP ${agentsRes.status}`);
      }
      if (!targetRes.ok) {
        const b = await targetRes.json().catch(() => ({}));
        throw new Error(b.error ?? `Failed to load target — HTTP ${targetRes.status}`);
      }

      const agentsJson = await agentsRes.json();
      setAgents(agentsJson.data ?? []);
      setTlTarget(await targetRes.json());
      setAllocData(allocRes && allocRes.ok ? await allocRes.json() : null);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const active = useMemo(() => agents.filter((a: any) => a.status === 'active'), [agents]);
  const pending = useMemo(() => agents.filter((a: any) => a.status === 'pending'), [agents]);

  const currency = tlTarget?.currency ?? 'USD';
  const assignedTarget = tlTarget?.assigned_target ?? 0;
  const allocatedToTeam = tlTarget?.allocated_to_team ?? 0;
  const remainingToAllocate = tlTarget?.remaining_to_allocate ?? 0;
  const teamAchieved = active.reduce((s: number, a: any) => s + (a.achieved ?? 0), 0);
  const pctAllocated = assignedTarget > 0 ? Math.round((allocatedToTeam / assignedTarget) * 100) : 0;
  const pctAchieved = assignedTarget > 0 ? Math.round((teamAchieved / assignedTarget) * 100) : 0;

  const memberRows: MemberRow[] = useMemo(() => {
    return active.map((a: any) => {
      const existing = (allocData?.data ?? []).find((x: any) => x.team_member_id === a.id);
      return {
        key: a.id, name: a.full_name, subtitle: a.email, initial: a.full_name.charAt(0).toUpperCase(),
        target: existing?.allocated_target ?? 0, achieved: a.achieved ?? 0,
        currency: existing?.currency ?? currency, memberId: a.id,
      };
    });
  }, [active, allocData, currency]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return memberRows;
    return memberRows.filter((r) => r.name.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q));
  }, [memberRows, search]);

  const startEdit = (row: MemberRow) => { setEditingKey(row.key); setEditValue(String(row.target)); };
  const cancelEdit = () => { setEditingKey(null); setEditValue(''); };

  const postAllocation = async (memberId: string, amount: number) => {
    if (!me?.id) throw new Error('Session error — please refresh');
    const res = await fetch('/api/team-leader/allocations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_leader_id: me.id, team_id: me.team_id, team_member_id: memberId,
        month, year, allocated_target: amount, currency, created_by: me.id,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.error) throw new Error(body.error ?? `Failed to save (HTTP ${res.status})`);
    return body;
  };

  const saveEdit = async (row: MemberRow) => {
    setSaving(true); setError('');
    try {
      await postAllocation(row.memberId, Number(editValue) || 0);
      await load();
      setEditingKey(null);
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const removeAllocation = async (row: MemberRow) => {
    const ok = window.confirm(`Set ${row.name}'s target back to 0 for ${MONTHS[month - 1]} ${year}?`);
    if (!ok) return;
    setSaving(true); setError('');
    try {
      await postAllocation(row.memberId, 0);
      await load();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const distributeEvenly = async () => {
    if (memberRows.length === 0) return;
    const share = Math.floor(Math.max(remainingToAllocate, 0) / memberRows.length) + Math.floor((memberRows.reduce((s, r) => s + r.target, 0)) / memberRows.length);
    const evenShare = Math.floor(assignedTarget / memberRows.length);
    const ok = window.confirm(
      `Set every team member's target to an equal share of ${currency} ${evenShare.toLocaleString()} ` +
      `(overwrites existing individual amounts). Continue?`
    );
    if (!ok) return;
    setSaving(true); setError('');
    try {
      await Promise.all(memberRows.map((r) => postAllocation(r.memberId, evenShare)));
      await load();
    } catch (err: any) { setError(err.message ?? 'Failed to distribute evenly.'); } finally { setSaving(false); }
  };

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
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Distribute Target to Team Members</h1>
          <p style={{ fontSize: '.875rem', color: 'rgba(148,163,184,.5)' }}>Allocate the target your Account Manager assigned you across your team.</p>
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
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 20 }} className="wm-fade-up">
            {statCard(<Target size={20} />, 'rgba(96,165,250,.18)', '#60a5fa', 'Assigned Target', assignedTarget > 0 ? `${currency} ${assignedTarget.toLocaleString()}` : '—', <span style={{ color: 'rgba(148,163,184,.5)' }}>From {tlTarget?.from_account_manager?.full_name ?? 'your AM'}</span>)}
            {statCard(<Users size={20} />, 'rgba(52,211,153,.18)', '#34d399', 'Allocated to Team', `${currency} ${allocatedToTeam.toLocaleString()}`, <span style={{ color: '#34d399', fontWeight: 600 }}>{pctAllocated}% of target</span>)}
            {statCard(<AlertCircle size={20} />, 'rgba(251,191,36,.18)', '#fbbf24', 'Remaining to Allocate', assignedTarget > 0 ? `${currency} ${Math.max(remainingToAllocate, 0).toLocaleString()}` : '—', <span style={{ color: remainingToAllocate < 0 ? '#f87171' : '#fbbf24', fontWeight: 600 }}>{remainingToAllocate < 0 ? 'Over-allocated' : `${100 - pctAllocated}% left`}</span>)}
            {statCard(<TrendingUp size={20} />, 'rgba(167,139,250,.18)', '#a78bfa', 'Team Achieved', `${currency} ${teamAchieved.toLocaleString()}`, <span style={{ color: 'rgba(148,163,184,.5)' }}>{pctAchieved}% of target</span>)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,1fr) minmax(260px,1fr)', gap: 16, marginBottom: 22 }} className="wm-fade-up-2">
            <div className="wm-card" style={{ padding: '20px 22px' }}>
              <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 18 }}>Target Overview</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <DonutChart
                  centerLabel="Assigned" centerValue={assignedTarget > 0 ? `${currency} ${assignedTarget.toLocaleString()}` : '—'}
                  segments={[
                    { value: Math.max(allocatedToTeam - teamAchieved, 0), color: '#60a5fa' },
                    { value: Math.max(remainingToAllocate, 0), color: '#34d399' },
                    { value: Math.max(teamAchieved, 0), color: '#a78bfa' },
                  ]}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 160 }}>
                  {[
                    { color: '#60a5fa', label: 'Allocated to Team', value: allocatedToTeam, pct: pctAllocated },
                    { color: '#34d399', label: 'Remaining to Allocate', value: Math.max(remainingToAllocate, 0), pct: assignedTarget > 0 ? Math.round((Math.max(remainingToAllocate, 0) / assignedTarget) * 100) : 0 },
                    { color: '#a78bfa', label: 'Achieved', value: teamAchieved, pct: pctAchieved },
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
                  ['Your Role', 'Team Leader'],
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

          <div className="wm-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(124,58,237,.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#f1f5f9' }}>Your Team Members</div>
                  <div style={{ fontSize: '.78rem', color: 'rgba(148,163,184,.45)', marginTop: 2 }}>Allocate target to your team. You can edit anytime.</div>
                </div>
                <button onClick={distributeEvenly} disabled={saving || memberRows.length === 0} className="wm-btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '.78rem', padding: '8px 14px' }}>
                  <Wand2 size={13} /> Distribute Evenly
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 320 }}>
                  <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,.4)' }} />
                  <input className="wm-input" placeholder="Search team members…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
                </div>
                <span style={{ fontSize: '.75rem', color: 'rgba(148,163,184,.4)' }}>Showing {filteredRows.length} of {memberRows.length} member{memberRows.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {memberRows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(148,163,184,.4)', fontSize: '.85rem' }}>No active team members yet.</div>
            ) : (
              <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                <table className="wm-table">
                  <thead>
                    <tr>
                      <th>Team Member</th>
                      <th style={{ textAlign: 'right' }}>Target</th>
                      <th style={{ textAlign: 'right' }}>Achieved</th>
                      <th style={{ textAlign: 'right' }}>Left</th>
                      <th style={{ textAlign: 'right' }}>Achievement</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 28, color: 'rgba(148,163,184,.4)' }}>No members match "{search}"</td></tr>
                    ) : filteredRows.map((row) => {
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
                                <span style={{ padding: '0 10px', height: 34, display: 'flex', alignItems: 'center', borderRadius: 8, background: 'rgba(124,58,237,.1)', color: '#a78bfa', fontSize: '.75rem', fontWeight: 700 }}>{currency}</span>
                              </div>
                            ) : `${row.currency} ${row.target.toLocaleString()}`}
                          </td>
                          <td style={{ textAlign: 'right', color: '#34d399', fontWeight: 600 }}>{row.achieved > 0 ? `${row.currency} ${row.achieved.toLocaleString()}` : '—'}</td>
                          <td style={{ textAlign: 'right' }}>{row.target > 0 ? `${row.currency} ${Math.max(left, 0).toLocaleString()}` : '—'}</td>
                          <td style={{ textAlign: 'right', color: 'rgba(148,163,184,.5)' }}>{pct}%</td>
                          <td style={{ textAlign: 'right' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button onClick={() => saveEdit(row)} disabled={saving} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(52,211,153,.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={13} /></button>
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

            {pending.length > 0 && (
              <div style={{ padding: '12px 20px', background: 'rgba(251,191,36,.04)', borderTop: '1px solid rgba(251,191,36,.1)', fontSize: '.78rem', color: '#fbbf24' }}>
                {pending.length} agent{pending.length > 1 ? 's' : ''} awaiting manager approval
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderTop: '1px solid rgba(124,58,237,.1)' }} className="wm-badge wm-badge-blue">
              <Info size={14} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '.78rem', fontWeight: 500 }}>Your total allocation to team members can't exceed {currency} {assignedTarget.toLocaleString()} — the target your Account Manager assigned you.</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}