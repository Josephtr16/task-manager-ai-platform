// src/components/Tasks/TaskDetailModal.js
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { tasksAPI, timeTrackingAPI, subtasksAPI } from '../../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  FaEdit, FaTrash, FaTimes, FaSave,
  FaStopwatch, FaPaperclip, FaComment, FaShare,
  FaTag, FaCheck, FaFileUpload, FaPaperPlane, FaUserPlus,
  FaRobot, FaPlay, FaPause, FaClock
} from 'react-icons/fa';

const TaskDetailModal = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  canComplete = true,
  canComment = true,
  canEdit = true,
  canDelete = true,
  canTrackTime = true,
  canManageAttachments = true,
  canShareTask = true,
  canToggleSubtasks = true,
}) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [notification, setNotification] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

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
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    },
    modal: {
      backgroundColor: theme.bgCard,
      borderRadius: '16px',
      width: '100%',
      maxWidth: '700px',
      maxHeight: '90vh',
      overflow: 'auto',
      padding: '32px',
      boxShadow: theme.shadows.float,
      color: theme.textPrimary,
      border: `1px solid ${theme.borderMedium || theme.border}`,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '20px',
      gap: '16px',
      paddingBottom: '16px',
      borderBottom: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      flex: 1,
    },
    headerRight: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      flexShrink: 0,
    },
    title: {
      margin: 0,
      fontFamily: '"Fraunces", serif',
      fontSize: '20px',
      fontWeight: '600',
      color: theme.textPrimary,
    },
    titleInput: {
      fontFamily: '"Fraunces", serif',
      fontSize: '20px',
      fontWeight: '600',
      backgroundColor: theme.bgRaised,
      color: theme.textPrimary,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      borderRadius: '8px',
      outline: 'none',
      width: '100%',
      padding: '11px 14px',
    },
    checkboxContainer: {
      width: '24px',
      height: '24px',
      borderRadius: '6px',
      backgroundColor: theme.bgRaised,
      boxShadow: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      border: `1px solid ${theme.borderStrong || theme.border}`,
      transition: 'all 150ms ease',
      flexShrink: 0,
    },
    checkboxChecked: {
      backgroundColor: theme.success,
      border: `1px solid ${theme.success}`,
    },
    checkboxInner: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform 0.2s ease',
    },
    editButton: {
      backgroundColor: theme.primary,
      color: '#0A0908',
      border: 'none',
      borderRadius: '8px',
      padding: '0 16px',
      height: '40px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,146,74,0.3) inset',
      transition: 'all 150ms ease',
    },
    deleteButton: {
      backgroundColor: `${theme.error}14`,
      color: theme.error,
      border: 'none',
      borderRadius: '8px',
      padding: '0 16px',
      height: '40px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: 'none',
      transition: 'all 150ms ease',
    },
    saveButton: {
      backgroundColor: theme.success,
      color: '#0A0908',
      border: 'none',
      borderRadius: '8px',
      padding: '0 16px',
      height: '40px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: 'none',
      transition: 'all 150ms ease',
    },
    sendButton: {
      backgroundColor: theme.primary,
      color: '#0A0908',
      border: 'none',
      borderRadius: '8px',
      padding: '0 20px',
      height: '40px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,146,74,0.3) inset',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 150ms ease',
    },
    cancelEditButton: {
      backgroundColor: theme.bgRaised,
      color: theme.textSecondary,
      border: 'none',
      borderRadius: '8px',
      padding: '0 12px',
      height: '40px',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: 'none',
    },
    closeButton: {
      backgroundColor: theme.bgRaised,
      border: `1px solid ${theme.borderMedium || theme.border}`,
      color: theme.textSecondary,
      fontSize: '16px',
      cursor: 'pointer',
      width: '32px',
      height: '32px',
      padding: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      transition: 'all 150ms ease',
    },
    notification: {
      marginBottom: '16px',
      padding: '12px 14px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
    },
    confirmOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1200,
      padding: '16px',
    },
    confirmDialog: {
      width: '100%',
      maxWidth: '420px',
      backgroundColor: theme.bgCard,
      borderRadius: '16px',
      border: `1px solid ${theme.borderMedium || theme.border}`,
      boxShadow: theme.shadows.float,
      padding: '20px',
    },
    confirmTitle: {
      margin: 0,
      fontSize: '18px',
      fontWeight: '700',
      color: theme.textPrimary,
    },
    confirmText: {
      margin: '10px 0 18px 0',
      color: theme.textSecondary,
      fontSize: '14px',
      lineHeight: '1.5',
    },
    confirmActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
    },
    confirmCancelBtn: {
      border: `1px solid ${theme.borderMedium || theme.border}`,
      backgroundColor: 'transparent',
      color: theme.textPrimary,
      borderRadius: '8px',
      padding: '0 14px',
      height: '40px',
      cursor: 'pointer',
      fontWeight: '600',
    },
    confirmDeleteBtn: {
      border: 'none',
      backgroundColor: theme.error,
      color: '#0A0908',
      borderRadius: '8px',
      padding: '0 14px',
      height: '40px',
      cursor: 'pointer',
      fontWeight: '700',
      boxShadow: 'none',
    },
    badges: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      marginBottom: '24px',
    },
    badge: {
      fontSize: '10px',
      fontWeight: '600',
      padding: '2px 6px',
      borderRadius: '6px',
    },
    badgeSecondary: {
      fontSize: '10px',
      fontWeight: '500',
      padding: '2px 6px',
      borderRadius: '6px',
      backgroundColor: theme.bgRaised,
      color: theme.textSecondary,
      textTransform: 'capitalize',
      border: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    section: {
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      fontFamily: '"Fraunces", serif',
      color: theme.textPrimary,
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    description: {
      fontSize: '14px',
      color: theme.textSecondary,
      lineHeight: '1.6',
      margin: 0,
    },
    textarea: {
      width: '100%',
      backgroundColor: theme.bgRaised,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      borderRadius: '8px',
      padding: '11px 14px',
      fontSize: '14px',
      color: theme.textPrimary,
      resize: 'vertical',
      fontFamily: 'Geist, sans-serif',
      outline: 'none',
      boxShadow: 'none',
    },
    input: {
      backgroundColor: theme.bgRaised,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      borderRadius: '8px',
      padding: '11px 14px',
      fontSize: '14px',
      color: theme.textPrimary,
      width: '100%',
      outline: 'none',
      boxShadow: 'none',
    },
    clearDeadlineButton: {
      backgroundColor: theme.bgRaised,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      color: theme.textSecondary,
      borderRadius: '8px',
      padding: '6px 10px',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    timerButton: {
      color: '#0A0908',
      border: 'none',
      borderRadius: '8px',
      padding: '0 20px',
      height: '40px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      boxShadow: 'none',
      transition: 'all 150ms ease',
    },
    trackingText: {
      fontSize: '14px',
      color: theme.urgent, // Use urgent color for tracking indication? Or wait for error color. 'error' from theme.
      marginTop: '8px',
      textAlign: 'center',
    },
    tagsContainer: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
    },
    tag: {
      fontSize: '12px',
      padding: '6px 12px',
      borderRadius: '6px',
      backgroundColor: theme.bgElevated,
      color: theme.textSecondary,
      border: `1px solid ${theme.border}`,
    },
    subtasksList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    subtaskItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      backgroundColor: theme.bgCard,
      borderRadius: '8px',
      border: `1px solid ${theme.border}`,
    },
    subtaskText: {
      fontSize: '14px',
      color: theme.textPrimary,
    },
    aiInsight: {
      backgroundColor: theme.bgRaised,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      borderRadius: '8px',
      padding: '14px',
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
      boxShadow: 'none',
    },
    aiInsightText: {
      fontSize: '14px',
      color: theme.textSecondary,
      lineHeight: '1.6',
      margin: 0,
    },
    metadata: {
      borderTop: `1px solid ${theme.border}`,
      paddingTop: '16px',
      marginTop: '8px',
    },
    metaText: {
      fontSize: '12px',
      color: theme.textMuted,
      margin: '4px 0',
    },
    attachmentsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '12px'
    },
    attachmentItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      fontSize: '14px',
      color: theme.textPrimary,
      padding: '8px',
      backgroundColor: theme.bgRaised,
      borderRadius: '8px',
      border: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    attachmentLink: {
      color: theme.textPrimary,
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    attachmentActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginLeft: '12px',
      flexShrink: 0,
    },
    removeAttachmentButton: {
      border: 'none',
      backgroundColor: `${theme.error}20`,
      color: theme.error,
      borderRadius: '8px',
      padding: '4px 8px',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    fileSize: {
      color: theme.textMuted,
      fontSize: '12px'
    },
    uploadButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0 20px',
      height: '40px',
      backgroundColor: theme.bgRaised,
      border: `1px dashed ${theme.borderMedium || theme.border}`,
      color: theme.accent,
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'all 180ms ease',
      boxShadow: 'none',
    },
    commentsList: {
      maxHeight: '200px',
      overflowY: 'auto',
      marginBottom: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '4px', // Add padding for shadow visibility
    },
    commentItem: {
      backgroundColor: theme.bgRaised,
      padding: '12px',
      borderRadius: '8px',
      border: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    commentText: {
      margin: '0 0 4px 0',
      fontSize: '14px',
      color: theme.textPrimary
    },
    commentDate: {
      fontSize: '10px',
      color: theme.textMuted
    },
    addComment: {
      display: 'flex',
      gap: '12px'
    },
    commentInput: {
      flex: 1,
      backgroundColor: theme.bgRaised,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      borderRadius: '8px',
      padding: '11px 14px',
      fontSize: '14px',
      color: theme.textPrimary,
      outline: 'none',
      boxShadow: 'none',
    },
    shareInputContainer: {
      display: 'flex',
      gap: '12px',
      marginBottom: '8px'
    },
    shareInput: {
      flex: 1,
      backgroundColor: theme.bgRaised,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      borderRadius: '8px',
      padding: '11px 14px',
      fontSize: '14px',
      color: theme.textPrimary,
      outline: 'none',
      boxShadow: 'none',
    },
    shareButton: {
      backgroundColor: theme.primary,
      color: '#0A0908',
      border: 'none',
      borderRadius: '8px',
      padding: '0 20px',
      height: '40px',
      cursor: 'pointer',
      boxShadow: 'none',
      fontWeight: '600',
    },
    sharedInfo: {
      fontSize: '12px',
      color: theme.textMuted,
      margin: 0
    }
  };

  // Modern Checkbox Component
  const Checkbox = ({ checked, onChange, style }) => (
    <div
      onClick={(e) => { e.stopPropagation(); onChange({ target: { checked: !checked } }); }}
      style={{
        ...styles.checkboxContainer,
        ...(checked && styles.checkboxChecked),
        borderColor: checked ? theme.success : 'transparent',
        ...style
      }}
    >
      <div style={{
        ...styles.checkboxInner,
        transform: checked ? 'scale(1)' : 'scale(0)',
      }}>
        <FaCheck size={10} color="#fff" />
      </div>
    </div>
  );

  const toDateTimeLocalValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        deadline: toDateTimeLocalValue(task.deadline),
      });
      setIsTracking(task?.timeTracking?.isTracking || false);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async () => {
    if (!canEdit) {
      showNotification('error', 'You do not have permission to edit this task.');
      return;
    }
    setLoading(true);
    try {
      let normalizedDeadline = null;
      if (formData.deadline) {
        const parsedDeadline = new Date(formData.deadline);
        if (Number.isNaN(parsedDeadline.getTime())) {
          showNotification('error', 'Please enter a valid deadline date/time.');
          setLoading(false);
          return;
        }
        if (parsedDeadline.getTime() < Date.now()) {
          showNotification('error', 'Deadline cannot be in the past.');
          setLoading(false);
          return;
        }
        normalizedDeadline = parsedDeadline.toISOString();
      }

      const updatePayload = {
        title: formData.title,
        description: formData.description,
        estimatedDuration: Number(formData.estimatedDuration) || 60,
        deadline: normalizedDeadline,
      };

      const response = await tasksAPI.updateTask(task._id, updatePayload);
      const updatedTask = response?.data?.task || response?.data;

      if (updatedTask && updatedTask._id) {
        onTaskUpdated(updatedTask);
        setIsEditing(false);
        showNotification('success', 'Task updated successfully.');
      } else {
        showNotification('error', 'Task update response was invalid.');
      }
    } catch (error) {
      console.error('Update error:', error);
      showNotification('error', error.response?.data?.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      showNotification('error', 'You do not have permission to delete this task.');
      return;
    }
    setLoading(true);
    try {
      const response = await tasksAPI.deleteTask(task._id);
      if (response.data.success) {
        onTaskDeleted(task._id);
        onClose();
      }
    } catch (error) {
      console.error('Delete error:', error);
      showNotification('error', 'Failed to delete task');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleToggleTimer = async () => {
    if (!canTrackTime) {
      showNotification('error', 'You do not have permission to track time on this task.');
      return;
    }
    try {
      if (isTracking) {
        const response = await timeTrackingAPI.stopTimer(task._id);
        if (response.data.success) {
          setIsTracking(false);
          onTaskUpdated(response.data.task);
        }
      } else {
        const response = await timeTrackingAPI.startTimer(task._id);
        if (response.data.success) {
          setIsTracking(true);
          onTaskUpdated(response.data.task);
        }
      }
    } catch (error) {
      console.error('Timer error:', error);
    }
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

  const formatDate = (date) => {
    if (!date) return 'No deadline';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /* Attachments Helper */
  const handleFileUpload = async (e) => {
    if (!canManageAttachments) {
      showNotification('error', 'You do not have permission to manage attachments.');
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await tasksAPI.addAttachment(task._id, formData);
      if (response.data.success) {
        onTaskUpdated({
          ...task,
          attachments: [...(task.attachments || []), response.data.attachment]
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('error', 'Failed to upload file');
    }
  };

  /* Comments Helper */
  const handleAddComment = async () => {
    if (!canComment) {
      showNotification('error', 'You do not have permission to comment on this task.');
      return;
    }
    if (!newComment.trim()) return;
    try {
      const response = await tasksAPI.addComment(task._id, newComment);
      if (response.data.success) {
        onTaskUpdated({
          ...task,
          comments: [...(task.comments || []), response.data.comment]
        });
        setNewComment('');
      }
    } catch (error) {
      console.error('Comment error:', error);
      showNotification('error', 'Failed to add comment');
    }
  };

  /* Share Helper */
  const handleShare = async () => {
    if (!canShareTask) {
      showNotification('error', 'You do not have permission to share this task.');
      return;
    }
    if (!shareEmail.trim()) return;
    try {
      const response = await tasksAPI.shareTask(task._id, shareEmail);
      if (response.data.success) {
        showNotification('success', `Task shared with ${response.data.user.email}`);
        onTaskUpdated({
          ...task,
          sharedWith: [...(task.sharedWith || []), response.data.user.id]
        });
        setShareEmail('');
      }
    } catch (error) {
      console.error('Share error:', error);
      showNotification('error', 'Failed to share task: ' + (error.response?.data?.message || error.message));
    }
  };

  const getAttachmentUrl = (file) => {
    if (!file?.filepath) {
      return '#';
    }

    const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const serverBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
    const normalizedPath = String(file.filepath).replace(/\\/g, '/').replace(/^\/+/, '');
    return `${serverBaseUrl}/${normalizedPath}`;
  };

  const handleRemoveAttachment = async (attachmentId) => {
    if (!canManageAttachments) {
      showNotification('error', 'You do not have permission to remove attachments.');
      return;
    }

    if (!attachmentId) {
      return;
    }

    try {
      const response = await tasksAPI.deleteAttachment(task._id, attachmentId);
      if (response?.data?.task) {
        setFormData(response.data.task);
        onTaskUpdated(response.data.task);
      }
    } catch (error) {
      console.error('Attachment delete error:', error);
      showNotification('error', error.response?.data?.message || 'Failed to remove attachment.');
    }
  };

  const displayedAttachments = Array.isArray(formData.attachments)
    ? formData.attachments
    : Array.isArray(task.attachments)
      ? task.attachments
      : [];

  const handleToggleSubtask = async (subtask) => {
    if (!canToggleSubtasks) {
      showNotification('error', 'You do not have permission to update subtasks.');
      return;
    }

    const subtaskId = subtask?._id || subtask?.id;
    if (!subtaskId) {
      return;
    }

    const previousSubtasks = Array.isArray(formData.subtasks) ? formData.subtasks : [];

    // Optimistic UI update so the checkbox feels responsive.
    setFormData((prev) => ({
      ...prev,
      subtasks: (Array.isArray(prev.subtasks) ? prev.subtasks : []).map((item) => {
        const itemId = item?._id || item?.id;
        return itemId === subtaskId ? { ...item, completed: !item.completed } : item;
      }),
    }));

    try {
      const response = await subtasksAPI.toggleSubtask(task._id, subtaskId);
      const updatedTask = response?.data?.task;

      if (updatedTask) {
        setFormData(updatedTask);
        onTaskUpdated(updatedTask);
      }
    } catch (error) {
      // Roll back optimistic state on failure.
      setFormData((prev) => ({ ...prev, subtasks: previousSubtasks }));
      console.error('Toggle subtask error:', error);
      showNotification('error', error.response?.data?.message || 'Failed to update subtask status.');
    }
  };

  const displayedSubtasks = Array.isArray(formData.subtasks)
    ? formData.subtasks
    : Array.isArray(task.subtasks)
      ? task.subtasks
      : [];

  const now = new Date();
  const selectedDeadlineDate = formData.deadline ? new Date(formData.deadline) : null;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const isSameDayAsToday =
    selectedDeadlineDate && !Number.isNaN(selectedDeadlineDate.getTime())
      ? selectedDeadlineDate.toDateString() === now.toDateString()
      : false;
  const minSelectableTime = isSameDayAsToday ? now : startOfDay;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <style>{`
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

        .task-detail-datepicker-wrapper {
          width: 100%;
          display: block;
        }

        .task-detail-datepicker-wrapper .react-datepicker__input-container input {
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

        .task-detail-datepicker {
          background-color: ${theme.bgCard};
          border: 1px solid ${theme.borderSubtle || theme.border};
          border-radius: 10px;
          box-shadow: ${theme.shadows.md};
          color: ${theme.textPrimary};
          font-family: 'Geist', sans-serif;
        }

        .task-detail-datepicker .react-datepicker__header {
          background-color: ${theme.bgCard};
          border-bottom: 1px solid ${theme.borderSubtle || theme.border};
        }

        .task-detail-datepicker .react-datepicker__current-month,
        .task-detail-datepicker .react-datepicker-time__header,
        .task-detail-datepicker .react-datepicker__day-name,
        .task-detail-datepicker .react-datepicker__time-name {
          color: ${theme.textSecondary};
        }

        .task-detail-datepicker .react-datepicker__day,
        .task-detail-datepicker .react-datepicker__time-list-item {
          color: ${theme.textPrimary};
          border-radius: 6px;
        }

        .task-detail-datepicker .react-datepicker__day:hover,
        .task-detail-datepicker .react-datepicker__time-list-item:hover {
          background-color: ${theme.bgElevated};
        }

        .task-detail-datepicker .react-datepicker__day--selected,
        .task-detail-datepicker .react-datepicker__day--keyboard-selected,
        .task-detail-datepicker .react-datepicker__time-list-item--selected {
          background-color: ${theme.primary} !important;
          color: #0A0908 !important;
        }

        .task-detail-datepicker .react-datepicker__time-list-item--selected:hover,
        .task-detail-datepicker .react-datepicker__day--selected:hover,
        .task-detail-datepicker .react-datepicker__day--keyboard-selected:hover {
          background-color: ${theme.primaryDark || theme.primary} !important;
          color: #0A0908 !important;
        }

        .task-detail-datepicker .react-datepicker__navigation-icon::before {
          border-color: ${theme.textSecondary} !important;
        }

        .task-detail-datepicker .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: ${theme.textPrimary} !important;
        }

        .task-detail-datepicker .react-datepicker__time-container {
          border-left: 1px solid ${theme.borderSubtle || theme.border};
        }

        .task-detail-datepicker .react-datepicker__time-container .react-datepicker__time,
        .task-detail-datepicker .react-datepicker__time-container .react-datepicker__time-box,
        .task-detail-datepicker .react-datepicker__time-container .react-datepicker__time-list {
          background-color: ${theme.bgCard};
        }

        .task-detail-datepicker .react-datepicker__time-list-item--disabled {
          color: ${theme.textMuted};
          opacity: 0.55;
          background-color: transparent;
        }

        .task-detail-datepicker-wrapper .react-datepicker__close-icon::after {
          background-color: ${theme.primary} !important;
          color: #0A0908 !important;
          font-weight: 700;
        }
      `}</style>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {notification && (
          <div
            style={{
              ...styles.notification,
              backgroundColor: notification.type === 'error' ? `${theme.error}22` : `${theme.success}22`,
              color: notification.type === 'error' ? theme.error : theme.success,
            }}
          >
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            {canComplete && (
              <Checkbox
                checked={formData.status === 'done'}
                onChange={(e) => {
                  const newStatus = e.target.checked ? 'done' : 'todo';
                  setFormData({ ...formData, status: newStatus });
                  tasksAPI.updateTask(task._id, { status: newStatus })
                    .then(res => onTaskUpdated(res.data.task));
                }}
                style={{ marginTop: '6px' }}
              />
            )}
            {isEditing ? (
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                style={styles.titleInput}
              />
            ) : (
              <h2 style={styles.title}>{formData.title}</h2>
            )}
          </div>
          <div style={styles.headerRight}>
            {isEditing ? (
              <>
                <button
                  onClick={handleUpdate}
                  style={styles.saveButton}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : <><FaSave /> Save</>}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  style={styles.cancelEditButton}
                >
                  <FaTimes />
                </button>
              </>
            ) : (
              <>
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    style={styles.editButton}
                  >
                    <FaEdit /> Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={styles.deleteButton}
                    disabled={loading}
                  >
                    <FaTrash /> Delete
                  </button>
                )}
                <button onClick={onClose} style={styles.closeButton}>
                  <FaTimes />
                </button>
              </>
            )}
          </div>
        </div>

        {showDeleteConfirm && (
          <div style={styles.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
            <div style={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.confirmTitle}>Delete Task</h3>
              <p style={styles.confirmText}>Are you sure you want to delete this task? This action cannot be undone.</p>
              <div style={styles.confirmActions}>
                <button type="button" style={styles.confirmCancelBtn} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button type="button" style={styles.confirmDeleteBtn} onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Status Badges */}
        <div style={styles.badges}>
          {formData.priority && (
            <span style={{
              ...styles.badge,
              backgroundColor: getPriorityColor(formData.priority) + '20',
              color: getPriorityColor(formData.priority)
            }}>
              {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
            </span>
          )}
          <span style={styles.badgeSecondary}>{formData.status}</span>
          <span style={styles.badgeSecondary}>{formData.category}</span>
          {task.aiPriorityScore && (
            <span style={{
              ...styles.badge,
              backgroundColor: theme.accentDim || `${theme.accent}15`,
              color: theme.accent
            }}>
              <FaRobot style={{ fontSize: '10px' }} /> AI {task.aiPriorityScore}%
            </span>
          )}
        </div>

        {/* Description */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}><FaComment style={{ fontSize: '16px' }} /> Description</h3>
          {isEditing ? (
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              style={styles.textarea}
              rows="4"
            />
          ) : (
            <p style={styles.description}>
              {formData.description || 'No description provided'}
            </p>
          )}
        </div>

        {/* Estimated Duration */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}><FaClock style={{ fontSize: '16px' }} /> Deadline</h3>
          {isEditing ? (
            <div>
              <DatePicker
                selected={formData.deadline ? new Date(formData.deadline) : null}
                onChange={(selectedDate) =>
                  setFormData((prev) => ({
                    ...prev,
                    deadline: selectedDate ? toDateTimeLocalValue(selectedDate) : '',
                  }))
                }
                minDate={now}
                minTime={minSelectableTime}
                maxTime={endOfDay}
                showTimeSelect
                timeIntervals={15}
                dateFormat="MM/dd/yyyy h:mm aa"
                placeholderText="mm/dd/yyyy --:-- --"
                wrapperClassName="task-detail-datepicker-wrapper"
                calendarClassName="task-detail-datepicker"
                popperPlacement="bottom-start"
                isClearable
                className="custom-datepicker-input"
              />
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, deadline: '' }))}
                style={{ ...styles.clearDeadlineButton, marginTop: '10px' }}
              >
                Clear
              </button>
            </div>
          ) : (
            <p style={styles.description}>{formatDate(formData.deadline)}</p>
          )}
        </div>

        {/* Estimated Duration */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}><FaClock style={{ fontSize: '16px' }} /> Estimated Duration</h3>
          {isEditing ? (
            <div>
              <input
                type="number"
                name="estimatedDuration"
                value={formData.estimatedDuration || 60}
                onChange={handleChange}
                style={styles.input}
                min="1"
              />
              <p style={{ fontSize: '12px', color: theme.textMuted, marginTop: '6px' }}>in minutes</p>
            </div>
          ) : (
            <p style={styles.description}>
              {(() => {
                const mins = Number(formData.estimatedDuration) || 60;
                if (mins < 60) return `${mins}m`;
                const hours = mins / 60;
                return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
              })()}
            </p>
          )}
        </div>

        {/* Time Tracking */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}><FaStopwatch style={{ fontSize: '16px' }} /> Time Tracking</h3>
          {canTrackTime ? (
            <>
              <button
                onClick={handleToggleTimer}
                style={{
                  ...styles.timerButton,
                  backgroundColor: isTracking ? theme.error : theme.success,
                }}
              >
                {isTracking ? <><FaPause /> Stop Timer</> : <><FaPlay /> Start Timer</>}
              </button>
              {isTracking && (
                <p style={{
                  ...styles.trackingText,
                  color: theme.error
                }}>Timer is running...</p>
              )}
            </>
          ) : (
            <p style={styles.description}>You do not have permission to track time on this task.</p>
          )}
        </div>

        {/* Attachments */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}><FaPaperclip style={{ fontSize: '16px' }} /> Attachments</h3>
          <div style={styles.attachmentsList}>
            {displayedAttachments.map((file, i) => (
              <div key={file._id || i} style={styles.attachmentItem}>
                <a
                  href={getAttachmentUrl(file)}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.attachmentLink}
                  title={file.filename}
                  onClick={(e) => e.stopPropagation()}
                >
                  <FaPaperclip /> {file.filename}
                </a>
                <div style={styles.attachmentActions}>
                  <span style={styles.fileSize}>({Math.round((file.filesize || 0) / 1024)}KB)</span>
                  {canManageAttachments && (
                    <button
                      type="button"
                      style={styles.removeAttachmentButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAttachment(file._id);
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {canManageAttachments && (
            <label style={styles.uploadButton}>
              <FaFileUpload /> Upload File
              <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          )}
        </div>

        {/* Comments */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}><FaComment style={{ fontSize: '16px' }} /> Comments</h3>
          <div style={styles.commentsList}>
            {task.comments?.map((comment, i) => (
              <div key={i} style={styles.commentItem}>
                <p style={styles.commentText}>{comment.text}</p>
                <span style={styles.commentDate}>{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
          {canComment ? (
            <div style={styles.addComment}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                style={styles.commentInput}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button onClick={handleAddComment} style={styles.sendButton}><FaPaperPlane /> Send</button>
            </div>
          ) : (
            <p style={styles.description}>You do not have permission to add comments.</p>
          )}
        </div>

        {/* Sharing */}
        {canShareTask && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}><FaShare style={{ fontSize: '16px' }} /> Share</h3>
            <div style={styles.shareInputContainer}>
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="Enter email to share with"
                style={styles.shareInput}
              />
              <button onClick={handleShare} style={styles.shareButton}><FaUserPlus /> Invite</button>
            </div>
            {task.sharedWith?.length > 0 && (
              <p style={styles.sharedInfo}>Shared with {task.sharedWith.length} users</p>
            )}
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}><FaTag style={{ fontSize: '16px' }} /> Tags</h3>
            <div style={styles.tagsContainer}>
              {task.tags.map((tag, index) => (
                <span key={index} style={styles.tag}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Subtasks */}
        {displayedSubtasks.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <FaCheck style={{ fontSize: '16px' }} /> Subtasks ({displayedSubtasks.filter(s => s.completed).length}/{displayedSubtasks.length})
            </h3>
            <div style={styles.subtasksList}>
              {displayedSubtasks.map((subtask, index) => (
                <div key={subtask._id || index} style={styles.subtaskItem}>
                  {canToggleSubtasks && (
                    <Checkbox
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtask(subtask)}
                      style={{ marginRight: '12px' }}
                    />
                  )}
                  <span style={{
                    ...styles.subtaskText,
                    textDecoration: subtask.completed ? 'line-through' : 'none',
                    color: subtask.completed ? theme.textMuted : theme.textPrimary,
                  }}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insight */}
        {task.aiInsight && (
          <div style={styles.aiInsight}>
            <span style={{ fontSize: '20px' }}><FaRobot /></span>
            <p style={styles.aiInsightText}>{task.aiInsight}</p>
          </div>
        )}

        {/* Metadata */}
        <div style={styles.metadata}>
          <p style={styles.metaText}>Created: {formatDate(task.createdAt)}</p>
          <p style={styles.metaText}>Last updated: {formatDate(task.updatedAt)}</p>
          <p style={styles.metaText}>Task ID: {task._id?.slice(-8)}</p>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;