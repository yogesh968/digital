// ============================================================
// USER DASHBOARD — Overview page
// ============================================================

import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Link } from 'react-router-dom';
import { subscriptionApi, scoreApi, drawApi, winnerApi } from '../lib/api';
import { useAuthStore } from '../store';
import { Trophy, Target, Heart, Dices, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DashShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
    <Sidebar />
    <main style={{ flex: 1, overflow: 'auto', padding: '36px 32px' }}>
      {children}
    </main>
  </div>
);

export const DashboardOverview: React.FC = () => {
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [latestDraw, setLatestDraw] = useState<any>(null);
  const [winnings, setWinnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      subscriptionApi.getStatus().then(setSubscription).catch(() => {}),
      scoreApi.getAll().then((s: any) => setScores(s ?? [])).catch(() => {}),
      drawApi.latest().then(setLatestDraw).catch(() => {}),
      winnerApi.myVerifications().then((w: any) => setWinnings(w ?? [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashShell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <Loader2 size={32} className="animate-spin" color="var(--accent-green)" />
        </div>
      </DashShell>
    );
  }

  const isActive = subscription?.status === 'active';
  const totalWon = winnings.filter((w: any) => w.payoutStatus === 'paid').reduce((s: number, w: any) => s + (w.prizeAmount ?? 0), 0);

  const cards = [
    {
      icon: <Target size={20} color="var(--accent-green)" />,
      label: 'Scores Entered',
      value: `${scores.length}/5`,
      color: 'green',
      link: '/dashboard/scores',
    },
    {
      icon: <Dices size={20} color="var(--accent-blue)" />,
      label: 'Latest Draw',
      value: latestDraw ? new Date(latestDraw.month).toLocaleString('en', { month: 'short', year: 'numeric' }) : '—',
      color: 'blue',
      link: '/dashboard/draws',
    },
    {
      icon: <Trophy size={20} color="var(--accent-gold)" />,
      label: 'Total Winnings',
      value: `£${totalWon.toFixed(2)}`,
      color: 'gold',
      link: '/dashboard/winnings',
    },
    {
      icon: <Heart size={20} color="var(--danger)" />,
      label: 'Charity %',
      value: `${user?.charityPercentage ?? 10}%`,
      color: 'green',
      link: '/dashboard/charity',
    },
  ];

  return (
    <DashShell>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>
          Good morning, <span className="text-gradient-green">{user?.fullName?.split(' ')[0]}</span> 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Here's your GolfGives overview</p>
      </div>

      {/* Subscription banner */}
      {!isActive && (
        <div className="card" style={{ padding: 20, marginBottom: 28, borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <AlertCircle size={20} color="var(--accent-gold)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--accent-gold)', margin: 0 }}>No active subscription</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Subscribe to enter draws and submit scores</p>
          </div>
          <Link to="/pricing" className="btn btn-gold btn-sm">Subscribe Now</Link>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }} className="stagger-children">
        {cards.map((c) => (
          <Link key={c.label} to={c.link} style={{ textDecoration: 'none' }}>
            <div className={`card stat-card ${c.color} animate-fadeInUp`} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{c.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent scores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16 }}>Recent Scores</h3>
            <Link to="/dashboard/scores" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-green)', padding: '4px 8px' }}>
              Manage <ChevronRight size={14} />
            </Link>
          </div>
          {scores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <Target size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p style={{ fontSize: 13 }}>No scores yet. Enter your first score!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scores.map((s: any, i: number) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < scores.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className="score-ball">{s.score}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Stableford {s.score}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{new Date(s.playedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest draw result */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16 }}>Latest Draw</h3>
            <Link to="/dashboard/draws" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-green)', padding: '4px 8px' }}>
              View <ChevronRight size={14} />
            </Link>
          </div>
          {!latestDraw ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <Dices size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p style={{ fontSize: 13 }}>No published draws yet</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {latestDraw.winningNumbers?.map((n: number) => {
                  const matched = scores.some((s: any) => s.score === n);
                  return <div key={n} className={`number-ball ${matched ? 'matched' : ''}`}>{n}</div>;
                })}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {new Date(latestDraw.month).toLocaleString('en', { month: 'long', year: 'numeric' })} draw · {latestDraw.status}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashShell>
  );
};

// ── SCORE MANAGEMENT PAGE ──────────────────────────────────────────
export const ScoresPage: React.FC = () => {
  const [scores, setScores] = useState<any[]>([]);
  const [score, setScore] = useState('');
  const [playedAt, setPlayedAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchScores = () => {
    scoreApi.getAll().then((s: any) => setScores(s ?? [])).finally(() => setFetching(false));
  };

  useEffect(() => { fetchScores(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!score || !playedAt) return;
    const n = parseInt(score);
    if (n < 1 || n > 45) { toast.error('Score must be between 1 and 45'); return; }
    setLoading(true);
    try {
      await scoreApi.add(n, new Date(playedAt).toISOString());
      toast.success(scores.length >= 5 ? 'Score added — oldest removed (rolling 5)' : 'Score added!');
      setScore('');
      setPlayedAt('');
      fetchScores();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? 'Failed to add score');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashShell>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>My Scores</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Enter your Stableford scores. We keep only your latest 5.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24 }}>
        {/* Entry form */}
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Add New Score</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="field-label">Stableford Score (1–45)</label>
              <input className="input" type="number" min={1} max={45} value={score} onChange={e => setScore(e.target.value)} placeholder="e.g. 32" required />
            </div>
            <div>
              <label className="field-label">Date Played</label>
              <input className="input" type="date" value={playedAt} onChange={e => setPlayedAt(e.target.value)} max={new Date().toISOString().split('T')[0]} required />
            </div>
            {scores.length >= 5 && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <AlertCircle size={16} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: 'var(--accent-gold)', margin: 0, lineHeight: 1.5 }}>
                  You have 5 scores. Adding another will remove your oldest.
                </p>
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Add Score'}
            </button>
          </form>
        </div>

        {/* Scores list */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16 }}>Your Last 5 Scores</h3>
            <span className="badge badge-green">{scores.length}/5</span>
          </div>

          {fetching ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 56 }} />)}
            </div>
          ) : scores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <Target size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No scores yet. Add your first score!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {scores.map((s: any, i: number) => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
                  borderBottom: i < scores.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div className="score-ball" style={{ fontSize: 17, width: 50, height: 50 }}>{s.score}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, margin: 0 }}>Stableford {s.score} pts</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                      {new Date(s.playedAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  {i === 0 && <span className="badge badge-green">Latest</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashShell>
  );
};
