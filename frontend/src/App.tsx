import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage, SignupPage } from './pages/AuthPages';
import { DashboardOverview, ScoresPage } from './pages/DashboardPages';
import { AdminDashboard, AdminDrawsPage, AdminWinnersPage } from './pages/AdminPages';
import { CharitiesPage, PricingPage } from './pages/PublicPages';

// Protected route wrappers
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'admin' | 'subscriber' }> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole === 'admin' && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a2235',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            fontSize: 14,
          },
          success: { iconTheme: { primary: '#34d399', secondary: '#0a0e1a' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#0a0e1a' } },
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/charities" element={<CharitiesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/how-it-works" element={<Navigate to="/#how-it-works" />} />

        {/* Auth (guests only) */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />

        {/* Dashboard (subscribers) */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
        <Route path="/dashboard/scores" element={<ProtectedRoute><ScoresPage /></ProtectedRoute>} />
        <Route path="/dashboard/charity" element={<ProtectedRoute><CharitiesPage /></ProtectedRoute>} />
        <Route path="/dashboard/draws" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
        <Route path="/dashboard/winnings" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/draws" element={<ProtectedRoute requiredRole="admin"><AdminDrawsPage /></ProtectedRoute>} />
        <Route path="/admin/winners" element={<ProtectedRoute requiredRole="admin"><AdminWinnersPage /></ProtectedRoute>} />
        <Route path="/admin/charities" element={<ProtectedRoute requiredRole="admin"><CharitiesPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
