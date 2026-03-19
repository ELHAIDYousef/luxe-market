import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import Storefront         from '../pages/Storefront';
import ProductDetail      from '../pages/ProductDetail';
import Cart               from '../pages/Cart';
import Checkout           from '../pages/Checkout';
import OrderConfirmation  from '../pages/OrderConfirmation';
import TrackOrder         from '../pages/TrackOrder';
import Login              from '../pages/Login';
import Signup             from '../pages/Signup';
import Profile            from '../pages/Profile';
import Unauthorized       from '../pages/Unauthorized';
import AdminDashboard     from '../pages/AdminDashboard';
import AdminManagement    from '../pages/AdminManagement';
import AdminUsers         from '../pages/AdminUsers';
import MarketingAnalytics from '../pages/MarketingAnalytics';

// ── Spinner shown while AuthContext is rehydrating from localStorage ──────────
function AuthLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: 9999, border: '3px solid var(--cream-muted)', borderTopColor: 'var(--accent-navy)', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--slate-muted)', fontStyle: 'italic' }}>Loading…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Requires login — redirects to /login with return URL ──────────────────────
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <AuthLoader />;
  if (!isAuthenticated) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  return <>{children}</>;
}

// ── Requires admin (editor+) — shows Unauthorized page on wrong role ──────────
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <AuthLoader />;
  if (!isAuthenticated) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isAdmin) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}

// ── Requires super_admin only ─────────────────────────────────────────────────
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSuperAdmin, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <AuthLoader />;
  if (!isAuthenticated) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isSuperAdmin) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}

export default function AppRouter() {
  const { isLoading } = useAuth();

  // Don't render any routes until auth state is resolved
  // This prevents the flash of /login on reload
  if (isLoading) return <AuthLoader />;

  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/"                   element={<Storefront />} />
      <Route path="/shop"               element={<Storefront />} />
      <Route path="/product/:id"        element={<ProductDetail />} />
      <Route path="/login"              element={<Login />} />
      <Route path="/signup"             element={<Signup />} />
      <Route path="/unauthorized"       element={<Unauthorized />} />
      <Route path="/track-order"        element={<TrackOrder />} />

      {/* ── Requires login ── */}
      <Route path="/cart"               element={<AuthRoute><Cart /></AuthRoute>} />
      <Route path="/checkout"           element={<AuthRoute><Checkout /></AuthRoute>} />
      <Route path="/order-confirmation" element={<AuthRoute><OrderConfirmation /></AuthRoute>} />
      <Route path="/profile"            element={<AuthRoute><Profile /></AuthRoute>} />

      {/* ── Admin (editor+) ── */}
      <Route path="/admin"              element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users"        element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/users/:userId" element={<AdminRoute><AdminUsers /></AdminRoute>} />

      {/* ── Super Admin only ── */}
      <Route path="/admin/management"   element={<SuperAdminRoute><AdminManagement /></SuperAdminRoute>} />
      <Route path="/admin/analytics"    element={<SuperAdminRoute><MarketingAnalytics /></SuperAdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
