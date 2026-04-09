import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';
import { formatTaskDuration } from '../../utils/formatTaskDuration';
import { FaRobot, FaCalendarAlt, FaClock, FaArrowRight, FaCheck, FaFlag, FaRegLightbulb, FaClipboardList, FaTrash } from 'react-icons/fa';
import { tasksAPI } from '../../services/api';

const AIRecommends = ({ tasks, onTaskClick, onToggleTask, onTaskDeleted, onTaskUpdated }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

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

    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 7) return `in ${diff} days`;
    return date.toLocaleDateString();
  };

  const handleCheckboxClick = (e, task) => {
    e.stopPropagation();
    if (onToggleTask) {
      onToggleTask(task);
    }
  };

  const handleDeleteTask = async (e, taskId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await tasksAPI.deleteTask(taskId, token);
      if (onTaskDeleted) onTaskDeleted(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getUrgencyScore = (deadline) => {
    if (!deadline) return 5;

    const now = new Date();
    const due = new Date(deadline);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 50;
    if (diffDays === 0) return 40;
    if (diffDays <= 2) return 30;
    if (diffDays <= 7) return 18;
    if (diffDays <= 14) return 10;
    return 3;
  };

  const getPriorityScore = (priority) => {
    switch (priority) {
      case 'urgent': return 40;
      case 'high': return 28;
      case 'medium': return 16;
      case 'low': return 8;
      default: return 10;
    }
  };

  const recommendationTasks = (tasks || [])
    .filter((task) => task.status !== 'done')
    .map((task) => {
      const aiBoost = Number(task.aiPriorityScore) || 0;
      const score = getPriorityScore(task.priority) + getUrgencyScore(task.deadline) + aiBoost;
      return { ...task, _recommendationScore: score };
    })
    .sort((a, b) => b._recommendationScore - a._recommendationScore)
    .slice(0, 3);

  const styles = {
    container: {
          backgroundColor: theme.bgCard,
      borderRadius: borderRadius.lg,
          padding: '24px',
          boxShadow: theme.shadows.sm,
          border: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
    },
    titleContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    iconWrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      borderRadius: '6px',
      backgroundColor: theme.bgElevated,
      color: theme.accent,
      border: `1px solid ${theme.border}`,
      fontSize: '14px',
    },
    title: {
      fontSize: '22px',
      fontWeight: '600',
      fontFamily: '"Fraunces", serif',
      color: theme.textPrimary,
      margin: 0,
    },
    viewAllButton: {
      background: theme.bgRaised,
      border: `1px solid ${theme.borderMedium || theme.border}`,
      color: theme.textSecondary,
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      padding: '8px 14px',
      borderRadius: '8px',
      boxShadow: 'none',
      display: 'flex',
      alignItems: 'center',
      transition: 'all 150ms ease',
    },
    subtitle: {
        fontSize: '13px',
      color: theme.textSecondary,
        marginBottom: '20px',
      marginLeft: '52px', // Align with title text
    },
    tasksList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    taskCard: {
      backgroundColor: theme.bgCard,
      borderRadius: borderRadius.lg,
      padding: '20px',
      boxShadow: theme.shadows.sm,
      cursor: 'pointer',
      transition: 'all 180ms ease',
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    taskHeader: {
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start',
    },
    checkboxWrapper: {
      width: '24px',
      height: '24px',
        borderRadius: '6px',
        backgroundColor: theme.bgRaised,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      marginTop: '2px', // Align with title
        border: `1.5px solid ${theme.borderStrong || theme.border}`,
        transition: 'all 180ms ease',
    },
    checkboxChecked: {
      backgroundColor: theme.sage,
      borderColor: theme.sage,
      color: '#fff',
    },
    // Custom Checkbox Styles are injected via style tag below
    taskInfo: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    taskTitle: {
        fontSize: '15px',
        fontWeight: '500',
      color: theme.textPrimary,
      margin: 0,
    },
    taskDescription: {
      fontSize: '13px',
      color: theme.textSecondary,
      margin: 0,
      lineHeight: '1.6',
    },
    badges: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      marginBottom: '16px',
      marginLeft: '40px', // Indent to align with text
    },
    badge: {
        fontSize: '10px',
        fontWeight: '600',
        padding: '2px 6px',
      borderRadius: '6px',
        backgroundColor: theme.bgRaised,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
    },
    badgeSecondary: {
      fontSize: '10px',
      fontWeight: '600',
      padding: '2px 6px',
      borderRadius: '6px',
      backgroundColor: theme.bgRaised,
      color: theme.textSecondary,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    projectBadge: {
      fontSize: '10px',
      fontWeight: '600',
        padding: '2px 6px',
      borderRadius: '6px',
        backgroundColor: theme.accentDim || `${theme.accent}15`,
        color: theme.accent,
        border: `1px solid ${theme.borderMedium || theme.border}`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    },
    contextRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    },
    taskMeta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
        fontSize: '12px',
      color: theme.textMuted,
      marginLeft: '40px',
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontWeight: '500',
    },
    taskActions: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      marginLeft: '40px',
      marginTop: '12px',
      borderTop: `1px solid ${theme.border}30`,
      paddingTop: '12px',
      position: 'relative',
    },
    statusButton: {
      backgroundColor: theme.bgRaised,
      color: theme.textPrimary,
      border: 'none',
      borderRadius: '8px',
      padding: '8px 14px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
        boxShadow: theme.shadows.sm,
        transition: 'all 180ms ease',
      minWidth: '110px',
    },
    statusButtonActive: {
      backgroundColor: theme.success,
      color: '#fff',
        boxShadow: theme.shadows.sm,
    },
    deleteButton: {
      backgroundColor: theme.bgRaised,
      color: theme.error,
      border: `1px solid ${theme.borderMedium || theme.border}`,
      borderRadius: '8px',
      padding: '6px 14px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      boxShadow: theme.shadows.sm,
      transition: 'all 180ms ease',
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: '8px',
        backgroundColor: theme.bgCard,
        borderRadius: '8px',
        boxShadow: theme.shadows.md,
      zIndex: 1000,
      minWidth: '160px',
      overflow: 'hidden',
        border: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    menuItem: {
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      color: theme.textPrimary,
      transition: 'all 120ms ease',
      borderBottom: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    menuItemHover: {
      backgroundColor: theme.primary + '10',
      color: theme.primary,
      paddingLeft: '20px',
    },
    menuItemDanger: {
      color: theme.error,
    },
    aiInsight: {
      marginLeft: '38px',
      backgroundColor: theme.bgRaised,
      boxShadow: 'none',
      borderRadius: '8px',
      padding: '12px 16px',
      display: 'flex',
      gap: '10px',
      alignItems: 'start',
      border: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    aiInsightText: {
      fontSize: '12px',
      color: theme.textSecondary,
      lineHeight: '1.5',
      fontWeight: '400',
      fontStyle: 'italic',
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: theme.bgCard,
      borderRadius: borderRadius.lg,
      boxShadow: 'none',
      border: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    emptyText: {
      fontSize: '15px',
      color: theme.textSecondary,
      margin: 0,
    },
  };

  return (
    <div style={styles.container}>
      <style>{`
        .task-card:hover {
          transform: translateY(-1px);
          box-shadow: ${theme.shadows.md} !important;
          border-color: ${theme.borderMedium || theme.border} !important;
        }
        .custom-checkbox {
          width: 24px;
          height: 24px;
          background-color: ${theme.bgRaised};
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: none;
          transition: all 180ms ease;
          border: 1.5px solid ${theme.borderStrong || theme.border};
        }
        .custom-checkbox:hover {
          border-color: ${theme.accent};
        }
        .custom-checkbox.checked {
          background-color: ${theme.sage};
          border-color: ${theme.sage};
        }
        .custom-checkbox.checkmark {
          font-size: 12px;
          color: #fff;
          opacity: 0;
          transform: scale(0.5);
          transition: all 0.18s ease;
        }
        .custom-checkbox.checked.checkmark {
          opacity: 1;
          transform: scale(1);
        }
      `}</style>

      <div style={styles.header}>
        <div style={styles.titleContainer}>
          <span style={styles.iconWrapper}><FaRobot /></span>
          <h2 style={styles.title}>AI Recommends</h2>
        </div>
        <button style={styles.viewAllButton} onClick={() => navigate('/tasks')}>
          View All <FaArrowRight style={{ marginLeft: '4px', fontSize: '10px' }} />
        </button>
      </div>

      <p style={styles.subtitle}>
        Smart task suggestions based on your patterns and priorities
      </p>

      <div style={styles.tasksList}>
        {recommendationTasks.length > 0 ? (
          recommendationTasks.map((task) => (
            <div
              key={task._id}
              style={styles.taskCard}
              onClick={() => onTaskClick && onTaskClick(task)}
              className="task-card"
            >
              <div style={styles.taskHeader}>
                {/* Custom Animated Checkbox */}
                <div
                  style={{
                    ...styles.checkboxWrapper,
                    ...(task.status === 'done' ? styles.checkboxChecked : {})
                  }}
                  onClick={(e) => handleCheckboxClick(e, task)}
                >
                  {task.status === 'done' && <FaCheck style={{ fontSize: '12px', color: theme.success }} />}
                </div>

                <div style={styles.taskInfo}>
                  <h3 style={styles.taskTitle}>{task.title}</h3>
                  <div style={styles.contextRow}>
                    <span style={{
                      ...styles.badge,
                      color: getPriorityColor(task.priority),
                      backgroundColor: `${getPriorityColor(task.priority)}15`,
                      border: `1px solid ${getPriorityColor(task.priority)}30`
                    }}>
                      <FaFlag style={{ fontSize: '10px' }} />
                      {task.priority.toUpperCase()}
                    </span>
                    <span style={styles.badgeSecondary}>{task.category}</span>
                    {task.projectId && (
                      <span style={styles.projectBadge}>
                        <FaClipboardList style={{ fontSize: '10px' }} /> {task.projectId.title}
                      </span>
                    )}
                    {task.aiPriorityScore && (
                      <span style={{
                        ...styles.badge,
                        color: theme.accent,
                        backgroundColor: theme.accentDim || `${theme.accent}15`,
                        border: `1px solid ${theme.borderMedium || theme.border}`
                      }}>
                        <FaRobot style={{ fontSize: '10px' }} /> AI {task.aiPriorityScore}%
                      </span>
                    )}
                  </div>
                  <p style={styles.taskDescription}>{task.description}</p>
                </div>
              </div>



              <div style={styles.taskMeta}>
                {task.deadline && (
                  <span style={styles.metaItem}>
                    <FaCalendarAlt /> {formatDeadline(task.deadline)}
                  </span>
                )}
                {task.estimatedDuration && (
                  <span style={styles.metaItem}>
                    <FaClock /> {formatTaskDuration(task.estimatedDuration)}
                  </span>
                )}
                {task.subtasks && task.subtasks.length > 0 && (
                  <span style={styles.metaItem}>
                    <FaCheck /> {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                  </span>
                )}
              </div>

              {task.aiInsight && (
                <div style={styles.aiInsight}>
                  <FaRegLightbulb style={{ fontSize: '14px', color: theme.accent }} />
                  <span style={styles.aiInsightText}>{task.aiInsight}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={styles.emptyState}>
            <FaRobot style={{ fontSize: '42px', marginBottom: '16px', color: theme.accent }} />
            <p style={styles.emptyText}>
              No tasks yet. Create your first task to get AI recommendations!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommends;