'use client';
import { useState }                              from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, Plus, Pencil }                  from 'lucide-react';
import { toast }                                 from 'sonner';
import type { User }                             from '@/types';

const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CURRENCIES = ['USD','GBP','EUR','AUD','INR','SGD'];
const currentYear  = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const inpStyle: React.CSSProperties = {
  width:'100%', height:40, background:'rgba(255,255,255,.04)',
  border:'1px solid rgba(124,58,237,.18)', borderRadius:9,
  padding:'0 12px', fontSize:'.85rem', color:'#f1f5f9', outline:'none',
};
const selStyle: React.CSSProperties = { ...inpStyle, cursor:'pointer' };
const lblStyle: React.CSSProperties = {
  fontSize:'.75rem', color:'rgba(148,163,184,.55)',
  textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:6,
};

export default function TargetsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    account_manager_id: '',
    month:         String(currentMonth),
    year:          String(currentYear),
    target_amount: '',
    currency:      'USD',
  });

  const { data: managers = [] } = useQuery<User[]>({
    queryKey: ['account-managers'],
    queryFn:  async () => (await (await fetch('/api/users?role=account_manager')).json()).data ?? [],
  });

  const { data: targets = [], isLoading } = useQuery({
    queryKey: ['revenue-targets'],
    queryFn:  async () => (await (await fetch('/api/revenue-targets')).json()).data ?? [],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res  = await fetch('/api/revenue-targets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['revenue-targets'] });
      toast.success('Target saved!');
      setShowModal(false);
      setForm({ account_manager_id:'', month:String(currentMonth), year:String(currentYear), target_amount:'', currency:'USD' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="wm-page-inner">

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }} className="wm-fade-up">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <Target size={15} style={{ color:'#a78bfa' }} />
            <span style={{ fontSize:'.72rem', color:'rgba(148,163,184,.5)', textTransform:'uppercase', letterSpacing:'.06em' }}>Goals</span>
          </div>
          <h1 style={{ fontSize:'1.65rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Revenue Targets</h1>
          <p style={{ fontSize:'.875rem', color:'rgba(148,163,184,.5)' }}>Set monthly revenue targets for account managers</p>
        </div>
        <button className="wm-btn-primary" onClick={() => setShowModal(true)}
          style={{ display:'flex', alignItems:'center', gap:7, height:38 }}>
          <Plus size={15}/> Set Target
        </button>
      </div>

      {/* Target cards */}
      {isLoading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'rgba(148,163,184,.3)' }}>Loading...</div>
      ) : targets.length === 0 ? (
        <div className="wm-card" style={{ padding:'60px 24px', textAlign:'center' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'rgba(167,139,250,.1)', border:'0.5px solid rgba(167,139,250,.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', color:'#a78bfa' }}>
            <Target size={22}/>
          </div>
          <p style={{ color:'rgba(148,163,184,.4)', fontSize:'.9rem', marginBottom:4 }}>No targets set yet</p>
          <p style={{ color:'rgba(148,163,184,.25)', fontSize:'.8rem' }}>Click "Set Target" to create a revenue target</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }} className="wm-fade-up-2">
          {targets.map((t: any) => (
            <div key={t.id} className="wm-card" style={{ padding:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div>
                  <p style={{ fontWeight:600, color:'#f1f5f9', fontSize:'.9rem', marginBottom:3 }}>
                    {t.accountManager?.full_name}
                  </p>
                  <p style={{ fontSize:'.78rem', color:'rgba(148,163,184,.5)' }}>
                    {MONTHS[t.month - 1]} {t.year}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setForm({
                      account_manager_id: t.account_manager_id,
                      month:         String(t.month),
                      year:          String(t.year),
                      target_amount: String(t.target_amount),
                      currency:      t.currency,
                    });
                    setShowModal(true);
                  }}
                  style={{ width:28, height:28, borderRadius:7, background:'rgba(255,255,255,.04)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(148,163,184,.4)', transition:'all .2s' }}
                  onMouseEnter={e => { const b=e.currentTarget as HTMLButtonElement; b.style.background='rgba(167,139,250,.12)'; b.style.color='#a78bfa'; }}
                  onMouseLeave={e => { const b=e.currentTarget as HTMLButtonElement; b.style.background='rgba(255,255,255,.04)'; b.style.color='rgba(148,163,184,.4)'; }}>
                  <Pencil size={12}/>
                </button>
              </div>
              <p style={{ fontSize:'1.8rem', fontWeight:700, color:'#f1f5f9' }}>
                {t.currency} {parseFloat(t.target_amount).toLocaleString()}
              </p>
              <p style={{ fontSize:'.72rem', color:'rgba(148,163,184,.4)', marginTop:4 }}>Monthly target</p>

              {/* Progress bar if we have upsell data */}
              <div style={{ marginTop:12, height:3, borderRadius:99, background:'rgba(255,255,255,.06)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:'0%', borderRadius:99, background:'linear-gradient(90deg,#7c3aed,#3b82f6)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Custom Modal ── */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          {/* Backdrop */}
          <div onClick={() => setShowModal(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)' }} />
          {/* Panel */}
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:460, background:'#0e0e20', border:'1px solid rgba(124,58,237,.3)', borderRadius:18, padding:28, boxShadow:'0 0 60px rgba(124,58,237,.2)' }}>
            <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>Set Revenue Target</h2>
            <p style={{ fontSize:'.82rem', color:'rgba(148,163,184,.5)', marginBottom:20 }}>Set a monthly revenue target for an account manager</p>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Account Manager */}
              <div>
                <label style={lblStyle}>Account Manager</label>
                <select style={selStyle} value={form.account_manager_id}
                  onChange={e => setForm(f => ({ ...f, account_manager_id: e.target.value }))}>
                  <option value="">Select AM</option>
                  {managers.map((m: User) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>

              {/* Month + Year */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lblStyle}>Month</label>
                  <select style={selStyle} value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}>
                    {MONTHS.map((m, i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lblStyle}>Year</label>
                  <select style={selStyle} value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
                    {[currentYear-1, currentYear, currentYear+1].map(y => <option key={y} value={String(y)}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Amount + Currency */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lblStyle}>Target Amount</label>
                  <input style={inpStyle} type="number" placeholder="5000"
                    value={form.target_amount}
                    onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} />
                </div>
                <div>
                  <label style={lblStyle}>Currency</label>
                  <select style={selStyle} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button className="wm-btn-ghost" onClick={() => setShowModal(false)}
                  style={{ flex:1, height:40 }}>Cancel</button>
                <button className="wm-btn-primary"
                  disabled={saveMutation.isPending || !form.account_manager_id || !form.target_amount}
                  onClick={() => saveMutation.mutate(form)}
                  style={{ flex:1, height:40 }}>
                  Save Target
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}