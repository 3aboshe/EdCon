import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';

import './i18n';
import './styles/global.css';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const SuperAdminLayout = lazy(() => import('./features/super-admin/SuperAdminLayout'));
const OverviewPage = lazy(() => import('./features/super-admin/OverviewPage'));
const SchoolsPage = lazy(() => import('./features/super-admin/SchoolsPage'));
const SchoolAdminLayout = lazy(() => import('./features/school-admin/SchoolAdminLayout'));
const DashboardPage = lazy(() => import('./features/school-admin/DashboardPage'));

// Loading Fallback
function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--color-bg)',
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
    </div>
  );
}

// Protected Route
function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'SUPER_ADMIN') {
      return <Navigate to="/super-admin" replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}

// Root Redirect
function RootRedirect() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/super-admin" replace />;
  }

  return <Navigate to="/admin" replace />;
}

// Placeholder pages (to be implemented)
function PlaceholderPage({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-4)' }}>
        {title}
      </h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        {t('common.loading')}
      </p>
    </div>
  );
}

function NotificationsPage() {
  return <PlaceholderPage title="Notifications" />;
}

function UsersPage() {
  return <PlaceholderPage title="User Management" />;
}

function AcademicPage() {
  return <PlaceholderPage title="Academic Management" />;
}

function AnalyticsPage() {
  return <PlaceholderPage title="Analytics" />;
}

function ToolsPage() {
  return <PlaceholderPage title="System Tools" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Root Redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Super Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route path="/super-admin" element={<SuperAdminLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="schools" element={<SchoolsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* School Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ADMIN']} />}>
              <Route path="/admin" element={<SchoolAdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="academic" element={<AcademicPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="tools" element={<ToolsPage />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
