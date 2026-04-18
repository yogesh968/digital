// ============================================================
// DASHBOARD SIDEBAR
// ============================================================

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import {
  LayoutDashboard, Target, Heart, Trophy, Settings,
  LogOut, Shield, Users, Dices, BarChart3
} from 'lucide-react';

interface NavItem { to: string; label: string; icon: React.ReactNode; }

export const Sidebar: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const subscriberLinks: NavItem[] = [
    { to: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { to: '/dashboard/scores', label: 'My Scores', icon: <Target size={18} /> },
    { to: '/dashboard/charity', label: 'My Charity', icon: <Heart size={18} /> },
    { to: '/dashboard/draws', label: 'Draws', icon: <Dices size={18} /> },
    { to: '/dashboard/winnings', label: 'Winnings', icon: <Trophy size={18} /> },
    { to: '/dashboard/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  const adminLinks: NavItem[] = [
    { to: '/admin', label: 'Analytics', icon: <BarChart3 size={18} /> },
    { to: '/admin/users', label: 'Users', icon: <Users size={18} /> },
    { to: '/admin/draws', label: 'Draw Control', icon: <Dices size={18} /> },
    { to: '/admin/charities', label: 'Charities', icon: <Heart size={18} /> },
    { to: '/admin/winners', label: 'Winners', icon: <Shield size={18} /> },
  ];

  const links = user?.role === 'admin' ? adminLinks : subscriberLinks;

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'linear-gradient(180deg, #111827 0%, #0f1623 100%)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0, overflow: 'auto',
      padding: '24px 0',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div onClick={() => navigate('/')} style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#34d399,#10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}>⛳</div>
          <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:16, color:'var(--text-primary)' }}>
            Golf<span style={{ color:'var(--accent-green)' }}>Gives</span>
          </span>
        </div>
      </div>

      {/* User pill */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,rgba(52,211,153,0.2),rgba(52,211,153,0.1))',
            border: '1.5px solid rgba(52,211,153,0.3)',
            display: 'flex', alignItems:'center', justifyContent:'center',
            fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:14, color:'var(--accent-green)',
          }}>
            {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', margin:0 }}>{user?.fullName}</p>
            <span className="badge badge-green" style={{ fontSize:10, padding:'2px 6px' }}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex:1, padding:'12px 12px', display:'flex', flexDirection:'column', gap:2 }}>
        {links.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/dashboard' || to === '/admin'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            {icon}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding:'12px 12px', borderTop:'1px solid var(--border)' }}>
        <button
          onClick={() => { clearAuth(); navigate('/'); }}
          className="sidebar-link"
          style={{ width:'100%', background:'none', border:'none', cursor:'pointer', color:'var(--danger)' }}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
