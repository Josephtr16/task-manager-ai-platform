// src/components/Dashboard/AIRecommends.js
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';
import { FaRobot, FaCalendarAlt, FaClock, FaCommentAlt, FaArrowRight, FaCheck, FaFlag, FaRegLightbulb } from 'react-icons/fa';

const AIRecommends = ({ tasks, onTaskClick }) => {
  const { theme } = useTheme();

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
    // This would typically toggle the task status locally or trigger an API call via a prop
    // Since we are inside a dashboard view, maybe just visually toggle or trigger onTaskClick with a 'toggle' action
    // For now, we'll just let the parent handle the click if passed, but the requirement is visual
  };

  const styles = {
    container: {
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.lg,
      padding: '28px',
      boxShadow: theme.shadows.neumorphic, // Neomorphic Container
      border: `1px solid transparent`,
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
      width: '40px',
      height: '40px',
      borderRadius: '12px',
      backgroundColor: theme.bgMain,
      color: theme.aiPurple,
      boxShadow: theme.shadows.neumorphic,
      fontSize: '20px',
    },
    title: {
      fontSize: '22px',
      fontWeight: '700',
      color: theme.textPrimary,
      margin: 0,
      textShadow: theme.type === 'dark' ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none',
    },
    viewAllButton: {
      background: theme.bgMain,
      border: 'none',
      color: theme.primary,
      fontSize: '12px',
      fontWeight: '700',
      cursor: 'pointer',
      padding: '8px 16px',
      borderRadius: '8px',
      boxShadow: theme.shadows.neumorphic, // Neomorphic button
      display: 'flex',
      alignItems: 'center',
      transition: 'all 0.2s',
    },
    subtitle: {
      fontSize: '15px',
      color: theme.textSecondary,
      marginBottom: '24px',
      marginLeft: '52px', // Align with title text
    },
    tasksList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    taskCard: {
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.lg,
      padding: '20px',
      boxShadow: theme.shadows.neumorphic, // Neomorphic card
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: `1px solid transparent`,
      position: 'relative',
      overflow: 'hidden',
    },
    taskHeader: {
      display: 'flex',
      gap: '16px',
      marginBottom: '16px',
      alignItems: 'flex-start',
    },
    checkboxWrapper: {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphic,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      marginTop: '2px', // Align with title
      border: `2px solid transparent`,
      transition: 'all 0.2s ease',
    },
    checkboxChecked: {
      boxShadow: theme.shadows.neumorphicInset,
      color: theme.success,
    },
    // Custom Checkbox Styles are injected via style tag below
    taskInfo: {
      flex: 1,
    },
    taskTitle: {
      fontSize: '17px',
      fontWeight: '700',
      color: theme.textPrimary,
      margin: '0 0 6px 0',
    },
    taskDescription: {
      fontSize: '14px',
      color: theme.textSecondary,
      margin: 0,
      lineHeight: '1.5',
    },
    badges: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      marginBottom: '16px',
      marginLeft: '40px', // Indent to align with text
    },
    badge: {
      fontSize: '11px',
      fontWeight: '600',
      padding: '6px 12px',
      borderRadius: '6px',
      backgroundColor: theme.bgMain,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    badgeSecondary: {
      fontSize: '11px',
      fontWeight: '600',
      padding: '6px 12px',
      borderRadius: '6px',
      backgroundColor: theme.bgMain,
      color: theme.textSecondary,
      boxShadow: theme.shadows.neumorphicInset,
    },
    taskMeta: {
      display: 'flex',
      gap: '20px',
      fontSize: '13px',
      color: theme.textMuted,
      marginBottom: '12px',
      flexWrap: 'wrap',
      marginLeft: '40px',
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontWeight: '500',
    },
    aiInsight: {
      marginLeft: '38px',
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphicInset, // Inset for insight box
      borderRadius: '12px',
      padding: '12px 16px',
      display: 'flex',
      gap: '10px',
      marginTop: '12px',
      alignItems: 'start',
    },
    aiInsightText: {
      fontSize: '13px',
      color: theme.aiPurple,
      lineHeight: '1.5',
      fontWeight: '500',
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.lg,
      boxShadow: theme.shadows.neumorphicInset,
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
          transform: translateY(-4px);
          box-shadow: ${theme.shadows.neumorphicHover} !important;
        }
        .custom-checkbox {
          width: 24px;
          height: 24px;
          background-color: ${theme.bgMain};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: ${theme.shadows.neumorphic};
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 2px solid transparent;
        }
        .custom-checkbox:hover {
          box-shadow: ${theme.shadows.neumorphicInset};
          color: ${theme.success};
        }
        .custom-checkbox.checked {
          background-color: ${theme.bgMain};
          box-shadow: ${theme.shadows.neumorphicInset};
          border-color: ${theme.success};
        }
        .custom-checkbox.checkmark {
          font-size: 12px;
          color: ${theme.success};
          opacity: 0;
          transform: scale(0.5);
          transition: all 0.2s ease;
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
        <button style={styles.viewAllButton}>
          View All <FaArrowRight style={{ marginLeft: '4px', fontSize: '10px' }} />
        </button>
      </div>

      <p style={styles.subtitle}>
        Smart task suggestions based on your patterns and priorities
      </p>

      <div style={styles.tasksList}>
        {tasks && tasks.length > 0 ? (
          tasks.slice(0, 3).map((task) => (
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
                  <p style={styles.taskDescription}>{task.description}</p>
                </div>
              </div>

              <div style={styles.badges}>
                <span style={{
                  ...styles.badge,
                  color: getPriorityColor(task.priority),
                  boxShadow: theme.shadows.neumorphicInset, // Inset badges
                  border: `1px solid ${getPriorityColor(task.priority)}10`
                }}>
                  <FaFlag style={{ fontSize: '10px' }} />
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
                <span style={styles.badgeSecondary}>{task.category}</span>
                {task.aiPriorityScore && (
                  <span style={{
                    ...styles.badge,
                    color: theme.aiPurple,
                    boxShadow: theme.shadows.neumorphicInset,
                    border: `1px solid ${theme.aiPurple}10`
                  }}>
                    <FaRobot style={{ fontSize: '10px' }} /> AI {task.aiPriorityScore}%
                  </span>
                )}
              </div>

              <div style={styles.taskMeta}>
                {task.deadline && (
                  <span style={styles.metaItem}>
                    <FaCalendarAlt /> {formatDeadline(task.deadline)}
                  </span>
                )}
                {task.estimatedDuration && (
                  <span style={styles.metaItem}>
                    <FaClock /> {task.estimatedDuration}m
                  </span>
                )}
                {task.subtasks && task.subtasks.length > 0 && (
                  <span style={styles.metaItem}>
                    <FaCommentAlt /> {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                  </span>
                )}
              </div>

              {task.aiInsight && (
                <div style={styles.aiInsight}>
                  <FaRegLightbulb style={{ fontSize: '16px', color: theme.aiPurple }} />
                  <span style={styles.aiInsightText}>{task.aiInsight}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={styles.emptyState}>
            <FaRobot style={{ fontSize: '48px', marginBottom: '16px', color: theme.aiPurple }} />
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