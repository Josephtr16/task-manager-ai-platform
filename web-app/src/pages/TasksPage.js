// src/pages/TasksPage.js
import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout/Layout';
import { tasksAPI } from '../services/api';
import aiService from '../services/aiService';
import { useTheme } from '../context/ThemeContext';
import { borderRadius } from '../theme';
import { formatTaskDuration } from '../utils/formatTaskDuration';
import CreateTaskModal from '../components/Tasks/CreateTaskModal';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import {
  FaSearch, FaPlus, FaCalendarAlt, FaClock, FaCheck, FaFlag, FaTag, FaTimes, FaClipboardList
} from 'react-icons/fa';
import CustomSelect from '../components/common/CustomSelect';
import { TaskCardSkeleton } from '../components/common/SkeletonLoader';

const TasksPage = () => {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isAIPrioritizing, setIsAIPrioritizing] = useState(false);
  const [aiPriorityScores, setAiPriorityScores] = useState({});
  const [isDetectingRisks, setIsDetectingRisks] = useState(false);
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [riskOverallStatus, setRiskOverallStatus] = useState(null);
  const [riskSummary, setRiskSummary] = useState('');
  const [notification, setNotification] = useState(null);
  const notificationTimerRef = useRef(null);
  const lastFilterKeyRef = useRef('');

  useEffect(() => {
    const filterKey = [
      searchQuery,
      statusFilter,
      priorityFilter,
      categoryFilter,
      projectFilter,
      sortBy,
    ].join('|');

    const filtersChanged = lastFilterKeyRef.current !== filterKey;

    if (filtersChanged && currentPage !== 1) {
      lastFilterKeyRef.current = filterKey;
      setCurrentPage(1);

      return;
    }

    lastFilterKeyRef.current = filterKey;
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, statusFilter, priorityFilter, categoryFilter, projectFilter, sortBy]);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });

    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }

    notificationTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const loadTasks = async () => {
    try {
      const params = {
        page: currentPage,
        sortBy,
        sortOrder: sortBy === 'deadline' || sortBy === 'title' ? 'asc' : 'desc',
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (priorityFilter !== 'all') {
        params.priority = priorityFilter;
      }

      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }

      if (projectFilter === 'standalone') {
        params.projectId = 'none';
      }

      const response = await tasksAPI.getTasks(params);
      const responseTasks = response.data.tasks || [];
      const pagination = response.data.pagination || {};

      setTasks(responseTasks);
      setTotalPages(pagination.totalPages || 1);

      const displayedTasks = projectFilter === 'project'
        ? responseTasks.filter(task => !!task.projectId)
        : responseTasks;

      setFilteredTasks(displayedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks([newTask, ...tasks]);
    loadTasks();
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(tasks.map(t => t._id === updatedTask._id ? updatedTask : t));
    setSelectedTask(updatedTask);
    loadTasks();
  };

  const handleTaskDeleted = (taskId) => {
    setTasks(tasks.filter(t => t._id !== taskId));
    setShowDetailModal(false);
    setSelectedTask(null);
    loadTasks();
  };

  const handleAIPrioritize = async () => {
    const tasksToPrioritize = filteredTasks.filter(task => ['pending', 'todo', 'in-progress'].includes(task.status));

    if (tasksToPrioritize.length === 0) {
      showNotification('No pending or in-progress tasks available for AI prioritization.', 'warning');
      return;
    }

    try {
      setIsAIPrioritizing(true);

      const payloadTasks = tasksToPrioritize.map(task => ({
        id: String(task._id || task.id),
        title: task.title,
        priority: task.priority,
        status: task.status,
        deadline: task.deadline,
        estimated_minutes: task.estimatedDuration,
        category: task.category,
      }));

      const result = await aiService.prioritize(payloadTasks);
      const rankedTasks = Array.isArray(result?.tasks) ? result.tasks : [];

      const scoreMap = rankedTasks.reduce((acc, item) => {
        acc[item.id] = item.score;
        return acc;
      }, {});

      setAiPriorityScores(scoreMap);

      const sortedByScore = [...filteredTasks].sort((a, b) => {
        const scoreA = scoreMap[String(a._id || a.id)] ?? -1;
        const scoreB = scoreMap[String(b._id || b.id)] ?? -1;
        return scoreB - scoreA;
      });

      setFilteredTasks(sortedByScore);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to prioritize tasks with AI. Please try again.', 'error');
    } finally {
      setIsAIPrioritizing(false);
    }
  };

  const handleDetectRisks = async () => {
    if (filteredTasks.length === 0) {
      showNotification('No tasks available for risk detection.', 'warning');
      return;
    }

    try {
      setIsDetectingRisks(true);

      const payloadTasks = filteredTasks.map(task => ({
        id: String(task._id || task.id),
        title: task.title,
        priority: task.priority,
        status: task.status,
        deadline: task.deadline,
        estimated_minutes: task.estimatedDuration,
        category: task.category,
      }));

      const result = await aiService.detectRisks(payloadTasks);
      
      setRiskAlerts(Array.isArray(result?.alerts) ? result.alerts : []);
      setRiskOverallStatus(result?.overall_status || 'ok');
      setRiskSummary(result?.summary || 'Risk analysis complete.');
      showNotification('Risk analysis complete. Review the alerts below.', 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to detect risks. Please try again.', 'error');
    } finally {
      setIsDetectingRisks(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return theme.urgent;
      case 'medium': return theme.warning;
      case 'low': return theme.info;
      default: return theme.textSecondary;
    }
  };

  const getRiskStatusColor = (status) => {
    switch (status) {
      case 'critical': return theme.urgent;
      case 'warning': return theme.warning;
      case 'ok': return theme.success;
      default: return theme.info;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return theme.urgent;
      case 'high': return theme.high;
      case 'medium': return theme.medium;
      case 'low': return theme.low;
      default: return theme.medium;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return theme.success;
      case 'in-progress': return theme.info;
      case 'review': return theme.warning;
      default: return theme.textMuted;
    }
  };

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));

    if (diff < 0) return { text: 'Overdue', color: theme.error };
    if (diff === 0) return { text: 'Today', color: theme.warning };
    if (diff === 1) return { text: 'Tomorrow', color: theme.warning };
    if (diff < 7) return { text: `${diff} days`, color: theme.textSecondary };
    return {
      text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      color: theme.textMuted,
    };
  };

  const activeTasks = filteredTasks.filter(t => t.status !== 'done');
  const completedTasks = filteredTasks.filter(t => t.status === 'done');
  const notificationColorMap = {
    success: theme.success,
    error: theme.error,
    warning: theme.warning,
    info: theme.info,
  };

  const styles = {
    container: {
      padding: '32px',
      minHeight: '100vh',
      backgroundColor: theme.bgMain, // Neomorphic background
    },
    loading: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      color: theme.textPrimary,
      gap: '16px',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: `4px solid ${theme.bgMain}`,
      borderTop: `4px solid ${theme.primary}`,
      boxShadow: theme.shadows.neumorphic,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '32px',
    },
    title: {
      fontSize: '32px',
      fontWeight: '800',
      color: theme.textPrimary,
      margin: '0 0 4px 0',
      textShadow: theme.type === 'dark' ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none',
    },
    subtitle: {
      fontSize: '14px',
      color: theme.textSecondary,
      margin: 0,
    },
    notificationBanner: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.md,
      padding: '12px 14px',
      boxShadow: theme.shadows.neumorphic,
      marginBottom: '18px',
      borderLeft: `4px solid ${theme.info}`,
    },
    notificationText: {
      margin: 0,
      color: theme.textPrimary,
      fontSize: '13px',
      fontWeight: '600',
    },
    createButton: {
      backgroundColor: theme.primary,
      color: '#fff', // White text for primary button
      border: 'none',
      borderRadius: borderRadius.lg,
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: theme.shadows.neumorphic,
      display: 'flex',
      alignItems: 'center',
      transition: 'all 0.2s',
    },
    aiPrioritizeButton: {
      backgroundColor: theme.bgMain,
      color: theme.primary,
      border: 'none',
      borderRadius: borderRadius.lg,
      padding: '12px 18px',
      fontSize: '14px',
      fontWeight: '700',
      cursor: isAIPrioritizing ? 'not-allowed' : 'pointer',
      boxShadow: theme.shadows.neumorphic,
      display: 'flex',
      alignItems: 'center',
      transition: 'all 0.2s',
      opacity: isAIPrioritizing ? 0.7 : 1,
      marginRight: '12px',
    },
    riskDetectButton: {
      backgroundColor: theme.bgMain,
      color: theme.warning,
      border: 'none',
      borderRadius: borderRadius.lg,
      padding: '12px 18px',
      fontSize: '14px',
      fontWeight: '700',
      cursor: isDetectingRisks ? 'not-allowed' : 'pointer',
      boxShadow: theme.shadows.neumorphic,
      display: 'flex',
      alignItems: 'center',
      transition: 'all 0.2s',
      opacity: isDetectingRisks ? 0.7 : 1,
      marginRight: '12px',
    },
    buttonSpinner: {
      width: '14px',
      height: '14px',
      border: `2px solid ${theme.primary}33`,
      borderTop: `2px solid ${theme.primary}`,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      marginRight: '8px',
    },
    filtersContainer: {
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.lg,
      padding: '24px',
      boxShadow: theme.shadows.neumorphic, // Neomorphic container
      marginBottom: '32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    searchContainer: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    },
    searchIcon: {
      position: 'absolute',
      left: '16px',
      fontSize: '16px',
      color: theme.textMuted,
      pointerEvents: 'none',
      zIndex: 1,
    },
    searchInput: {
      width: '100%',
      backgroundColor: theme.bgMain,
      border: 'none',
      borderRadius: borderRadius.md,
      padding: '12px 16px 12px 48px',
      fontSize: '14px',
      color: theme.textPrimary,
      outline: 'none',
      boxShadow: theme.shadows.neumorphicInset, // Inset shadow for input
    },
    clearSearch: {
      position: 'absolute',
      right: '12px',
      background: 'none',
      border: 'none',
      color: theme.textMuted,
      cursor: 'pointer',
      fontSize: '16px',
      padding: '4px',
    },
    filtersRow: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    clearButton: {
      backgroundColor: 'transparent',
      border: `1px solid ${theme.error}`,
      borderRadius: borderRadius.md,
      padding: '10px 16px',
      fontSize: '13px',
      color: theme.error,
      cursor: 'pointer',
    },
    riskPanel: {
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.lg,
      padding: '20px',
      marginBottom: '24px',
      boxShadow: theme.shadows.neumorphic,
      borderLeft: `4px solid ${theme.warning}`,
    },
    riskStatusBanner: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '14px',
      fontWeight: '600',
    },
    alertsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    alertItem: {
      backgroundColor: theme.type === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      borderRadius: borderRadius.md,
      padding: '12px',
      border: `1px solid ${theme.textMuted}20`,
    },
    dismissButton: {
      background: 'none',
      border: 'none',
      color: theme.textMuted,
      cursor: 'pointer',
      fontSize: '16px',
      padding: '4px',
      transition: 'color 0.2s',
    },
    taskList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '24px',
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px',
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.lg,
      boxShadow: theme.shadows.neumorphicInset,
    },
    emptyText: {
      fontSize: '16px',
      color: theme.textSecondary,
      margin: 0,
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
      fontSize: '24px',
      boxShadow: theme.type === 'dark' ? '8px 8px 16px rgba(0,0,0,0.4), -8px -8px 16px rgba(255,255,255,0.05)' : '8px 8px 16px rgba(0,0,0,0.2), -8px -8px 16px rgba(255,255,255,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      transition: 'all 0.3s ease',
    },
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.container}>
          <div style={styles.grid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <TaskCardSkeleton key={index} />
            ))}
          </div>
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

        .ai-prioritize-btn:hover {
          transform: translateY(-1px);
          box-shadow: ${theme.shadows.neumorphicInset} !important;
        }

        .risk-detect-btn:hover {
          transform: translateY(-1px);
          box-shadow: ${theme.shadows.neumorphicInset} !important;
        }

        .task-card:hover {
            transform: translateY(-4px);
            box-shadow: ${theme.shadows.neumorphic} !important;
            border-color: ${theme.primary}40 !important; // Subtle glow on hover
        }
      `}</style>
      <div style={styles.container}>
        {notification && (
          <div
            style={{
              ...styles.notificationBanner,
              borderLeftColor: notificationColorMap[notification.type] || theme.info,
            }}
            role="status"
            aria-live="polite"
          >
            <p style={styles.notificationText}>{notification.message}</p>
            <button
              type="button"
              onClick={() => setNotification(null)}
              style={styles.dismissButton}
              aria-label="Dismiss message"
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>All Tasks</h1>
            <p style={styles.subtitle}>
              {activeTasks.length} active · {completedTasks.length} completed
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              style={styles.aiPrioritizeButton}
              onClick={handleAIPrioritize}
              disabled={isAIPrioritizing}
              className="ai-prioritize-btn"
            >
              {isAIPrioritizing && <span style={styles.buttonSpinner} />}
              {isAIPrioritizing ? 'Prioritizing...' : '🤖 AI Prioritize'}
            </button>
            <button
              type="button"
              style={styles.riskDetectButton}
              onClick={handleDetectRisks}
              disabled={isDetectingRisks}
              className="risk-detect-btn"
            >
              {isDetectingRisks && <span style={styles.buttonSpinner} />}
              {isDetectingRisks ? 'Detecting...' : '⚠️ Detect Risks'}
            </button>
            <button
              style={styles.createButton}
              onClick={() => setShowCreateModal(true)}
            >
              <FaPlus style={{ marginRight: '8px' }} /> New Task
            </button>
          </div>
        </div>

        {/* Risk Alerts Panel */}
        {riskAlerts.length > 0 && (
          <div style={styles.riskPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={styles.riskStatusBanner}>
                  <span style={{ color: getRiskStatusColor(riskOverallStatus), fontWeight: '700' }}>
                    {riskOverallStatus?.toUpperCase()}
                  </span>
                  <span style={{ color: theme.textSecondary, marginLeft: '12px' }}>{riskSummary}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setRiskAlerts([]);
                  setRiskOverallStatus(null);
                  setRiskSummary('');
                }}
                style={styles.dismissButton}
              >
                <FaTimes />
              </button>
            </div>
            <div style={styles.alertsList}>
              {riskAlerts.map((alert, idx) => (
                <div key={idx} style={styles.alertItem}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{
                      backgroundColor: getSeverityColor(alert.severity),
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: borderRadius.sm,
                      fontSize: '11px',
                      fontWeight: '700',
                      minWidth: '60px',
                      textAlign: 'center',
                      marginTop: '2px',
                    }}>
                      {alert.severity?.toUpperCase()}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: theme.textPrimary }}>
                        {alert.type?.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: theme.textSecondary }}>
                        {alert.message}
                      </p>
                      {alert.affected_task_ids && alert.affected_task_ids.length > 0 && (
                        <div style={{ fontSize: '12px', color: theme.textMuted }}>
                          Affected: {alert.affected_task_ids.length} task(s)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div style={styles.filtersContainer}>
          {/* Search */}
          <div style={styles.searchContainer}>
            <FaSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={styles.clearSearch}
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div style={styles.filtersRow}>
            {/* Status Filter */}
            <div style={{ width: '200px' }}>
              <CustomSelect
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'todo', label: 'To Do' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'review', label: 'Review' },
                  { value: 'done', label: 'Done' }
                ]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                placeholder="Status"
              />
            </div>

            {/* Priority Filter */}
            <div style={{ width: '200px' }}>
              <CustomSelect
                options={[
                  { value: 'all', label: 'All Priority' },
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' }
                ]}
                value={priorityFilter}
                onChange={(val) => setPriorityFilter(val)}
                placeholder="Priority"
              />
            </div>

            {/* Category Filter */}
            <div style={{ width: '200px' }}>
              <CustomSelect
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'Work', label: 'Work' },
                  { value: 'Personal', label: 'Personal' },
                  { value: 'Health', label: 'Health' },
                  { value: 'Shopping', label: 'Shopping' },
                  { value: 'Learning', label: 'Learning' },
                  { value: 'Family', label: 'Family' }
                ]}
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val)}
                placeholder="Category"
              />
            </div>

            {/* Scope Filter */}
            <div style={{ width: '200px' }}>
              <CustomSelect
                options={[
                  { value: 'all', label: 'All Tasks' },
                  { value: 'standalone', label: 'Standalone Only' },
                  { value: 'project', label: 'Project-Linked Only' }
                ]}
                value={projectFilter}
                onChange={(val) => setProjectFilter(val)}
                placeholder="Scope"
              />
            </div>

            {/* Sort Order */}
            <div style={{ width: '200px' }}>
              <CustomSelect
                options={[
                  { value: 'createdAt', label: 'Date Created' },
                  { value: 'deadline', label: 'Due Date' },
                  { value: 'priority', label: 'Priority' },
                  { value: 'title', label: 'Title' }
                ]}
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                placeholder="Sort By"
              />
            </div>
          </div>
        </div>

        {/* Task List */}
        <div style={styles.taskList}>
          {filteredTasks.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>
                {searchQuery ? 'No tasks match your search.' : 'No tasks yet. Create one!'}
              </p>
            </div>
          ) : (
            <div style={styles.grid}>
              {filteredTasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  aiPriorityScore={aiPriorityScores[String(task._id || task.id)]}
                  onClick={() => handleTaskClick(task)}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                  formatDate={formatDate}
                  completed={task.status === 'done'}
                />
              ))}
            </div>
          )}
        </div>

        {filteredTasks.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                ...styles.clearButton,
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>
            <span style={{ alignSelf: 'center', color: theme.textSecondary, fontWeight: '600' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              style={{
                ...styles.clearButton,
                opacity: currentPage >= totalPages ? 0.5 : 1,
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        )}
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

      {/* FAB */}
      <button
        style={styles.fab}
        onClick={() => setShowCreateModal(true)}
        className="fab"
      >
        <FaPlus />
      </button>
    </Layout>
  );
};

// Task Card Component
const TaskCard = ({ task, aiPriorityScore, onClick, getPriorityColor, getStatusColor, formatDate, completed }) => {
  const { theme } = useTheme();
  const deadline = formatDate(task.deadline);

  const styles = {
    taskCard: {
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.lg,
      padding: '20px',
      boxShadow: theme.shadows.neumorphic,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      position: 'relative',
      overflow: 'hidden',
    },
    taskCardTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '12px',
    },
    taskCardLeft: {
      display: 'flex',
      gap: '12px',
      flex: 1,
    },
    checkboxContainer: {
      width: '24px',
      height: '24px',
      borderRadius: '8px',
      border: `2px solid ${theme.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphicInset,
    },
    checkboxChecked: {
      backgroundColor: theme.success,
      boxShadow: 'none',
      borderColor: theme.success,
    },
    checkboxInner: {
      transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
    taskTitleContainer: { // New style for title and project badge
      display: 'flex',
      flexDirection: 'column',
      gap: '4px', // Space between title and project badge
    },
    taskTitle: {
      fontSize: '16px',
      fontWeight: '700',
      margin: '0',
      lineHeight: '1.4',
    },
    aiScoreBadge: {
      fontSize: '11px',
      fontWeight: '800',
      padding: '2px 8px',
      borderRadius: '999px',
      backgroundColor: theme.success + '20',
      color: theme.success,
      border: `1px solid ${theme.success}40`,
      display: 'inline-flex',
      alignItems: 'center',
      marginLeft: '8px',
    },
    taskDescription: {
      fontSize: '14px',
      color: theme.textSecondary,
      margin: 0,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    },
    taskCardRight: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px',
    },
    deadlineBadge: {
      fontSize: '12px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
    },
    priorityBadge: {
      fontSize: '12px',
      fontWeight: '700',
      padding: '4px 8px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    projectBadge: {
      fontSize: '10px',
      fontWeight: '600',
      padding: '2px 8px',
      borderRadius: '6px',
      backgroundColor: theme.primary + '15',
      color: theme.primary,
      border: `1px solid ${theme.primary}30`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      marginTop: '4px',
    },
    categoryBadge: {
      fontSize: '12px',
      fontWeight: '600',
      padding: '4px 8px',
      borderRadius: '6px',
    },
    tagBadge: {
      fontSize: '11px',
      color: theme.textSecondary,
      backgroundColor: theme.bgElevated, // Assuming bgElevated might be missing unless defined in theme
      // fallback to bgMain or a slight variation if bgElevated is not in theme
      // Let's use theme.bgMain with inset shadow or just slightly different styling?
      // Actually, let's just use bgMain for now or add a custom style.
      padding: '2px 8px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      border: `1px solid ${theme.border}`,
    },
    metaContainer: {
      display: 'flex',
      gap: '12px',
    },
    metaItem: {
      fontSize: '12px',
      color: theme.textMuted,
      display: 'flex',
      alignItems: 'center',
    },
  }

  // Modern animated checkbox
  const Checkbox = ({ checked }) => (
    <div style={{
      ...styles.checkboxContainer,
      ...(checked && styles.checkboxChecked),
      borderColor: checked ? theme.success : theme.border,
    }}>
      <div style={{
        ...styles.checkboxInner,
        transform: checked ? 'scale(1)' : 'scale(0)',
      }}>
        <FaCheck size={10} color="#fff" />
      </div>
    </div>
  );

  return (
    <div
      style={{
        ...styles.taskCard,
        opacity: completed ? 0.7 : 1,
        border: `1px solid ${theme.border}`, // Consistent border
      }}
      onClick={onClick}
      className="task-card"
    >
      {/* Title Row */}
      <div style={{ ...styles.taskCardTop, marginBottom: '8px' }}>
        <div style={styles.taskCardLeft}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Checkbox checked={task.status === 'done'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <h3 style={{
              ...styles.taskTitle,
              textDecoration: completed ? 'line-through' : 'none',
              color: completed ? theme.textMuted : theme.textPrimary,
            }}>
              {task.title}
            </h3>
            {typeof aiPriorityScore === 'number' && (
              <span style={styles.aiScoreBadge}>{aiPriorityScore}</span>
            )}
          </div>
        </div>

        <div style={styles.taskCardRight}>
          {deadline && (
            <span style={{ ...styles.deadlineBadge, color: deadline.color }}>
              <FaCalendarAlt size={12} style={{ marginRight: '4px' }} /> {deadline.text}
            </span>
          )}
        </div>
      </div>

      {/* Context Row (Badges) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '0 12px', marginLeft: '32px', marginBottom: '10px' }}>
          <span style={{
            ...styles.priorityBadge,
            backgroundColor: getPriorityColor(task.priority) + '15',
            color: getPriorityColor(task.priority),
            border: `1px solid ${getPriorityColor(task.priority)}30`,
          }}>
            <FaFlag size={10} style={{ marginRight: '4px' }} />
            {task.priority.toUpperCase()}
          </span>
          <span style={{
            ...styles.categoryBadge,
            backgroundColor: theme.primary + '05',
            color: theme.textSecondary,
            border: `1px solid ${theme.border}50`,
          }}>
            {task.category}
          </span>
          {task.projectId && (
            <div style={styles.projectBadge}>
              <FaClipboardList size={10} />
              {typeof task.projectId === 'object' ? task.projectId.title : 'Project'}
            </div>
          )}
          {task.tags && task.tags.map((tag, index) => (
            <span key={index} style={styles.tagBadge}>
              <FaTag size={10} style={{ marginRight: '4px' }} />
              {tag}
            </span>
          ))}
      </div>

      {/* Description */}
      {task.description && (
        <p style={{ ...styles.taskDescription, padding: '0 12px', marginLeft: '32px', marginBottom: '8px' }}>{task.description}</p>
      )}

      {/* Metadata Row (Footer) */}
      <div style={{ ...styles.taskCardBottom, borderTop: `1px solid ${theme.border}30`, paddingTop: '8px' }}>
        <div style={styles.metaContainer}>
          {task.estimatedDuration && (
            <span style={styles.metaItem}>
              <FaClock size={12} style={{ marginRight: '4px' }} />
              {formatTaskDuration(task.estimatedDuration)}
            </span>
          )}
          {task.subtasks?.length > 0 && (
            <span style={styles.metaItem}>
              <FaCheck size={12} style={{ marginRight: '4px' }} />
              {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksPage;