// src/pages/KanbanPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { tasksAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { borderRadius } from '../theme';
import { formatTaskDuration } from '../utils/formatTaskDuration';
import CreateTaskModal from '../components/Tasks/CreateTaskModal';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import { FaClipboardList, FaBolt, FaEye, FaCheckCircle, FaPlus, FaCalendarAlt, FaClock, FaTag, FaGripVertical } from 'react-icons/fa';

const KanbanPage = () => {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [hasMoreTasks, setHasMoreTasks] = useState(false);
  const isFirstMountRef = React.useRef(true);

  const COLUMNS = [
    { id: 'todo', title: 'To Do', icon: <FaClipboardList />, color: theme.textMuted },
    { id: 'in-progress', title: 'In Progress', icon: <FaBolt />, color: theme.info || '#3b82f6' },
    { id: 'review', title: 'Review', icon: <FaEye />, color: theme.warning || '#f59e0b' },
    { id: 'done', title: 'Done', icon: <FaCheckCircle />, color: theme.success },
  ];

  useEffect(() => {
    // Only show loading on first mount in entire app, not on page re-entries
    if (!isFirstMountRef.current) {
      setLoading(false);
    }
    isFirstMountRef.current = false;
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getTasks({ limit: 500 });
      // The interceptor unwraps one data layer, so parse the endpoint payload from response.data.
      const tasksPayload = response.data;
      const fetchedTasks = tasksPayload.tasks || [];
      const pagination = tasksPayload.pagination || {};
      
      setTasks(fetchedTasks);
      // Track if there are more tasks than shown (>500)
      setHasMoreTasks(pagination?.hasMore ?? false);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTasksByStatus = useMemo(() => {
    return (status) =>
      tasks
        .filter(task => task.status === status)
        .sort((a, b) => {
          const aHasDeadline = Boolean(a.deadline);
          const bHasDeadline = Boolean(b.deadline);

          if (!aHasDeadline && !bHasDeadline) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          if (!aHasDeadline) {
            return 1;
          }
          if (!bHasDeadline) {
            return -1;
          }

          return new Date(a.deadline) - new Date(b.deadline);
        });
  }, [tasks]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return theme.urgent;
      case 'high': return theme.high;
      case 'medium': return theme.medium;
      case 'low': return theme.low;
      default: return theme.medium;
    }
  };

  const formatDeadline = (deadline, status) => {
    if (!deadline) return null;

    if (status === 'done') {
      return { text: 'Completed', color: theme.success };
    }

    const date = new Date(deadline);
    const now = new Date();
    const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: 'Overdue', color: theme.error };
    if (diff === 0) return { text: 'Today', color: theme.warning };
    if (diff === 1) return { text: 'Tomorrow', color: theme.warning };
    return {
      text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      color: theme.textMuted,
    };
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    // Optimistically update UI
    setTasks(tasks.map(t =>
      t._id === draggedTask._id ? { ...t, status: newStatus } : t
    ));

    // Update in backend
    try {
      await tasksAPI.updateTask(draggedTask._id, { status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert on error
      loadTasks();
    }

    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleTaskCreated = (newTask) => {
    setTasks([newTask, ...tasks]);
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
      boxShadow: theme.shadows.float,
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
      fontFamily: '"Syne", sans-serif',
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
    createButton: {
      backgroundColor: theme.primary,
      color: '#fff',
      border: 'none',
      borderRadius: '999px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: theme.shadows.float,
      display: 'flex',
      alignItems: 'center',
      transition: 'all 150ms ease',
    },
    board: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '24px',
      alignItems: 'start',
    },
    column: {
      backgroundColor: theme.bgCard,
      borderRadius: borderRadius.lg,
      padding: '20px',
      boxShadow: theme.shadows.card,
      border: `1px solid ${theme.border}`,
      minHeight: '500px',
      transition: 'all 150ms ease',
    },
    columnDragOver: {
      border: `1px solid ${theme.primary}`,
      boxShadow: theme.shadows.float,
    },
    columnHeader: {
      marginBottom: '20px',
    },
    columnTitleRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px',
    },
    columnTitle: {
      fontSize: '16px',
      fontWeight: '700',
      margin: 0,
      flex: 1,
    },
    columnCount: {
      fontSize: '12px',
      fontWeight: '700',
      padding: '2px 8px',
      borderRadius: '4px',
      backgroundColor: theme.bgOverlay,
      boxShadow: 'none',
    },
    columnBar: {
      height: '4px',
      borderRadius: '2px',
      opacity: 0.5,
    },
    columnTasks: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      minHeight: '200px',
    },
    emptyColumn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '150px',
      border: `1px dashed ${theme.borderMedium || theme.border}`,
      borderRadius: borderRadius.md,
      transition: 'all 120ms ease',
    },
    emptyColumnDragOver: {
      borderColor: theme.borderMedium || theme.border,
      backgroundColor: theme.bgRaised,
    },
    emptyColumnText: {
      fontSize: '14px',
      color: theme.textMuted,
      margin: 0,
    },
    dropZone: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60px',
      border: `1px dashed ${theme.borderStrong || theme.border}`,
      borderRadius: borderRadius.md,
      color: theme.textSecondary,
      fontSize: '14px',
      fontWeight: '500',
    },
    fab: {
      height: '40px',
      padding: '0 20px',
      borderRadius: '8px',
      backgroundColor: theme.primary,
      color: '#0A0908',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,146,74,0.3) inset',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      transition: 'all 180ms ease',
    },
    // Card Styles
    card: {
      backgroundColor: theme.bgRaised,
      borderRadius: '8px',
      padding: '14px',
      cursor: 'grab',
      transition: 'all 180ms ease',
      boxShadow: theme.shadows.sm,
      position: 'relative',
      border: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    cardHeader: {
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-start',
      marginBottom: '8px',
    },
    cardTitle: {
      fontSize: '13px',
      fontWeight: '500',
      color: theme.textPrimary,
      margin: 0,
      lineHeight: '1.4',
    },
    cardDescription: {
      fontSize: '12px',
      color: theme.textSecondary,
      margin: '0 0 8px 0',
      lineHeight: '1.45',
      minHeight: '34px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
    },
    cardTags: {
      display: 'flex',
      gap: '4px',
      flexWrap: 'wrap',
      marginBottom: '8px',
    },
    cardTag: {
      fontSize: '10px',
      padding: '2px 6px',
      borderRadius: '4px',
      backgroundColor: theme.bgElevated,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      color: theme.textMuted,
    },
    subtaskProgress: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px',
    },
    subtaskProgressBar: {
      flex: 1,
      height: '6px',
      backgroundColor: theme.bgElevated,
      borderRadius: '3px',
      overflow: 'hidden',
      boxShadow: 'none',
    },
    subtaskProgressFill: {
      height: '100%',
      backgroundColor: theme.success,
      borderRadius: '3px',
      transition: 'width 0.3s ease',
    },
    subtaskText: {
      fontSize: '11px',
      color: theme.textMuted,
      flexShrink: 0,
    },
    cardFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '8px',
    },
    cardFooterLeft: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
    },
    cardFooterRight: {
      display: 'flex',
      gap: '6px',
      alignItems: 'center',
    },
    deadlineText: {
      fontSize: '11px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
    },
    durationText: {
      fontSize: '11px',
      color: theme.textMuted,
      display: 'flex',
      alignItems: 'center',
    },
    categoryBadge: {
      fontSize: '11px',
      padding: '2px 6px',
      borderRadius: '4px',
      backgroundColor: theme.bgElevated,
      boxShadow: 'none',
      color: theme.textSecondary,
      display: 'flex',
      alignItems: 'center',
    },
    projectBadge: {
      fontSize: '10px',
      padding: '2px 6px',
      borderRadius: '4px',
      backgroundColor: theme.primary + '15',
      color: theme.primary,
      border: `1px solid ${theme.primary}30`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      marginTop: '4px',
    },
    dragHint: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      fontSize: '12px',
      color: theme.textMuted,
      opacity: 0.5,
    },
  };

  if (loading) {
    return (
      <>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <p>Loading Kanban board...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={styles.container}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          [draggable]:active {
            cursor: grabbing !important;
          }
          
          .fab:hover {
            transform: translateY(-1px);
            box-shadow: ${theme.shadows.glow} !important;
          }
          
          .kanban-card:hover {
            transform: translateY(-1px);
            box-shadow: ${theme.shadows.md} !important;
          }
        `}</style>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Kanban Board</h1>
            <p style={styles.subtitle}>
              {tasks.length} tasks shown {hasMoreTasks && '(more available)'} · Drag and drop to update status
            </p>
          </div>
          <button
            style={styles.createButton}
            onClick={() => setShowCreateModal(true)}
          >
            <FaPlus style={{ marginRight: '8px' }} /> New Task
          </button>
        </div>

        {/* Kanban Board */}
        <div style={styles.board}>
          {COLUMNS.map(column => {
            const columnTasks = getTasksByStatus(column.id);
            const isDragOver = dragOverColumn === column.id;

            return (
              <div
                key={column.id}
                style={{
                  ...styles.column,
                  ...(isDragOver && styles.columnDragOver),
                }}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div style={styles.columnHeader}>
                  <div style={styles.columnTitleRow}>
                    <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>{column.icon}</span>
                    <h3 style={{ ...styles.columnTitle, color: column.color }}>
                      {column.title}
                    </h3>
                    <span style={{
                      ...styles.columnCount,
                      color: column.color,
                    }}>
                      {columnTasks.length}
                    </span>
                  </div>
                  <div style={{
                    ...styles.columnBar,
                    backgroundColor: column.color,
                  }} />
                </div>

                {/* Tasks */}
                <div style={styles.columnTasks}>
                  {columnTasks.length > 0 ? (
                    columnTasks.map(task => (
                      <KanbanCard
                        key={task._id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        getPriorityColor={getPriorityColor}
                        formatDeadline={formatDeadline}
                        isDragging={draggedTask?._id === task._id}
                        styles={styles}
                      />
                    ))
                  ) : (
                    <div style={{
                      ...styles.emptyColumn,
                      ...(isDragOver && styles.emptyColumnDragOver),
                    }}>
                      <p style={styles.emptyColumnText}>
                        {isDragOver ? '📥 Drop here' : 'No tasks'}
                      </p>
                    </div>
                  )}

                  {/* Drop zone when column has tasks */}
                  {isDragOver && columnTasks.length > 0 && (
                    <div style={styles.dropZone}>
                      📥 Drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
      </div>
    </>
  );
};

// Kanban Card Component
const KanbanCard = ({
  task,
  onClick,
  onDragStart,
  onDragEnd,
  getPriorityColor,
  formatDeadline,
  isDragging,
  styles, // Passed from parent styles
}) => {
  const deadline = formatDeadline(task.deadline, task.status);
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskPercentage = totalSubtasks > 0
    ? Math.round((completedSubtasks / totalSubtasks) * 100)
    : 0;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        ...styles.card,
        opacity: isDragging ? 0.5 : 1,
        borderLeft: `3px solid ${getPriorityColor(task.priority)}`,
        transform: isDragging ? 'rotate(2deg)' : 'none',
      }}
      className="kanban-card"
    >
      {/* Card Header */}
      <div style={styles.cardHeader}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={styles.cardTitle}>{task.title}</p>
          {task.projectId && (
            <div style={styles.projectBadge}>
              <FaClipboardList size={10} />
              {typeof task.projectId === 'object' ? task.projectId.title : 'Project'}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p style={styles.cardDescription}>{task.description}</p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div style={styles.cardTags}>
          {task.tags.slice(0, 2).map(tag => (
            <span key={tag} style={styles.cardTag}>{tag}</span>
          ))}
        </div>
      )}

      {/* Subtask Progress */}
      {totalSubtasks > 0 && (
        <div style={styles.subtaskProgress}>
          <div style={styles.subtaskProgressBar}>
            <div style={{
              ...styles.subtaskProgressFill,
              width: `${subtaskPercentage}%`,
            }} />
          </div>
          <span style={styles.subtaskText}>
            {completedSubtasks}/{totalSubtasks}
          </span>
        </div>
      )}

      {/* Card Footer */}
      <div style={styles.cardFooter}>
        <div style={styles.cardFooterLeft}>
          {deadline && (
            <span style={{ ...styles.deadlineText, color: deadline.color }}>
              <FaCalendarAlt size={10} style={{ marginRight: '4px' }} /> {deadline.text}
            </span>
          )}
        </div>
        <div style={styles.cardFooterRight}>
          {task.estimatedDuration && (
            <span style={styles.durationText}>
              <FaClock size={10} style={{ marginRight: '4px' }} /> {formatTaskDuration(task.estimatedDuration)}
            </span>
          )}
          <span style={{
            ...styles.categoryBadge,
            fontSize: '10px',
          }}>
            <FaTag size={8} style={{ marginRight: '3px' }} />
            {task.category}
          </span>
        </div>
      </div>

      {/* Drag Handle Hint */}
      <div style={styles.dragHint}><FaGripVertical /></div>
    </div>
  );
};

export default KanbanPage;