'use client';
import { useState }                          from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Plus, Pencil, Trash2, TrendingUp }  from 'lucide-react';
import { toast }                             from 'sonner';
import type { Client }                       from '@/types';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(251,191,36,.12)',  color: '#fbbf24' },
  active:    { bg: 'rgba(96,165,250,.12)',  color: '#60a5fa' },
  completed: { bg: 'rgba(52,211,153,.12)',  color: '#34d399' },
  cancelled: { bg: 'rgba(248,113,113,.12)', color: '#f87171' },
};
const CURRENCIES = ['USD','GBP','EUR','AUD','INR','SGD'];
const emptyForm  = { client_id: '', date: '', product_sold: '', total_cost: '', upfront_amount: '', project_status: 'pending', currency: 'USD', notes: '' };

const inpStyle: React.CSSProperties = { width: '100%', height: 40, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(124,58,237,.18)', borderRadius: 9, padding: '0 12px', fontSize: '.85rem', color: '#f1f5f9', outline: 'none' };
const selStyle: React.CSSProperties = { ...inpStyle, cursor: 'pointer' };
const lblStyle: React.CSSProperties = { fontSize: '.75rem', color: 'rgba(148,163,184,.55)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 };

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
  const monthUpsells = upsells.filter((u: any) => { const d = new Date(u.date); return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear; });
  const monthRevenue = monthUpsells.reduce((s: number, u: any) => s + parseFloat(u.total_cost || 0), 0);
  const monthTarget  = targets.find((t: any) => t.month === currentMonth && t.year === currentYear);
  const targetAmount = monthTarget ? parseFloat(monthTarget.target_amount) : 0;
  const progress     = targetAmount > 0 ? Math.min((monthRevenue / targetAmount) * 100, 100) : 0;

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editId ? 'PATCH' : 'POST';
      const body   = editId ? JSON.stringify({ id: editId, ...data }) : JSON.stringify(data);
      const res    = await fetch('/api/upsells', { method, headers: { 'Content-Type': 'application/json' }, body });
      const json   = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['upsells'] });
      toast.success(editId ? 'Upsell updated!' : 'Upsell logged!');
      setShowModal(false); setEditId(null); setForm({ ...emptyForm });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const res = await fetch(`/api/upsells?id=${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Delete failed'); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['upsells'] }); toast.success('Upsell deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (u: any) => {
    setEditId(u.id);
    setForm({ client_id: u.client_id, date: u.date?.split('T')[0] || '', product_sold: u.product_sold, total_cost: String(u.total_cost), upfront_amount: String(u.upfront_amount), project_status: u.project_status, currency: u.currency, notes: u.notes || '' });
    setShowModal(true);
  };

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }} className="wm-fade-up">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <TrendingUp size={15} style={{ color: '#34d399' }} />
            <span style={{ fontSize: '.72rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Revenue</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Upsell Tracker</h1>
          <p style={{ fontSize: '.875rem', color: 'rgba(148,163,184,.5)' }}>Log and track upsell deals per client</p>
        </div>
        <button className="wm-btn-primary"
          onClick={() => { setEditId(null); setForm({ ...emptyForm }); setShowModal(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38 }}>
          <Plus size={15} /> Log Upsell
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginBottom: 24 }} className="wm-fade-up">
        <div className="wm-stat">
          <p style={{ fontSize: '.7rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>This Month Revenue</p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9' }}>${monthRevenue.toLocaleString()}</p>
          {targetAmount > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: 'rgba(148,163,184,.45)', marginBottom: 5 }}>
                <span>vs ${targetAmount.toLocaleString()}</span><span>{progress.toFixed(0)}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, width: `${progress}%`, background: progress >= 100 ? 'linear-gradient(90deg,#059669,#34d399)' : 'linear-gradient(90deg,#7c3aed,#3b82f6)', transition: 'width .5s' }} />
              </div>
            </div>
          )}
        </div>
        <div className="wm-stat">
          <p style={{ fontSize: '.7rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Deals This Month</p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9' }}>{monthUpsells.length}</p>
        </div>
        <div className="wm-stat">
          <p style={{ fontSize: '.7rem', color: 'rgba(148,163,184,.5)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Monthly Target</p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9' }}>{targetAmount > 0 ? `$${targetAmount.toLocaleString()}` : 'Not set'}</p>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(148,163,184,.3)' }}>Loading...</div>
      ) : upsells.length === 0 ? (
        <div className="wm-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <TrendingUp size={36} style={{ color: 'rgba(148,163,184,.15)', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: 'rgba(148,163,184,.4)', fontSize: '.9rem' }}>No upsells logged yet</p>
          <p style={{ color: 'rgba(148,163,184,.25)', fontSize: '.8rem', marginTop: 4 }}>Click "Log Upsell" to record a deal</p>
        </div>
      ) : (
        <div className="wm-card wm-fade-up-2" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="wm-table">
              <thead>
                <tr>
                  <th>Date</th><th>Client</th><th>Product</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Upfront</th>
                  <th style={{ textAlign: 'right' }}>Due</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
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
                      <td>{u.product_sold}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{u.currency} {parseFloat(u.total_cost).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: '#34d399' }}>{u.currency} {parseFloat(u.upfront_amount).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: '#fbbf24' }}>{u.currency} {parseFloat(u.remaining_due || 0).toLocaleString()}</td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: '.7rem', fontWeight: 500, background: st.bg, color: st.color, textTransform: 'capitalize' }}>
                          {u.project_status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                          {[
                            { icon: Pencil, action: () => openEdit(u),              color: '#a78bfa' },
                            { icon: Trash2, action: () => deleteMutation.mutate(u.id), color: '#f87171' },
                          ].map(({ icon: Icon, action, color }, i) => (
                            <button key={i} onClick={action}
                              style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'rgba(255,255,255,.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(148,163,184,.4)', transition: 'all .2s' }}
                              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = color + '18'; b.style.color = color; }}
                              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(255,255,255,.04)'; b.style.color = 'rgba(148,163,184,.4)'; }}>
                              <Icon size={12} />
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Custom Modal — no radix */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          {/* Backdrop */}
          <div onClick={() => setShowModal(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          {/* Panel */}
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28, boxShadow:'0 0 60px rgba(124,58,237,.2)' }}>
            <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>{editId ? 'Edit Upsell' : 'Log Upsell'}</h2>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:20 }}>Record an upsell deal for a client</p>

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={lblStyle}>Client</label>
                <select style={selStyle} value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                  <option value="">Select client</option>
                  {clients.map((c: Client) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label style={lblStyle}>Product / Service</label>
                <input style={inpStyle} placeholder="e.g. SEO Package" value={form.product_sold} onChange={e => setForm(f => ({ ...f, product_sold: e.target.value }))} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={lblStyle}>Date</label>
                  <input style={inpStyle} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label style={lblStyle}>Currency</label>
                  <select style={selStyle} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={lblStyle}>Total Cost</label>
                  <input style={inpStyle} type="number" placeholder="0.00" value={form.total_cost} onChange={e => setForm(f => ({ ...f, total_cost: e.target.value }))} />
                </div>
                <div>
                  <label style={lblStyle}>Upfront Amount</label>
                  <input style={inpStyle} type="number" placeholder="0.00" value={form.upfront_amount} onChange={e => setForm(f => ({ ...f, upfront_amount: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={lblStyle}>Project Status</label>
                <select style={selStyle} value={form.project_status} onChange={e => setForm(f => ({ ...f, project_status: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label style={lblStyle}>Notes</label>
                <textarea placeholder="Any additional notes..." value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3} style={{ ...inpStyle, height:'auto', resize:'none', padding:'10px 12px' }} />
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button className="wm-btn-ghost" onClick={() => setShowModal(false)} style={{ flex:1, height:40 }}>Cancel</button>
                <button className="wm-btn-primary" style={{ flex:1, height:40 }}
                  disabled={saveMutation.isPending || !form.client_id || !form.product_sold || !form.date || !form.total_cost}
                  onClick={() => saveMutation.mutate(form)}>
                  {editId ? 'Update' : 'Log Upsell'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}