// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import VerifyEmail from './components/Auth/VerifyEmail';
import Dashboard from './components/Dashboard/Dashboard';
import ErrorBoundary from './components/common/ErrorBoundary';
import TasksPage from './pages/TasksPage';
import KanbanPage from './pages/KanbanPage';
import CalendarPage from './pages/CalendarPage';
import InsightsPage from './pages/InsightsPage';
import SettingsPage from './pages/SettingsPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';

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
        ✨ Loading...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute><ErrorBoundary><Dashboard /></ErrorBoundary></ProtectedRoute>
            } />
            <Route path="/tasks" element={
              <ProtectedRoute><ErrorBoundary><TasksPage /></ErrorBoundary></ProtectedRoute>
            } />
            <Route path="/kanban" element={
              <ProtectedRoute><ErrorBoundary><KanbanPage /></ErrorBoundary></ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute><ErrorBoundary><CalendarPage /></ErrorBoundary></ProtectedRoute>
            } />
            <Route path="/insights" element={
              <ProtectedRoute><ErrorBoundary><InsightsPage /></ErrorBoundary></ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute><ErrorBoundary><ProjectsPage /></ErrorBoundary></ProtectedRoute>
            } />
            <Route path="/projects/:id" element={
              <ProtectedRoute><ErrorBoundary><ProjectDetailPage /></ErrorBoundary></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><ErrorBoundary><SettingsPage /></ErrorBoundary></ProtectedRoute>
            } />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;