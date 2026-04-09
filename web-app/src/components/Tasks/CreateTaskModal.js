// src/components/Tasks/CreateTaskModal.js
import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaCalendarAlt, FaTag, FaFlag, FaPlus, FaPaperclip, FaCheckCircle, FaTrash, FaClock, FaRobot } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';
import CustomSelect from '../common/CustomSelect';
import aiService from '../../services/aiService';
import { tasksAPI } from '../../services/api';

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated }) => {
  const { theme } = useTheme();
  const initialFormData = {
    title: '',
    description: '',
    dueDate: '',
    category: 'Work',
    priority: 'medium',
    estimatedDuration: 60,
    recurrenceEnabled: false,
    recurrenceFrequency: 'weekly',
    tags: [],
    subtasks: [],
  };
  const [formData, setFormData] = useState({
    ...initialFormData,
  });
  const [tagInput, setTagInput] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [isAssistingWrite, setIsAssistingWrite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const notificationTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setTagInput('');
      setNewSubtask('');
      setNotification(null);
      setIsAssistingWrite(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });

    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }

    notificationTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, 3200);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description,
      deadline: formData.dueDate || null,
      category: formData.category,
      priority: formData.priority,
      estimatedDuration: Number(formData.estimatedDuration) || 60,
      recurrence: formData.recurrenceEnabled ? {
        enabled: true,
        frequency: formData.recurrenceFrequency,
      } : {
        enabled: false,
        frequency: 'weekly',
      },
      tags: formData.tags,
      status: 'todo',
      subtasks: formData.subtasks.map((subtask) => ({
        title: subtask.title,
        completed: Boolean(subtask.completed),
      })),
    };

    try {
      setIsSubmitting(true);
      const response = await tasksAPI.createTask(payload);
      onTaskCreated(response.data.task);
      onClose();

      // Reset form
      setFormData(initialFormData);
      setNewSubtask('');
      setTagInput('');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to create task. Please check your inputs and try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagRemove)
    }));
  };

  const handleAddSubtask = (e) => {
    if ((e.key === 'Enter' || e.type === 'click') && newSubtask.trim()) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, { id: Date.now(), title: newSubtask.trim(), completed: false }]
      }));
      setNewSubtask('');
    }
  };

  const removeSubtask = (id) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(st => st.id !== id)
    }));
  };

  const toValidCategory = (value, fallback = 'Work') => {
    const allowed = ['Work', 'Personal', 'Health', 'Shopping', 'Learning', 'Family'];
    return allowed.includes(value) ? value : fallback;
  };

  const normalizeTags = (tags) => {
    if (!Array.isArray(tags)) {
      return [];
    }

    const cleaned = tags
      .map((tag) => String(tag || '').trim())
      .filter(Boolean)
      .map((tag) => tag.replace(/^#/, ''));

    return [...new Set(cleaned)];
  };

  const handleAssistWrite = async () => {
    const hasEnoughContext = formData.title.trim().length >= 3 || formData.description.trim().length >= 10;

    if (isAssistingWrite || !hasEnoughContext) {
      if (!isAssistingWrite) {
        showNotification('Add at least a short title or description so AI can generate quality suggestions.', 'error');
      }
      return;
    }

    try {
      setIsAssistingWrite(true);
      const result = await aiService.assistWrite({
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
      });

      setFormData(prev => ({
        ...prev,
        title: result?.suggested_title || prev.title,
        category: toValidCategory(result?.suggested_category, prev.category),
        description: result?.description || prev.description,
        estimatedDuration: result?.estimated_duration?.minutes || prev.estimatedDuration,
        tags: normalizeTags([...(prev.tags || []), ...(result?.suggested_tags || [])]),
        subtasks: Array.isArray(result?.subtasks)
          ? result.subtasks.map((subtask, index) => ({
              id: Date.now() + index,
              title: typeof subtask === 'string' ? subtask : subtask?.title || '',
              completed: false,
            })).filter(subtask => subtask.title)
          : prev.subtasks,
      }));

      showNotification('AI suggestions added beautifully to your task.', 'success');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to generate AI task details. Please try again.', 'error');
    } finally {
      setIsAssistingWrite(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: theme.low },
    { value: 'medium', label: 'Medium', color: theme.medium },
    { value: 'high', label: 'High', color: theme.high },
    { value: 'urgent', label: 'Urgent', color: theme.urgent },
  ];

  const categoryOptions = [
    { value: 'Personal', label: 'Personal' },
    { value: 'Work', label: 'Work' },
    { value: 'Shopping', label: 'Shopping' },
    { value: 'Health', label: 'Health' },
    { value: 'Learning', label: 'Learning' },
    { value: 'Family', label: 'Family' }
  ];

  const recurrenceOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: theme.bgCard,
      borderRadius: '16px',
      padding: '32px',
      width: '90%',
      maxWidth: '560px',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: theme.shadows.float,
      border: `1px solid ${theme.border}`,
      position: 'relative',
      color: theme.textPrimary, // Dynamic text color
      animation: 'slideUp 200ms ease',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      borderBottom: `1px solid ${theme.border}`,
      paddingBottom: '16px',
    },
    title: {
      fontFamily: '"Fraunces", serif',
      fontSize: '20px',
      fontWeight: '600',
      color: theme.textPrimary,
    },
    notification: {
      marginBottom: '16px',
      borderRadius: '8px',
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px',
      fontSize: '13px',
      fontWeight: '600',
      border: `1px solid ${theme.border}`,
      boxShadow: 'none',
      animation: 'fadeSlideIn 0.28s ease-out',
    },
    notificationText: {
      margin: 0,
      lineHeight: '1.4',
      color: theme.textPrimary,
    },
    notificationClose: {
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: theme.textSecondary,
      display: 'flex',
      alignItems: 'center',
      padding: 0,
    },
    closeButton: {
      background: 'transparent',
      border: 'none',
      color: theme.textSecondary,
      fontSize: '20px',
      cursor: 'pointer',
      padding: '0',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      transition: 'all 150ms ease',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '11px',
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: '6px',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },
    input: {
      width: '100%',
      padding: '11px 14px',
      fontSize: '15px',
      backgroundColor: theme.bgRaised,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      borderRadius: '8px',
      color: theme.textPrimary,
      outline: 'none',
      transition: 'all 150ms ease',
    },
    textarea: {
      width: '100%',
      padding: '11px 14px',
      fontSize: '15px',
      backgroundColor: theme.bgRaised,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      borderRadius: '8px',
      color: theme.textPrimary,
      outline: 'none',
      resize: 'vertical',
      minHeight: '90px',
    },
    row: {
      display: 'flex',
      gap: '20px',
      marginBottom: '20px',
    },
    col: {
      flex: 1,
    },
    priorityWrapper: {
      display: 'inline-flex',
      gap: '0',
      padding: '3px',
      backgroundColor: theme.bgRaised,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      borderRadius: '8px',
    },
    priorityBtn: (option) => ({
      flex: 1,
      padding: '0 12px',
      height: '34px',
      borderRadius: '6px',
      border: `1px solid ${formData.priority === option.value ? theme.borderMedium : 'transparent'}`,
      backgroundColor: formData.priority === option.value ? theme.bgOverlay : 'transparent',
      color: formData.priority === option.value ? option.color : theme.textMuted,
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: formData.priority === option.value ? theme.shadows.xs : 'none',
      transition: 'all 150ms ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
    }),
    tagsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '12px',
    },
    tag: {
      backgroundColor: theme.bgRaised,
      color: theme.primary,
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      border: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    removeTag: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      opacity: 0.6,
      ':hover': { opacity: 1 }
    },
    subtaskList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginTop: '12px',
    },
    subtaskItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      backgroundColor: theme.bgElevated,
      borderRadius: '8px',
      border: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    subtaskText: {
      flex: 1,
      fontSize: '14px',
      color: theme.textPrimary,
    },
    removeSubtaskBtn: {
      color: theme.error,
      cursor: 'pointer',
      fontSize: '14px',
    },
    addSubtaskContainer: {
      display: 'flex',
      gap: '8px',
    },
    addSubtaskBtn: {
      padding: '0 16px',
      backgroundColor: theme.bgCard,
      color: theme.textSecondary,
      border: `1px solid ${theme.border}`,
      borderRadius: borderRadius.md,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
    },
    recurringCard: {
      backgroundColor: theme.bgRaised,
      borderRadius: '8px',
      boxShadow: 'none',
      padding: '14px',
      border: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    recurringToggleRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
    },
    recurringToggleLabel: {
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
    },
    recurringTitle: {
      color: theme.textPrimary,
      fontSize: '14px',
      fontWeight: '700',
      margin: 0,
    },
    recurringSubtitle: {
      color: theme.textMuted,
      fontSize: '12px',
      margin: 0,
    },
    switch: {
      position: 'relative',
      width: '48px',
      height: '26px',
      borderRadius: '999px',
      border: `1px solid ${formData.recurrenceEnabled ? theme.borderMedium : theme.borderSubtle || theme.border}`,
      cursor: 'pointer',
      backgroundColor: formData.recurrenceEnabled ? theme.accent : theme.bgOverlay,
      boxShadow: 'none',
      transition: 'all 180ms ease',
      flexShrink: 0,
      padding: 0,
    },
    switchKnob: {
      position: 'absolute',
      top: '3px',
      left: formData.recurrenceEnabled ? '25px' : '3px',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      backgroundColor: theme.bgCard,
      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
      transition: 'left 180ms ease',
    },
    frequencyLabel: {
      marginTop: '12px',
      marginBottom: '8px',
      fontSize: '12px',
      fontWeight: '700',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.4px',
    },
    frequencyPills: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
    },
    frequencyPill: (option) => ({
      border: `1px solid ${formData.recurrenceFrequency === option.value ? theme.borderMedium : theme.borderSubtle || theme.border}`,
      borderRadius: '6px',
      padding: '0 12px',
      height: '34px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      boxShadow: formData.recurrenceFrequency === option.value ? theme.shadows.xs : 'none',
      color: formData.recurrenceFrequency === option.value ? theme.textPrimary : theme.textMuted,
      backgroundColor: formData.recurrenceFrequency === option.value ? theme.bgOverlay : 'transparent',
      transition: 'all 180ms ease',
    }),
    aiAssistButton: {
      marginTop: '10px',
      padding: '0 14px',
      height: '40px',
      borderRadius: '8px',
      border: `1px solid ${theme.borderMedium || theme.border}`,
      backgroundColor: theme.bgRaised,
      color: theme.accent,
      fontSize: '13px',
      fontWeight: '600',
      cursor: isAssistingWrite || formData.title.trim().length < 3 ? 'not-allowed' : 'pointer',
      boxShadow: 'none',
      opacity: isAssistingWrite || formData.title.trim().length < 3 ? 0.6 : 1,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 180ms ease',
    },
    spinner: {
      width: '14px',
      height: '14px',
      border: `2px solid ${theme.primary}33`,
      borderTop: `2px solid ${theme.primary}`,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    footer: {
      marginTop: '32px',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '16px',
    },
    cancelButton: {
      padding: '0 20px',
      height: '40px',
      borderRadius: '8px',
      border: `1px solid ${theme.borderMedium || theme.border}`,
      backgroundColor: 'transparent',
      color: theme.textSecondary,
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: 'none',
      transition: 'all 150ms ease',
    },
    createButton: {
      padding: '0 20px',
      height: '40px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: theme.primary,
      color: '#0A0908',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,146,74,0.3) inset',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 150ms ease',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <style>{`
                .close-btn:hover {
          color: ${theme.error} !important;
          background-color: ${theme.bgElevated} !important;
        }
        .cancel-btn:hover {
          color: ${theme.textPrimary} !important;
          transform: translateY(-1px);
        }
        .create-btn:hover {
          transform: translateY(-1px);
          box-shadow: ${theme.shadows.float} !important;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeSlideIn {
          0% {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${theme.bgMain}; 
        }
        ::-webkit-scrollbar-thumb {
          background: ${theme.border}; 
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${theme.textSecondary}; 
        }
        .unified-datepicker-wrapper {
          width: 100%;
          display: block;
        }

        .unified-datepicker-wrapper .react-datepicker__input-container input {
          width: 100%;
          background-color: ${theme.bgRaised};
          border: 1px solid ${theme.borderSubtle || theme.border};
          border-radius: 8px;
          padding: 11px 14px;
          font-size: 14px;
          color: ${theme.textPrimary};
          outline: none;
          box-shadow: none;
        }

        .unified-datepicker {
          background-color: ${theme.bgCard};
          border: 1px solid ${theme.borderSubtle || theme.border};
          border-radius: 10px;
          box-shadow: ${theme.shadows.md};
          color: ${theme.textPrimary};
          font-family: 'Geist', sans-serif;
        }

        .unified-datepicker .react-datepicker__header {
          background-color: ${theme.bgCard};
          border-bottom: 1px solid ${theme.borderSubtle || theme.border};
        }

        .unified-datepicker .react-datepicker__current-month,
        .unified-datepicker .react-datepicker-time__header,
        .unified-datepicker .react-datepicker__day-name,
        .unified-datepicker .react-datepicker__time-name {
          color: ${theme.textSecondary};
        }

        .unified-datepicker .react-datepicker__day,
        .unified-datepicker .react-datepicker__time-list-item {
          color: ${theme.textPrimary} !important;
          background-color: transparent !important;
          border-radius: 6px !important;
        }

        .unified-datepicker .react-datepicker__day--outside-month {
          color: ${theme.textMuted} !important;
          opacity: 0.55;
        }

        .unified-datepicker .react-datepicker__day:hover,
        .unified-datepicker .react-datepicker__time-list-item:hover {
          background-color: ${theme.bgElevated} !important;
        }

        .unified-datepicker .react-datepicker__day--selected,
        .unified-datepicker .react-datepicker__day--keyboard-selected,
        .unified-datepicker .react-datepicker__time-list-item--selected {
          background-color: ${theme.primary} !important;
          color: #0A0908 !important;
        }

        .unified-datepicker .react-datepicker__day--selected:hover,
        .unified-datepicker .react-datepicker__day--keyboard-selected:hover,
        .unified-datepicker .react-datepicker__time-list-item--selected:hover {
          background-color: ${theme.primaryDark || theme.primary} !important;
          color: #0A0908 !important;
        }

        .unified-datepicker .react-datepicker__navigation-icon::before {
          border-color: ${theme.textSecondary} !important;
        }

        .unified-datepicker .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: ${theme.textPrimary} !important;
        }

        .unified-datepicker-wrapper .react-datepicker__close-icon::after {
          background-color: ${theme.primary} !important;
          color: #0A0908 !important;
          font-weight: 700;
        }

        .unified-datepicker .react-datepicker__time-container,
        .unified-datepicker .react-datepicker__time,
        .unified-datepicker .react-datepicker__time-box,
        .unified-datepicker .react-datepicker__time-list {
          background-color: ${theme.bgCard} !important;
          border-left: 1px solid ${theme.borderSubtle || theme.border} !important;
        }

        .unified-datepicker .react-datepicker__time-list-item--selected,
        .unified-datepicker .react-datepicker__time-list-item--selected:hover {
          background-color: ${theme.primary} !important;
          color: #0A0908 !important;
        }
      `}</style>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Create New Task</h2>
          <button style={styles.closeButton} onClick={onClose} className="close-btn">
            <FaTimes />
          </button>
        </div>

        {notification && (
          <div
            style={{
              ...styles.notification,
              background: notification.type === 'success'
                ? `linear-gradient(120deg, ${theme.success}20, ${theme.primary}12)`
                : notification.type === 'error'
                  ? `linear-gradient(120deg, ${theme.error}20, ${theme.warning}10)`
                  : `linear-gradient(120deg, ${theme.primary}16, ${theme.info || '#3b82f6'}10)`,
              borderColor: notification.type === 'success'
                ? `${theme.success}55`
                : notification.type === 'error'
                  ? `${theme.error}55`
                  : `${theme.primary}40`,
            }}
            role="status"
            aria-live="polite"
          >
            <p style={styles.notificationText}>{notification.message}</p>
            <button
              type="button"
              style={styles.notificationClose}
              onClick={() => setNotification(null)}
              aria-label="Dismiss message"
            >
              <FaTimes size={12} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Task Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Redesign Homepage"
              style={styles.input}
              required
              autoFocus
            />
              <button
                type="button"
                onClick={handleAssistWrite}
                style={styles.aiAssistButton}
                disabled={isAssistingWrite || !(formData.title.trim().length >= 3 || formData.description.trim().length >= 10)}
              >
                  {isAssistingWrite ? <span style={styles.spinner} /> : <FaRobot size={12} />}
                {isAssistingWrite ? 'Generating...' : 'AI Writing Assistant'}
              </button>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Add details about the task..."
              style={styles.textarea}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.col}>
              <label style={styles.label}><FaCalendarAlt /> Due Date</label>
              <DatePicker
                selected={formData.dueDate ? new Date(formData.dueDate) : null}
                onChange={date => setFormData(prev => ({ ...prev, dueDate: date ? date.toISOString() : '' }))}
                minDate={new Date()}
                dateFormat="MM/dd/yyyy"
                placeholderText="mm/dd/yyyy"
                wrapperClassName="unified-datepicker-wrapper"
                calendarClassName="unified-datepicker"
                isClearable
                className="custom-datepicker-input"
              />
            </div>
            <div style={styles.col}>
              <label style={styles.label}><FaTag /> Category</label>
              <CustomSelect
                options={categoryOptions}
                value={formData.category}
                onChange={value => setFormData(prev => ({ ...prev, category: value }))}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}><FaClock /> Estimated Duration</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                name="estimatedDuration"
                value={formData.estimatedDuration}
                onChange={handleInputChange}
                placeholder="e.g., 60"
                style={{ ...styles.input, flex: 1 }}
                min="1"
              />
              <span style={{ fontSize: '14px', fontWeight: '600', color: theme.textMuted, whiteSpace: 'nowrap' }}>minutes</span>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Recurring</label>
            <div style={styles.recurringCard}>
              <div style={styles.recurringToggleRow}>
                <div style={styles.recurringToggleLabel}>
                  <p style={styles.recurringTitle}>Enable recurring task</p>
                  <p style={styles.recurringSubtitle}>Automatically create the next occurrence when completed</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, recurrenceEnabled: !prev.recurrenceEnabled }))}
                  style={styles.switch}
                  aria-label="Toggle recurring task"
                  aria-pressed={formData.recurrenceEnabled}
                >
                  <span style={styles.switchKnob} />
                </button>
              </div>
            </div>
            {formData.recurrenceEnabled && (
              <>
                <div style={styles.frequencyLabel}>Repeat every</div>
                <div style={styles.frequencyPills}>
                  {recurrenceOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      style={styles.frequencyPill(option)}
                      onClick={() => setFormData(prev => ({ ...prev, recurrenceFrequency: option.value }))}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}><FaFlag /> Priority</label>
            <div style={styles.priorityWrapper}>
              {priorityOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority: option.value }))}
                  style={styles.priorityBtn(option)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}><FaCheckCircle /> Subtasks</label>
            <div style={styles.addSubtaskContainer}>
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={handleAddSubtask}
                placeholder="Add a subtask..."
                style={styles.input}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                style={styles.addSubtaskBtn}
              >
                <FaPlus />
              </button>
            </div>
            {formData.subtasks.length > 0 && (
              <div style={styles.subtaskList}>
                {formData.subtasks.map(subtask => (
                  <div key={subtask.id} style={styles.subtaskItem}>
                    <FaCheckCircle color={theme.textMuted} size={14} />
                    <span style={styles.subtaskText}>{subtask.title}</span>
                    <FaTrash
                      style={styles.removeSubtaskBtn}
                      onClick={() => removeSubtask(subtask.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}><FaPaperclip /> Tags</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Press Enter to add tags"
              style={styles.input}
            />
            <div style={styles.tagsContainer}>
              {formData.tags.map((tag, index) => (
                <div key={index} style={styles.tag}>
                  #{tag}
                  <span
                    style={styles.removeTag}
                    onClick={() => removeTag(tag)}
                  >
                    <FaTimes size={10} />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.createButton}
              className="create-btn"
              disabled={isSubmitting}
            >
              <FaPlus /> {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;