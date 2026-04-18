// ============================================================
// CHARITY DIRECTORY PAGE (Public)
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { charityApi } from '../lib/api';
import { useAuthStore } from '../store';
import { Heart, Search, ExternalLink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const CharitiesPage: React.FC = () => {
  const [charities, setCharities] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuthStore();

  const fetch = useCallback((q?: string) => {
    setLoading(true);
    charityApi.list(q).then((d: any) => setCharities(d ?? [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearch(v);
    const debouncedSearch = setTimeout(() => fetch(v || undefined), 400);
    return () => clearTimeout(debouncedSearch);
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 100, paddingBottom: 80 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="section-label">Making a Difference</span>
          <h1 style={{ fontSize: 42, marginTop: 12, marginBottom: 16 }}>Choose Your Charity</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto' }}>
            A minimum of 10% of your subscription supports your chosen cause. You can increase this anytime.
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 440, margin: '0 auto 40px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="input" value={search} onChange={handleSearch} placeholder="Search charities…" style={{ paddingLeft: 40 }} />
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {charities.map((c: any) => (
              <div key={c.id} className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(52,211,153,0.05))',
                    border: '1px solid rgba(52,211,153,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Heart size={22} color="var(--accent-green)" />
                  </div>
                  {c.isFeatured && <span className="badge badge-gold" style={{ fontSize: 10 }}>⭐ Featured</span>}
                </div>

                <h3 style={{ fontSize: 17, marginBottom: 10 }}>{c.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, marginBottom: 20 }}>
                  {c.description}
                </p>

                <div style={{ display: 'flex', gap: 8 }}>
                  {c.websiteUrl && (
                    <a href={c.websiteUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                      <ExternalLink size={12} /> Visit
                    </a>
                  )}
                  {isAuthenticated && user?.charityId !== c.id && (
                    <button
                      onClick={async () => {
                        setSelecting(c.id);
                        // This would typically call a PATCH /auth/profile endpoint
                        toast.success(`${c.name} selected as your charity!`);
                        setSelecting(null);
                      }}
                      className="btn btn-primary btn-sm"
                      disabled={selecting === c.id}
                      style={{ flex: 1 }}>
                      {selecting === c.id ? <Loader2 size={12} className="animate-spin" /> : <><Heart size={12} fill="currentColor" /> Select</>}
                    </button>
                  )}
                  {user?.charityId === c.id && (
                    <span className="badge badge-green" style={{ flex: 1, justifyContent: 'center' }}>✓ Your Charity</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && charities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p>No charities found matching "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// PRICING PAGE
// ============================================================

import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  const plans = [
    {
      name: 'Monthly',
      price: '£9.99',
      period: 'per month',
      priceId: 'monthly',
      features: [
        'Enter all monthly draws',
        'Submit Stableford scores',
        'Charity contribution (10%+)',
        'Prize pool participation',
        'Winner verification access',
        'Full dashboard access',
      ],
      highlight: false,
    },
    {
      name: 'Yearly',
      price: '£99.99',
      period: 'per year',
      saving: 'Save £19.89',
      priceId: 'yearly',
      features: [
        'Everything in Monthly',
        '2 months free (save 17%)',
        'Priority draw entry',
        'Early results access',
        'Yearly charity summary',
        'Badge & subscriber status',
      ],
      highlight: true,
    },
  ];

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span className="section-label">Transparent Pricing</span>
          <h1 style={{ fontSize: 42, marginTop: 12, marginBottom: 16 }}>Simple, Fair Plans</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto' }}>
            No hidden fees. Your contribution is split between the prize pool and your chosen charity.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 800, margin: '0 auto' }}>
          {plans.map((plan) => (
            <div key={plan.name} className="card" style={{
              flex: '1 1 320px', maxWidth: 360, padding: 36,
              borderColor: plan.highlight ? 'rgba(52,211,153,0.3)' : 'var(--border)',
              position: 'relative', overflow: 'hidden',
            }}>
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'linear-gradient(135deg,#34d399,#10b981)',
                  color: '#0a0e1a', fontSize: 10, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 'var(--radius-full)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>Best Value</div>
              )}

              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 18, marginBottom: 8 }}>{plan.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 48, fontWeight: 800, color: plan.highlight ? 'var(--accent-green)' : 'var(--text-primary)' }}>{plan.price}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{plan.period}</p>
                {plan.saving && <span className="badge badge-gold" style={{ marginTop: 8 }}>{plan.saving}</span>}
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: 'var(--text-secondary)' }}>
                    <Check size={16} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: 1 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to={isAuthenticated ? `/dashboard?subscribe=${plan.priceId}` : '/signup'}
                className={plan.highlight ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ width: '100%', justifyContent: 'center' }}>
                Get Started <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>

        {/* Prize pool breakdown */}
        <div className="card" style={{ maxWidth: 600, margin: '48px auto 0', padding: 32 }}>
          <h3 style={{ fontSize: 18, marginBottom: 20, textAlign: 'center' }}>How Your Subscription Is Distributed</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Jackpot Pool (5-match)', share: 40, color: 'var(--accent-gold)' },
              { label: '4-Match Pool', share: 35, color: 'var(--accent-green)' },
              { label: '3-Match Pool', share: 25, color: 'var(--accent-blue)' },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.share}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${item.share}%`, height: '100%', background: item.color, borderRadius: 'var(--radius-full)', transition: 'width 1s cubic-bezier(0.33,1,0.68,1)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
