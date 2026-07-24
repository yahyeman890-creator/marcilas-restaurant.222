import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, getDashboardPath } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import type { ReactNode } from 'react';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { StaffLoginPage } from '@/pages/auth/StaffLoginPage';
import { AccessDeniedPage } from '@/pages/auth/AccessDeniedPage';
import { MenuPage } from '@/pages/customer/MenuPage';
import { CartPage } from '@/pages/customer/CartPage';
import { CheckoutPage } from '@/pages/customer/CheckoutPage';
import { OrdersPage } from '@/pages/customer/OrdersPage';
import { ProfilePage } from '@/pages/customer/ProfilePage';
import { CashierDashboard } from '@/pages/cashier/CashierDashboard';
import { DriverDashboard } from '@/pages/driver/DriverDashboard';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import type { UserRole } from '@/types';

const STAFF_ROLES: UserRole[] = ['admin', 'cashier', 'driver'];

function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
    </div>
  );
}

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenSpinner />;

  if (!user) {
    // Staff routes redirect to staff login; customer routes redirect to public login.
    if (roles && STAFF_ROLES.some((r) => roles.includes(r))) {
      return <Navigate to={`/staff/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
    }
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Authenticated but wrong role → Access Denied.
  if (roles && !roles.includes(user.role)) return <AccessDeniedPage />;

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenSpinner />;

  if (user) {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    if (redirect && user.role === 'customer') return <Navigate to={redirect} replace />;
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }
  return <>{children}</>;
}

function StaffPublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenSpinner />;

  if (user && STAFF_ROLES.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }
  // If a customer somehow lands on /staff/login, send them to the menu.
  if (user && user.role === 'customer') return <Navigate to="/menu" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth — customer only */}
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

      {/* Staff auth — separate, not linked from public site */}
      <Route path="/staff/login" element={<StaffPublicOnlyRoute><StaffLoginPage /></StaffPublicOnlyRoute>} />

      {/* Customer — public browsing */}
      <Route path="/" element={<Navigate to="/menu" replace />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/cart" element={<CartPage />} />

      {/* Customer — auth required */}
      <Route path="/checkout" element={<ProtectedRoute roles={['customer']}><CheckoutPage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute roles={['customer']}><OrdersPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute roles={['customer']}><ProfilePage /></ProtectedRoute>} />

      {/* Staff dashboards — role-protected */}
      <Route path="/cashier" element={<ProtectedRoute roles={['cashier']}><CashierDashboard /></ProtectedRoute>} />
      <Route path="/driver" element={<ProtectedRoute roles={['driver']}><DriverDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/menu" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
