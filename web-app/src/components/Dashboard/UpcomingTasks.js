// src/components/Dashboard/UpcomingTasks.js
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';
import { FaClock, FaCalendarAlt, FaCheckCircle, FaAngleRight, FaClipboardList } from 'react-icons/fa';

const UpcomingTasks = ({ tasks, onTaskClick }) => {
  const { theme } = useTheme();

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      alignItems: 'center',
      gap: '12px',
      marginBottom: '20px',
    },
    iconWrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      borderRadius: '6px',
      backgroundColor: theme.bgElevated,
      color: theme.primary,
      border: `1px solid ${theme.border}`,
      fontSize: '13px',
    },
    title: {
      fontSize: '22px',
      fontWeight: '600',
      color: theme.textPrimary,
      margin: 0,
      flex: 1,
      fontFamily: '"Fraunces", serif',
    },
    count: {
      backgroundColor: theme.bgElevated,
      boxShadow: 'none',
      color: theme.primary,
      fontSize: '10px',
      fontWeight: '600',
      padding: '0',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Geist Mono", monospace',
    },
    list: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '14px 16px',
      backgroundColor: theme.bgCard,
      borderRadius: borderRadius.lg,
      cursor: 'pointer',
      transition: 'all 150ms ease',
      boxShadow: 'none',
      borderBottom: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    itemContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      flex: 1,
      minWidth: 0,
    },
    itemTitle: {
      fontSize: '13px',
      fontWeight: '500',
      color: theme.textPrimary,
      margin: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    itemMeta: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
    },
    itemDate: {
      fontSize: '11px',
      color: theme.textSecondary,
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      fontFamily: '"Geist Mono", monospace',
    },
    subtaskCount: {
      fontSize: '11px',
      color: theme.textMuted,
      display: 'flex',
      alignItems: 'center',
      fontFamily: '"Geist Mono", monospace',
    },
    badges: {
      display: 'flex',
      gap: '8px',
    },
    priorityBadge: {
      fontSize: '10px',
      fontWeight: '600',
      padding: '2px 6px',
      borderRadius: '6px',
      textTransform: 'uppercase',
      display: 'inline-flex',
      alignItems: 'center',
      letterSpacing: '0.06em',
    },
    categoryBadge: {
      fontSize: '10px',
      fontWeight: '600',
      padding: '2px 6px',
      borderRadius: '4px',
      backgroundColor: theme.bgElevated,
      color: theme.textMuted,
      border: `1px solid ${theme.border}50`,
      display: 'inline-flex',
      alignItems: 'center',
    },
    projectBadge: {
      fontSize: '10px',
      fontWeight: '600',
      padding: '2px 6px',
      borderRadius: '4px',
      backgroundColor: theme.primary + '15',
      color: theme.primary,
      border: `1px solid ${theme.primary}30`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      alignSelf: 'flex-start',
    },
    badgesRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
    },
    arrow: {
      fontSize: '14px',
      color: theme.textMuted,
      flexShrink: 0,
      display: 'flex',
    },
    empty: {
      fontSize: '14px',
      color: theme.textMuted,
      textAlign: 'center',
      padding: '24px 0',
      margin: 0,
      backgroundColor: theme.bgElevated,
      borderRadius: borderRadius.lg,
      boxShadow: 'none',
    },
  };

  return (
    <div style={styles.container}>
      <style>{`
        .upcoming-item:hover {
          transform: translateX(2px);
          background-color: ${theme.bgRaised} !important;
          border-color: ${theme.borderMedium || theme.border} !important;
        }
      `}</style>
      <div style={styles.header}>
        <span style={styles.iconWrapper}><FaClock /></span>
        <h3 style={styles.title}>Upcoming</h3>
        <span style={styles.count}>{tasks?.length || 0}</span>
      </div>

      <div style={styles.list}>
        {tasks && tasks.length > 0 ? (
          tasks.map(task => (
            <div
              key={task._id}
              style={styles.item}
              onClick={() => onTaskClick && onTaskClick(task)}
              className="upcoming-item"
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getPriorityColor(task.priority), flexShrink: 0 }} />
              <div style={styles.itemContent}>
                <h4 style={{ ...styles.itemTitle, margin: 0 }}>{task.title}</h4>
                
                <div style={styles.badgesRow}>
                  <span style={{
                    ...styles.priorityBadge,
                    color: getPriorityColor(task.priority),
                    backgroundColor: `${getPriorityColor(task.priority)}12`,
                    border: `1px solid ${getPriorityColor(task.priority)}22`,
                  }}>
                    {task.priority.toUpperCase()}
                  </span>
                  <span style={styles.categoryBadge}>
                    {task.category}
                  </span>
                </div>

                {task.projectId && (
                  <div style={styles.projectBadge}>
                    <FaClipboardList style={{ fontSize: '10px' }} /> {task.projectId.title}
                  </div>
                )}

                <div style={styles.itemMeta}>
                  <span style={styles.itemDate}>
                    <FaCalendarAlt style={{ marginRight: '6px' }} /> {formatDate(task.deadline)}
                  </span>
                  {task.subtasks && task.subtasks.length > 0 && (
                    <span style={styles.subtaskCount}>
                      <FaCheckCircle style={{ marginRight: '6px' }} /> {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                    </span>
                  )}
                </div>
              </div>

              <span style={styles.arrow}><FaAngleRight /></span>
            </div>
          ))
        ) : (
          <div style={styles.empty}>
            <p>No upcoming tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingTasks;