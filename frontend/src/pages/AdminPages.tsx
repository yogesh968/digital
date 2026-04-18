// ============================================================
// ADMIN PANEL PAGES
// ============================================================

import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { adminApi, drawApi, winnerApi } from '../lib/api';
import { BarChart3, Users, Dices, Heart, Shield, Loader2, Play, Eye, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
    <Sidebar />
    <main style={{ flex: 1, overflow: 'auto', padding: '36px 32px' }}>
      {children}
    </main>
  </div>
);

// ── ANALYTICS DASHBOARD ────────────────────────────────────────────
export const AdminDashboard: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.analytics().then(setReport).catch(() => toast.error('Failed to load analytics')).finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminShell><div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}><Loader2 size={32} className="animate-spin" color="var(--accent-green)" /></div></AdminShell>;

  const stats = [
    { label: 'Total Users', value: report?.totalUsers ?? 0, icon: <Users size={20} />, color: 'blue', prefix: '' },
    { label: 'Active Subscribers', value: report?.activeSubscribers ?? 0, icon: <BarChart3 size={20} />, color: 'green', prefix: '' },
    { label: 'Total Prize Pool', value: (report?.totalPrizePool ?? 0).toFixed(2), icon: <Dices size={20} />, color: 'gold', prefix: '£' },
    { label: 'Charity Raised', value: (report?.totalCharityContributions ?? 0).toFixed(2), icon: <Heart size={20} />, color: 'green', prefix: '£' },
    { label: 'Draws Published', value: report?.publishedDraws ?? 0, icon: <CheckCircle size={20} />, color: 'blue', prefix: '' },
    { label: 'Pending Verifications', value: report?.pendingVerifications ?? 0, icon: <Shield size={20} />, color: 'gold', prefix: '' },
  ];

  return (
    <AdminShell>
      <div style={{ marginBottom: 32 }}>
        <span className="section-label">Admin</span>
        <h1 style={{ fontSize: 28, marginTop: 8 }}>Analytics Dashboard</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }} className="stagger-children">
        {stats.map((s) => (
          <div key={s.label} className={`card stat-card ${s.color} animate-fadeInUp`}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div style={{ width:40, height:40, borderRadius:'var(--radius-md)', background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', color: s.color === 'gold' ? 'var(--accent-gold)' : s.color === 'green' ? 'var(--accent-green)' : 'var(--accent-blue)' }}>{s.icon}</div>
            </div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:30, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>{s.prefix}{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
};

// ── DRAW CONTROL PAGE ──────────────────────────────────────────────
export const AdminDrawsPage: React.FC = () => {
  const [draws, setDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawType, setDrawType] = useState<'random' | 'algorithmic'>('random');
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDraws = () => drawApi.all().then((d: any) => setDraws(d ?? [])).finally(() => setLoading(false));
  useEffect(() => { fetchDraws(); }, []);

  const createDraw = async () => {
    setActionLoading('create');
    try {
      await drawApi.create(drawType);
      toast.success('Draw created');
      fetchDraws();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to create draw');
    } finally { setActionLoading(null); }
  };

  const simulate = async (id: string) => {
    setActionLoading(id + '-sim');
    try {
      const result: any = await drawApi.simulate(id);
      setSimulationResult(result);
      toast.success('Simulation complete');
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Simulation failed');
    } finally { setActionLoading(null); }
  };

  const run = async (id: string) => {
    setActionLoading(id + '-run');
    try {
      await drawApi.run(id);
      toast.success('Draw run and entries saved');
      fetchDraws();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Draw run failed');
    } finally { setActionLoading(null); }
  };

  const publish = async (id: string) => {
    setActionLoading(id + '-pub');
    try {
      await drawApi.publish(id);
      toast.success('Draw published!');
      fetchDraws();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Publish failed');
    } finally { setActionLoading(null); }
  };

  const statusBadge = (status: string) => {
    if (status === 'published') return <span className="badge badge-green">Published</span>;
    if (status === 'simulated') return <span className="badge badge-blue">Simulated</span>;
    return <span className="badge badge-gray">Draft</span>;
  };

  return (
    <AdminShell>
      <div style={{ marginBottom: 32 }}>
        <span className="section-label">Admin</span>
        <h1 style={{ fontSize: 28, marginTop: 8 }}>Draw Control</h1>
      </div>

      {/* Create draw */}
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Create New Draw</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['random', 'algorithmic'] as const).map((t) => (
              <button key={t} onClick={() => setDrawType(t)}
                className={drawType === t ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}>
                {t === 'random' ? '🎲 Random' : '📊 Algorithmic'}
              </button>
            ))}
          </div>
          <button onClick={createDraw} className="btn btn-gold btn-sm" disabled={actionLoading === 'create'}>
            {actionLoading === 'create' ? <Loader2 size={14} className="animate-spin" /> : <><Play size={14} /> Create Draw</>}
          </button>
        </div>
      </div>

      {/* Simulation result */}
      {simulationResult && (
        <div className="card" style={{ padding: 24, marginBottom: 24, borderColor: 'rgba(52,211,153,0.2)' }}>
          <h3 style={{ fontSize: 15, marginBottom: 16, color: 'var(--accent-green)' }}>Simulation Preview</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {simulationResult.winningNumbers?.map((n: number) => <div key={n} className="number-ball">{n}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {Object.entries(simulationResult.tierSummary ?? {}).map(([tier, count]) => (
              <div key={tier} style={{ textAlign:'center', padding:12, background:'rgba(255,255,255,0.03)', borderRadius:'var(--radius-md)' }}>
                <div style={{ fontWeight:700, fontSize:20 }}>{count as number}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{tier}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:12, fontSize:13, color:'var(--text-secondary)' }}>
            Jackpot rollover: £{simulationResult.jackpotRollover?.toFixed(2) ?? '0.00'}
          </div>
        </div>
      )}

      {/* Draws table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16 }}>All Draws</h3>
        </div>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 48 }} />)}
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Month</th><th>Type</th><th>Pool</th><th>Numbers</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {draws.map((d: any) => (
                <tr key={d.id}>
                  <td>{new Date(d.month).toLocaleString('en', { month: 'long', year: 'numeric' })}</td>
                  <td><span className="badge badge-blue" style={{ fontSize:11 }}>{d.drawType}</span></td>
                  <td style={{ color:'var(--accent-green)', fontWeight:600 }}>£{d.prizePoolTotal?.toFixed(2)}</td>
                  <td>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {d.winningNumbers?.length > 0
                        ? d.winningNumbers.map((n: number) => <span key={n} style={{ fontSize:12, background:'rgba(255,255,255,0.08)', padding:'2px 6px', borderRadius:4, fontWeight:600 }}>{n}</span>)
                        : <span style={{ color:'var(--text-muted)', fontSize:13 }}>Not drawn</span>}
                    </div>
                  </td>
                  <td>{statusBadge(d.status)}</td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      {d.status === 'draft' && (
                        <>
                          <button onClick={() => simulate(d.id)} className="btn btn-outline btn-sm" disabled={actionLoading === d.id+'-sim'} title="Simulate">
                            {actionLoading === d.id+'-sim' ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                          </button>
                          <button onClick={() => run(d.id)} className="btn btn-primary btn-sm" disabled={actionLoading === d.id+'-run'} title="Run">
                            {actionLoading === d.id+'-run' ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                          </button>
                        </>
                      )}
                      {d.status === 'simulated' && (
                        <button onClick={() => publish(d.id)} className="btn btn-gold btn-sm" disabled={actionLoading === d.id+'-pub'}>
                          {actionLoading === d.id+'-pub' ? <Loader2 size={12} className="animate-spin" /> : 'Publish'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
};

// ── WINNERS MANAGEMENT ────────────────────────────────────────────
export const AdminWinnersPage: React.FC = () => {
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchWinners = () => winnerApi.allVerifications().then((w: any) => setWinners(w ?? [])).finally(() => setLoading(false));
  useEffect(() => { fetchWinners(); }, []);

  const review = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id);
    try {
      await winnerApi.review(id, status);
      toast.success(`Verification ${status}`);
      fetchWinners();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed');
    } finally { setActionLoading(null); }
  };

  const markPaid = async (id: string) => {
    setActionLoading(id + '-pay');
    try {
      await winnerApi.markPaid(id);
      toast.success('Marked as paid');
      fetchWinners();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed');
    } finally { setActionLoading(null); }
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return <span className="badge badge-green">Approved</span>;
    if (status === 'rejected') return <span className="badge badge-red">Rejected</span>;
    return <span className="badge badge-gold">Pending</span>;
  };

  return (
    <AdminShell>
      <div style={{ marginBottom: 32 }}>
        <span className="section-label">Admin</span>
        <h1 style={{ fontSize: 28, marginTop: 8 }}>Winner Verifications</h1>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
          </div>
        ) : winners.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Shield size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No winner verifications yet</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>User</th><th>Draw Entry</th><th>Proof</th><th>Status</th><th>Payout</th><th>Actions</th></tr></thead>
            <tbody>
              {winners.map((w: any) => (
                <tr key={w.id}>
                  <td style={{ fontSize: 13 }}>{w.userId?.slice(0, 8)}…</td>
                  <td style={{ fontSize: 13 }}>{w.drawEntryId?.slice(0, 8)}…</td>
                  <td>
                    <a href={w.proofUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ padding:'4px 8px', color:'var(--accent-blue)', fontSize:12 }}>
                      View Proof
                    </a>
                  </td>
                  <td>{statusBadge(w.status)}</td>
                  <td>
                    {w.payoutStatus === 'paid'
                      ? <span className="badge badge-green">Paid</span>
                      : <span className="badge badge-gray">Pending</span>}
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      {w.status === 'pending' && (
                        <>
                          <button onClick={() => review(w.id, 'approved')} className="btn btn-primary btn-sm" disabled={actionLoading === w.id} title="Approve">
                            {actionLoading === w.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                          </button>
                          <button onClick={() => review(w.id, 'rejected')} className="btn btn-sm" style={{ background:'rgba(248,113,113,0.15)', color:'var(--danger)', border:'1px solid rgba(248,113,113,0.3)' }} disabled={actionLoading === w.id} title="Reject">
                            <XCircle size={12} />
                          </button>
                        </>
                      )}
                      {w.status === 'approved' && w.payoutStatus === 'pending' && (
                        <button onClick={() => markPaid(w.id)} className="btn btn-gold btn-sm" disabled={actionLoading === w.id+'-pay'}>
                          {actionLoading === w.id+'-pay' ? <Loader2 size={12} className="animate-spin" /> : <><DollarSign size={12} /> Pay</>}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
};
