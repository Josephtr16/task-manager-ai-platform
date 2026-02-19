// src/components/Dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { tasksAPI } from '../../services/api';
import StatsCard from './StatsCard';
import AIRecommends from './AIRecommends';
import UpcomingTasks from './UpcomingTasks';
import QuickStats from './QuickStats';
import CreateTaskModal from '../Tasks/CreateTaskModal';
import TaskDetailModal from '../Tasks/TaskDetailModal';
import Layout from '../Layout/Layout';

const Dashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [tasksRes, statsRes, upcomingRes] = await Promise.all([
        tasksAPI.getTasks(),
        tasksAPI.getStatistics(),
        tasksAPI.getUpcoming(),
      ]);
      setTasks(tasksRes.data.tasks);
      setStats(statsRes.data.stats);
      setUpcomingTasks(upcomingRes.data.tasks);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks([newTask, ...tasks]);
    loadDashboardData();
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(tasks.map(t => t._id === updatedTask._id ? updatedTask : t));
    setSelectedTask(updatedTask);
    loadDashboardData();
  };

  const handleTaskDeleted = (taskId) => {
    setTasks(tasks.filter(t => t._id !== taskId));
    setShowDetailModal(false);
    setSelectedTask(null);
    loadDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 20) return 'Good evening';
    return 'Good night';
  };

  const styles = {
    container: {
      padding: '32px',
      backgroundColor: theme.bgMain,
      minHeight: '100vh',
    },
    loading: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      color: theme.textPrimary,
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: `4px solid ${theme.bgMain}`,
      borderTop: `4px solid ${theme.primary}`,
      boxShadow: theme.shadows.neumorphic,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '16px',
    },
    greeting: {
      marginBottom: '32px',
    },
    greetingTitle: {
      fontSize: '36px',
      fontWeight: '800',
      color: theme.textPrimary,
      margin: '0 0 8px 0',
      letterSpacing: '-0.5px',
      textShadow: theme.type === 'dark' ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none',
    },
    greetingSubtitle: {
      fontSize: '16px',
      color: theme.textSecondary,
      margin: 0,
      fontWeight: '500',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '24px',
      marginBottom: '32px',
    },
    mainContent: {
      display: 'grid',
      gridTemplateColumns: '1fr 360px',
      gap: '24px',
    },
    leftContent: {
      minHeight: '400px',
    },
    rightSidebar: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    },
    fab: {
      position: 'fixed',
      bottom: '40px',
      right: '40px',
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      backgroundColor: theme.primary,
      color: '#fff',
      border: 'none',
      cursor: 'pointer',
      boxShadow: theme.type === 'dark' ? '8px 8px 16px rgba(0,0,0,0.4), -8px -8px 16px rgba(255,255,255,0.05)' : '8px 8px 16px rgba(0,0,0,0.2), -8px -8px 16px rgba(255,255,255,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      zIndex: 50,
    },
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.loading}>
          <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
          <div style={styles.spinner}></div>
          <p>Loading your dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <style>{`
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .fab:hover {
            transform: scale(1.1) rotate(90deg);
            box-shadow: 0 0 20px ${theme.primary}80 !important;
        }

        @media (max-width: 1024px) {
            .dashboard-main-content {
            grid-template-columns: 1fr !important;
            }
        }
      `}</style>
      <div style={styles.container}>
        {/* Greeting */}
        <div style={styles.greeting}>
          <h1 style={styles.greetingTitle}>
            {getGreeting()}, <span style={{ color: theme.primary }}>{user?.name?.split(' ')[0]}</span>! 👋
          </h1>
          <p style={styles.greetingSubtitle}>
            You have <strong style={{ color: theme.textPrimary }}>{stats?.dueToday || 0}</strong> tasks due today and {stats?.dueTomorrow || 0} tomorrow.
          </p>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <StatsCard
            icon="📈"
            label="Productivity Score"
            value={stats?.productivityScore || 0}
            color={theme.primary}
          />
          <StatsCard
            icon="✅"
            label="Tasks Completed"
            value={`${stats?.completed || 0}/${stats?.total || 0}`}
            color={theme.success}
          />
          <StatsCard
            icon="⏰"
            label="Focus Time"
            value={`${stats?.focusTime || 0}m`}
            subtitle="Today's focused work"
            color={theme.warning}
          />
          <StatsCard
            icon="🔥"
            label="Streak"
            value={`${stats?.streak || 0} days`}
            subtitle="Keep it going! 🔥"
            color={theme.error}
          />
        </div>

        {/* Main Content */}
        <div style={styles.mainContent}>
          <div style={styles.leftContent}>
            <AIRecommends
              tasks={tasks}
              onTaskClick={handleTaskClick}
            />
          </div>
          <div style={styles.rightSidebar}>
            <UpcomingTasks
              tasks={upcomingTasks}
              onTaskClick={handleTaskClick}
            />
            <QuickStats stats={stats} />
          </div>
        </div>

        {/* FAB */}
        <button
          style={styles.fab}
          onClick={() => setShowCreateModal(true)}
          className="fab"
        >
          <span style={{ fontSize: '28px', fontWeight: '300' }}>+</span>
        </button>

        {/* Modals */}
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
        />

        <TaskDetailModal
          task={selectedTask}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTask(null);
          }}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;