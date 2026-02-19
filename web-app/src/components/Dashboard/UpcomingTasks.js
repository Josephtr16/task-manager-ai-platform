// src/components/Dashboard/UpcomingTasks.js
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';
import { FaClock, FaCalendarAlt, FaCheckCircle, FaAngleRight } from 'react-icons/fa';

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
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.lg,
      padding: '24px',
      boxShadow: theme.shadows.neumorphic,
      border: `1px solid transparent`,
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
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      backgroundColor: theme.bgMain,
      color: theme.primary,
      boxShadow: theme.shadows.neumorphic,
      fontSize: '16px',
    },
    title: {
      fontSize: '20px',
      fontWeight: '700',
      color: theme.textPrimary,
      margin: 0,
      flex: 1,
      textShadow: theme.type === 'dark' ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none',
    },
    count: {
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphicInset,
      color: theme.primary,
      fontSize: '13px',
      fontWeight: '700',
      padding: '4px 10px',
      borderRadius: '12px',
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
      padding: '16px',
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.lg,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: theme.shadows.neumorphic, // Neomorphic items
      border: `1px solid transparent`,
    },
    itemContent: {
      flex: 1,
      overflow: 'hidden',
    },
    itemTitle: {
      fontSize: '15px',
      fontWeight: '600',
      color: theme.textPrimary,
      margin: '0 0 6px 0',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    itemMeta: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      marginBottom: '8px',
    },
    itemDate: {
      fontSize: '12px',
      color: theme.textSecondary,
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
    },
    subtaskCount: {
      fontSize: '12px',
      color: theme.textMuted,
      display: 'flex',
      alignItems: 'center',
    },
    badges: {
      display: 'flex',
      gap: '8px',
    },
    priorityBadge: {
      fontSize: '11px',
      fontWeight: '600',
      padding: '2px 8px',
      borderRadius: '6px',
      backgroundColor: theme.bgMain,
      textTransform: 'capitalize',
    },
    categoryBadge: {
      fontSize: '11px',
      fontWeight: '600',
      padding: '2px 8px',
      borderRadius: '6px',
      backgroundColor: theme.bgMain,
      color: theme.textMuted,
      boxShadow: theme.shadows.neumorphicInset, // Inset badge
    },
    arrow: {
      fontSize: '16px',
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
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.lg,
      boxShadow: theme.shadows.neumorphicInset,
    },
  };

  return (
    <div style={styles.container}>
      <style>{`
        .upcoming-item:hover {
          transform: translateX(4px);
          box-shadow: ${theme.shadows.neumorphicHover} !important;
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
              <div style={styles.itemContent}>
                <h4 style={styles.itemTitle}>{task.title}</h4>
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
                <div style={styles.badges}>
                  <span style={{
                    ...styles.priorityBadge,
                    color: getPriorityColor(task.priority),
                    boxShadow: theme.shadows.neumorphicInset, // Inset badge
                    border: `1px solid ${getPriorityColor(task.priority)}10`,
                  }}>
                    {task.priority}
                  </span>
                  <span style={styles.categoryBadge}>
                    {task.category}
                  </span>
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