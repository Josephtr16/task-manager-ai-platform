import React, { useEffect, useState } from 'react';
import { FaTimes, FaRobot, FaCheck, FaHourglassHalf, FaTimesCircle, FaMagic, FaPlus } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';
import aiService from '../../services/aiService';
import CustomSelect from '../common/CustomSelect';

const AIProjectBreakdownModal = ({ isOpen, onClose, project, onAddAcceptedTasks }) => {
  const { theme } = useTheme();
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('auto');
  const [taskCount, setTaskCount] = useState(12);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (isOpen) {
      setDescription(project?.description || '');
      setScope('auto');
      setTaskCount(12);
      setGeneratedTasks([]);
      setIsGenerating(false);
      setIsAdding(false);
      setNotification(null);
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const toHoursLabel = (minutes) => {
    const safeMinutes = Number(minutes) || 0;
    const hours = safeMinutes / 60;
    if (hours < 1) return `${safeMinutes}m`;
    if (Number.isInteger(hours)) return `${hours}h`;
    return `${hours.toFixed(1)}h`;
  };

  const normalizePriority = (priority) => {
    const p = String(priority || 'medium').toLowerCase();
    if (['low', 'medium', 'high', 'urgent'].includes(p)) return p;
    return 'medium';
  };

  const priorityColor = (priority) => {
    const p = normalizePriority(priority);
    if (p === 'urgent') return theme.urgent;
    if (p === 'high') return theme.high;
    if (p === 'low') return theme.low;
    return theme.medium;
  };

  const resolveProjectDeadline = (value) => {
    if (!value) return '';

    const asText = String(value);
    const dateMatch = asText.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) return dateMatch[1];

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';

    return parsed.toISOString().split('T')[0];
  };

  const projectDueDate = resolveProjectDeadline(project?.dueDate);
  const scopeOptions = [
    { value: 'auto', label: 'auto-detect' },
    { value: 'school', label: 'school' },
    { value: 'basic', label: 'basic' },
    { value: 'professional', label: 'professional' },
    { value: 'advanced', label: 'advanced' },
  ];
  const taskCountOptions = [
    { value: '8', label: '8' },
    { value: '12', label: '12' },
    { value: '16', label: '16' },
    { value: '20', label: '20' },
  ];

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const result = await aiService.projectBreakdown(
        project?.title || 'Untitled Project',
        description,
        String(project?.category || 'work').toLowerCase(),
        'solo',
        scope,
        Number(taskCount),
        projectDueDate || undefined
      );

      const tasks = Array.isArray(result?.tasks) ? result.tasks : [];
      const normalizedTasks = tasks.map((task, index) => ({
        id: `ai-task-${Date.now()}-${index}`,
        title: task.title || `Generated Task ${index + 1}`,
        description: task.description || '',
        estimated_minutes: Number(task.estimated_minutes) || 240,
        priority: normalizePriority(task.priority),
        category: task.category || 'Work',
        phase: task.phase || 'development',
        deadline: task.deadline || null,
        accepted: true,
        subtasks: [],
        subtasksLoading: false,
      }));

      setGeneratedTasks(normalizedTasks);
      showNotification('success', 'AI task breakdown generated successfully.');
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Failed to generate AI project breakdown. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateTask = (id, updates) => {
    setGeneratedTasks(prev => prev.map(task => (task.id === id ? { ...task, ...updates } : task)));
  };

  const handleAcceptAll = (e) => {
    e?.preventDefault();
    setGeneratedTasks(prev => prev.map(task => ({ ...task, accepted: true })));
  };

  const handleDenyAll = (e) => {
    e?.preventDefault();
    setGeneratedTasks(prev => prev.map(task => ({ ...task, accepted: false })));
  };

  const handleGenerateSubtasks = async (taskId) => {
    const task = generatedTasks.find(item => item.id === taskId);
    if (!task) return;

    try {
      updateTask(taskId, { subtasksLoading: true });

      const response = await aiService.generateSubtasks(
        `${project?.title || ''}\n${description || project?.description || ''}`,
        task.title,
        task.description,
        task.category,
        task.phase,
        task.estimated_minutes
      );

      const subtasks = Array.isArray(response?.subtasks) ? response.subtasks : [];
      updateTask(taskId, { subtasks, subtasksLoading: false });
    } catch (error) {
      updateTask(taskId, { subtasksLoading: false });
      showNotification('error', error.response?.data?.message || 'Failed to generate subtasks. Please try again.');
    }
  };

  const handleAddAcceptedTasks = async () => {
    const acceptedTasks = generatedTasks.filter(task => task.accepted);
    if (acceptedTasks.length === 0) {
      showNotification('info', 'Please accept at least one task before adding.');
      return;
    }

    try {
      setIsAdding(true);
      await onAddAcceptedTasks(acceptedTasks);
    } catch (error) {
      showNotification('error', error.response?.data?.message || error.message || 'Failed to add accepted tasks.');
    } finally {
      setIsAdding(false);
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1200,
    },
    modal: {
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.xl,
      width: '94%',
      maxWidth: '980px',
      maxHeight: '88vh',
      overflowY: 'auto',
      padding: '28px',
      border: `1px solid ${theme.border}`,
      boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
      color: theme.textPrimary,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    closeBtn: {
      border: 'none',
      background: 'transparent',
      color: theme.textSecondary,
      cursor: 'pointer',
      fontSize: '18px',
      display: 'flex',
      alignItems: 'center',
    },
    notification: {
      marginBottom: '16px',
      padding: '10px 12px',
      borderRadius: borderRadius.md,
      fontSize: '14px',
      fontWeight: '600',
    },
    section: {
      marginBottom: '18px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '700',
      color: theme.textSecondary,
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.4px',
    },
    textarea: {
      width: '100%',
      minHeight: '110px',
      border: 'none',
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphicInset,
      borderRadius: borderRadius.md,
      color: theme.textPrimary,
      padding: '12px 14px',
      resize: 'vertical',
      boxSizing: 'border-box',
      fontSize: '14px',
    },
    controlsRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr auto',
      gap: '12px',
      alignItems: 'end',
      marginBottom: '18px',
    },
    deadlineHint: {
      marginBottom: '18px',
      fontSize: '13px',
      color: theme.textSecondary,
    },
    select: {
      width: '100%',
      border: 'none',
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphicInset,
      borderRadius: borderRadius.md,
      color: theme.textPrimary,
      padding: '12px 14px',
      fontSize: '14px',
    },
    generateBtn: {
      padding: '11px 18px',
      border: 'none',
      borderRadius: borderRadius.md,
      backgroundColor: theme.primary,
      color: '#fff',
      fontWeight: '700',
      cursor: isGenerating ? 'not-allowed' : 'pointer',
      opacity: isGenerating ? 0.7 : 1,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: theme.shadows.neumorphic,
    },
    actionBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '14px',
    },
    actionBtn: {
      padding: '8px 12px',
      border: `1px solid ${theme.border}`,
      borderRadius: borderRadius.md,
      backgroundColor: theme.bgMain,
      color: theme.textPrimary,
      cursor: 'pointer',
      boxShadow: theme.shadows.neumorphic,
      fontWeight: '600',
    },
    taskGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '12px',
      marginBottom: '20px',
    },
    taskCard: {
      border: `1px solid ${theme.border}`,
      borderRadius: borderRadius.lg,
      padding: '14px',
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphic,
    },
    taskTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '10px',
    },
    taskTitleInput: {
      flex: 1,
      border: 'none',
      backgroundColor: theme.bgMain,
      color: theme.textPrimary,
      fontWeight: '700',
      boxShadow: theme.shadows.neumorphicInset,
      borderRadius: borderRadius.sm,
      padding: '8px 10px',
      fontSize: '15px',
    },
    badgesRow: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      marginBottom: '10px',
    },
    badge: {
      padding: '4px 8px',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: '700',
      border: `1px solid ${theme.border}`,
    },
    taskDesc: {
      fontSize: '13px',
      color: theme.textSecondary,
      marginBottom: '10px',
      lineHeight: '1.5',
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'wrap',
    },
    acceptBtn: (accepted) => ({
      border: 'none',
      borderRadius: borderRadius.sm,
      padding: '7px 10px',
      cursor: 'pointer',
      backgroundColor: accepted ? `${theme.success}22` : theme.bgMain,
      color: theme.success,
      boxShadow: theme.shadows.neumorphic,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontWeight: '700',
    }),
    denyBtn: (accepted) => ({
      border: 'none',
      borderRadius: borderRadius.sm,
      padding: '7px 10px',
      cursor: 'pointer',
      backgroundColor: accepted ? theme.bgMain : `${theme.error}22`,
      color: theme.error,
      boxShadow: theme.shadows.neumorphic,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontWeight: '700',
    }),
    subtasksBtn: {
      border: `1px solid ${theme.primary}`,
      borderRadius: borderRadius.sm,
      padding: '7px 10px',
      cursor: 'pointer',
      backgroundColor: 'transparent',
      color: theme.primary,
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    subtasksList: {
      marginTop: '10px',
      borderTop: `1px dashed ${theme.border}`,
      paddingTop: '10px',
      display: 'grid',
      gap: '6px',
    },
    subtaskItem: {
      fontSize: '13px',
      color: theme.textSecondary,
      backgroundColor: `${theme.primary}08`,
      padding: '6px 8px',
      borderRadius: borderRadius.sm,
    },
    footer: {
      borderTop: `1px solid ${theme.border}`,
      paddingTop: '14px',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
    },
    cancelBtn: {
      padding: '10px 14px',
      borderRadius: borderRadius.md,
      border: `1px solid ${theme.border}`,
      backgroundColor: theme.bgMain,
      color: theme.textPrimary,
      cursor: 'pointer',
    },
    addBtn: {
      padding: '10px 16px',
      borderRadius: borderRadius.md,
      border: 'none',
      backgroundColor: theme.success,
      color: '#fff',
      cursor: isAdding ? 'not-allowed' : 'pointer',
      opacity: isAdding ? 0.7 : 1,
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
  };

  const acceptedCount = generatedTasks.filter(task => task.accepted).length;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.primary, fontWeight: '800' }}>
              <FaRobot /> AI Project Breakdown
            </div>
            <h2 style={{ margin: '8px 0 0 0' }}>Generate Tasks with AI</h2>
          </div>
          <button type="button" style={styles.closeBtn} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {notification && (
          <div
            style={{
              ...styles.notification,
              backgroundColor:
                notification.type === 'error'
                  ? `${theme.error}22`
                  : notification.type === 'success'
                    ? `${theme.success}22`
                    : `${theme.primary}22`,
              color:
                notification.type === 'error'
                  ? theme.error
                  : notification.type === 'success'
                    ? theme.success
                    : theme.primary,
            }}
          >
            {notification.message}
          </div>
        )}

        <div style={styles.section}>
          <label style={styles.label}>Project Description</label>
          <textarea
            style={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the project goals and scope..."
          />
        </div>

        <div style={styles.controlsRow}>
          <div>
            <label style={styles.label}>Scope</label>
            <CustomSelect
              options={scopeOptions}
              value={scope}
              onChange={(value) => setScope(value)}
            />
          </div>

          <div>
            <label style={styles.label}>Number of Tasks</label>
            <CustomSelect
              options={taskCountOptions}
              value={String(taskCount)}
              onChange={(value) => setTaskCount(Number(value))}
            />
          </div>

          <button type="button" style={styles.generateBtn} onClick={handleGenerate} disabled={isGenerating}>
            <FaMagic /> {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {projectDueDate && (
          <div style={styles.deadlineHint}>
            Using project due date: <strong>{projectDueDate}</strong>
          </div>
        )}

        {generatedTasks.length > 0 && (
          <>
            <div style={styles.actionBar}>
              <div style={{ color: theme.textSecondary, fontSize: '14px' }}>
                {acceptedCount} of {generatedTasks.length} tasks accepted
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" style={styles.actionBtn} onClick={handleAcceptAll}>Accept All</button>
                <button type="button" style={styles.actionBtn} onClick={handleDenyAll}>Deny All</button>
              </div>
            </div>

            <div style={styles.taskGrid}>
              {generatedTasks.map((task) => (
                <div key={task.id} style={styles.taskCard}>
                  <div style={styles.taskTop}>
                    <input
                      style={styles.taskTitleInput}
                      value={task.title}
                      onChange={(e) => updateTask(task.id, { title: e.target.value })}
                    />
                  </div>

                  <div style={styles.badgesRow}>
                    <span style={{ ...styles.badge, backgroundColor: `${theme.primary}12`, color: theme.primary }}>
                      <FaHourglassHalf style={{ marginRight: '5px' }} /> {toHoursLabel(task.estimated_minutes)}
                    </span>
                    <span style={{ ...styles.badge, backgroundColor: `${priorityColor(task.priority)}1a`, color: priorityColor(task.priority) }}>
                      {String(task.priority || 'medium').toUpperCase()}
                    </span>
                    {task.deadline && (
                      <span style={{ ...styles.badge, backgroundColor: `${theme.info}1a`, color: theme.info }}>
                        Due {task.deadline}
                      </span>
                    )}
                  </div>

                  {task.description && <div style={styles.taskDesc}>{task.description}</div>}

                  <div style={styles.row}>
                    <button 
                      type="button" 
                      style={styles.acceptBtn(task.accepted)} 
                      onClick={(e) => {
                        e.preventDefault();
                        updateTask(task.id, { accepted: true });
                      }}
                    >
                      <FaCheck /> Accept
                    </button>
                    <button 
                      type="button" 
                      style={styles.denyBtn(task.accepted)} 
                      onClick={(e) => {
                        e.preventDefault();
                        updateTask(task.id, { accepted: false });
                      }}
                    >
                      <FaTimesCircle /> Deny
                    </button>

                    {task.accepted && (
                      <button
                        type="button"
                        style={styles.subtasksBtn}
                        onClick={() => handleGenerateSubtasks(task.id)}
                        disabled={task.subtasksLoading}
                      >
                        <FaPlus /> {task.subtasksLoading ? 'Generating...' : 'Generate Subtasks'}
                      </button>
                    )}
                  </div>

                  {Array.isArray(task.subtasks) && task.subtasks.length > 0 && (
                    <div style={styles.subtasksList}>
                      {task.subtasks.map((subtask, index) => (
                        <div key={`${task.id}-sub-${index}`} style={styles.subtaskItem}>
                          <FaCheck style={{ marginRight: '8px', color: theme.success }} />
                          {subtask.title || subtask.description || `Subtask ${index + 1}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div style={styles.footer}>
          <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button 
            type="button" 
            style={styles.addBtn} 
            onClick={(e) => {
              e.preventDefault();
              handleAddAcceptedTasks();
            }}
            disabled={isAdding || acceptedCount === 0}
          >
            <FaCheck /> {isAdding ? 'Adding Tasks...' : acceptedCount > 0 ? `Add ${acceptedCount} Task${acceptedCount !== 1 ? 's' : ''} to Project` : 'No Tasks Accepted'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIProjectBreakdownModal;
