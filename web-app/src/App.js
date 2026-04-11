// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FocusProvider, useFocus } from './context/FocusContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import VerifyEmail from './components/Auth/VerifyEmail';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import Dashboard from './components/Dashboard/Dashboard';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/Layout/Layout';
import TasksPage from './pages/TasksPage';
import KanbanPage from './pages/KanbanPage';
import CalendarPage from './pages/CalendarPage';
import InsightsPage from './pages/InsightsPage';
import SettingsPage from './pages/SettingsPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import FocusPage from './pages/FocusPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0F1419',
        color: '#fff',
        fontSize: '18px',
      }}>
        Loading...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Persistent Layout Route - keeps Layout/sidebar mounted across these routes
const ProtectedLayoutRoute = () => {
  const { isFocusMode } = useFocus();

  return (
    <ProtectedRoute>
      <Layout isFocusMode={isFocusMode}>
        <Outlet />
      </Layout>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <FocusProvider>
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes with Persistent Layout Shell */}
            <Route element={<ProtectedLayoutRoute />}>
              <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="/tasks" element={<ErrorBoundary><TasksPage /></ErrorBoundary>} />
              <Route path="/focus" element={<ErrorBoundary><FocusPage /></ErrorBoundary>} />
              <Route path="/projects" element={<ErrorBoundary><ProjectsPage /></ErrorBoundary>} />
              <Route path="/kanban" element={<ErrorBoundary><KanbanPage /></ErrorBoundary>} />
              <Route path="/calendar" element={<ErrorBoundary><CalendarPage /></ErrorBoundary>} />
              <Route path="/insights" element={<ErrorBoundary><InsightsPage /></ErrorBoundary>} />
              <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
            </Route>

            {/* Project Detail Route (individual project pages) */}
            <Route path="/projects/:id" element={
              <ProtectedRoute><ErrorBoundary><ProjectDetailPage /></ErrorBoundary></ProtectedRoute>
            } />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </FocusProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;