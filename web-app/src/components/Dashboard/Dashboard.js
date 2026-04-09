// src/components/Dashboard/Dashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { tasksAPI } from '../../services/api';
import StatsCard from './StatsCard';
import AIRecommends from './AIRecommends';
import UpcomingTasks from './UpcomingTasks';
import QuickStats from './QuickStats';
import CreateTaskModal from '../Tasks/CreateTaskModal';
import TaskDetailModal from '../Tasks/TaskDetailModal';
import { StatsCardSkeleton } from '../common/SkeletonLoader';
import { FaChartLine, FaCheckCircle, FaCalendarAlt, FaChartPie, FaPlus } from 'react-icons/fa';

const DASHBOARD_CACHE_KEY = 'taskflow_dashboard_cache';

const readDashboardCache = () => {
  try {
    const cached = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const writeDashboardCache = (payload) => {
  try {
    sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors.
  }
};

const Dashboard = () => {
  const cachedDashboardState = readDashboardCache();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState(cachedDashboardState?.tasks || []);
  const [stats, setStats] = useState(cachedDashboardState?.stats || null);
  const [upcomingTasks, setUpcomingTasks] = useState(cachedDashboardState?.upcomingTasks || []);
  const [loading, setLoading] = useState(!cachedDashboardState);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (cachedDashboardState) {
      setLoading(false);
    }
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      if (!cachedDashboardState) {
        setLoading(true);
      }

      const [tasksRes, statsRes, upcomingRes] = await Promise.all([
        tasksAPI.getTasks(),
        tasksAPI.getStatistics(),
        tasksAPI.getUpcoming(),
      ]);
      setTasks(tasksRes.data.tasks);
      setStats(statsRes.data.stats);
      setUpcomingTasks(upcomingRes.data.tasks);
      writeDashboardCache({
        tasks: tasksRes.data.tasks,
        stats: statsRes.data.stats,
        upcomingTasks: upcomingRes.data.tasks,
      });
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

  const handleToggleTaskFromRecommendations = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';

    try {
      const response = await tasksAPI.updateTask(task._id, { status: newStatus });
      const updatedTask = response.data.task;

      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
      if (selectedTask?._id === updatedTask._id) {
        setSelectedTask(updatedTask);
      }

      loadDashboardData();
    } catch (error) {
      console.error('Error toggling task status from AI recommendations:', error);
    }
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

  const busiestDayData = useMemo(() => {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = Array(7).fill(0);

    (tasks || []).forEach((task) => {
      if (task.status !== 'done' || !task.completedAt) return;
      const completedDate = new Date(task.completedAt);
      if (!Number.isNaN(completedDate.getTime())) {
        counts[completedDate.getDay()] += 1;
      }
    });

    const maxCount = Math.max(...counts, 0);
    const busiestIndex = counts.findIndex((count) => count === maxCount);

    if (maxCount === 0 || busiestIndex < 0) {
      return {
        labels,
        counts,
        maxCount: 1,
        busiestLabel: 'No data',
        busiestCount: 0,
      };
    }

    return {
      labels,
      counts,
      maxCount,
      busiestLabel: labels[busiestIndex],
      busiestCount: maxCount,
    };
  }, [tasks]);

  const categoryBreakdownData = useMemo(() => {
    const activeTasks = (tasks || []).filter((task) => task.status !== 'done');
    const categoryCounts = activeTasks.reduce((acc, task) => {
      const category = (task.category || 'Other').trim() || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const entries = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const total = entries.reduce((sum, item) => sum + item.count, 0);

    return {
      entries,
      total,
    };
  }, [tasks]);

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
      boxShadow: 'none',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '16px',
    },
    greeting: {
      marginBottom: '32px',
    },
    greetingTitle: {
      fontFamily: '"Fraunces", serif',
      fontSize: '40px',
      fontWeight: '600',
      color: theme.textPrimary,
      margin: '0 0 8px 0',
      letterSpacing: '-0.02em',
    },
    greetingItalic: {
      fontStyle: 'italic',
      fontWeight: '300',
      color: theme.textSecondary,
    },
    greetingName: {
      fontWeight: '600',
      color: theme.textPrimary,
    },
    greetingSubtitle: {
      fontSize: '14px',
      color: theme.textSecondary,
      margin: 0,
      fontWeight: '500',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      gap: '24px',
      marginBottom: '32px',
    },
    mainContent: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)',
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
      height: '40px',
      padding: '0 20px',
      borderRadius: '8px',
      backgroundColor: theme.primary,
      color: '#0A0908',
      border: 'none',
      cursor: 'pointer',
      boxShadow: theme.shadows.float,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 150ms ease',
      zIndex: 50,
      fontSize: '13px',
      fontWeight: '600',
    },
  };

  if (loading) {
    return (
      <>
        <div style={styles.container}>
          <div style={styles.statsGrid}>
            {Array.from({ length: 4 }).map((_, index) => (
              <StatsCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .dashboard-container {
          animation: fadeIn 0.2s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0.95; }
          to { opacity: 1; }
        }
        
        .fab:hover {
          transform: translateY(-1px);
          box-shadow: ${theme.shadows.glow} !important;
        }

        @media (max-width: 1200px) {
            .dashboard-main-content {
            grid-template-columns: 1fr !important;
            }
            .dashboard-stats-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
        }

        @media (max-width: 720px) {
            .dashboard-stats-grid {
              grid-template-columns: 1fr !important;
            }
        }
      `}</style>
      <div style={styles.container} className="dashboard-container">
        {/* Greeting */}
        <div style={styles.greeting}>
          <h1 style={styles.greetingTitle}>
            <span style={styles.greetingItalic}>{getGreeting()},</span>{' '}
            <span style={styles.greetingName}>{user?.name?.split(' ')[0]}</span>
          </h1>
          <p style={styles.greetingSubtitle}>
            You have <strong style={{ color: theme.textPrimary }}>{stats?.dueToday || 0}</strong> tasks due today and {stats?.dueTomorrow || 0} tomorrow.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button
            style={styles.fab}
            onClick={() => setShowCreateModal(true)}
            className="fab"
          >
            <FaPlus style={{ marginRight: '8px', fontSize: '12px' }} /> New Task
          </button>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid} className="dashboard-stats-grid">
          <StatsCard
            icon={<FaChartLine />}
            label="Productivity Score"
            value={stats?.productivityScore || 0}
            color={theme.info}
            progress={{
              current: stats?.productivityScore || 0,
              total: 100,
              color: theme.info,
              labelLeft: 'Progress',
              labelRight: `${stats?.productivityScore || 0}%`,
            }}
          />
          <StatsCard
            icon={<FaCheckCircle />}
            label="Tasks Completed"
            value={`${stats?.completed || 0}/${stats?.total || 0}`}
            color={theme.success}
            progress={{
              current: stats?.completed || 0,
              total: stats?.total || 0,
              color: theme.success,
              labelLeft: 'Completed',
              labelRight: `${stats?.completed || 0}/${stats?.total || 0}`,
            }}
          />
          <StatsCard
            icon={<FaCalendarAlt />}
            label="Busiest Day"
            color={theme.warning}
            customContent={(
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                  <h2 style={{
                    fontFamily: 'Fraunces, serif',
                    fontSize: '40px',
                    fontWeight: '800',
                    color: theme.textPrimary,
                    margin: 0,
                  }}>
                    {busiestDayData.busiestLabel}
                  </h2>
                  <span style={{ fontSize: '13px', color: theme.textMuted }}>
                    {busiestDayData.busiestCount} completed
                  </span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gap: '6px',
                  alignItems: 'end',
                  height: '44px',
                  marginBottom: '8px',
                }}>
                  {busiestDayData.counts.map((count, index) => {
                    const height = Math.max(6, Math.round((count / busiestDayData.maxCount) * 100));
                    return (
                      <div
                        key={busiestDayData.labels[index]}
                        style={{
                          height: `${height}%`,
                          borderRadius: '4px',
                          backgroundColor: count > 0 ? theme.warning : `${theme.warning}25`,
                          boxShadow: count > 0 ? `0 0 8px ${theme.warning}40` : 'none',
                        }}
                        title={`${busiestDayData.labels[index]}: ${count}`}
                      />
                    );
                  })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px' }}>
                  {busiestDayData.labels.map((label) => (
                    <span
                      key={label}
                      style={{ fontSize: '11px', textAlign: 'center', color: theme.textMuted }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </>
            )}
          />
          <StatsCard
            icon={<FaChartPie />}
            label="Category Breakdown"
            color={theme.error}
            customContent={(
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                  <h2 style={{
                    fontFamily: 'Fraunces, serif',
                    fontSize: '40px',
                    fontWeight: '800',
                    color: theme.textPrimary,
                    margin: 0,
                  }}>
                    {categoryBreakdownData.total}
                  </h2>
                  <span style={{ fontSize: '13px', color: theme.textMuted }}>
                    active tasks
                  </span>
                </div>
                <div style={{
                  padding: '2px',
                  borderRadius: '999px',
                  backgroundColor: theme.bgElevated,
                  border: `1px solid ${theme.border}`,
                  marginBottom: '10px',
                }}>
                  <div style={{
                    height: '8px',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    display: 'flex',
                    backgroundColor: `${theme.primary}20`,
                  }}>
                    {categoryBreakdownData.total === 0 ? (
                      <div style={{ width: '100%', backgroundColor: `${theme.textMuted}30` }} />
                    ) : (
                      categoryBreakdownData.entries.map((item, index) => {
                        const color = theme.error;
                        const width = (item.count / categoryBreakdownData.total) * 100;
                        return (
                          <div
                            key={item.category}
                            style={{ width: `${width}%`, backgroundColor: color }}
                            title={`${item.category}: ${item.count}`}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 10px' }}>
                  {(categoryBreakdownData.entries.slice(0, 3)).map((item, index) => {
                    const color = theme.error;
                    return (
                      <div key={item.category} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '999px',
                          backgroundColor: color,
                          boxShadow: `0 0 6px ${color}60`,
                        }} />
                        <span style={{ fontSize: '12px', color: theme.textSecondary }}>
                          {item.category} ({item.count})
                        </span>
                      </div>
                    );
                  })}
                  {categoryBreakdownData.entries.length === 0 && (
                    <span style={{ fontSize: '12px', color: theme.textMuted }}>
                      No active tasks
                    </span>
                  )}
                </div>
              </>
            )}
          />
        </div>

        {/* Main Content */}
        <div style={styles.mainContent} className="dashboard-main-content">
          <div style={styles.leftContent}>
            <AIRecommends
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onToggleTask={handleToggleTaskFromRecommendations}
              onTaskDeleted={handleTaskDeleted}
              onTaskUpdated={handleTaskUpdated}
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
    </>
  );
};

export default Dashboard;