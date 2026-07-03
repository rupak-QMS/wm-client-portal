// src/app/(dashboard)/team-leader/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Target, Users, TrendingUp, PieChart, Info, Calendar, UserPlus,
  Clock, ArrowRight,
} from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type Tab = 'progress' | 'history';

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
  return (
    <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
      <svg width={180} height={180} viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={90} cy={90} r={radius} fill="none" stroke="rgba(148,163,184,.12)" strokeWidth={22} />
        {segments.map((seg, i) => {
          const frac = seg.value / total;
          const dash = frac * circumference;
          const circle = (
            <circle key={i} cx={90} cy={90} r={radius} fill="none" stroke={seg.color} strokeWidth={22}
              strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset} strokeLinecap="butt" />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f1f5f9', textAlign: 'center' }}>{centerValue}</div>
        <div style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.5)' }}>{centerLabel}</div>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width:'100%', height:40, background:'rgba(255,255,255,.04)', border:'1px solid rgba(124,58,237,.18)', borderRadius:9, padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none', boxSizing:'border-box' };
const lbl: React.CSSProperties = { fontSize:'.75rem', color:'rgba(148,163,184,.55)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6 };

export default function TeamLeaderDashboard() {
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [tab, setTab] = useState<Tab>('progress');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', password: '' });
  const [history, setHistory] = useState<{ label: string; assigned: number; allocated: number }[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { data: agents = [], isLoading: agentsLoading } = useQuery<any[]>({
    queryKey: ['tl-agents'],
    queryFn: async () => (await fetch('/api/team-leader/agents')).json().then((r: any) => r.data ?? []),
  });

  const { data: me } = useQuery<any>({
    queryKey: ['me'],
    queryFn: async () => (await fetch('/api/users/me')).json().then((r: any) => r.data),
  });

  const { data: tlTarget } = useQuery<any>({
    queryKey: ['tl-target', month, year],
    queryFn: async () => (await fetch(`/api/team-leader/target?month=${month}&year=${year}`)).json(),
  });

  const { data: tlAllocData } = useQuery<any>({
    queryKey: ['tl-allocations', me?.id, month, year],
    enabled: !!me?.id,
    queryFn: async () => {
      const res = await fetch(`/api/team-leader/allocations?team_leader_id=${me.id}&month=${month}&year=${year}`);
      return res.json();
    },
  });

  const active = agents.filter((a: any) => a.status === 'active');
  const pending = agents.filter((a: any) => a.status === 'pending');
  const teamName = me?.team?.name ?? 'My Team';

  const currency = tlTarget?.currency ?? 'USD';
  const assignedTarget = tlTarget?.assigned_target ?? 0;
  const allocatedToTeam = tlTarget?.allocated_to_team ?? 0;
  const remainingToAllocate = tlTarget?.remaining_to_allocate ?? 0;
  const teamAchieved = active.reduce((s: number, a: any) => s + (a.achieved ?? 0), 0);
  const pctAllocated = assignedTarget > 0 ? Math.round((allocatedToTeam / assignedTarget) * 100) : 0;
  const pctAchieved = assignedTarget > 0 ? Math.round((teamAchieved / assignedTarget) * 100) : 0;

  const loadHistory = useCallback(async () => {
    if (!me?.id) return;
    setHistoryLoading(true);
    try {
      const points: { label: string; assigned: number; allocated: number }[] = [];
      let m = month, y = year;
      for (let i = 0; i < 6; i++) {
        const res = await fetch(`/api/team-leader/target?month=${m}&year=${y}`);
        if (res.ok) {
          const d = await res.json();
          points.unshift({ label: `${MONTHS[m - 1].slice(0, 3)} ${y}`, assigned: d.assigned_target ?? 0, allocated: d.allocated_to_team ?? 0 });
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
  }, [me?.id, month, year]);

  useEffect(() => {
    if (tab === 'history' && !history) loadHistory();
  }, [tab, history, loadHistory]);

  const handleAddAgent = async () => {
    if (!addForm.full_name || !addForm.email || !addForm.password) return toast.error('All fields are required');
    setAddLoading(true);
    const res = await fetch('/api/team-leader/agents', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addForm),
    });
    const json = await res.json();
    setAddLoading(false);
    if (!res.ok) { toast.error(json.error); return; }
    toast.success('Agent added — pending manager approval');
    qc.invalidateQueries({ queryKey: ['tl-agents'] });
    setShowAddModal(false);
    setAddForm({ full_name: '', email: '', password: '' });
  };

  const totalDays = daysInMonth(month, year);
  const daysPassed = (year === now.getFullYear() && month === now.getMonth() + 1)
    ? Math.min(now.getDate(), totalDays)
    : (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) ? totalDays : 0;
  const daysRemaining = Math.max(totalDays - daysPassed, 0);

  const statCard = (icon: React.ReactNode, iconBg: string, iconColor: string, label: string, value: string, sub: React.ReactNode) => (
    <div className="wm-stat" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '.78rem', color: 'rgba(148,163,184,.55)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.15 }}>{value}</div>
        <div style={{ fontSize: '.75rem', marginTop: 4 }}>{sub}</div>
      </div>
    </div>
  );

  return (
    <div className="wm-page-inner">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }} className="wm-fade-up">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Target size={15} style={{ color: '#a78bfa' }} />
            <span style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Team Leader Portal</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{teamName}</h1>
          <p style={{ fontSize: '.875rem', color: 'rgba(148,163,184,.5)' }}>Overview of your team's target and performance.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button className="wm-btn-ghost" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '.8rem' }}>
            <UserPlus size={14} /> Add Agent
          </button>
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
      </div>

      {/* Pointer to the dedicated Targets page for allocation */}
      <Link href="/team-leader/targets" className="wm-card wm-fade-up" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '16px 20px', marginBottom: 20, textDecoration: 'none', cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(167,139,250,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', flexShrink: 0 }}>
            <PieChart size={17} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '.9rem' }}>Allocate targets to your team</div>
            <div style={{ fontSize: '.78rem', color: 'rgba(148,163,184,.5)' }}>Set or edit each agent's target on the dedicated Targets page</div>
          </div>
        </div>
        <ArrowRight size={16} style={{ color: '#a78bfa', flexShrink: 0 }} />
      </Link>

      {/* Colorful stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 20 }} className="wm-fade-up">
        {statCard(<Target size={20} />, 'rgba(96,165,250,.18)', '#60a5fa', 'Assigned Target', assignedTarget > 0 ? `${currency} ${assignedTarget.toLocaleString()}` : '—', <span style={{ color: 'rgba(148,163,184,.5)' }}>From {tlTarget?.from_account_manager?.full_name ?? 'your AM'}</span>)}
        {statCard(<Users size={20} />, 'rgba(52,211,153,.18)', '#34d399', 'Allocated to Team', `${currency} ${allocatedToTeam.toLocaleString()}`, <span style={{ color: '#34d399', fontWeight: 600 }}>{pctAllocated}% of target</span>)}
        {statCard(<PieChart size={20} />, 'rgba(251,191,36,.18)', '#fbbf24', 'Remaining to Allocate', assignedTarget > 0 ? `${currency} ${Math.max(remainingToAllocate, 0).toLocaleString()}` : '—', <span style={{ color: remainingToAllocate < 0 ? '#f87171' : '#fbbf24', fontWeight: 600 }}>{remainingToAllocate < 0 ? 'Over-allocated' : `${100 - pctAllocated}% left`}</span>)}
        {statCard(<TrendingUp size={20} />, 'rgba(167,139,250,.18)', '#a78bfa', 'Team Achieved', `${currency} ${teamAchieved.toLocaleString()}`, <span style={{ color: 'rgba(148,163,184,.5)' }}>{pctAchieved}% of target</span>)}
      </div>

      {/* Overview + period info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,1fr) minmax(260px,1fr)', gap: 16, marginBottom: 22 }} className="wm-fade-up-2">
        <div className="wm-card" style={{ padding: '20px 22px' }}>
          <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 18 }}>Target Overview</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <DonutChart
              centerLabel="Assigned"
              centerValue={assignedTarget > 0 ? `${currency} ${assignedTarget.toLocaleString()}` : '—'}
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

      {/* Tabs — Distribute tab removed, that's now on /team-leader/targets */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(124,58,237,.12)', marginBottom: 18 }} className="wm-fade-up-3">
        {([
          ['progress', 'Team Progress'],
          ['history', 'Distribution History'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '10px 4px', marginRight: 20,
              fontSize: '.85rem', fontWeight: 600,
              color: tab === key ? '#a78bfa' : 'rgba(148,163,184,.5)',
              borderBottom: tab === key ? '2px solid #a78bfa' : '2px solid transparent',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Team Progress (leaderboard, read-only) */}
      {tab === 'progress' && (
        <div className="wm-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(124,58,237,.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#f1f5f9' }}>Team Performance</span>
            <span style={{ fontSize: '.75rem', color: 'rgba(148,163,184,.4)' }}>{active.length} active agents</span>
          </div>
          {agentsLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(148,163,184,.4)' }}>Loading…</div>
          ) : active.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(148,163,184,.3)', fontSize: '.85rem' }}>No active agents yet.</div>
          ) : (
            [...active].sort((a: any, b: any) => (b.achieved ?? 0) - (a.achieved ?? 0)).map((a: any, i: number) => {
              const existing = (tlAllocData?.data ?? []).find((x: any) => x.team_member_id === a.id);
              const allocated = Number(existing?.allocated_target ?? 0);
              const achieved = a.achieved ?? 0;
              const pct = allocated > 0 ? Math.min(100, Math.round((achieved / allocated) * 100)) : 0;
              return (
                <div key={a.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(124,58,237,.07)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(124,58,237,.18)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '.875rem', fontWeight: 600, color: '#f1f5f9' }}>{a.full_name}</span>
                      <span style={{ fontSize: '.8rem', color: 'rgba(148,163,184,.4)' }}>Target: {allocated > 0 ? `${existing?.currency ?? currency} ${allocated.toLocaleString()}` : '—'}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 9 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#34d399,#10b981)', borderRadius: 9 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '.95rem', fontWeight: 700, color: '#34d399', flexShrink: 0 }}>{currency} {achieved.toLocaleString()}</div>
                </div>
              );
            })
          )}
          {pending.length > 0 && (
            <div style={{ padding: '12px 20px', background: 'rgba(251,191,36,.04)', borderTop: '1px solid rgba(251,191,36,.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={13} style={{ color: '#fbbf24' }} />
              <span style={{ fontSize: '.78rem', color: '#fbbf24' }}>{pending.length} agent{pending.length > 1 ? 's' : ''} awaiting manager approval</span>
            </div>
          )}
        </div>
      )}

      {/* Tab: Distribution History */}
      {tab === 'history' && (
        <div className="wm-card" style={{ padding: '22px 24px' }}>
          <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Distribution History</div>
          <div style={{ fontSize: '.78rem', color: 'rgba(148,163,184,.45)', marginBottom: 18 }}>Last 6 months, assigned target vs. what you allocated to agents.</div>
          {historyLoading ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'rgba(148,163,184,.4)' }}>Loading…</div>
          ) : !history || history.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'rgba(148,163,184,.4)', fontSize: '.85rem' }}>No history available.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {history.map((h) => {
                const pct = h.assigned > 0 ? Math.min(100, Math.round((h.allocated / h.assigned) * 100)) : 0;
                return (
                  <div key={h.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 5 }}>
                      <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{h.label}</span>
                      <span style={{ color: 'rgba(148,163,184,.5)' }}>{currency} {h.allocated.toLocaleString()} / {currency} {h.assigned.toLocaleString()}</span>
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

      {/* Add Agent modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: '#0f0f1a', border: '1px solid rgba(124,58,237,.25)', borderRadius: 18, padding: 28, width: '100%', maxWidth: 420 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 20px' }}>Add New Agent</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={lbl}>Full Name</label><input style={inp} value={addForm.full_name} onChange={(e) => setAddForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Jane Smith" /></div>
              <div><label style={lbl}>Email</label><input style={inp} type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" /></div>
              <div><label style={lbl}>Temporary Password</label><input style={inp} type="password" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" /></div>
              <div style={{ background: 'rgba(251,191,36,.07)', border: '1px solid rgba(251,191,36,.15)', borderRadius: 9, padding: '10px 14px', fontSize: '.78rem', color: '#fbbf24' }}>
                This agent will be pending until the manager approves their account.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="wm-btn-ghost" onClick={() => setShowAddModal(false)} style={{ flex: 1, height: 40 }}>Cancel</button>
              <button className="wm-btn-primary" onClick={handleAddAgent} disabled={addLoading} style={{ flex: 1, height: 40 }}>{addLoading ? 'Adding…' : 'Add Agent'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}