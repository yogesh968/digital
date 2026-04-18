// ============================================================
// HOMEPAGE
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { charityApi } from '../lib/api';
import { Heart, Trophy, Dices, TrendingUp, ArrowRight, Star, ChevronRight } from 'lucide-react';

// Animated counter hook
const useCounter = (target: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef<boolean>(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    setTimeout(() => requestAnimationFrame(tick), 300);
  }, [target, duration]);
  return count;
};

const StatCounter: React.FC<{ value: number; suffix?: string; prefix?: string; label: string }> = ({ value, suffix = '', prefix = '', label }) => {
  const count = useCounter(value);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 40, fontWeight: 800, color: 'var(--accent-green)', lineHeight: 1 }}>
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>{label}</div>
    </div>
  );
};

export const HomePage: React.FC = () => {
  const [featuredCharities, setFeaturedCharities] = useState<any[]>([]);

  useEffect(() => {
    charityApi.featured().then((data: any) => setFeaturedCharities(data ?? [])).catch(() => {});
  }, []);

  const steps = [
    { icon: '🧑‍💻', step: '01', title: 'Subscribe & Choose', desc: 'Pick a plan and select a charity to support. A portion of every payment goes directly to your chosen cause.' },
    { icon: '⛳', step: '02', title: 'Enter Scores', desc: 'Submit your latest Stableford scores from your club app. We store only your most recent 5.' },
    { icon: '🎰', step: '03', title: 'Monthly Draw', desc: 'We match your scores against drawn numbers. 3, 4, or 5 matches wins you a prize from the pool.' },
    { icon: '🏆', step: '04', title: 'Win & Give', desc: "Winners receive their prize. Charity contributions accumulate automatically every month." },
  ];

  const features = [
    { icon: <Heart size={22} color="var(--accent-green)" />, title: 'Charity First', desc: 'Minimum 10% of every subscription goes to your chosen charity, automatically.' },
    { icon: <Dices size={22} color="var(--accent-green)" />, title: 'Monthly Draws', desc: 'Smart draw engine using both random and algorithm-based generation for fair play.' },
    { icon: <Trophy size={22} color="var(--accent-gold)" />, title: 'Real Prizes', desc: '40% jackpot, 35% four-match, 25% three-match distribution. Jackpot rolls over.' },
    { icon: <TrendingUp size={22} color="var(--accent-blue)" />, title: 'Track Everything', desc: 'Full dashboard for scores, draws, winnings, and your charity impact.' },
  ];

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <Navbar />

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(52,211,153,0.08) 0%, transparent 70%)',
        paddingTop: 120, paddingBottom: 80,
      }}>
        <div className="container">
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <div className="animate-fadeInUp" style={{ animationDelay: '0ms' }}>
              <span className="badge badge-green" style={{ marginBottom: 24, fontSize: 12, display: 'inline-flex' }}>
                <Heart size={12} fill="currentColor" /> Golf with Purpose
              </span>
            </div>

            <h1 className="animate-fadeInUp" style={{
              fontSize: 'clamp(42px, 7vw, 80px)', fontWeight: 900,
              lineHeight: 1.05, letterSpacing: '-0.03em',
              marginBottom: 28, animationDelay: '80ms'
            }}>
              Play Golf.{' '}
              <span className="text-gradient-green">Win Prizes.</span>
              <br />Change{' '}
              <span className="text-gradient-gold">Lives.</span>
            </h1>

            <p className="animate-fadeInUp" style={{
              fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.7,
              maxWidth: 540, margin: '0 auto 40px', animationDelay: '160ms'
            }}>
              A subscription platform where your golf scores enter you into monthly prize draws — while automatically funding your chosen charity every single month.
            </p>

            <div className="animate-fadeInUp" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', animationDelay: '240ms' }}>
              <Link to="/signup" className="btn btn-primary btn-lg animate-pulse-glow">
                Start Playing <ArrowRight size={18} />
              </Link>
              <Link to="/how-it-works" className="btn btn-outline btn-lg">
                How It Works
              </Link>
            </div>

            {/* Trust bar */}
            <div className="animate-fadeInUp" style={{ marginTop: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, animationDelay: '320ms' }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="var(--accent-gold)" color="var(--accent-gold)" />)}
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 8 }}>Trusted by thousands of golfers</span>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT STATS */}
      <section style={{ padding: '80px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(17,24,39,0.8), rgba(10,14,26,0.8))' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 48 }}>
            <StatCounter value={12450} prefix="£" label="Raised For Charity" />
            <StatCounter value={847} label="Active Subscribers" />
            <StatCounter value={36} label="Monthly Draws Run" />
            <StatCounter value={24} label="Charities Supported" />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '100px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span className="section-label">Process</span>
            <h2 style={{ fontSize: 40, marginTop: 12 }}>Simple. Transparent. Rewarding.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {steps.map((s) => (
              <div key={s.step} className="card" style={{ padding: 32, textAlign: 'center', position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: 20, right: 20,
                  fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                  fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.1em',
                }}>{s.step}</div>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{s.icon}</div>
                <h3 style={{ fontSize: 20, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '80px 0', background: 'linear-gradient(180deg, transparent, rgba(17,24,39,0.6), transparent)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {features.map((f) => (
              <div key={f.title} className="card" style={{ padding: 28, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{f.icon}</div>
                <div>
                  <h4 style={{ fontSize: 16, marginBottom: 6 }}>{f.title}</h4>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHARITIES SPOTLIGHT */}
      {featuredCharities.length > 0 && (
        <section style={{ padding: '80px 0' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
              <div>
                <span className="section-label">Impact</span>
                <h2 style={{ fontSize: 32, marginTop: 8 }}>Supporting Amazing Causes</h2>
              </div>
              <Link to="/charities" className="btn btn-outline btn-sm">
                View All <ChevronRight size={16} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {featuredCharities.slice(0, 3).map((c: any) => (
                <div key={c.id} className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(52,211,153,0.05))',
                      border: '1px solid rgba(52,211,153,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Heart size={20} color="var(--accent-green)" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 15, lineHeight: 1.3 }}>{c.name}</h4>
                      <span className="badge badge-green" style={{ fontSize: 10, marginTop: 2 }}>Featured</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                    {c.description.slice(0, 90)}…
                  </p>
                  <Link to="/charities" className="btn btn-ghost btn-sm" style={{ padding: '6px 0', color: 'var(--accent-green)' }}>
                    Learn more <ChevronRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{
        padding: '100px 0',
        background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(52,211,153,0.06) 0%, transparent 70%)',
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="section-label">Join Today</span>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', marginTop: 12, marginBottom: 20 }}>
            Ready to Play with <span className="text-gradient-green">Purpose?</span>
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 40px' }}>
            Join thousands of golfers making an impact every month. From £9.99/mo.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get Started — From £9.99 <ArrowRight size={18} />
            </Link>
            <Link to="/pricing" className="btn btn-outline btn-lg">View Plans</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'var(--text-primary)' }}>
            Golf<span style={{ color: 'var(--accent-green)' }}>Gives</span>
          </span>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>© 2026 GolfGives. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
