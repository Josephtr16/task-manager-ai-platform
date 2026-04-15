// src/components/Dashboard/Dashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api, { tasksAPI } from '../../services/api';
import { aiService } from '../../services/aiService';
import StatsCard from './StatsCard';
import AIRecommends from './AIRecommends';
import UpcomingTasks from './UpcomingTasks';
import QuickStats from './QuickStats';
import CreateTaskModal from '../Tasks/CreateTaskModal';
import TaskDetailModal from '../Tasks/TaskDetailModal';
import { StatsCardSkeleton } from '../common/SkeletonLoader';
import { readCache, writeCache } from '../../utils/sessionCache';
import { formatTaskDuration } from '../../utils/formatTaskDuration';
import { FaChartLine, FaCheckCircle, FaCalendarAlt, FaChartPie, FaPlus, FaTimes, FaRegLightbulb, FaPlay, FaClock, FaListOl, FaTrash } from 'react-icons/fa';

const DASHBOARD_CACHE_KEY = 'taskflow_dashboard_cache';
const DAILY_PLAN_STORAGE_KEY = 'taskflow_daily_plan';

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrowDateKey = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateKey(tomorrow);
};

const DailyStandupBanner = ({ report, standupCounts, onDismiss, theme }) => {
  const insights = Array.isArray(report?.insights) ? report.insights : [];

  return (
    <div style={{
      padding: '2px',
      borderRadius: '20px',
      background: 'linear-gradient(135deg, #6366F1 0%, #22C55E 50%, #F59E0B 100%)',
      marginBottom: '28px',
      boxShadow: `0 4px 24px rgba(99, 102, 241, 0.15), ${theme.shadows.glow}`,
    }}>
      <div style={{
        backgroundColor: theme.bgCard,
        borderRadius: '18px',
        padding: '24px 28px 22px',
        border: `1px solid ${theme.borderSubtle || theme.border}`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          alignItems: 'flex-start',
        }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${theme.primary}18`,
              color: theme.primary,
              border: `1px solid ${theme.borderSubtle || theme.border}`,
              flexShrink: 0,
            }}>
              <FaRegLightbulb style={{ fontSize: '18px' }} />
            </div>

            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: '999px',
                backgroundColor: `${theme.primary}12`,
                color: theme.primary,
                fontSize: '12px',
                fontWeight: '700',
                marginBottom: '10px',
              }}>
                Daily AI Standup
              </div>
              <h2 style={{
                margin: '0 0 8px 0',
                color: theme.textPrimary,
                fontSize: '20px',
                fontWeight: '800',
                letterSpacing: '-0.02em',
              }}>
                {report?.completion_rate_label || 'Your daily standup is ready'}
              </h2>
              <p style={{
                margin: '0 0 10px 0',
                color: theme.textSecondary,
                fontSize: '14px',
                lineHeight: 1.6,
                maxWidth: '920px',
              }}>
                {report?.summary || 'A quick AI summary of what happened yesterday and what needs attention today.'}
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '10px',
              }}>
                <span style={{
                  padding: '6px 10px',
                  borderRadius: '999px',
                  backgroundColor: `${theme.success}12`,
                  color: theme.success,
                  fontSize: '12px',
                  fontWeight: '700',
                }}>
                  Completed yesterday: {standupCounts?.completedYesterday || 0}
                </span>
                <span style={{
                  padding: '6px 10px',
                  borderRadius: '999px',
                  backgroundColor: `${theme.warning}12`,
                  color: theme.warning,
                  fontSize: '12px',
                  fontWeight: '700',
                }}>
                  Due today: {standupCounts?.dueToday || 0}
                </span>
                <span style={{
                  padding: '6px 10px',
                  borderRadius: '999px',
                  backgroundColor: `${theme.error}12`,
                  color: theme.error,
                  fontSize: '12px',
                  fontWeight: '700',
                }}>
                  Overdue: {standupCounts?.overdue || 0}
                </span>
                {report?.best_day && (
                  <span style={{
                    padding: '6px 10px',
                    borderRadius: '999px',
                    backgroundColor: theme.bgElevated,
                    color: theme.textSecondary,
                    fontSize: '12px',
                    fontWeight: '700',
                    border: `1px solid ${theme.borderSubtle || theme.border}`,
                  }}>
                    Best day: {report.best_day}
                  </span>
                )}
                {report?.best_period && (
                  <span style={{
                    padding: '6px 10px',
                    borderRadius: '999px',
                    backgroundColor: theme.bgElevated,
                    color: theme.textSecondary,
                    fontSize: '12px',
                    fontWeight: '700',
                    border: `1px solid ${theme.borderSubtle || theme.border}`,
                  }}>
                    Best period: {report.best_period}
                  </span>
                )}
              </div>
              {report?.recommendation && (
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  marginBottom: insights.length > 0 ? '10px' : 0,
                  color: theme.textPrimary,
                  fontSize: '13px',
                  lineHeight: 1.5,
                }}>
                  <span style={{ color: theme.primary, marginTop: '2px' }}>
                    <FaCalendarAlt />
                  </span>
                  <span>
                    <strong>Recommendation:</strong> {report.recommendation}
                  </span>
                </div>
              )}
              {insights.length > 0 && (
                <ul style={{
                  margin: 0,
                  paddingLeft: '18px',
                  color: theme.textSecondary,
                  fontSize: '13px',
                  display: 'grid',
                  gap: '6px',
                }}>
                  {insights.slice(0, 3).map((insight, index) => (
                    <li key={`${index}-${insight}`}>
                      {insight}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss daily standup banner"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              backgroundColor: `${theme.primary}12`,
              color: theme.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: 'none',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${theme.primary}22`;
              e.currentTarget.style.boxShadow = `0 2px 8px ${theme.primary}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${theme.primary}12`;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <FaTimes style={{ fontSize: '14px' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

const PlanDayModal = ({
  isOpen,
  onClose,
  onPlan,
  onAccept,
  onDecline,
  loading,
  error,
  result,
  workStart,
  workEnd,
  setWorkStart,
  setWorkEnd,
  focusTask,
  theme,
}) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const schedule = Array.isArray(result?.schedule) ? result.schedule : [];
  const focusTaskLabel = focusTask?.title || result?.focus_task || 'No focus task returned';
  const planningScopeLabel = String(result?.planning_scope || 'today').toLowerCase() === 'tomorrow'
    ? 'tomorrow'
    : 'today';
  const targetDateLabel = result?.target_date ? new Date(`${result.target_date}T00:00:00`) : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        backgroundColor: 'rgba(10, 9, 8, 0.72)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(1000px, 100%)',
          maxHeight: '92vh',
          overflow: 'auto',
          borderRadius: '24px',
          padding: '3px',
          background: 'linear-gradient(135deg, #6366F1 0%, #22C55E 50%, #F59E0B 100%)',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.3), ${theme.shadows.glow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          backgroundColor: theme.bgCard,
          borderRadius: '22px',
          padding: '28px 32px',
          border: `1px solid ${theme.borderSubtle || theme.border}`,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '16px',
            alignItems: 'flex-start',
            marginBottom: '20px',
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: '999px',
                backgroundColor: `${theme.primary}12`,
                color: theme.primary,
                fontSize: '12px',
                fontWeight: '700',
                marginBottom: '10px',
              }}>
                <FaPlay /> Plan Day
              </div>
              <h2 style={{ margin: 0, color: theme.textPrimary, fontSize: '24px', fontWeight: '800' }}>
                Build {planningScopeLabel}&apos;s schedule
              </h2>
              <p style={{ margin: '8px 0 0', color: theme.textSecondary, fontSize: '14px', lineHeight: 1.6 }}>
                Use your open tasks and working hours to generate a focused plan for the day.
              </p>
              {targetDateLabel && (
                <p style={{ margin: '8px 0 0', color: theme.textMuted, fontSize: '12px', fontWeight: '600' }}>
                  Target date: {targetDateLabel.toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close plan day modal"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: `1.5px solid ${theme.border}`,
                backgroundColor: `${theme.primary}12`,
                color: theme.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.primary}22`;
                e.currentTarget.style.borderColor = `${theme.primary}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.primary}12`;
                e.currentTarget.style.borderColor = theme.border;
              }}
            >
              <FaTimes style={{ fontSize: '14px' }} />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '18px',
            marginBottom: '24px',
          }}>
            <label style={{ display: 'grid', gap: '10px', color: theme.textSecondary, fontSize: '13px', fontWeight: '680' }}>
              Start time
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                style={{
                  backgroundColor: theme.bgElevated,
                  color: theme.textPrimary,
                  border: `1.5px solid ${theme.border}`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  fontSize: '14px',
                  transition: 'all 150ms ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = `${theme.primary}60`;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.primary}15`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </label>
            <label style={{ display: 'grid', gap: '10px', color: theme.textSecondary, fontSize: '13px', fontWeight: '680' }}>
              End time
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                style={{
                  backgroundColor: theme.bgElevated,
                  color: theme.textPrimary,
                  border: `1.5px solid ${theme.border}`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  fontSize: '14px',
                  transition: 'all 150ms ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = `${theme.primary}60`;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.primary}15`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </label>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button
                type="button"
                onClick={onPlan}
                disabled={loading}
                style={{
                  width: '100%',
                  height: '48px',
                  border: 'none',
                  borderRadius: '12px',
                  backgroundColor: loading ? `${theme.primary}88` : theme.primary,
                  color: '#0A0908',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: `0 4px 16px ${theme.primary}35`,
                  transition: 'all 150ms ease',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 24px ${theme.primary}45`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 16px ${theme.primary}35`;
                }}
              >
                <FaClock style={{ fontSize: '13px' }} /> {loading ? 'Planning...' : 'Generate plan'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '16px 18px',
              borderRadius: '12px',
              backgroundColor: `${theme.error}12`,
              border: `1.5px solid ${theme.error}35`,
              color: theme.error,
              fontSize: '13px',
              fontWeight: '500',
              lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          {result && (
            <div style={{ display: 'grid', gap: '18px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '18px',
              }}>
                <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: theme.bgElevated, border: `1.5px solid ${theme.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: theme.primary, marginBottom: '12px', fontWeight: '800', fontSize: '13px' }}>
                    <FaListOl /> FOCUS TASK
                  </div>
                  <div style={{ color: theme.textPrimary, fontSize: '15px', lineHeight: 1.6, fontWeight: '700' }}>
                    {focusTaskLabel}
                  </div>
                </div>
                <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: theme.bgElevated, border: `1.5px solid ${theme.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: theme.primary, marginBottom: '12px', fontWeight: '800', fontSize: '13px' }}>
                    <FaClock /> ADVICE
                  </div>
                  <div style={{ color: theme.textPrimary, fontSize: '15px', lineHeight: 1.6 }}>
                    {result.advice || 'No advice returned'}
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: theme.bgElevated, border: `1.5px solid ${theme.border}` }}>
                <h3 style={{ margin: '0 0 16px 0', color: theme.textPrimary, fontSize: '16px', fontWeight: '800', letterSpacing: '-0.005em' }}>Suggested schedule</h3>
                {schedule.length > 0 ? (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {schedule.map((item) => (
                      <div
                        key={item.task_id || `${item.title}-${item.suggested_start}`}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          backgroundColor: theme.bgCard,
                          border: `1.5px solid ${theme.borderSubtle || theme.border}`,
                          transition: 'all 150ms ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = `${theme.primary}40`;
                          e.currentTarget.style.backgroundColor = `${theme.primary}08`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = theme.borderSubtle || theme.border;
                          e.currentTarget.style.backgroundColor = theme.bgCard;
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                          <strong style={{ color: theme.textPrimary, fontSize: '14px' }}>{item.title}</strong>
                          <span style={{ color: theme.primary, fontWeight: '800', fontSize: '13px' }}>{item.suggested_start}</span>
                        </div>
                        <div style={{ color: theme.textSecondary, fontSize: '13px', lineHeight: 1.5 }}>
                          {item.duration_minutes} min · {item.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: theme.textSecondary, fontSize: '14px' }}>No schedule returned yet.</div>
                )}
              </div>
            </div>
          )}

          {result && (
            <div style={{
              display: 'flex',
              gap: '14px',
              justifyContent: 'flex-end',
              marginTop: '24px',
              flexWrap: 'wrap',
            }}>
              <button
                type="button"
                onClick={onDecline}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: `1.5px solid ${theme.border}`,
                  backgroundColor: `${theme.textSecondary}08`,
                  color: theme.textSecondary,
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${theme.textSecondary}12`;
                  e.currentTarget.style.borderColor = `${theme.textSecondary}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${theme.textSecondary}08`;
                  e.currentTarget.style.borderColor = theme.border;
                }}
              >
                Decline
              </button>
              <button
                type="button"
                onClick={onAccept}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: theme.primary,
                  color: '#0A0908',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: `0 4px 16px ${theme.primary}40`,
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 24px ${theme.primary}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 16px ${theme.primary}40`;
                }}
              >
                Accept
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DailyPlanPanel = ({ plan, tasks, theme, onToggleScheduleItem, onTaskClick, onTaskUpdatedFromPlan, onDeletePlan }) => {
  const [expandedScheduleKeys, setExpandedScheduleKeys] = useState([]);

  if (!plan) return null;

  const schedule = Array.isArray(plan.schedule) ? plan.schedule : [];
  const completedScheduleKeys = Array.isArray(plan.completedScheduleKeys) ? plan.completedScheduleKeys : [];

  const getScheduleItemKey = (item) => String(item.task_id || `${item.title}-${item.suggested_start}`);
  const resolveTaskForScheduleItem = (item) => {
    const scheduleTaskId = String(item.task_id || '');
    if (scheduleTaskId) {
      const byId = (tasks || []).find((task) => String(task._id || task.id) === scheduleTaskId);
      if (byId) return byId;
    }

    const itemTitle = String(item.title || '').trim().toLowerCase();
    return (tasks || []).find((task) => String(task.title || '').trim().toLowerCase() === itemTitle) || null;
  };

  const resolvedFocusTask = (tasks || []).find((task) => String(task._id || task.id) === String(plan.focus_task || ''));
  const focusTaskLabel = resolvedFocusTask?.title
    || ((plan.focus_task_title && plan.focus_task_title !== plan.focus_task) ? plan.focus_task_title : null)
    || 'Not specified';
  const todayKey = getLocalDateKey();
  const tomorrowKey = getTomorrowDateKey();
  const planDateKey = /^\d{4}-\d{2}-\d{2}$/.test(String(plan?.target_date || ''))
    ? String(plan.target_date)
    : todayKey;
  const planTitle = planDateKey === tomorrowKey ? "Tomorrow's Plan" : "Today's Plan";
  const planStatusLabel = planDateKey === tomorrowKey ? 'Starts tomorrow' : 'Active today';

  const toggleExpandedScheduleItem = (itemKey) => {
    setExpandedScheduleKeys((prev) => (
      prev.includes(itemKey)
        ? prev.filter((key) => key !== itemKey)
        : [...prev, itemKey]
    ));
  };

  const handleScheduleItemToggle = (itemKey) => {
    const item = schedule.find((s) => getScheduleItemKey(s) === itemKey);
    if (!item) return;

    // Get fresh task data
    let currentTask = null;
    const scheduleTaskId = String(item.task_id || '');
    if (scheduleTaskId) {
      currentTask = (tasks || []).find((task) => String(task._id || task.id) === scheduleTaskId);
    }
    if (!currentTask) {
      const itemTitle = String(item.title || '').trim().toLowerCase();
      currentTask = (tasks || []).find((task) => String(task.title || '').trim().toLowerCase() === itemTitle);
    }

    if (currentTask) {
      const isCurrentlyCompleted = completedScheduleKeys.includes(itemKey);
      const newStatus = isCurrentlyCompleted ? 'in-progress' : 'done';
      
      console.log("🎯 Toggle schedule item:", currentTask.title, "From:", isCurrentlyCompleted ? 'done' : 'in-progress', "To:", newStatus);

      const updateData = { status: newStatus };

      // Also toggle all subtasks when parent task is toggled
      if (Array.isArray(currentTask.subtasks) && currentTask.subtasks.length > 0) {
        updateData.subtasks = currentTask.subtasks.map((subtask) => ({
          title: subtask.title,
          completed: !isCurrentlyCompleted, // If unchecking parent, uncheck subtasks (false); if checking parent, check subtasks (true)
        }));
        console.log("📋 Subtasks being updated:", updateData.subtasks);
      }

      if (onTaskUpdatedFromPlan) {
        onTaskUpdatedFromPlan(currentTask._id, updateData);
      }
    }

    onToggleScheduleItem(itemKey);
  };

  const handleSubtaskToggle = (itemKey, subtaskIndex) => {
    const item = schedule.find((s) => getScheduleItemKey(s) === itemKey);
    if (!item) return;

    // Get fresh task data from the tasks array to ensure we have the latest subtasks
    let currentTask = null;
    const scheduleTaskId = String(item.task_id || '');
    if (scheduleTaskId) {
      currentTask = (tasks || []).find((task) => String(task._id || task.id) === scheduleTaskId);
    }
    if (!currentTask) {
      const itemTitle = String(item.title || '').trim().toLowerCase();
      currentTask = (tasks || []).find((task) => String(task.title || '').trim().toLowerCase() === itemTitle);
    }

    if (currentTask && Array.isArray(currentTask.subtasks)) {
      console.log("🏷️ Toggle subtask:", subtaskIndex, "in task:", currentTask.title);
      console.log("   Current subtasks before toggle:", currentTask.subtasks);
      
      const updatedSubtasks = currentTask.subtasks.map((subtask, index) => {
        if (index === subtaskIndex) {
          console.log(`   Toggling subtask ${index} from`, subtask.completed, "to", !subtask.completed);
          return { 
            title: subtask.title, 
            completed: !subtask.completed 
          };
        }
        return { 
          title: subtask.title, 
          completed: subtask.completed 
        };
      });

      console.log("   Updated subtasks:", updatedSubtasks);

      // Check if all subtasks are now completed
      const allSubtasksCompleted = updatedSubtasks.every((subtask) => subtask.completed);
      console.log("   All subtasks completed?", allSubtasksCompleted);

      // If all subtasks are completed, auto-complete the parent task
      let newStatus = currentTask.status;
      if (allSubtasksCompleted && currentTask.status !== 'done') {
        newStatus = 'done';
        console.log("   🎉 All subtasks done! Auto-completing parent task");
      } else if (!allSubtasksCompleted && currentTask.status === 'done') {
        // If unchecking a subtask and task was done, revert to in-progress
        newStatus = 'in-progress';
        console.log("   ↩️ Unchecked a subtask, reverting task to in-progress");
      }

      const updatePayload = { 
        subtasks: updatedSubtasks,
        status: newStatus,
      };

      if (onTaskUpdatedFromPlan) {
        onTaskUpdatedFromPlan(currentTask._id, updatePayload);
      }

      // Update UI state if status changed to 'done' or from 'done'
      if (newStatus !== currentTask.status) {
        console.log("   📍 Updating completedScheduleKeys for:", itemKey);
        onToggleScheduleItem(itemKey);
      }
    }
  };

  return (
    <div style={{
      padding: '2px',
      borderRadius: '20px',
      background: 'linear-gradient(135deg, #22C55E 0%, #6366F1 55%, #F59E0B 100%)',
      marginBottom: '20px',
      boxShadow: `0 4px 24px rgba(34, 197, 94, 0.15), ${theme.shadows.glow}`,
    }}>
      <div style={{
        backgroundColor: theme.bgCard,
        borderRadius: '18px',
        padding: '20px 24px',
        border: `1px solid ${theme.borderSubtle || theme.border}`,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '14px',
          flexWrap: 'wrap',
        }}>
          <h3 style={{ margin: 0, color: theme.textPrimary, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.01em' }}>
            {planTitle}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              padding: '5px 12px',
              borderRadius: '8px',
              backgroundColor: `${theme.success}15`,
              color: theme.success,
              fontSize: '11px',
              fontWeight: '800',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              {planStatusLabel}
            </span>
            <button
              type="button"
              onClick={onDeletePlan}
              aria-label="Delete current plan"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: `1.5px solid ${theme.error}50`,
                backgroundColor: `${theme.error}12`,
                color: theme.error,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.error}20`;
                e.currentTarget.style.borderColor = `${theme.error}80`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.error}12`;
                e.currentTarget.style.borderColor = `${theme.error}50`;
              }}
            >
              <FaTrash size={12} />
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '14px',
          marginBottom: '16px',
        }} className="plan-focus-advice">
          <div style={{
            padding: '16px 18px',
            borderRadius: '12px',
            backgroundColor: `${theme.primary}08`,
            border: `1.5px solid ${theme.primary}35`,
          }}>
            <div style={{
              color: theme.primary,
              fontSize: '11px',
              fontWeight: '800',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}>
              Focus task
            </div>
            <div style={{
              color: theme.textPrimary,
              fontWeight: '700',
              fontSize: '15px',
              lineHeight: 1.5,
              letterSpacing: '-0.005em',
            }}>
              {focusTaskLabel}
            </div>
          </div>
          <div style={{
            padding: '16px 18px',
            borderRadius: '12px',
            backgroundColor: `${theme.warning}08`,
            border: `1.5px solid ${theme.warning}35`,
          }}>
            <div style={{
              color: theme.warning,
              fontSize: '11px',
              fontWeight: '800',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}>
              Advice
            </div>
            <div style={{
              color: theme.textPrimary,
              fontSize: '14px',
              lineHeight: 1.5,
            }}>
              {plan.advice || 'No advice provided'}
            </div>
          </div>
        </div>

        <div style={{
          padding: '18px',
          borderRadius: '14px',
          backgroundColor: theme.bgElevated,
          border: `1.5px solid ${theme.border}`,
        }}>
          <h4 style={{ margin: '0 0 14px 0', color: theme.textPrimary, fontSize: '16px', fontWeight: '800', letterSpacing: '-0.005em' }}>Schedule</h4>
          {schedule.length > 0 ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {schedule.map((item) => {
                const itemKey = getScheduleItemKey(item);
                const isCompleted = completedScheduleKeys.includes(itemKey);
                const isExpanded = expandedScheduleKeys.includes(itemKey);
                const taskDetails = resolveTaskForScheduleItem(item);
                const hasSubtasks = Array.isArray(taskDetails?.subtasks) && taskDetails.subtasks.length > 0;
                const totalSubtasks = hasSubtasks ? taskDetails.subtasks.length : 0;
                const completedSubtasks = hasSubtasks
                  ? taskDetails.subtasks.filter((subtask) => subtask.completed).length
                  : 0;
                const subtaskProgress = totalSubtasks > 0
                  ? Math.round((completedSubtasks / totalSubtasks) * 100)
                  : 0;

                return (
                <div
                  key={itemKey}
                  style={{
                    padding: '16px 18px',
                    borderRadius: '12px',
                    backgroundColor: isCompleted ? `${theme.success}12` : theme.bgCard,
                    border: `1.5px solid ${isCompleted ? `${theme.success}40` : theme.borderSubtle || theme.border}`,
                    transition: 'all 200ms ease',
                    cursor: taskDetails ? 'pointer' : 'default',
                    opacity: isCompleted ? 0.75 : 1,
                  }}
                  onClick={() => {
                    if (taskDetails && onTaskClick) {
                      onTaskClick(taskDetails);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!isCompleted) {
                      e.currentTarget.style.borderColor = `${theme.primary}50`;
                      e.currentTarget.style.backgroundColor = `${theme.primary}08`;
                      e.currentTarget.style.boxShadow = `0 2px 12px ${theme.primary}15`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.borderSubtle || theme.border;
                    e.currentTarget.style.backgroundColor = theme.bgCard;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => handleScheduleItemToggle(itemKey)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '20px',
                          height: '20px',
                          accentColor: theme.primary,
                          cursor: 'pointer',
                          flexShrink: 0,
                          borderRadius: '6px',
                          border: `2px solid ${theme.primary}`,
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <strong style={{
                          color: isCompleted ? theme.textSecondary : theme.textPrimary,
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          fontSize: '14px',
                          fontWeight: '700',
                        }}>
                          {item.title}
                        </strong>
                        <span style={{
                          color: theme.textSecondary,
                          fontSize: '12px',
                          fontWeight: '600',
                        }}>
                          {formatTaskDuration(item.duration_minutes)}
                        </span>
                      </div>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      {hasSubtasks && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandedScheduleItem(itemKey);
                          }}
                          aria-label={isExpanded ? 'Hide subtasks' : 'Show subtasks'}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: `1.5px solid ${theme.primary}40`,
                            backgroundColor: isExpanded ? `${theme.primary}20` : `${theme.primary}10`,
                            color: theme.primary,
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 150ms ease',
                            flexShrink: 0,
                            letterSpacing: '-0.3px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${theme.primary}25`;
                            e.currentTarget.style.borderColor = `${theme.primary}60`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = isExpanded ? `${theme.primary}20` : `${theme.primary}10`;
                            e.currentTarget.style.borderColor = `${theme.primary}40`;
                          }}
                        >
                          {isExpanded ? 'Hide subtasks' : 'Show subtasks'}
                        </button>
                      )}
                      <span style={{ color: theme.primary, fontWeight: '800', fontSize: '14px', minWidth: '50px', textAlign: 'right' }}>
                        {item.suggested_start}
                      </span>
                    </div>
                  </div>

                  {hasSubtasks && isExpanded && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        marginTop: '12px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: theme.bgElevated,
                        border: `1.5px solid ${theme.border}`,
                        display: 'grid',
                        gap: '10px',
                      }}
                    >
                      {(taskDetails.subtasks || []).map((subtask, index) => (
                        <label
                          key={`${itemKey}-subtask-${index}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: subtask.completed ? theme.textSecondary : theme.textPrimary,
                            fontSize: '13px',
                            cursor: 'pointer',
                            opacity: subtask.completed ? 0.7 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(subtask.completed)}
                            onChange={() => handleSubtaskToggle(itemKey, index)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              width: '16px',
                              height: '16px',
                              accentColor: theme.primary,
                              cursor: 'pointer',
                              flexShrink: 0,
                              borderRadius: '4px',
                              border: `1.5px solid ${theme.primary}`,
                            }}
                          />
                          <span style={{
                            textDecoration: subtask.completed ? 'line-through' : 'none',
                            fontWeight: subtask.completed ? '500' : '500',
                          }}>
                            {subtask.title}
                          </span>
                        </label>
                      ))}

                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${theme.border}` }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                          fontSize: '12px',
                          color: theme.textSecondary,
                          fontWeight: '600',
                        }}>
                          <span>Progress</span>
                          <span>{completedSubtasks}/{totalSubtasks}</span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          borderRadius: '999px',
                          backgroundColor: `${theme.textMuted}25`,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${subtaskProgress}%`,
                            height: '100%',
                            borderRadius: '999px',
                            backgroundColor: theme.success,
                            transition: 'width 200ms ease',
                            boxShadow: `0 0 8px ${theme.success}40`,
                          }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: theme.textSecondary, fontSize: '14px', padding: '12px', textAlign: 'center' }}>No schedule saved.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const computeLocalStats = (tasks = []) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const stats = {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === 'done').length,
    inProgress: tasks.filter((task) => task.status === 'in-progress').length,
    todo: tasks.filter((task) => task.status === 'todo').length,
    dueToday: tasks.filter((task) =>
      task.deadline &&
      new Date(task.deadline) >= today &&
      new Date(task.deadline) < tomorrow &&
      task.status !== 'done'
    ).length,
    dueTomorrow: tasks.filter((task) => {
      if (!task.deadline || task.status === 'done') return false;
      const taskDate = new Date(task.deadline);
      return taskDate >= tomorrow && taskDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
    }).length,
    overdue: tasks.filter((task) =>
      task.deadline &&
      new Date(task.deadline) < now &&
      task.status !== 'done'
    ).length,
    urgent: tasks.filter((task) => task.priority === 'urgent' && task.status !== 'done').length,
    highPriority: tasks.filter((task) => task.priority === 'high' && task.status !== 'done').length,
  };

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const onTimeRate = stats.overdue === 0 ? 100 : Math.max(0, 100 - (stats.overdue / stats.total) * 100);
  const productivityScore = Math.round((completionRate * 0.6) + (onTimeRate * 0.4));

  const focusTime = tasks.reduce((total, task) => total + (task.timeTracking?.totalTime || 0), 0);

  const completedTasks = tasks
    .filter((task) => task.status === 'done' && task.completedAt)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  let streak = 0;
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < completedTasks.length; i += 1) {
    const taskDate = new Date(completedTasks[i].completedAt);
    taskDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((currentDate - taskDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === streak) {
      streak += 1;
    } else if (daysDiff > streak) {
      break;
    }
  }

  return {
    ...stats,
    productivityScore,
    focusTime,
    streak,
  };
};

const Dashboard = () => {
  const cachedDashboardState = readCache(DASHBOARD_CACHE_KEY, 60000);
  const { user } = useAuth();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState(cachedDashboardState?.tasks || []);
  const [stats, setStats] = useState(
    cachedDashboardState?.stats || computeLocalStats(cachedDashboardState?.tasks || [])
  );
  const [upcomingTasks, setUpcomingTasks] = useState(cachedDashboardState?.upcomingTasks || []);
  const [loading, setLoading] = useState(!cachedDashboardState);
  const [dailyStandup, setDailyStandup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPlanDayModal, setShowPlanDayModal] = useState(false);
  const [planDayWorkStart, setPlanDayWorkStart] = useState('09:00');
  const [planDayWorkEnd, setPlanDayWorkEnd] = useState('18:00');
  const [planDayLoading, setPlanDayLoading] = useState(false);
  const [planDayError, setPlanDayError] = useState('');
  const [planDayResult, setPlanDayResult] = useState(null);
  const [acceptedDailyPlan, setAcceptedDailyPlan] = useState(null);
  const [showDeletePlanConfirm, setShowDeletePlanConfirm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    setStats(computeLocalStats(tasks));
  }, [tasks]);

  useEffect(() => {
    if (cachedDashboardState) {
      setLoading(false);
    }
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const todayKey = getLocalDateKey();
    const tomorrowKey = getTomorrowDateKey();
    const rawAcceptedPlan = localStorage.getItem(DAILY_PLAN_STORAGE_KEY);
    if (!rawAcceptedPlan) {
      setAcceptedDailyPlan(null);
      return;
    }

    try {
      const parsed = JSON.parse(rawAcceptedPlan);
      if ((parsed?.date === todayKey || parsed?.date === tomorrowKey) && parsed?.plan) {
        setAcceptedDailyPlan(parsed.plan);
      } else {
        localStorage.removeItem(DAILY_PLAN_STORAGE_KEY);
        setAcceptedDailyPlan(null);
      }
    } catch {
      localStorage.removeItem(DAILY_PLAN_STORAGE_KEY);
      setAcceptedDailyPlan(null);
    }
  }, []);

  useEffect(() => {
    const todayKey = getLocalDateKey();
    const dismissedDate = localStorage.getItem('standup_date');

    if (dismissedDate === todayKey) {
      return;
    }

    let isMounted = true;

    const loadDailyStandup = async () => {
      try {
        const response = await api.get('/ai/daily-standup');
        const payload = response.data || {};

        if (isMounted) {
          setDailyStandup({
            report: payload.report || null,
            standup: payload.standup || null,
          });
        }
      } catch (error) {
        console.error('Error loading daily standup:', error);
      }
    };

    loadDailyStandup();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismissDailyStandup = () => {
    localStorage.setItem('standup_date', getLocalDateKey());
    setDailyStandup(null);
  };

  const handleOpenPlanDay = () => {
    setPlanDayError('');
    setPlanDayResult(null);
    setShowPlanDayModal(true);
  };

  const handleGeneratePlanDay = async () => {
    const activeTasks = (tasks || [])
      .filter((task) => task.status !== 'done')
      .map((task) => ({
        id: String(task._id || task.id),
        title: task.title,
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        deadline: task.deadline || null,
        estimated_minutes: task.estimatedDuration || 60,
        category: task.category || '',
        dependencies: Array.isArray(task.dependencies) 
          ? task.dependencies.map(dep => String(dep._id || dep)) 
          : [],
      }));

    if (activeTasks.length === 0) {
      setPlanDayError('Add at least one active task before planning your day.');
      return;
    }

    setPlanDayLoading(true);
    setPlanDayError('');

    try {
      const result = await aiService.planDay(activeTasks, planDayWorkStart, planDayWorkEnd);
      setPlanDayResult(result);
    } catch (error) {
      console.error('Error generating day plan:', error);
      const responseData = error?.response?.data;
      const detailMessage = typeof responseData?.detail === 'string'
        ? responseData.detail
        : null;
      setPlanDayError(
        responseData?.message
        || detailMessage
        || error?.message
        || 'Unable to generate a day plan right now.'
      );
    } finally {
      setPlanDayLoading(false);
    }
  };

  const getFocusedPlanTask = () => {
    const focusTaskId = String(planDayResult?.focus_task || '');
    return (tasks || []).find((task) => String(task._id || task.id) === focusTaskId) || null;
  };

  const handleAcceptPlanDay = () => {
    if (planDayResult) {
      const targetDateKey = /^\d{4}-\d{2}-\d{2}$/.test(String(planDayResult?.target_date || ''))
        ? String(planDayResult.target_date)
        : getLocalDateKey();
      const focusTask = getFocusedPlanTask();
      const acceptedPlan = {
        ...planDayResult,
        focus_task_title: focusTask?.title || planDayResult.focus_task,
        completedScheduleKeys: Array.isArray(planDayResult.completedScheduleKeys)
          ? planDayResult.completedScheduleKeys
          : [],
      };
      localStorage.setItem(DAILY_PLAN_STORAGE_KEY, JSON.stringify({
        date: targetDateKey,
        plan: acceptedPlan,
        acceptedAt: Date.now(),
      }));
      setAcceptedDailyPlan(acceptedPlan);
    }
    setShowPlanDayModal(false);
  };

  const handleToggleAcceptedScheduleItem = (itemKey) => {
    setAcceptedDailyPlan((prev) => {
      if (!prev) return prev;

      const existing = Array.isArray(prev.completedScheduleKeys) ? prev.completedScheduleKeys : [];
      const nextCompleted = existing.includes(itemKey)
        ? existing.filter((key) => key !== itemKey)
        : [...existing, itemKey];

      const nextPlan = {
        ...prev,
        completedScheduleKeys: nextCompleted,
      };

      const planDateKey = /^\d{4}-\d{2}-\d{2}$/.test(String(prev?.target_date || ''))
        ? String(prev.target_date)
        : getLocalDateKey();
      localStorage.setItem(DAILY_PLAN_STORAGE_KEY, JSON.stringify({
        date: planDateKey,
        plan: nextPlan,
        acceptedAt: Date.now(),
      }));

      return nextPlan;
    });
  };

  const handleDeclinePlanDay = () => {
    setPlanDayResult(null);
    setPlanDayError('');
    setShowPlanDayModal(false);
  };

  const handleDeleteAcceptedPlan = () => {
    setShowDeletePlanConfirm(true);
  };

  const handleConfirmDeleteAcceptedPlan = () => {
    localStorage.removeItem(DAILY_PLAN_STORAGE_KEY);
    setAcceptedDailyPlan(null);
    setPlanDayResult(null);
    setShowDeletePlanConfirm(false);
  };

  const handleCancelDeleteAcceptedPlan = () => {
    setShowDeletePlanConfirm(false);
  };

  const loadDashboardData = async () => {
    try {
      if (!cachedDashboardState) {
        setLoading(true);
      }

      const [tasksRes, upcomingRes] = await Promise.all([
        tasksAPI.getTasks(),
        tasksAPI.getUpcoming(),
      ]);
      // The interceptor already unwraps one data layer; read the payload directly and then its domain keys.
      const tasksPayload = tasksRes.data;
      const upcomingPayload = upcomingRes.data;
      const localStats = computeLocalStats(tasksPayload.tasks || []);

      setTasks(tasksPayload.tasks || []);
      setStats(localStats);
      setUpcomingTasks(upcomingPayload.tasks || []);
      writeCache(DASHBOARD_CACHE_KEY, {
        tasks: tasksPayload.tasks || [],
        stats: localStats,
        upcomingTasks: upcomingPayload.tasks || [],
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
    loadDashboardData();
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleToggleTaskFromRecommendations = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';

    try {
      const response = await tasksAPI.updateTask(task._id, { status: newStatus });
      // The interceptor unwraps to the endpoint payload, so support either { task } or direct task shapes.
      const updatedTask = response.data.task || response.data;

      const completedDelta = task.status === 'done' && updatedTask.status !== 'done'
        ? -1
        : task.status !== 'done' && updatedTask.status === 'done'
          ? 1
          : 0;

      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
      setStats((prev) => {
        const nextCompleted = Math.max(0, Math.min(prev.total, prev.completed + completedDelta));
        const completionRate = prev.total > 0 ? (nextCompleted / prev.total) * 100 : 0;
        const onTimeRate = prev.overdue === 0 ? 100 : Math.max(0, 100 - (prev.overdue / prev.total) * 100);
        const productivityScore = Math.round((completionRate * 0.6) + (onTimeRate * 0.4));

        return {
          ...prev,
          completed: nextCompleted,
          productivityScore,
          todo: task.status === 'todo' && updatedTask.status === 'done'
            ? Math.max(0, prev.todo - 1)
            : task.status === 'done' && updatedTask.status === 'todo'
              ? prev.todo + 1
              : prev.todo,
        };
      });
      setUpcomingTasks((prev) => {
        const remaining = prev.filter((task) => task._id !== updatedTask._id);

        if (updatedTask.status === 'done') {
          return remaining;
        }

        return [updatedTask, ...remaining]
          .filter((task, index, array) => array.findIndex((item) => item._id === task._id) === index)
          .sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0))
          .slice(0, 5);
      });
      if (selectedTask?._id === updatedTask._id) {
        setSelectedTask(updatedTask);
      }
    } catch (error) {
      console.error('Error toggling task status from AI recommendations:', error);
      loadDashboardData();
    }
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) => prev.map((task) => (task._id === updatedTask._id ? updatedTask : task)));
    setUpcomingTasks((prev) => {
      const remaining = prev.filter((task) => task._id !== updatedTask._id);

      if (updatedTask.status === 'done') {
        return remaining;
      }

      return [updatedTask, ...remaining]
        .filter((task, index, array) => array.findIndex((item) => item._id === task._id) === index)
        .sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0))
        .slice(0, 5);
    });
    setSelectedTask(updatedTask);
  };

  const handleTaskUpdatedFromDailyPlan = async (taskId, updates) => {
    try {
      console.log("📤 Sending update to API - Task ID:", taskId, "Updates:", updates);
      const response = await tasksAPI.updateTask(taskId, updates);
      console.log("📥 Received response from API:", response);
      
      const updatedTask = response.data.task || response.data;
      console.log("✅ Updated task:", updatedTask, "Subtasks:", updatedTask.subtasks);

      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
      setUpcomingTasks((prev) => {
        const remaining = prev.filter((task) => task._id !== updatedTask._id);

        if (updatedTask.status === 'done') {
          return remaining;
        }

        return [updatedTask, ...remaining]
          .filter((task, index, array) => array.findIndex((item) => item._id === task._id) === index)
          .sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0))
          .slice(0, 5);
      });
      if (selectedTask?._id === updatedTask._id) {
        setSelectedTask(updatedTask);
      }
    } catch (error) {
      console.error('❌ Error updating task from daily plan:', error);
    }
  };

  const handleTaskDeleted = (taskId) => {
    setTasks((prev) => prev.filter((task) => task._id !== taskId));
    setUpcomingTasks((prev) => prev.filter((task) => task._id !== taskId));
    setShowDetailModal(false);
    setSelectedTask(null);
    loadDashboardData();
  };

  const busiestDayData = useMemo(() => {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = Array(7).fill(0);

    (tasks || []).forEach((task) => {
      if (task.status !== 'done' || !task.completedAt) return;
      const completedDate = new Date(task.completedAt);
      if (!Number.isNaN(completedDate.getTime())) {
        counts[completedDate.getDay()] += 1;
      }
    });

    const maxCount = Math.max(...counts, 0);
    const busiestIndex = counts.findIndex((count) => count === maxCount);

    if (maxCount === 0 || busiestIndex < 0) {
      return {
        labels,
        counts,
        maxCount: 1,
        busiestLabel: 'No data',
        busiestCount: 0,
      };
    }

    return {
      labels,
      counts,
      maxCount,
      busiestLabel: labels[busiestIndex],
      busiestCount: maxCount,
    };
  }, [tasks]);

  const getCategoryColor = React.useCallback((category) => {
    const normalized = String(category || 'other').trim().toLowerCase();

    if (theme.chart && theme.chart[normalized]) {
      return theme.chart[normalized];
    }

    // Deterministic fallback color for unknown categories to avoid palette collisions.
    let hash = 0;
    for (let i = 0; i < normalized.length; i += 1) {
      hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 52%, 52%)`;
  }, [theme.chart]);

  const categoryBreakdownData = useMemo(() => {
    const activeTasks = (tasks || []).filter((task) => task.status !== 'done');
    const categoryCounts = activeTasks.reduce((acc, task) => {
      const category = (task.category || 'Other').trim() || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const entries = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const total = entries.reduce((sum, item) => sum + item.count, 0);

    return {
      entries,
      total,
    };
  }, [tasks]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 20) return 'Good evening';
    return 'Good night';
  };

  const styles = {
    container: {
      padding: '40px 40px',
      backgroundColor: theme.bgMain,
      minHeight: '100vh',
    },
    loading: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      color: theme.textPrimary,
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: `4px solid ${theme.bgMain}`,
      borderTop: `4px solid ${theme.primary}`,
      boxShadow: 'none',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '16px',
    },
    greeting: {
      marginBottom: '36px',
    },
    greetingTitle: {
      fontFamily: '"Fraunces", serif',
      fontSize: '44px',
      fontWeight: '700',
      color: theme.textPrimary,
      margin: '0 0 10px 0',
      letterSpacing: '-0.03em',
    },
    greetingItalic: {
      fontStyle: 'italic',
      fontWeight: '300',
      color: theme.textSecondary,
    },
    greetingName: {
      fontWeight: '600',
      color: theme.textPrimary,
    },
    greetingSubtitle: {
      fontSize: '14px',
      color: theme.textSecondary,
      margin: 0,
      fontWeight: '500',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      gap: '28px',
      marginBottom: '36px',
    },
    mainContent: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)',
      gap: '28px',
    },
    leftContent: {
      minHeight: '400px',
    },
    rightSidebar: {
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
    },
    fab: {
      height: '42px',
      padding: '0 22px',
      borderRadius: '10px',
      backgroundColor: theme.primary,
      color: '#0A0908',
      border: 'none',
      cursor: 'pointer',
      boxShadow: `0 4px 16px ${theme.primary}30`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 160ms ease',
      zIndex: 50,
      fontSize: '13px',
      fontWeight: '700',
      letterSpacing: '-0.005em',
    },
  };

  if (loading) {
    return (
      <>
        <div style={styles.container}>
          <div style={styles.statsGrid}>
            {Array.from({ length: 4 }).map((_, index) => (
              <StatsCardSkeleton key={index} />
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
        
        .dashboard-container {
          animation: fadeIn 0.2s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0.95; }
          to { opacity: 1; }
        }
        
        .fab:hover {
          transform: translateY(-3px);
          box-shadow: ${`0 6px 24px ${theme.primary}40`} !important;
        }

        .fab-secondary:hover {
          background-color: ${`${theme.bgElevated}cc`} !important;
          border-color: ${`${theme.border}cc`} !important;
        }

        @media (max-width: 1200px) {
            .dashboard-main-content {
            grid-template-columns: 1fr !important;
            }
            .dashboard-stats-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
            .plan-focus-advice {
              grid-template-columns: 1fr !important;
            }
        }

        @media (max-width: 720px) {
            .dashboard-stats-grid {
              grid-template-columns: 1fr !important;
            }
            .plan-focus-advice {
              grid-template-columns: 1fr !important;
            }
        }
      `}</style>
      <div style={styles.container} className="dashboard-container">
        <PlanDayModal
          isOpen={showPlanDayModal}
          onClose={() => setShowPlanDayModal(false)}
          onPlan={handleGeneratePlanDay}
          onAccept={handleAcceptPlanDay}
          onDecline={handleDeclinePlanDay}
          loading={planDayLoading}
          error={planDayError}
          result={planDayResult}
          workStart={planDayWorkStart}
          workEnd={planDayWorkEnd}
          setWorkStart={setPlanDayWorkStart}
          setWorkEnd={setPlanDayWorkEnd}
          focusTask={getFocusedPlanTask()}
          theme={theme}
        />

        {/* Greeting */}
        <div style={styles.greeting}>
          <h1 style={styles.greetingTitle}>
            <span style={styles.greetingItalic}>{getGreeting()},</span>{' '}
            <span style={styles.greetingName}>{user?.name?.split(' ')[0]}</span>
          </h1>
          <p style={styles.greetingSubtitle}>
            You have <strong style={{ color: theme.textPrimary }}>{stats?.dueToday || 0}</strong> tasks due today and {stats?.dueTomorrow || 0} tomorrow.
          </p>
        </div>

        {dailyStandup?.report && (
          <DailyStandupBanner
            report={dailyStandup.report}
            standupCounts={dailyStandup.standup?.counts}
            onDismiss={handleDismissDailyStandup}
            theme={theme}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            style={{
              ...styles.fab,
              backgroundColor: `${theme.primary}15`,
              color: theme.primary,
              border: `1.5px solid ${theme.primary}30`,
              boxShadow: 'none',
            }}
            onClick={handleOpenPlanDay}
            className="fab fab-secondary"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${theme.primary}25`;
              e.currentTarget.style.borderColor = `${theme.primary}50`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${theme.primary}15`;
              e.currentTarget.style.borderColor = `${theme.primary}30`;
            }}
          >
            <FaPlay style={{ marginRight: '8px', fontSize: '12px' }} /> Plan Day
          </button>
          <button
            style={styles.fab}
            onClick={() => setShowCreateModal(true)}
            className="fab"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <FaPlus style={{ marginRight: '8px', fontSize: '12px' }} /> New Task
          </button>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid} className="dashboard-stats-grid">
          <StatsCard
            icon={<FaChartLine />}
            label="Productivity Score"
            value={stats?.productivityScore || 0}
            color={theme.info}
            progress={{
              current: stats?.productivityScore || 0,
              total: 100,
              color: theme.info,
              labelLeft: 'Progress',
              labelRight: `${stats?.productivityScore || 0}%`,
            }}
          />
          <StatsCard
            icon={<FaCheckCircle />}
            label="Tasks Completed"
            value={`${stats?.completed || 0}/${stats?.total || 0}`}
            color={theme.success}
            progress={{
              current: stats?.completed || 0,
              total: stats?.total || 0,
              color: theme.success,
              labelLeft: 'Completed',
              labelRight: `${stats?.completed || 0}/${stats?.total || 0}`,
            }}
          />
          <StatsCard
            icon={<FaCalendarAlt />}
            label="Busiest Day"
            color={theme.warning}
            customContent={(
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                  <h2 style={{
                    fontFamily: 'Fraunces, serif',
                    fontSize: '40px',
                    fontWeight: '800',
                    color: theme.textPrimary,
                    margin: 0,
                  }}>
                    {busiestDayData.busiestLabel}
                  </h2>
                  <span style={{ fontSize: '13px', color: theme.textMuted }}>
                    {busiestDayData.busiestCount} completed
                  </span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gap: '6px',
                  alignItems: 'end',
                  height: '44px',
                  marginBottom: '8px',
                }}>
                  {busiestDayData.counts.map((count, index) => {
                    const height = Math.max(6, Math.round((count / busiestDayData.maxCount) * 100));
                    return (
                      <div
                        key={busiestDayData.labels[index]}
                        style={{
                          height: `${height}%`,
                          borderRadius: '4px',
                          backgroundColor: count > 0 ? theme.warning : `${theme.warning}25`,
                          boxShadow: count > 0 ? `0 0 8px ${theme.warning}40` : 'none',
                        }}
                        title={`${busiestDayData.labels[index]}: ${count}`}
                      />
                    );
                  })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px' }}>
                  {busiestDayData.labels.map((label) => (
                    <span
                      key={label}
                      style={{ fontSize: '11px', textAlign: 'center', color: theme.textMuted }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </>
            )}
          />
          <StatsCard
            icon={<FaClock />}
            label="Focus Time"
            color={theme.primary}
            customContent={(
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                  <h2 style={{
                    fontFamily: 'Fraunces, serif',
                    fontSize: '56px',
                    fontWeight: '800',
                    color: theme.textPrimary,
                    margin: 0,
                  }}>
                    {(() => {
                      const totalTime = tasks.reduce((total, task) => total + (task.timeTracking?.totalTime || 0), 0);
                      const hours = Math.floor(totalTime / 60);
                      const mins = totalTime % 60;
                      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                    })()}
                  </h2>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: theme.textSecondary,
                  margin: 0,
                }}>
                  Total time tracked across all tasks
                </p>
              </>
            )}
          />
        </div>

        {/* Main Content */}
        <div style={styles.mainContent} className="dashboard-main-content">
          <div style={styles.leftContent}>
            {acceptedDailyPlan && (
              <DailyPlanPanel
                plan={acceptedDailyPlan}
                tasks={tasks}
                theme={theme}
                onToggleScheduleItem={handleToggleAcceptedScheduleItem}
                onTaskClick={handleTaskClick}
                onTaskUpdatedFromPlan={handleTaskUpdatedFromDailyPlan}
                onDeletePlan={handleDeleteAcceptedPlan}
              />
            )}
            <AIRecommends
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onToggleTask={handleToggleTaskFromRecommendations}
              onTaskDeleted={handleTaskDeleted}
              onTaskUpdated={handleTaskUpdated}
            />
          </div>
          <div style={styles.rightSidebar}>
            <UpcomingTasks
              tasks={upcomingTasks}
              onTaskClick={handleTaskClick}
            />
            <QuickStats stats={stats} />
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

        {showDeletePlanConfirm && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1400,
              backgroundColor: 'rgba(10, 9, 8, 0.7)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
            onClick={handleCancelDeleteAcceptedPlan}
          >
            <div
              style={{
                width: 'min(440px, 100%)',
                borderRadius: '20px',
                padding: '2px',
                background: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)',
                boxShadow: `0 18px 48px rgba(0, 0, 0, 0.3), ${theme.shadows.glow}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  backgroundColor: theme.bgCard,
                  borderRadius: '18px',
                  padding: '22px 22px 18px',
                  border: `1px solid ${theme.borderSubtle || theme.border}`,
                }}
              >
                <h3 style={{ margin: '0 0 8px 0', color: theme.textPrimary, fontSize: '20px', fontWeight: '800' }}>
                  Delete current plan?
                </h3>
                <p style={{ margin: 0, color: theme.textSecondary, fontSize: '14px', lineHeight: 1.6 }}>
                  This removes the accepted plan card so you can generate a fresh one.
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={handleCancelDeleteAcceptedPlan}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: `1.5px solid ${theme.border}`,
                      backgroundColor: `${theme.textSecondary}10`,
                      color: theme.textSecondary,
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteAcceptedPlan}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      border: `1.5px solid ${theme.error}`,
                      backgroundColor: `${theme.error}18`,
                      color: theme.error,
                      fontWeight: '800',
                      cursor: 'pointer',
                    }}
                  >
                    Delete Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;