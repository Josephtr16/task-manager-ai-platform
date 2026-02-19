// src/pages/CalendarPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { tasksAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { borderRadius } from '../theme';
import CreateTaskModal from '../components/Tasks/CreateTaskModal';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaPlus, FaClock, FaCheckCircle } from 'react-icons/fa';

const CalendarPage = () => {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' or 'week'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

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

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowCreateModal(true);
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

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // ==================== MONTH VIEW ====================
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        currentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        currentMonth: true,
      });
    }

    // Next month days to fill grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        currentMonth: false,
      });
    }

    return days;
  };

  // ==================== WEEK VIEW ====================
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = currentDate.getDay();
    startOfWeek.setDate(currentDate.getDate() - day);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekRange = () => {
    const days = getWeekDays();
    const start = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
      flexWrap: 'wrap',
      gap: '16px',
    },
    title: {
      fontSize: '32px',
      fontWeight: '800',
      color: theme.textPrimary,
      margin: '0 0 4px 0',
      textShadow: theme.type === 'dark' ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none',
      display: 'flex',
      alignItems: 'center',
    },
    subtitle: {
      fontSize: '14px',
      color: theme.textSecondary,
      margin: 0,
    },
    headerRight: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    viewToggle: {
      display: 'flex',
      backgroundColor: theme.bgMain,
      borderRadius: '12px',
      padding: '6px',
      boxShadow: theme.shadows.neumorphicInset, // Inset toggle container
    },
    toggleButton: {
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: '500',
      color: theme.textSecondary,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    toggleButtonActive: {
      backgroundColor: theme.bgMain,
      color: theme.primary,
      boxShadow: theme.shadows.neumorphic, // Pop out active toggle
      fontWeight: '700',
    },
    navigation: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
    },
    navButton: {
      backgroundColor: theme.bgMain,
      border: 'none',
      borderRadius: '50%',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.textPrimary,
      cursor: 'pointer',
      boxShadow: theme.shadows.neumorphic, // Round neomorphic buttons
    },
    todayButton: {
      backgroundColor: theme.bgMain,
      border: 'none',
      borderRadius: borderRadius.md,
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: '600',
      color: theme.textPrimary,
      cursor: 'pointer',
      boxShadow: theme.shadows.neumorphic,
    },
    createButton: {
      backgroundColor: theme.primary,
      color: '#fff',
      border: 'none',
      borderRadius: borderRadius.lg,
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      boxShadow: theme.shadows.neumorphic,
    },
    calendarContainer: {
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.lg,
      boxShadow: theme.shadows.neumorphic, // Neomorphic container
      overflow: 'hidden',
      marginBottom: '24px',
      padding: '8px', // Visual padding
    },
    dayNamesRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      marginBottom: '8px',
    },
    dayName: {
      padding: '12px',
      textAlign: 'center',
      fontSize: '13px',
      fontWeight: '700',
      color: theme.textSecondary,
      textTransform: 'uppercase',
    },
    monthGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '4px', // Gap for neomorphic feel
    },
    monthDay: {
      minHeight: '120px',
      padding: '8px',
      borderRadius: '12px',
      backgroundColor: theme.bgMain,
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative',
      border: `1px solid transparent`,
    },
    monthDayOtherMonth: {
      opacity: 0.4,
    },
    monthDayToday: {
      boxShadow: theme.shadows.neumorphicInset, // Inset for today
      border: `1px solid ${theme.primary}20`,
    },
    dayNumber: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      fontSize: '14px',
      fontWeight: '600',
      color: theme.textPrimary,
      borderRadius: '50%',
      marginBottom: '4px',
    },
    dayNumberToday: {
      backgroundColor: theme.primary,
      color: '#fff',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    },
    dayTasks: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    taskPill: {
      borderRadius: '6px',
      padding: '4px 6px',
      cursor: 'pointer',
      transition: 'transform 0.1s',
    },
    taskPillText: {
      fontSize: '11px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: 'block',
    },
    moreTasksText: {
      fontSize: '11px',
      color: theme.textMuted,
      paddingLeft: '6px',
    },
    addTaskHint: {
      fontSize: '11px',
      color: theme.textMuted,
      opacity: 0,
      position: 'absolute',
      bottom: '4px',
      right: '8px',
      transition: 'opacity 0.2s',
    },
    weekGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '4px',
      minHeight: '500px',
    },
    weekDay: {
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      cursor: 'pointer',
      backgroundColor: theme.bgMain,
    },
    weekDayToday: {
      boxShadow: theme.shadows.neumorphicInset,
    },
    weekDayHeader: {
      padding: '12px 8px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
    },
    weekDayName: {
      fontSize: '12px',
      fontWeight: '600',
      color: theme.textSecondary,
      textTransform: 'uppercase',
    },
    weekDayNumber: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      fontSize: '18px',
      fontWeight: '600',
      color: theme.textPrimary,
      borderRadius: '50%',
    },
    weekDayNumberToday: {
      backgroundColor: theme.primary,
      color: '#fff',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    },
    weekDayTasks: {
      flex: 1,
      padding: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    weekTaskCard: {
      borderRadius: '8px',
      padding: '10px',
      cursor: 'pointer',
      boxShadow: theme.shadows.card, // Pop out tasks in week view
      backgroundColor: theme.bgMain,
    },
    weekTaskTitle: {
      fontSize: '12px',
      fontWeight: '600',
      margin: '0 0 4px 0',
    },
    weekTaskDuration: {
      fontSize: '11px',
      color: theme.textMuted,
      margin: 0,
      display: 'flex',
      alignItems: 'center',
    },
    weekTaskSubtasks: {
      fontSize: '11px',
      color: theme.textMuted,
      margin: 0,
      display: 'flex',
      alignItems: 'center',
    },
    weekDayEmpty: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.5,
    },
    weekDayEmptyText: {
      fontSize: '12px',
      color: theme.textMuted,
      margin: 0,
    },
    weekAddButton: {
      backgroundColor: 'transparent',
      border: `1px dashed ${theme.border}`,
      borderRadius: '6px',
      padding: '6px',
      fontSize: '11px',
      color: theme.textMuted,
      cursor: 'pointer',
      width: '100%',
      marginTop: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    legend: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap',
    },
    legendTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: theme.textSecondary,
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    legendDot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      boxShadow: '0 0 4px currentColor',
    },
    legendLabel: {
      fontSize: '13px',
      color: theme.textSecondary,
    },
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <p>Loading calendar...</p>
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
           .calendar-day:hover {
             background-color: ${theme.bgElevated} !important;
             box-shadow: ${theme.shadows.neumorphic} !important;
             z-index: 5;
           }
           .calendar-day:hover .add-task-hint {
             opacity: 1 !important;
           }
        `}</style>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              <FaCalendarAlt style={{ marginRight: '12px', fontSize: '28px' }} />
              Calendar
            </h1>
            <p style={styles.subtitle}>
              {view === 'month' ? monthName : weekRange()}
            </p>
          </div>

          <div style={styles.headerRight}>
            {/* View Toggle */}
            <div style={styles.viewToggle}>
              <button
                style={{
                  ...styles.toggleButton,
                  ...(view === 'month' && styles.toggleButtonActive),
                }}
                onClick={() => setView('month')}
              >
                Month
              </button>
              <button
                style={{
                  ...styles.toggleButton,
                  ...(view === 'week' && styles.toggleButtonActive),
                }}
                onClick={() => setView('week')}
              >
                Week
              </button>
            </div>

            {/* Navigation */}
            <div style={styles.navigation}>
              <button style={styles.navButton} onClick={navigatePrev}><FaChevronLeft /></button>
              <button
                style={styles.todayButton}
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </button>
              <button style={styles.navButton} onClick={navigateNext}><FaChevronRight /></button>
            </div>

            {/* Create Task */}
            <button
              style={styles.createButton}
              onClick={() => setShowCreateModal(true)}
            >
              <FaPlus style={{ marginRight: '8px' }} /> New Task
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div style={styles.calendarContainer}>
          {/* Day Names Header */}
          <div style={styles.dayNamesRow}>
            {DAY_NAMES.map(day => (
              <div key={day} style={styles.dayName}>{day}</div>
            ))}
          </div>

          {/* Month View */}
          {view === 'month' && (
            <div style={styles.monthGrid}>
              {getMonthDays().map(({ date, currentMonth }, index) => {
                const dayTasks = getTasksForDate(date);
                const isCurrentDay = isToday(date);

                return (
                  <div
                    key={index}
                    style={{
                      ...styles.monthDay,
                      ...(!currentMonth && styles.monthDayOtherMonth),
                      ...(isCurrentDay && styles.monthDayToday),
                    }}
                    onClick={() => handleDateClick(date)}
                    className="calendar-day"
                  >
                    <span style={{
                      ...styles.dayNumber,
                      ...(isCurrentDay && styles.dayNumberToday),
                    }}>
                      {date.getDate()}
                    </span>

                    {/* Tasks for this day */}
                    <div style={styles.dayTasks}>
                      {dayTasks.slice(0, 3).map(task => (
                        <div
                          key={task._id}
                          style={{
                            ...styles.taskPill,
                            backgroundColor: getPriorityColor(task.priority) + '30',
                            borderLeft: `3px solid ${getPriorityColor(task.priority)}`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task);
                          }}
                        >
                          <span style={{
                            ...styles.taskPillText,
                            color: getPriorityColor(task.priority),
                          }}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <span style={styles.moreTasksText}>
                          +{dayTasks.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Add task hint */}
                    <div style={styles.addTaskHint} className="add-task-hint">+ Add</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Week View */}
          {view === 'week' && (
            <div style={styles.weekGrid}>
              {getWeekDays().map((date, index) => {
                const dayTasks = getTasksForDate(date);
                const isCurrentDay = isToday(date);

                return (
                  <div
                    key={index}
                    style={{
                      ...styles.weekDay,
                      ...(isCurrentDay && styles.weekDayToday),
                    }}
                    onClick={() => handleDateClick(date)}
                    className="calendar-day"
                  >
                    {/* Day Header */}
                    <div style={styles.weekDayHeader}>
                      <span style={styles.weekDayName}>
                        {DAY_NAMES[date.getDay()]}
                      </span>
                      <span style={{
                        ...styles.weekDayNumber,
                        ...(isCurrentDay && styles.weekDayNumberToday),
                      }}>
                        {date.getDate()}
                      </span>
                    </div>

                    {/* Tasks */}
                    <div style={styles.weekDayTasks}>
                      {dayTasks.length > 0 ? (
                        dayTasks.map(task => (
                          <div
                            key={task._id}
                            style={{
                              ...styles.weekTaskCard,
                              backgroundColor: getPriorityColor(task.priority) + '20',
                              borderLeft: `3px solid ${getPriorityColor(task.priority)}`,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskClick(task);
                            }}
                          >
                            <p style={{
                              ...styles.weekTaskTitle,
                              color: getPriorityColor(task.priority),
                            }}>
                              {task.title}
                            </p>
                            {task.estimatedDuration && (
                              <p style={styles.weekTaskDuration}>
                                <FaClock size={10} style={{ marginRight: '4px' }} /> {task.estimatedDuration}m
                              </p>
                            )}
                            {task.subtasks?.length > 0 && (
                              <p style={styles.weekTaskSubtasks}>
                                <FaCheckCircle size={10} style={{ marginRight: '4px' }} /> {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div style={styles.weekDayEmpty}>
                          <p style={styles.weekDayEmptyText}>No tasks</p>
                        </div>
                      )}

                      <button
                        style={styles.weekAddButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDateClick(date);
                        }}
                      >
                        <FaPlus style={{ marginRight: '4px' }} /> Add task
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={styles.legend}>
          <span style={styles.legendTitle}>Priority:</span>
          {[
            { label: 'Urgent', color: theme.urgent },
            { label: 'High', color: theme.high },
            { label: 'Medium', color: theme.medium },
            { label: 'Low', color: theme.low },
          ].map(item => (
            <div key={item.label} style={styles.legendItem}>
              <div style={{
                ...styles.legendDot,
                backgroundColor: item.color,
              }} />
              <span style={styles.legendLabel}>{item.label}</span>
            </div>
          ))}
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
    </Layout>
  );
};

export default CalendarPage;