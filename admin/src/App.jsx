import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import './i18n';
import './styles/global.css';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const ForcePasswordChangePage = lazy(() => import('./features/auth/ForcePasswordChangePage'));
const SuperAdminLayout = lazy(() => import('./features/super-admin/SuperAdminLayout'));
const OverviewPage = lazy(() => import('./features/super-admin/OverviewPage'));
const SchoolsPage = lazy(() => import('./features/super-admin/SchoolsPage'));
const NotificationsPage = lazy(() => import('./features/super-admin/NotificationsPage'));
const SchoolAdminLayout = lazy(() => import('./features/school-admin/SchoolAdminLayout'));
const DashboardPage = lazy(() => import('./features/school-admin/DashboardPage'));
const UsersPage = lazy(() => import('./features/school-admin/UsersPage'));
const AcademicPage = lazy(() => import('./features/school-admin/AcademicPage'));

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
function ProtectedRoute({ allowedRoles }) {
    const { user, isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
        return <LoadingFallback />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check if user requires password reset
    if (user?.requiresPasswordReset) {
        return <Navigate to="/force-password-change" replace />;
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

    // Check if user requires password reset
    if (user?.requiresPasswordReset) {
        return <Navigate to="/force-password-change" replace />;
    }

    if (user?.role === 'SUPER_ADMIN') {
        return <Navigate to="/super-admin" replace />;
    }

    return <Navigate to="/admin" replace />;
}




function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<LoginPage />} />

                        {/* Force Password Change Route (protected but accessible to all authenticated users requiring reset) */}
                        <Route
                            path="/force-password-change"
                            element={
                                <Suspense fallback={<LoadingFallback />}>
                                    <ForcePasswordChangePage />
                                </Suspense>
                            }
                        />

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
