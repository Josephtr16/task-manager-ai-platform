// src/pages/TasksPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { tasksAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { borderRadius } from '../theme';
import CreateTaskModal from '../components/Tasks/CreateTaskModal';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import {
  FaSearch, FaPlus, FaCalendarAlt, FaClock, FaCheck, FaFlag, FaTag, FaTimes
} from 'react-icons/fa';
import CustomSelect from '../components/common/CustomSelect';

const TasksPage = () => {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, searchQuery, statusFilter, priorityFilter, categoryFilter, sortBy]);

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getTasks();
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(task => task.status !== 'done');
      } else {
        filtered = filtered.filter(task => task.status === statusFilter);
      }
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.category === categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredTasks(filtered);
  };

  const handleTaskCreated = (newTask) => {
    setTasks([newTask, ...tasks]);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(tasks.map(t => t._id === updatedTask._id ? updatedTask : t));
    setSelectedTask(updatedTask);
  };

  const handleTaskDeleted = (taskId) => {
    setTasks(tasks.filter(t => t._id !== taskId));
    setShowDetailModal(false);
    setSelectedTask(null);
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
        <div style={styles.loading}>
          <style>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            `}</style>
          <div style={styles.spinner} />
          <p>Loading tasks...</p>
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

        .task-card:hover {
            transform: translateY(-4px);
            box-shadow: ${theme.shadows.neumorphic} !important;
            border-color: ${theme.primary}40 !important; // Subtle glow on hover
        }
      `}</style>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>All Tasks</h1>
            <p style={styles.subtitle}>
              {activeTasks.length} active · {completedTasks.length} completed
            </p>
          </div>
          <button
            style={styles.createButton}
            onClick={() => setShowCreateModal(true)}
          >
            <FaPlus style={{ marginRight: '8px' }} /> New Task
          </button>
        </div>

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
const TaskCard = ({ task, onClick, getPriorityColor, getStatusColor, formatDate, completed }) => {
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
    taskTitle: {
      fontSize: '16px',
      fontWeight: '700',
      margin: '0 0 4px 0',
      lineHeight: '1.4',
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
    },
    taskCardBottom: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 'auto',
      paddingTop: '16px',
      borderTop: `1px solid ${theme.border}`,
    },
    tagsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
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
      {/* Top Row */}
      <div style={styles.taskCardTop}>
        <div style={styles.taskCardLeft}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Checkbox checked={task.status === 'done'} />
          </div>
          <div>
            <h3 style={{
              ...styles.taskTitle,
              textDecoration: completed ? 'line-through' : 'none',
              color: completed ? theme.textMuted : theme.textPrimary,
            }}>
              {task.title}
            </h3>
            {task.description && (
              <p style={styles.taskDescription}>{task.description}</p>
            )}
          </div>
        </div>

        <div style={styles.taskCardRight}>
          {deadline && (
            <span style={{ ...styles.deadlineBadge, color: deadline.color }}>
              <FaCalendarAlt size={12} style={{ marginRight: '4px' }} /> {deadline.text}
            </span>
          )}
          <span style={{
            ...styles.priorityBadge,
            backgroundColor: getPriorityColor(task.priority) + '20',
            color: getPriorityColor(task.priority),
          }}>
            <FaFlag size={12} style={{ marginRight: '4px' }} />
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={styles.taskCardBottom}>
        <div style={styles.tagsContainer}>
          <span style={{
            ...styles.categoryBadge,
            backgroundColor: theme.primary + '20',
            color: theme.primary,
          }}>
            {task.category}
          </span>
          {task.tags && task.tags.map((tag, index) => (
            <span key={index} style={styles.tagBadge}>
              <FaTag size={10} style={{ marginRight: '4px' }} />
              {tag}
            </span>
          ))}
        </div>

        <div style={styles.metaContainer}>
          {task.estimatedDuration && (
            <span style={styles.metaItem}>
              <FaClock size={12} style={{ marginRight: '4px' }} />
              {task.estimatedDuration}m
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