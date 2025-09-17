import React, { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../App';
import LoginScreen from '../screens/LoginScreen';
import StudentDashboard from '../screens/StudentDashboard';
import ParentDashboard from '../screens/ParentDashboard';
import TeacherDashboard from '../screens/TeacherDashboard';
import AdminDashboard from '../screens/AdminDashboard';
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

// Main App Routes Component
const AppRoutes: React.FC = () => {
  const { user } = useContext(AppContext);
  
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
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <NewAdminDashboard />
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
