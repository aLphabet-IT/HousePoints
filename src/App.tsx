import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import LiveDisplay from './pages/LiveDisplay';
import HousePointsPage from './pages/HousePointsPage';
import { UserRole } from './types';

function RoleRoute({ children, allowedRoles }: { children: React.ReactElement; allowedRoles: UserRole[] }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) {
    // Redirect to their respective dashboard if they try to access a privileged one
    if (user.role === 'admin') return <Navigate to="/admin" />;
    if (user.role === 'teacher') return <Navigate to="/teacher" />;
    return <Navigate to="/student" />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/live" element={<LiveDisplay />} />
          <Route path="/points" element={<HousePointsPage />} />
          
          <Route 
            path="/admin/*" 
            element={
              <RoleRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleRoute>
            } 
          />
          
          <Route 
            path="/teacher/*" 
            element={
              <RoleRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </RoleRoute>
            } 
          />
          
          <Route 
            path="/student/*" 
            element={
              <RoleRoute allowedRoles={['student']}>
                <StudentDashboard />
              </RoleRoute>
            } 
          />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
