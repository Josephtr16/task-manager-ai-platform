// src/pages/KanbanPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { tasksAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { borderRadius } from '../theme';
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

  const COLUMNS = [
    { id: 'todo', title: 'To Do', icon: <FaClipboardList />, color: theme.textMuted },
    { id: 'in-progress', title: 'In Progress', icon: <FaBolt />, color: theme.info || '#3b82f6' },
    { id: 'review', title: 'Review', icon: <FaEye />, color: theme.warning || '#f59e0b' },
    { id: 'done', title: 'Done', icon: <FaCheckCircle />, color: theme.success },
  ];

  useEffect(() => {
    loadTasks();
  }, []);

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

  const getTasksByStatus = (status) =>
    tasks.filter(task => task.status === status);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return theme.urgent;
      case 'high': return theme.high;
      case 'medium': return theme.medium;
      case 'low': return theme.low;
      default: return theme.medium;
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return null;
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
      color: '#fff',
      border: 'none',
      borderRadius: borderRadius.lg,
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: theme.shadows.neumorphic,
      display: 'flex',
      alignItems: 'center',
      transition: 'transform 0.2s',
    },
    board: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '24px',
      alignItems: 'start',
    },
    column: {
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.lg,
      padding: '20px',
      boxShadow: theme.shadows.neumorphic,
      minHeight: '500px',
      transition: 'all 0.2s',
    },
    columnDragOver: {
      border: `2px solid ${theme.primary}`,
      boxShadow: theme.shadows.neumorphicInset,
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
      borderRadius: '12px',
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphicInset,
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
      border: `2px dashed ${theme.border}`,
      borderRadius: borderRadius.md,
      transition: 'all 0.2s',
    },
    emptyColumnDragOver: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + '10',
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
      border: `2px dashed ${theme.primary}`,
      borderRadius: borderRadius.md,
      color: theme.primary,
      fontSize: '14px',
      fontWeight: '500',
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
    // Card Styles
    card: {
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.md,
      padding: '16px',
      cursor: 'grab',
      transition: 'all 0.2s',
      boxShadow: theme.shadows.card,
      position: 'relative',
    },
    cardHeader: {
      display: 'flex',
      gap: '8px',
      alignItems: 'flex-start',
      marginBottom: '8px',
    },
    cardTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: theme.textPrimary,
      margin: 0,
      lineHeight: '1.4',
    },
    cardDescription: {
      fontSize: '12px',
      color: theme.textSecondary,
      margin: '0 0 8px 0',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
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
      backgroundColor: theme.bgMain,
      border: `1px solid ${theme.border}`,
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
      backgroundColor: theme.bgMain,
      borderRadius: '3px',
      overflow: 'hidden',
      boxShadow: theme.shadows.neumorphicInset,
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
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphicInset,
      color: theme.textSecondary,
      display: 'flex',
      alignItems: 'center',
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
      <Layout>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <p>Loading Kanban board...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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
            transform: scale(1.1) rotate(90deg);
            box-shadow: 0 0 20px ${theme.primary}80 !important;
          }
          
          .kanban-card:hover {
            transform: translateY(-2px);
            box-shadow: ${theme.shadows.neumorphic} !important;
          }
        `}</style>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Kanban Board</h1>
            <p style={styles.subtitle}>
              {tasks.length} total tasks · Drag and drop to update status
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
    </Layout>
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
  const deadline = formatDeadline(task.deadline);
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

        <p style={styles.cardTitle}>{task.title}</p>
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
              <FaClock size={10} style={{ marginRight: '4px' }} /> {task.estimatedDuration}m
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