// src/app/(dashboard)/account/targets/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';

interface TLAllocation {
  id: string;
  team_leader_id: string;
  allocated_amount: number;
  achieved_amount: number;
  team_leader: { id: string; full_name: string };
}

interface TeamLeaderOption {
  id: string;
  full_name: string;
  email: string;
}

interface AllocationsResponse {
  total_target: number;
  self_allocation: { allocated_amount: number; achieved_amount: number };
  tl_allocations: TLAllocation[];
  allocated_total: number;
  remaining: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function AccountManagerTargetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<AllocationsResponse | null>(null);
  const [teamLeaders, setTeamLeaders] = useState<TeamLeaderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selfInput, setSelfInput] = useState('');
  const [tlInputs, setTlInputs] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [allocRes, tlRes] = await Promise.all([
        fetch(`/api/account-manager/allocations?month=${month}&year=${year}`),
        fetch('/api/account-manager/team-leaders'),
      ]);
      if (!allocRes.ok) throw new Error('Failed to load allocations');
      if (!tlRes.ok) throw new Error('Failed to load team leaders');

      const allocData: AllocationsResponse = await allocRes.json();
      const tlData: TeamLeaderOption[] = await tlRes.json();

      setData(allocData);
      setTeamLeaders(tlData);
      setSelfInput(String(allocData.self_allocation.allocated_amount));

      const inputs: Record<string, string> = {};
      for (const tl of tlData) {
        const existing = allocData.tl_allocations.find((a) => a.team_leader_id === tl.id);
        inputs[tl.id] = String(existing?.allocated_amount ?? 0);
      }
      setTlInputs(inputs);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const saveSelf = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/account-manager/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          year,
          type: 'self',
          allocated_amount: Number(selfInput) || 0,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to save');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveTl = async (teamLeaderId: string) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/account-manager/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          year,
          type: 'team_leader',
          team_leader_id: teamLeaderId,
          allocated_amount: Number(tlInputs[teamLeaderId]) || 0,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to save');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const pct = data && data.total_target > 0
    ? Math.min(100, Math.round((data.allocated_total / data.total_target) * 100))
    : 0;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px', color: '#e6e8ec' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Distribute Your Target</h1>
      <p style={{ color: '#9aa1ac', marginBottom: 24 }}>
        Split the bulk target Manager assigned you between yourself and your Team Leaders.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          style={selectStyle}
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          style={selectStyle}
        >
          {[year - 1, year, year + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ background: '#3a1e22', color: '#ff8a8a', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading || !data ? (
        <p style={{ color: '#9aa1ac' }}>Loading…</p>
      ) : (
        <>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#9aa1ac' }}>Total target from Manager</span>
              <strong>${data.total_target.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: '#9aa1ac' }}>Allocated so far</span>
              <strong>
                ${data.allocated_total.toLocaleString()}{' '}
                <span style={{ color: data.remaining < 0 ? '#ff8a8a' : '#7fd88f' }}>
                  ({data.remaining >= 0 ? `$${data.remaining.toLocaleString()} left` : 'over-allocated'})
                </span>
              </strong>
            </div>
            <div style={{ background: '#20242c', borderRadius: 6, height: 8, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: pct >= 100 ? '#7fd88f' : '#5b8def',
                  transition: 'width 0.2s',
                }}
              />
            </div>
          </div>

          <div style={{ ...cardStyle, marginTop: 16 }}>
            <h2 style={sectionTitle}>My Own Target</h2>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="number"
                min={0}
                value={selfInput}
                onChange={(e) => setSelfInput(e.target.value)}
                style={inputStyle}
              />
              <button onClick={saveSelf} disabled={saving} style={buttonStyle}>
                Save
              </button>
              <span style={{ color: '#9aa1ac', fontSize: 13 }}>
                Achieved so far: ${data.self_allocation.achieved_amount.toLocaleString()}
              </span>
            </div>
          </div>

          <div style={{ ...cardStyle, marginTop: 16 }}>
            <h2 style={sectionTitle}>Allocate to Team Leaders</h2>
            {teamLeaders.length === 0 ? (
              <p style={{ color: '#9aa1ac' }}>No Team Leaders are assigned to you yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {teamLeaders.map((tl) => {
                  const existing = data.tl_allocations.find((a) => a.team_leader_id === tl.id);
                  return (
                    <div
                      key={tl.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        padding: '10px 0',
                        borderTop: '1px solid #2a2e37',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{tl.full_name}</div>
                        <div style={{ fontSize: 12, color: '#9aa1ac' }}>{tl.email}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input
                          type="number"
                          min={0}
                          value={tlInputs[tl.id] ?? '0'}
                          onChange={(e) =>
                            setTlInputs((prev) => ({ ...prev, [tl.id]: e.target.value }))
                          }
                          style={inputStyle}
                        />
                        <button onClick={() => saveTl(tl.id)} disabled={saving} style={buttonStyle}>
                          Save
                        </button>
                      </div>
                      {existing && (
                        <span style={{ fontSize: 12, color: '#9aa1ac', minWidth: 110, textAlign: 'right' }}>
                          Achieved: ${existing.achieved_amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#171a20',
  border: '1px solid #262a33',
  borderRadius: 12,
  padding: 20,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  marginBottom: 14,
  color: '#e6e8ec',
};

const selectStyle: React.CSSProperties = {
  background: '#171a20',
  border: '1px solid #2a2e37',
  color: '#e6e8ec',
  borderRadius: 8,
  padding: '8px 12px',
};

const inputStyle: React.CSSProperties = {
  background: '#0f1115',
  border: '1px solid #2a2e37',
  color: '#e6e8ec',
  borderRadius: 8,
  padding: '8px 10px',
  width: 120,
};

const buttonStyle: React.CSSProperties = {
  background: '#5b8def',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  cursor: 'pointer',
  fontWeight: 600,
};
