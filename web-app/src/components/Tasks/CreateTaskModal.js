// src/components/Tasks/CreateTaskModal.js
import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaCalendarAlt, FaTag, FaFlag, FaPlus, FaPaperclip, FaCheckCircle, FaTrash, FaClock, FaRobot } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { borderRadius } from '../../theme';
import CustomSelect from '../common/CustomSelect';
import aiService from '../../services/aiService';
import { tasksAPI } from '../../services/api';

const INITIAL_FORM_DATA = {
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

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const TIME_DEFAULT = '09:00';
  const [formData, setFormData] = useState({
    ...INITIAL_FORM_DATA,
  });
  const [isSpecificTimeEnabled, setIsSpecificTimeEnabled] = useState(false);
  const [selectedDueTime, setSelectedDueTime] = useState(TIME_DEFAULT);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [typedDueTime, setTypedDueTime] = useState('09:00 AM');
  const [tagInput, setTagInput] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [isAssistingWrite, setIsAssistingWrite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [aiDiffSummary, setAiDiffSummary] = useState('');
  const notificationTimerRef = useRef(null);
  const previousFormDataRef = useRef(null);
  const timePickerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM_DATA);
      setIsSpecificTimeEnabled(false);
      setSelectedDueTime(TIME_DEFAULT);
      setIsTimePickerOpen(false);
      setTypedDueTime('09:00 AM');
      setTagInput('');
      setNewSubtask('');
      setNotification(null);
      setAiDiffSummary('');
      setIsAssistingWrite(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutsideTimePicker = (event) => {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target)) {
        setIsTimePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideTimePicker);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideTimePicker);
    };
  }, []);

  useEffect(() => {
    const [hourRaw = '09', minuteRaw = '00'] = String(selectedDueTime || TIME_DEFAULT).split(':');
    let hour24 = Number.parseInt(hourRaw, 10);
    const minute = Number.parseInt(minuteRaw, 10);

    if (Number.isNaN(hour24)) {
      hour24 = 9;
    }

    const period = hour24 >= 12 ? 'PM' : 'AM';
    let hour12 = hour24 % 12;
    if (hour12 === 0) {
      hour12 = 12;
    }

    const safeMinute = Number.isNaN(minute) ? 0 : minute;
    setTypedDueTime(`${String(hour12).padStart(2, '0')}:${String(safeMinute).padStart(2, '0')} ${period}`);
  }, [selectedDueTime]);

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
      setFormData(INITIAL_FORM_DATA);
      setIsSpecificTimeEnabled(false);
      setSelectedDueTime(TIME_DEFAULT);
      setIsTimePickerOpen(false);
      setTypedDueTime('09:00 AM');
      setNewSubtask('');
      setTagInput('');
    } catch (error) {
      showNotification(error.response?.data?.message || t('tasks.createFailed', 'Failed to create task. Please check your inputs and try again.'), 'error');
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

  const mergeSubtasks = (existingSubtasks, aiSubtasks) => {
    const current = Array.isArray(existingSubtasks) ? existingSubtasks : [];

    if (!Array.isArray(aiSubtasks)) {
      return current;
    }

    const existingTitles = new Set(
      current
        .map((subtask) => String(subtask?.title || '').trim().toLowerCase())
        .filter(Boolean)
    );

    const aiToAppend = aiSubtasks
      .map((subtask, index) => ({
        id: Date.now() + index,
        title: typeof subtask === 'string' ? subtask : subtask?.title || '',
        completed: false,
      }))
      .map((subtask) => ({
        ...subtask,
        title: String(subtask.title || '').trim(),
      }))
      .filter((subtask) => {
        if (!subtask.title) {
          return false;
        }

        const normalizedTitle = subtask.title.toLowerCase();
        if (existingTitles.has(normalizedTitle)) {
          return false;
        }

        existingTitles.add(normalizedTitle);
        return true;
      });

    return [...current, ...aiToAppend];
  };

  const cloneFormData = (value) => ({
    ...value,
    tags: Array.isArray(value?.tags) ? [...value.tags] : [],
    subtasks: Array.isArray(value?.subtasks)
      ? value.subtasks.map((subtask) => ({ ...subtask }))
      : [],
  });

  const normalizeList = (items = []) => items
    .map((item) => String(item || '').trim().toLowerCase())
    .filter(Boolean)
    .sort();

  const normalizeSubtaskTitles = (subtasks = []) => normalizeList(
    subtasks.map((subtask) => subtask?.title || '')
  );

  const areStringArraysEqual = (a = [], b = []) => {
    if (a.length !== b.length) {
      return false;
    }

    return a.every((value, index) => value === b[index]);
  };

  const buildAIDiffSummary = (previousState, nextState) => {
    const changed = [];

    if (String(previousState?.title || '').trim() !== String(nextState?.title || '').trim()) {
      changed.push('title');
    }

    if (String(previousState?.description || '').trim() !== String(nextState?.description || '').trim()) {
      changed.push('description');
    }

    if (String(previousState?.category || '') !== String(nextState?.category || '')) {
      changed.push('category');
    }

    if (Number(previousState?.estimatedDuration || 0) !== Number(nextState?.estimatedDuration || 0)) {
      changed.push('estimatedDuration');
    }

    const previousTags = normalizeList(previousState?.tags || []);
    const nextTags = normalizeList(nextState?.tags || []);
    if (!areStringArraysEqual(previousTags, nextTags)) {
      changed.push('tags');
    }

    const previousSubtasks = normalizeSubtaskTitles(previousState?.subtasks || []);
    const nextSubtasks = normalizeSubtaskTitles(nextState?.subtasks || []);
    if (!areStringArraysEqual(previousSubtasks, nextSubtasks)) {
      const subtaskDelta = nextSubtasks.length - previousSubtasks.length;
      if (subtaskDelta > 0) {
        changed.push(`+${subtaskDelta} subtasks`);
      } else if (subtaskDelta < 0) {
        changed.push(`${subtaskDelta} subtasks`);
      } else {
        changed.push('subtasks');
      }
    }

    return changed.length > 0 ? `AI changed: ${changed.join(', ')}` : '';
  };

  const handleAssistWrite = async () => {
    const hasEnoughContext = formData.title.trim().length >= 3 || formData.description.trim().length >= 10;

    if (isAssistingWrite || !hasEnoughContext) {
      if (!isAssistingWrite) {
        showNotification(t('ai.assistShortContext', 'Add at least a short title or description so AI can generate quality suggestions.'), 'error');
      }
      return;
    }

    try {
      const previousFormData = cloneFormData(formData);
      previousFormDataRef.current = previousFormData;
      setIsAssistingWrite(true);
      const result = await aiService.assistWrite({
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
      });

      const nextFormData = {
        ...previousFormData,
        title: result?.suggested_title || previousFormData.title,
        category: toValidCategory(result?.suggested_category, previousFormData.category),
        description: result?.description || previousFormData.description,
        estimatedDuration: result?.estimated_duration?.minutes || previousFormData.estimatedDuration,
        tags: normalizeTags([...(previousFormData.tags || []), ...(result?.suggested_tags || [])]),
        subtasks: mergeSubtasks(previousFormData.subtasks, result?.subtasks),
      };

      setFormData(nextFormData);

      const summary = buildAIDiffSummary(previousFormData, nextFormData);
      setAiDiffSummary(summary);

      showNotification(summary || t('ai.suggestionsAdded', 'AI suggestions added to your task.'), 'info');
    } catch (error) {
      showNotification(error.response?.data?.message || t('ai.generateFailed', 'Failed to generate AI task details. Please try again.'), 'error');
    } finally {
      setIsAssistingWrite(false);
    }
  };

  const handleUndoAIAssistChanges = () => {
    if (!previousFormDataRef.current) {
      return;
    }

    setFormData(cloneFormData(previousFormDataRef.current));
    setAiDiffSummary('');
    setNotification(null);
  };

  const buildSmartDeadlineISO = (selectedDate, useSpecificTime = isSpecificTimeEnabled, explicitTime = selectedDueTime) => {
    if (!selectedDate) {
      return '';
    }

    const picked = new Date(selectedDate);
    if (Number.isNaN(picked.getTime())) {
      return '';
    }

    if (useSpecificTime) {
      const [hoursRaw, minutesRaw] = String(explicitTime || TIME_DEFAULT).split(':');
      const hours = Number.parseInt(hoursRaw, 10);
      const minutes = Number.parseInt(minutesRaw, 10);

      if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
        picked.setHours(hours, minutes, 0, 0);
      } else {
        picked.setHours(9, 0, 0, 0);
      }
    } else {
      // Date-only mode defaults to end of day.
      picked.setHours(23, 59, 0, 0);
    }

    return picked.toISOString();
  };

  const handleDueDateChange = (selectedDate) => {
    setFormData(prev => ({
      ...prev,
      dueDate: buildSmartDeadlineISO(selectedDate),
    }));
  };

  const handleSpecificTimeToggle = () => {
    setIsSpecificTimeEnabled(prev => {
      const nextEnabled = !prev;

      if (!nextEnabled) {
        setIsTimePickerOpen(false);
      }

      setFormData(current => {
        if (!current.dueDate) {
          return current;
        }

        const datePart = new Date(current.dueDate);
        if (Number.isNaN(datePart.getTime())) {
          return current;
        }

        return {
          ...current,
          dueDate: buildSmartDeadlineISO(datePart, nextEnabled, selectedDueTime),
        };
      });

      return nextEnabled;
    });
  };

  const handleSpecificTimeChange = (event) => {
    const value = event;
    setSelectedDueTime(value);

    setFormData(prev => {
      if (!prev.dueDate) {
        return prev;
      }

      const datePart = new Date(prev.dueDate);
      if (Number.isNaN(datePart.getTime())) {
        return prev;
      }

      return {
        ...prev,
        dueDate: buildSmartDeadlineISO(datePart, true, value),
      };
    });
  };

  const parseDueTimeParts = (timeValue) => {
    const [hourRaw = '09', minuteRaw = '00'] = String(timeValue || TIME_DEFAULT).split(':');
    let hour24 = Number.parseInt(hourRaw, 10);
    const minute = Number.parseInt(minuteRaw, 10);

    if (Number.isNaN(hour24)) {
      hour24 = 9;
    }

    const period = hour24 >= 12 ? 'PM' : 'AM';
    let hour12 = hour24 % 12;
    if (hour12 === 0) {
      hour12 = 12;
    }

    return {
      hour12: String(hour12).padStart(2, '0'),
      minute: Number.isNaN(minute) ? '00' : String(minute).padStart(2, '0'),
      period,
    };
  };

  const composeDueTime = (hour12String, minuteString, periodString) => {
    const hour12 = Number.parseInt(hour12String, 10);
    const minute = Number.parseInt(minuteString, 10);

    if (Number.isNaN(hour12) || Number.isNaN(minute)) {
      return TIME_DEFAULT;
    }

    let hour24 = hour12 % 12;
    if (periodString === 'PM') {
      hour24 += 12;
    }

    return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const formatDueTimeForDisplay = (timeValue) => {
    const parts = parseDueTimeParts(timeValue);
    return `${parts.hour12}:${parts.minute} ${parts.period}`;
  };

  const parseTypedDueTimeInput = (rawValue) => {
    const normalized = String(rawValue || '').trim().toLowerCase();
    const match = normalized.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/i);

    if (!match) {
      return null;
    }

    const hourRaw = Number.parseInt(match[1], 10);
    const minuteRaw = match[2] !== undefined ? Number.parseInt(match[2], 10) : 0;
    const periodRaw = match[3] ? match[3].toUpperCase() : null;

    if (Number.isNaN(hourRaw) || Number.isNaN(minuteRaw) || minuteRaw < 0 || minuteRaw > 59) {
      return null;
    }

    if (periodRaw) {
      if (hourRaw < 1 || hourRaw > 12) {
        return null;
      }

      let hour24 = hourRaw % 12;
      if (periodRaw === 'PM') {
        hour24 += 12;
      }

      return `${String(hour24).padStart(2, '0')}:${String(minuteRaw).padStart(2, '0')}`;
    }

    if (hourRaw < 0 || hourRaw > 23) {
      return null;
    }

    return `${String(hourRaw).padStart(2, '0')}:${String(minuteRaw).padStart(2, '0')}`;
  };

  const dueTimeParts = parseDueTimeParts(selectedDueTime);
  const hourOptions = Array.from({ length: 12 }, (_, idx) => {
    const value = String(idx + 1).padStart(2, '0');
    return { value, label: value };
  });
  const minuteOptions = Array.from({ length: 12 }, (_, idx) => {
    const value = String(idx * 5).padStart(2, '0');
    return { value, label: value };
  });
  const periodOptions = [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' },
  ];

  const handleHourChange = (nextHour) => {
    handleSpecificTimeChange(composeDueTime(nextHour, dueTimeParts.minute, dueTimeParts.period));
  };

  const handleMinuteChange = (nextMinute) => {
    handleSpecificTimeChange(composeDueTime(dueTimeParts.hour12, nextMinute, dueTimeParts.period));
  };

  const handlePeriodChange = (nextPeriod) => {
    handleSpecificTimeChange(composeDueTime(dueTimeParts.hour12, dueTimeParts.minute, nextPeriod));
  };

  const commitTypedDueTime = () => {
    const parsed = parseTypedDueTimeInput(typedDueTime);
    if (!parsed) {
      setTypedDueTime(formatDueTimeForDisplay(selectedDueTime));
      return;
    }

    handleSpecificTimeChange(parsed);
    setTypedDueTime(formatDueTimeForDisplay(parsed));
  };

  const selectTimeSegmentFromCaret = (inputEl) => {
    const caretPos = typeof inputEl.selectionStart === 'number' ? inputEl.selectionStart : 0;

    if (caretPos <= 2) {
      inputEl.setSelectionRange(0, 2);
      return;
    }

    if (caretPos <= 5) {
      inputEl.setSelectionRange(3, 5);
      return;
    }

    inputEl.setSelectionRange(6, 8);
  };

  const priorityOptions = [
    { value: 'low', label: t('tasks.priorityLabels.low', 'Low'), color: theme.low },
    { value: 'medium', label: t('tasks.priorityLabels.medium', 'Medium'), color: theme.medium },
    { value: 'high', label: t('tasks.priorityLabels.high', 'High'), color: theme.high },
    { value: 'urgent', label: t('tasks.priorityLabels.urgent', 'Urgent'), color: theme.urgent },
  ];

  const categoryOptions = [
    { value: 'Personal', label: t('tasks.categoryLabels.personal', 'Personal') },
    { value: 'Work', label: t('tasks.categoryLabels.work', 'Work') },
    { value: 'Shopping', label: t('tasks.categoryLabels.shopping', 'Shopping') },
    { value: 'Health', label: t('tasks.categoryLabels.health', 'Health') },
    { value: 'Learning', label: t('tasks.categoryLabels.learning', 'Learning') },
    { value: 'Family', label: t('tasks.categoryLabels.family', 'Family') }
  ];

  const recurrenceOptions = [
    { value: 'daily', label: t('recurrence.daily', 'Daily') },
    { value: 'weekly', label: t('recurrence.weekly', 'Weekly') },
    { value: 'monthly', label: t('recurrence.monthly', 'Monthly') },
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
    dueDateHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '6px',
      gap: '8px',
    },
    timeToggleButton: {
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      backgroundColor: isSpecificTimeEnabled ? theme.bgOverlay : theme.bgRaised,
      color: isSpecificTimeEnabled ? theme.textPrimary : theme.textSecondary,
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: '600',
      cursor: 'pointer',
      padding: '4px 10px',
      lineHeight: 1.2,
      transition: 'all 150ms ease',
      whiteSpace: 'nowrap',
    },
    timeSlideContainer: {
      overflow: 'visible',
      maxHeight: isSpecificTimeEnabled ? '190px' : '0',
      opacity: isSpecificTimeEnabled ? 1 : 0,
      transform: isSpecificTimeEnabled ? 'translateX(0)' : 'translateX(-16px)',
      transition: 'all 220ms ease',
      marginTop: isSpecificTimeEnabled ? '10px' : '0',
      position: 'relative',
      zIndex: isSpecificTimeEnabled ? 20 : 'auto',
      pointerEvents: isSpecificTimeEnabled ? 'auto' : 'none',
    },
    timePickerContainer: {
      position: 'relative',
      width: '100%',
    },
    timePickerTrigger: {
      width: '100%',
      backgroundColor: theme.bgRaised,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      borderRadius: '8px',
      height: '44px',
      padding: '0 14px',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      transition: 'all 150ms ease',
    },
    timePickerInput: {
      all: 'unset',
      display: 'block',
      width: '100%',
      color: theme.textPrimary,
      fontSize: '14px',
      fontWeight: '400',
      lineHeight: '20px',
      padding: 0,
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      cursor: 'text',
    },
    timePickerPanel: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      left: 0,
      right: 0,
      backgroundColor: theme.bgCard,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      borderRadius: '10px',
      boxShadow: theme.shadows.md,
      padding: '10px 10px 8px',
      zIndex: 50,
    },
    timePartsRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '8px',
      alignItems: 'start',
    },
    timeListColumn: {
      minWidth: 0,
    },
    timeListTitle: {
      color: theme.textMuted,
      fontSize: '10px',
      fontWeight: '700',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      marginBottom: '6px',
      paddingLeft: '4px',
    },
    timeList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      maxHeight: '134px',
      overflowY: 'auto',
      paddingRight: '2px',
    },
    timeListItem: (isSelected) => ({
      border: `1px solid ${isSelected ? theme.borderMedium || theme.border : theme.borderSubtle || theme.border}`,
      borderRadius: '7px',
      backgroundColor: isSelected ? theme.bgOverlay : theme.bgRaised,
      color: isSelected ? theme.textPrimary : theme.textSecondary,
      fontSize: '13px',
      fontWeight: isSelected ? '700' : '600',
      height: '30px',
      cursor: 'pointer',
      padding: '0 8px',
      textAlign: 'center',
      transition: 'all 140ms ease',
    }),
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
    aiDiffSummary: {
      marginTop: '10px',
      borderRadius: '8px',
      padding: '10px 12px',
      border: `1px solid ${theme.primary}40`,
      background: `linear-gradient(120deg, ${theme.primary}16, ${theme.info || '#3b82f6'}10)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      fontSize: '13px',
      fontWeight: '600',
      animation: 'fadeSlideIn 0.28s ease-out',
    },
    aiDiffSummaryText: {
      margin: 0,
      lineHeight: 1.4,
      color: theme.textPrimary,
    },
    aiDiffActions: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      flexShrink: 0,
    },
    aiDiffActionButton: {
      border: 'none',
      background: 'transparent',
      padding: 0,
      color: theme.textSecondary,
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'underline',
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

        .unified-datepicker-popper {
          z-index: 1400;
          margin-left: 14px !important;
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
          <h2 style={styles.title}>{t('tasks.createTask', 'Create New Task')}</h2>
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
            <label style={styles.label}>{t('tasks.taskTitle', 'Task Title')}</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={t('tasks.titlePlaceholder', 'e.g., Redesign Homepage')}
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
                {isAssistingWrite ? t('ai.generating', 'Generating...') : t('ai.aiAssistant', 'AI Writing Assistant')}
              </button>

              {aiDiffSummary && (
                <div style={styles.aiDiffSummary} role="status" aria-live="polite">
                  <p style={styles.aiDiffSummaryText}>{aiDiffSummary}</p>
                  <div style={styles.aiDiffActions}>
                    <button
                      type="button"
                      style={styles.aiDiffActionButton}
                      onClick={handleUndoAIAssistChanges}
                    >
                      {t('common.undo', 'Undo')}
                    </button>
                    <button
                      type="button"
                      style={styles.aiDiffActionButton}
                      onClick={() => setAiDiffSummary('')}
                    >
                      {t('common.dismiss', 'Dismiss')}
                    </button>
                  </div>
                </div>
              )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>{t('tasks.description', 'Description')}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t('tasks.descriptionPlaceholder', 'Add details about the task...')}
              style={styles.textarea}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.col}>
              <div style={styles.dueDateHeader}>
                <label style={{ ...styles.label, marginBottom: 0 }}><FaCalendarAlt /> {t('tasks.dueDate', 'Due Date')}</label>
                <button
                  type="button"
                  onClick={handleSpecificTimeToggle}
                  style={styles.timeToggleButton}
                >
                  {isSpecificTimeEnabled ? t('tasks.useEndOfDay', 'Use end of day') : t('tasks.addSpecificTime', 'Add specific time')}
                </button>
              </div>
              <DatePicker
                selected={formData.dueDate ? new Date(formData.dueDate) : null}
                onChange={handleDueDateChange}
                minDate={startOfToday}
                dateFormat="MM/dd/yyyy"
                placeholderText="mm/dd/yyyy"
                wrapperClassName="unified-datepicker-wrapper"
                calendarClassName="unified-datepicker"
                popperClassName="unified-datepicker-popper"
                popperPlacement="bottom"
                isClearable
                className="custom-datepicker-input"
              />
              <div style={styles.timeSlideContainer}>
                <div ref={timePickerRef} style={styles.timePickerContainer}>
                  <div style={styles.timePickerTrigger}>
                    <input
                      type="text"
                      value={typedDueTime}
                      onChange={(e) => setTypedDueTime(e.target.value)}
                      onFocus={() => setIsTimePickerOpen(true)}
                      onClick={(e) => {
                        setIsTimePickerOpen(true);
                        requestAnimationFrame(() => selectTimeSegmentFromCaret(e.target));
                      }}
                      onBlur={commitTypedDueTime}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitTypedDueTime();
                        }
                      }}
                      placeholder={t('tasks.timePlaceholder', '09:00 AM')}
                      style={styles.timePickerInput}
                      aria-label="Type due time"
                    />
                  </div>
                  {isTimePickerOpen && (
                    <div style={styles.timePickerPanel}>
                      <div style={styles.timePartsRow}>
                        <div style={styles.timeListColumn}>
                          <div style={styles.timeListTitle}>{t('time.hour', 'Hour')}</div>
                          <div style={styles.timeList}>
                            {hourOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                style={styles.timeListItem(dueTimeParts.hour12 === option.value)}
                                onClick={() => handleHourChange(option.value)}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={styles.timeListColumn}>
                          <div style={styles.timeListTitle}>{t('time.minute', 'Minute')}</div>
                          <div style={styles.timeList}>
                            {minuteOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                style={styles.timeListItem(dueTimeParts.minute === option.value)}
                                onClick={() => handleMinuteChange(option.value)}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={styles.timeListColumn}>
                          <div style={styles.timeListTitle}>{t('time.ampm', 'AM/PM')}</div>
                          <div style={styles.timeList}>
                            {periodOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                style={styles.timeListItem(dueTimeParts.period === option.value)}
                                onClick={() => handlePeriodChange(option.value)}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
                placeholder={t('tasks.addSubtaskPlaceholder', 'Add a subtask...')}
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
              placeholder={t('tasks.tagsPlaceholder', 'Press Enter to add tags')}
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
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              style={styles.createButton}
              className="create-btn"
              disabled={isSubmitting}
            >
              <FaPlus /> {isSubmitting ? t('common.creating', 'Creating...') : t('tasks.createTaskButton', 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;