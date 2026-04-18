// ============================================================
// AUTH PAGES — Login + Signup
// ============================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

const AuthShell: React.FC<{ children: React.ReactNode; title: string; sub: React.ReactNode }> = ({ children, title, sub }) => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(52,211,153,0.07) 0%, transparent 70%)',
    padding: '24px',
  }}>
    <div className="card" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#34d399,#10b981)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⛳</div>
          <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:16, color:'var(--text-primary)' }}>Golf<span style={{ color:'var(--accent-green)' }}>Gives</span></span>
        </Link>
        <h1 style={{ fontSize: 26, marginBottom: 8 }}>{title}</h1>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{sub}</div>
      </div>
      {children}
    </div>
  </div>
);

// ── LOGIN ──────────────────────────────────────────────────────────
export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await authApi.login(email, password) as any;
      setAuth(result.user, result.accessToken);
      toast.success('Welcome back!');
      navigate(result.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" sub={<>Don't have an account? <Link to="/signup" style={{ color:'var(--accent-green)' }}>Sign up</Link></>}>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
        <div>
          <label className="field-label">Email address</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
        </div>
        <div>
          <label className="field-label">Password</label>
          <div style={{ position:'relative' }}>
            <input className="input" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingRight:44 }} />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop:4 }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <>Log In <ArrowRight size={16} /></>}
        </button>
      </form>
    </AuthShell>
  );
};

// ── SIGNUP ─────────────────────────────────────────────────────────
export const SignupPage: React.FC = () => {
  const [form, setForm] = useState({ email:'', password:'', fullName:'' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await authApi.signup(form.email, form.password, form.fullName) as any;
      setAuth(result.user, result.accessToken);
      toast.success('Account created! Welcome to GolfGives 🎉');
      navigate('/dashboard/charity');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? err?.message ?? 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" sub={<>Already have an account? <Link to="/login" style={{ color:'var(--accent-green)' }}>Log in</Link></>}>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
        <div>
          <label className="field-label">Full name</label>
          <input className="input" type="text" value={form.fullName} onChange={set('fullName')} placeholder="John Smith" required autoFocus />
        </div>
        <div>
          <label className="field-label">Email address</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
        </div>
        <div>
          <label className="field-label">Password</label>
          <div style={{ position:'relative' }}>
            <input className="input" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min. 8 characters" minLength={8} required style={{ paddingRight:44 }} />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <p style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5 }}>
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <>Create Account <ArrowRight size={16} /></>}
        </button>
      </form>
    </AuthShell>
  );
};
