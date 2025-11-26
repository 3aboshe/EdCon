import React, { useContext, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../contexts/AppContext';
import LoginScreen from '../screens/LoginScreen';
import StudentDashboard from '../screens/StudentDashboard';
import ParentDashboard from '../screens/ParentDashboard';
import TeacherDashboard from '../screens/TeacherDashboard';
import SuperAdminDashboard from '../screens/SuperAdminDashboard';
import NewAdminDashboard from '../screens/NewAdminDashboard';

// Protected Route Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles: string[];
  redirectTo?: string;
}> = ({ children, allowedRoles, redirectTo = '/login' }) => {
  const { user } = useContext(AppContext);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const userRole = user.role.toLowerCase();
  if (!allowedRoles.includes(userRole)) {
    // Redirect to user's appropriate dashboard
    const userDashboard = `/${userRole}`;
    return <Navigate to={userDashboard} replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (only accessible when not logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useContext(AppContext);
  
  if (user) {
    // Redirect to user's appropriate dashboard
    const userRole = user.role.toLowerCase();
    const userDashboard = `/${userRole}`;
    return <Navigate to={userDashboard} replace />;
  }
  
  return <>{children}</>;
};

// Loading component for session restoration
const SessionLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

// Main App Routes Component
const AppRoutes: React.FC = () => {
  const { user } = useContext(AppContext);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  
  // Check if session restoration is complete
  useEffect(() => {
    // Give a small delay to allow session restoration to complete
    const timer = setTimeout(() => {
      setIsSessionChecked(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Show loading while session is being checked
  if (!isSessionChecked) {
    return <SessionLoader />;
  }
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginScreen />
          </PublicRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/student" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/parent" 
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/teacher" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/super_admin" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/school_admin" 
        element={
          <ProtectedRoute allowedRoles={['school_admin']}>
            <NewAdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'school_admin', 'super_admin']}>
             {user?.backendRole === 'SUPER_ADMIN' ? <SuperAdminDashboard /> : <NewAdminDashboard />}
          </ProtectedRoute>
        } 
      />
      
      {/* Root Route - Redirect based on user status */}
      <Route 
        path="/" 
        element={
          user ? (
            <Navigate to={`/${user.role.toLowerCase()}`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Catch-all Route - Redirect to appropriate dashboard or login */}
      <Route 
        path="*" 
        element={
          user ? (
            <Navigate to={`/${user.role.toLowerCase()}`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
    </Routes>
  );
};

export default AppRoutes;
