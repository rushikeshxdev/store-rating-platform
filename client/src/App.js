import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Landing page
import LandingPage from './pages/LandingPage';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminStoresPage from './pages/AdminStoresPage';

// Normal user pages
import UserStoresPage from './pages/UserStoresPage';

// Store owner pages
import OwnerDashboard from './pages/OwnerDashboard';

// Common pages
import PasswordUpdatePage from './pages/PasswordUpdatePage';
import DebugPage from './pages/DebugPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/debug" element={<DebugPage />} />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stores"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <AdminStoresPage />
              </ProtectedRoute>
            }
          />

          {/* Normal user routes */}
          <Route
            path="/stores"
            element={
              <ProtectedRoute allowedRoles={['NORMAL_USER']}>
                <UserStoresPage />
              </ProtectedRoute>
            }
          />

          {/* Store owner routes */}
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STORE_OWNER']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Common authenticated routes */}
          <Route
            path="/password-update"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER']}>
                <PasswordUpdatePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
