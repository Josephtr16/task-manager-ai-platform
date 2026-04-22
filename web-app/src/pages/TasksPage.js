// src/pages/TasksPage.js
import React, { useState, useEffect, useRef } from 'react';
import { tasksAPI } from '../services/api';
import aiService from '../services/aiService';
import { useTheme } from '../context/ThemeContext';
import { borderRadius } from '../theme';
import { formatTaskDuration } from '../utils/formatTaskDuration';
import CreateTaskModal from '../components/Tasks/CreateTaskModal';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import {
  FaSearch, FaPlus, FaCalendarAlt, FaClock, FaCheck, FaFlag, FaTag, FaTimes, FaClipboardList, FaRobot, FaExclamationTriangle
} from 'react-icons/fa';
import CustomSelect from '../components/common/CustomSelect';
import { TaskCardSkeleton } from '../components/common/SkeletonLoader';
import { readCache, writeCache } from '../utils/sessionCache';

const TASKS_CACHE_KEY = 'taskflow_tasks_page_cache';

const AI_SCORABLE_STATUSES = ['pending', 'todo', 'in-progress'];

const TasksPage = () => {
  const cachedTasksState = readCache(TASKS_CACHE_KEY, 60000);
  const { theme } = useTheme();
  const [tasks, setTasks] = useState(cachedTasksState?.tasks || []);
  const [filteredTasks, setFilteredTasks] = useState(cachedTasksState?.filteredTasks || []);
  const [loading, setLoading] = useState(!cachedTasksState);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(cachedTasksState?.totalPages || 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState(cachedTasksState?.sortBy || 'aiPriorityScore');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isAIPrioritizing, setIsAIPrioritizing] = useState(false);
  const [aiPriorityScores, setAiPriorityScores] = useState({});
  const [isDetectingRisks, setIsDetectingRisks] = useState(false);
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [riskTaskIds, setRiskTaskIds] = useState(() => new Set());
  const [riskOverallStatus, setRiskOverallStatus] = useState(null);
  const [riskSummary, setRiskSummary] = useState('');
  const [notification, setNotification] = useState(null);
  const notificationTimerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const lastAutoScoreKeyRef = useRef('');
  const lastFilterKeyRef = useRef('');
  const [hasCache, setHasCache] = useState(Boolean(cachedTasksState));

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
    
    // Only show loading if we have no cached page data yet.
    if (!hasCache) {
      setLoading(true);
    } else {
      setLoading(false);
    }
    
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, statusFilter, priorityFilter, categoryFilter, projectFilter, sortBy]);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
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
      const isAiSort = sortBy === 'aiPriorityScore';
      const params = {
        page: currentPage,
        sortBy: isAiSort ? 'createdAt' : sortBy,
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

      if (!hasCache && tasks.length === 0) {
        setLoading(true);
      }

      const response = await tasksAPI.getTasks(params);
      // The interceptor already unwraps one data layer, so consume the payload before reading task keys.
      const tasksPayload = response.data;
      const responseTasks = tasksPayload.tasks || [];
      const pagination = tasksPayload.pagination || {};

      setTasks(responseTasks);
      setTotalPages(pagination.totalPages || 1);

      const displayedTasks = projectFilter === 'project'
        ? responseTasks.filter(task => !!task.projectId)
        : responseTasks;

      const scoreMap = responseTasks.reduce((acc, task) => {
        if (AI_SCORABLE_STATUSES.includes(task.status) && typeof task.aiPriorityScore === 'number') {
          acc[String(task._id || task.id)] = task.aiPriorityScore;
        }
        return acc;
      }, {});
      setAiPriorityScores(scoreMap);

      const shouldPushCompletedToBottom = statusFilter === 'all' && (sortBy === 'createdAt' || sortBy === 'deadline');

      const orderedTasks = shouldPushCompletedToBottom
        ? [
            ...displayedTasks.filter(task => task.status !== 'done'),
            ...displayedTasks.filter(task => task.status === 'done'),
          ]
        : displayedTasks;

      const finalOrderedTasks = isAiSort
        ? sortTasksByPriorityScore(orderedTasks, scoreMap)
        : orderedTasks;

      setFilteredTasks(finalOrderedTasks);

      const unscoredActiveIds = finalOrderedTasks
        .filter(task => AI_SCORABLE_STATUSES.includes(task.status) && typeof task.aiPriorityScore !== 'number')
        .map(task => String(task._id || task.id))
        .sort();
      const autoScoreKey = unscoredActiveIds.join('|');

      if (autoScoreKey && autoScoreKey !== lastAutoScoreKeyRef.current) {
        lastAutoScoreKeyRef.current = autoScoreKey;
        triggerAutoReprioritize();
      } else if (!autoScoreKey) {
        lastAutoScoreKeyRef.current = '';
      }

      setHasCache(true);
      writeCache(TASKS_CACHE_KEY, {
        tasks: responseTasks,
        filteredTasks: finalOrderedTasks,
        totalPages: pagination.totalPages || 1,
        sortBy,
      });
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortTasksByPriorityScore = (taskList, scoreMap) => {
    return [...taskList].sort((a, b) => {
      const scoreA = scoreMap[String(a._id || a.id)] ?? -1;
      const scoreB = scoreMap[String(b._id || b.id)] ?? -1;

      if (scoreA === scoreB) {
        const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
        const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
        return deadlineA - deadlineB;
      }

      return scoreB - scoreA;
    });
  };

  const getPrioritizationSnapshot = async () => {
    const isAiSort = sortBy === 'aiPriorityScore';
    const params = {
      page: currentPage,
      sortBy: isAiSort ? 'createdAt' : sortBy,
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
    // The interceptor returns the endpoint payload in response.data, so read tasks from that payload.
    const tasksPayload = response.data;
    const responseTasks = tasksPayload.tasks || [];
    const displayedTasks = projectFilter === 'project'
      ? responseTasks.filter(task => !!task.projectId)
      : responseTasks;

    const shouldPushCompletedToBottom = statusFilter === 'all' && (sortBy === 'createdAt' || sortBy === 'deadline');

    return shouldPushCompletedToBottom
      ? [
          ...displayedTasks.filter(task => task.status !== 'done'),
          ...displayedTasks.filter(task => task.status === 'done'),
        ]
      : displayedTasks;
  };

  const autoReprioritize = async () => {
    const snapshotTasks = await getPrioritizationSnapshot();
    const nonDoneTasks = snapshotTasks.filter(task => task.status !== 'done');

    if (nonDoneTasks.length === 0) {
      return;
    }

    const tasksToPrioritize = snapshotTasks.filter(task => AI_SCORABLE_STATUSES.includes(task.status));

    if (tasksToPrioritize.length === 0) {
      return;
    }

    try {
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
        acc[String(item.id)] = item.score;
        return acc;
      }, {});

      setAiPriorityScores(scoreMap);

      setTasks(prev => prev.map(task => {
        const taskId = String(task._id || task.id);
        return Object.prototype.hasOwnProperty.call(scoreMap, taskId)
          ? { ...task, aiPriorityScore: scoreMap[taskId] }
          : task;
      }));

      const scoredSnapshotTasks = snapshotTasks.map(task => {
        const taskId = String(task._id || task.id);
        return Object.prototype.hasOwnProperty.call(scoreMap, taskId)
          ? { ...task, aiPriorityScore: scoreMap[taskId] }
          : task;
      });

      const sortedTasks = sortTasksByPriorityScore(scoredSnapshotTasks, scoreMap);
      setFilteredTasks(sortedTasks);
      writeCache(TASKS_CACHE_KEY, {
        tasks: scoredSnapshotTasks,
        filteredTasks: sortedTasks,
        totalPages,
        sortBy,
      });
    } catch (error) {
      console.warn('Auto AI prioritization failed:', error);
    }
  };

  const triggerAutoReprioritize = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      autoReprioritize();
    }, 1500);
  };

  const handleTaskCreated = async (newTask) => {
    setTasks(prev => [newTask, ...prev]);
    await loadTasks();
    triggerAutoReprioritize();
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleTaskUpdated = async (updatedTask) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    setSelectedTask(updatedTask);
    await loadTasks();
    triggerAutoReprioritize();
  };

  const handleTaskDeleted = async (taskId) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
    setShowDetailModal(false);
    setSelectedTask(null);
    await loadTasks();
    triggerAutoReprioritize();
  };

  const handleAIPrioritize = async () => {
    const tasksToPrioritize = tasks.filter(task => AI_SCORABLE_STATUSES.includes(task.status));

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
      setFilteredTasks(sortTasksByPriorityScore(filteredTasks, scoreMap));
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to prioritize tasks with AI. Please try again.', 'error');
    } finally {
      setIsAIPrioritizing(false);
    }
  };

  const handleDetectRisks = async () => {
    const riskEligibleTasks = filteredTasks.filter((task) => {
      const normalizedStatus = String(task?.status || '').toLowerCase();
      return !['done', 'completed', 'complete'].includes(normalizedStatus);
    });

    if (riskEligibleTasks.length === 0) {
      showNotification('No active tasks available for risk detection.', 'warning');
      return;
    }

    try {
      setIsDetectingRisks(true);

      const payloadTasks = riskEligibleTasks.map(task => ({
        id: String(task._id || task.id),
        title: task.title,
        priority: task.priority,
        status: task.status,
        deadline: task.deadline,
        estimated_minutes: task.estimatedDuration,
        category: task.category,
      }));

      const result = await aiService.detectRisks(payloadTasks);

      const alerts = Array.isArray(result?.alerts) ? result.alerts : [];
      setRiskAlerts(alerts);
      const nextRiskTaskIds = new Set(
        alerts
          .flatMap((alert) => (Array.isArray(alert?.affected_task_ids) ? alert.affected_task_ids : []))
          .map((taskId) => String(taskId))
      );
      setRiskTaskIds(nextRiskTaskIds);
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

  const formatDate = (date, isCompleted = false) => {
    if (!date) return null;

    if (isCompleted) {
      return { text: 'Completed', color: theme.success };
    }

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
      backgroundColor: theme.bgMain,
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
      boxShadow: 'none',
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
      fontFamily: 'Syne, sans-serif',
      fontSize: '32px',
      fontWeight: '800',
      color: theme.textPrimary,
      margin: '0 0 4px 0',
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
      backgroundColor: theme.bgCard,
      borderRadius: borderRadius.md,
      padding: '12px 14px',
      boxShadow: theme.shadows.card,
      marginBottom: '18px',
      borderLeft: `4px solid ${theme.info}`,
      border: `1px solid ${theme.border}`,
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
      boxShadow: theme.shadows.card,
      display: 'flex',
      alignItems: 'center',
      transition: 'all 150ms ease',
    },
    aiPrioritizeButton: {
      backgroundColor: theme.bgCard,
      color: theme.primary,
      border: `1px solid ${theme.border}`,
      borderRadius: borderRadius.lg,
      padding: '12px 18px',
      fontSize: '14px',
      fontWeight: '700',
      cursor: isAIPrioritizing ? 'not-allowed' : 'pointer',
      boxShadow: theme.shadows.card,
      display: 'flex',
      alignItems: 'center',
      transition: 'all 150ms ease',
      opacity: isAIPrioritizing ? 0.7 : 1,
      marginRight: '12px',
    },
    riskDetectButton: {
      backgroundColor: theme.bgCard,
      color: theme.warning,
      border: `1px solid ${theme.border}`,
      borderRadius: borderRadius.lg,
      padding: '12px 18px',
      fontSize: '14px',
      fontWeight: '700',
      cursor: isDetectingRisks ? 'not-allowed' : 'pointer',
      boxShadow: theme.shadows.card,
      display: 'flex',
      alignItems: 'center',
      transition: 'all 150ms ease',
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
      backgroundColor: theme.bgCard,
      borderRadius: borderRadius.lg,
      padding: '24px',
      boxShadow: theme.shadows.card,
      marginBottom: '32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      border: `1px solid ${theme.border}`,
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
      backgroundColor: theme.bgRaised,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      borderRadius: '8px',
      padding: '11px 14px 11px 44px',
      fontSize: '14px',
      color: theme.textPrimary,
      outline: 'none',
      boxShadow: 'none',
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
      border: `1px solid ${theme.borderMedium || theme.border}`,
      borderRadius: '8px',
      padding: '0 16px',
      height: '40px',
      fontSize: '13px',
      color: theme.textSecondary,
      cursor: 'pointer',
    },
    riskPanel: {
      backgroundColor: theme.bgCard,
      borderRadius: borderRadius.lg,
      padding: '20px',
      marginBottom: '24px',
      boxShadow: theme.shadows.card,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
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
      backgroundColor: theme.bgCard,
      borderRadius: borderRadius.md,
      boxShadow: 'none',
      border: `1px solid ${theme.borderSubtle || theme.border}`,
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
      backgroundColor: theme.bgCard,
      borderRadius: borderRadius.lg,
      boxShadow: 'none',
      border: `1px solid ${theme.borderSubtle || theme.border}`,
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
      color: '#0A0908',
      border: 'none',
      cursor: 'pointer',
      fontSize: '24px',
      boxShadow: theme.shadows.float,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      transition: 'all 150ms ease',
    },
  };

  if (loading) {
    return (
      <>
        <div style={styles.container}>
          <div style={styles.grid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <TaskCardSkeleton key={index} />
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
        
        .tasks-page-container {
          animation: fadeIn 0.2s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0.95; }
          to { opacity: 1; }
        }

        @keyframes warningPulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        
        .fab:hover {
            transform: scale(1.1) rotate(90deg);
            box-shadow: 0 0 20px ${theme.primary}80 !important;
        }

        .ai-prioritize-btn:hover {
          transform: translateY(-1px);
          box-shadow: ${theme.shadows.card} !important;
        }

        .risk-detect-btn:hover {
          transform: translateY(-1px);
          box-shadow: ${theme.shadows.card} !important;
        }

        .task-card:hover {
            transform: translateY(-2px);
            box-shadow: ${theme.shadows.float} !important;
            border-color: ${theme.primary}33 !important;
        }

        .task-card:hover .task-card-checkbox {
            opacity: 1;
        }
      `}</style>
      <div style={styles.container} className="tasks-page-container">
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
              <FaRobot style={{ marginRight: '8px', fontSize: '12px' }} />
              {isAIPrioritizing ? 'Prioritizing...' : 'AI Prioritize'}
            </button>
            <button
              type="button"
              style={styles.riskDetectButton}
              onClick={handleDetectRisks}
              disabled={isDetectingRisks}
              className="risk-detect-btn"
            >
              {isDetectingRisks && <span style={styles.buttonSpinner} />}
              <FaExclamationTriangle style={{ marginRight: '8px', fontSize: '12px' }} />
              {isDetectingRisks ? 'Detecting...' : 'Detect Risks'}
            </button>
            <button
              style={styles.createButton}
              onClick={() => setShowCreateModal(true)}
            >
              <FaPlus style={{ marginRight: '8px', fontSize: '12px' }} /> New Task
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
                  setRiskTaskIds(new Set());
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
                  { value: 'aiPriorityScore', label: 'AI Score' },
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
                  aiPriorityScore={task.status === 'done' ? undefined : aiPriorityScores[String(task._id || task.id)]}
                  onClick={() => handleTaskClick(task)}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                  formatDate={formatDate}
                  completed={task.status === 'done'}
                  riskTaskIds={riskTaskIds}
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

    </>
  );
};

// Task Card Component
const TaskCard = ({ task, aiPriorityScore, onClick, getPriorityColor, getStatusColor, formatDate, completed, riskTaskIds }) => {
  const { theme } = useTheme();
  const deadline = formatDate(task.deadline, completed);
  const taskId = task?._id != null ? task._id.toString() : String(task?.id || '');
  const isRiskTask = riskTaskIds?.has(taskId);

  const styles = {
    taskCard: {
      backgroundColor: theme.bgCard,
      borderRadius: '12px',
      padding: '16px',
      boxShadow: theme.shadows.xs,
      cursor: 'pointer',
      transition: 'all 180ms ease',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      position: 'relative',
      overflow: 'hidden',
      height: '280px',
    },
    taskCardTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '12px',
    },
    taskCardLeft: {
      display: 'flex',
      gap: '8px',
      flex: 1,
    },
    checkboxContainer: {
      width: '20px',
      height: '20px',
      borderRadius: '6px',
      border: `1.5px solid ${theme.borderStrong || theme.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 150ms ease',
      backgroundColor: theme.bgRaised,
      boxShadow: 'none',
      opacity: 0.35,
    },
    checkboxChecked: {
      backgroundColor: theme.sage,
      boxShadow: 'none',
      borderColor: theme.sage,
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
      fontWeight: '500',
      margin: '0',
      lineHeight: '1.4',
      color: theme.textPrimary,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      minHeight: '44px',
    },
    taskTitleMeta: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '8px',
    },
    aiScoreBadge: {
      fontSize: '11px',
      fontWeight: '700',
      padding: '4px 9px',
      borderRadius: '7px',
      backgroundColor: theme.accentDim || `${theme.accent}15`,
      color: theme.accent,
      border: `1px solid ${theme.borderMedium || theme.border}`,
      display: 'inline-flex',
      alignItems: 'center',
      lineHeight: 1,
      letterSpacing: '0.06em',
      fontFamily: '"Geist Mono", monospace',
    },
    taskDescription: {
      fontSize: '14px',
      color: theme.textSecondary,
      margin: 0,
      display: '-webkit-box',
      WebkitLineClamp: 3,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      lineHeight: '1.45',
    },
    taskDescriptionBlock: {
      minHeight: '60px',
      maxHeight: '60px',
      overflow: 'hidden',
    },
    taskCardRight: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px',
    },
    taskContentRail: {
      marginLeft: '22px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      flex: 1,
      minHeight: 0,
    },
    badgesRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
    },
    deadlineBadge: {
      fontSize: '11px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      fontFamily: '"Geist Mono", monospace',
    },
    priorityBadge: {
      fontSize: '10px',
      fontWeight: '600',
      padding: '2px 6px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    },
    projectBadge: {
      fontSize: '10px',
      fontWeight: '600',
      padding: '2px 6px',
      borderRadius: '6px',
      backgroundColor: theme.bgRaised,
      color: theme.textSecondary,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      marginTop: '4px',
    },
    categoryBadge: {
      fontSize: '10px',
      fontWeight: '600',
      padding: '2px 6px',
      borderRadius: '6px',
      backgroundColor: theme.bgRaised,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    tagBadge: {
      fontSize: '10px',
      color: theme.textSecondary,
      backgroundColor: theme.bgRaised,
      padding: '2px 6px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      border: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    metaContainer: {
      display: 'flex',
      gap: '12px',
      minHeight: '16px',
    },
    taskCardBottom: {
      marginTop: 'auto',
      borderTop: `1px solid ${theme.borderSubtle || theme.border}`,
      paddingTop: '14px',
    },
    metaItem: {
      fontSize: '12px',
      color: theme.textMuted,
      display: 'flex',
      alignItems: 'center',
      fontFamily: '"Geist Mono", monospace',
    },
    warningBorderStrip: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '3px',
      backgroundColor: theme.warning,
      opacity: 0.8,
      animation: 'warningPulse 1.5s ease-in-out infinite',
      pointerEvents: 'none',
    },
    warningBadge: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      fontSize: '13px',
      lineHeight: 1,
      zIndex: 2,
      pointerEvents: 'none',
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
        border: isRiskTask
          ? `3px solid ${theme.warning}`
          : `1px solid ${theme.borderSubtle || theme.border}`,
        boxShadow: isRiskTask
          ? theme.shadows.xs
          : `${theme.shadows.xs}, inset 4px 0 0 ${getPriorityColor(task.priority)}`,
      }}
      onClick={onClick}
      className="task-card"
    >
      {isRiskTask && <div style={styles.warningBorderStrip} />}
      {isRiskTask && <span style={styles.warningBadge}>⚠️</span>}

      {/* Title Row */}
      <div style={styles.taskCardTop}>
        <div style={styles.taskCardLeft}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="task-card-checkbox"
          >
            <Checkbox checked={task.status === 'done'} />
          </div>
          <div style={styles.taskTitleMeta}>
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

      <div style={styles.taskContentRail}>
      {/* Context Row (Badges) */}
      <div style={styles.badgesRow}>
          <span style={{
            ...styles.priorityBadge,
            backgroundColor: getPriorityColor(task.priority) + '12',
            color: getPriorityColor(task.priority),
            border: `1px solid ${getPriorityColor(task.priority)}22`,
          }}>
            <FaFlag size={10} style={{ marginRight: '4px' }} />
            {task.priority.toUpperCase()}
          </span>
          <span style={{
            ...styles.categoryBadge,
            backgroundColor: theme.bgRaised,
            color: theme.textSecondary,
            border: `1px solid ${theme.borderSubtle || theme.border}`,
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
      <div style={styles.taskDescriptionBlock}>
        <p style={styles.taskDescription}>{task.description || 'No description provided.'}</p>
      </div>

      {/* Metadata Row (Footer) */}
      <div style={styles.taskCardBottom}>
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
          {!task.estimatedDuration && !(task.subtasks?.length > 0) && (
            <span style={styles.metaItem}>No estimates</span>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default TasksPage;