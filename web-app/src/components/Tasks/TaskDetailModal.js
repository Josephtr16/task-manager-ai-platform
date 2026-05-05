// src/components/Tasks/TaskDetailModal.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { tasksAPI, timeTrackingAPI, subtasksAPI } from '../../services/api';
import { aiService } from '../../services/aiService';
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
  mentionUsers = [],
}) => {
  const { theme: themeFromContext } = useTheme();
  const theme = themeFromContext || {};
  const successColor = theme.success || '#5E8A6E';
  const errorColor = theme.error || '#B85C5C';
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [notification, setNotification] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dependencyOptions, setDependencyOptions] = useState([]);
  const [loadingDependencies, setLoadingDependencies] = useState(false);
  const [commentSelectionStart, setCommentSelectionStart] = useState(0);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [pendingSubtasks, setPendingSubtasks] = useState([]);
  const [showSubtasksReview, setShowSubtasksReview] = useState(false);
  const [reviewSubtaskEdits, setReviewSubtaskEdits] = useState({});
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');
  const commentInputRef = useRef(null);

  const renderTextWithMentions = (text) => {
    const rawText = String(text || '');
    const parts = rawText.split(/(@[A-Za-z0-9_.-]+)/g);

    return parts.map((part, index) => {
      if (/^@[A-Za-z0-9_.-]+$/.test(part)) {
        return (
          <span key={`${part}-${index}`} style={{ color: theme.accent, fontWeight: 700 }}>
            {part}
          </span>
        );
      }

      return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
    });
  };

  const collaboratorSuggestions = useMemo(() => {
    const seen = new Set();
    const suggestions = [];

    const addSuggestion = (candidate) => {
      if (!candidate) return;

      if (typeof candidate === 'string') {
        const rawValue = candidate.trim();
        const inferredEmail = rawValue.includes('@') ? rawValue : '';
        const inferredName = inferredEmail ? inferredEmail.split('@')[0] : rawValue;
        const inferredId = rawValue;

        if (!inferredId || seen.has(inferredId)) return;
        seen.add(inferredId);

        suggestions.push({
          id: inferredId,
          name: inferredName || inferredEmail || 'User',
          email: inferredEmail,
          initial: (inferredName || inferredEmail || 'U').charAt(0).toUpperCase(),
        });

        return;
      }

      const name = String(candidate.name || '').trim();
      const email = String(candidate.email || '').trim();
      const id = String(candidate._id || candidate.id || email || name).trim();

      if (!id || seen.has(id)) return;
      seen.add(id);

      suggestions.push({
        id,
        name: name || email || 'User',
        email,
        initial: (name || email || 'U').charAt(0).toUpperCase(),
      });
    };

    if (Array.isArray(mentionUsers)) {
      mentionUsers.forEach(addSuggestion);
    }

    addSuggestion(task?.userId && typeof task.userId === 'object' ? task.userId : null);

    if (Array.isArray(task?.sharedWith)) {
      task.sharedWith.forEach(addSuggestion);
    }

    if (Array.isArray(task?.comments)) {
      task.comments.forEach((comment) => addSuggestion(comment?.user));
    }

    return suggestions;
  }, [task, mentionUsers]);

  const mentionContext = useMemo(() => {
    const textBeforeCursor = String(newComment || '').slice(0, commentSelectionStart);
    const match = textBeforeCursor.match(/(^|\s)@([A-Za-z0-9_.-]*)$/);

    if (!match) {
      return null;
    }

    const triggerStart = textBeforeCursor.lastIndexOf('@');
    const query = match[2] || '';

    return {
      triggerStart,
      query,
    };
  }, [newComment, commentSelectionStart]);

  const filteredMentionSuggestions = useMemo(() => {
    if (!mentionContext) {
      return [];
    }

    const normalizedQuery = mentionContext.query.trim().toLowerCase();

    return collaboratorSuggestions.filter((person) => {
      if (!normalizedQuery) {
        return true;
      }

      return person.name.toLowerCase().includes(normalizedQuery)
        || person.email.toLowerCase().includes(normalizedQuery);
    });
  }, [collaboratorSuggestions, mentionContext]);

  const insertMention = (person) => {
    if (!mentionContext) {
      return;
    }

    const insertionLabel = person.name || person.email;
    const before = newComment.slice(0, mentionContext.triggerStart);
    const after = newComment.slice(commentSelectionStart);
    const nextValue = `${before}@${insertionLabel} ${after}`.replace(/\s{2,}/g, ' ');

    setNewComment(nextValue);

    requestAnimationFrame(() => {
      if (commentInputRef.current) {
        const nextCursor = `${before}@${insertionLabel} `.length;
        commentInputRef.current.focus();
        commentInputRef.current.setSelectionRange(nextCursor, nextCursor);
        setCommentSelectionStart(nextCursor);
      }
    });
  };

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
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(2px)',
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
    subtasksReviewList: {
      maxHeight: '400px',
      overflowY: 'auto',
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    subtaskReviewItem: {
      backgroundColor: theme.bgBase,
      border: `1px solid ${theme.borderLight}`,
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    subtaskItemLabel: {
      fontSize: '11px',
      fontWeight: '600',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    subtaskReviewInput: {
      width: '100%',
      padding: '8px 10px',
      borderRadius: '6px',
      border: `1px solid ${theme.borderMedium}`,
      backgroundColor: theme.bgCard,
      color: theme.textPrimary,
      fontSize: '13px',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
    },
    subtaskEstimate: {
      fontSize: '12px',
      color: theme.textSecondary,
      fontWeight: '500',
    },
    subtasksEditList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    subtaskEditItem: {
      backgroundColor: theme.bgBase,
      border: `1px solid ${theme.borderLight}`,
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    subtaskEditInput: {
      flex: 1,
      padding: '8px 10px',
      borderRadius: '6px',
      border: `1px solid ${theme.borderMedium}`,
      backgroundColor: theme.bgCard,
      color: theme.textPrimary,
      fontSize: '13px',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
    },
    subtaskActionBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      color: '#0A0908',
      fontSize: '13px',
      fontWeight: '600',
      transition: 'opacity 150ms ease',
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
    commentComposer: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      flex: 1,
      minWidth: 0,
    },
    mentionDropdown: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 'calc(100% + 8px)',
      zIndex: 20,
      backgroundColor: theme.bgCard,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      borderRadius: '12px',
      boxShadow: theme.shadows.float,
      overflow: 'hidden',
      maxHeight: '220px',
      overflowY: 'auto',
    },
    mentionDropdownHeader: {
      padding: '10px 12px',
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: theme.textMuted,
      borderBottom: `1px solid ${theme.borderSubtle || theme.border}`,
      backgroundColor: theme.bgRaised,
    },
    mentionOption: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left',
    },
    mentionAvatar: {
      width: '34px',
      height: '34px',
      borderRadius: '50%',
      backgroundColor: `${theme.primary}18`,
      color: theme.primary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '800',
      flexShrink: 0,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    mentionName: {
      margin: 0,
      fontSize: '14px',
      fontWeight: '700',
      color: theme.textPrimary,
      lineHeight: 1.3,
    },
    mentionMeta: {
      margin: '2px 0 0',
      fontSize: '12px',
      color: theme.textMuted,
      lineHeight: 1.3,
    },
    mentionEmpty: {
      padding: '12px',
      fontSize: '13px',
      color: theme.textSecondary,
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
        dependencies: Array.isArray(task.dependencies)
          ? task.dependencies.map((dep) => (typeof dep === 'string' ? dep : dep?._id)).filter(Boolean)
          : [],
        deadline: toDateTimeLocalValue(task.deadline),
      });
      setIsTracking(task?.timeTracking?.isTracking || false);
    }
  }, [task]);

  useEffect(() => {
    const loadDependencyOptions = async () => {
      if (!task?._id) {
        setDependencyOptions([]);
        return;
      }

      setLoadingDependencies(true);
      try {
        const params = task.projectId ? { projectId: task.projectId, limit: 200 } : { limit: 200 };
        const response = await tasksAPI.getTasks(params);
        const list = Array.isArray(response?.data?.tasks)
          ? response.data.tasks
          : Array.isArray(response?.data)
            ? response.data
            : [];

        setDependencyOptions(list.filter((item) => item?._id && item._id !== task._id));
      } catch (error) {
        console.error('Failed to load dependency options:', error);
        setDependencyOptions([]);
      } finally {
        setLoadingDependencies(false);
      }
    };

    loadDependencyOptions();
  }, [task?._id, task?.projectId]);

  if (!isOpen || !task) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const hasCircularDependency = (candidateDependencyId) => {
    if (!task?._id || !candidateDependencyId) return false;

    const dependencyMap = new Map();

    dependencyOptions.forEach((item) => {
      const deps = Array.isArray(item.dependencies)
        ? item.dependencies
          .map((dep) => (typeof dep === 'string' ? dep : dep?._id))
          .filter(Boolean)
        : [];
      dependencyMap.set(item._id, deps);
    });

    const selectedDependencies = Array.isArray(formData.dependencies)
      ? formData.dependencies.filter((depId) => depId !== candidateDependencyId)
      : [];
    dependencyMap.set(task._id, selectedDependencies);

    const visited = new Set();
    const stack = [candidateDependencyId];

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (!currentId || visited.has(currentId)) continue;
      if (currentId === task._id) return true;

      visited.add(currentId);
      const currentDeps = dependencyMap.get(currentId) || [];
      currentDeps.forEach((depId) => {
        if (!visited.has(depId)) {
          stack.push(depId);
        }
      });
    }

    return false;
  };

  const handleDependencyToggle = (dependencyId) => {
    if (!dependencyId) return;

    const existing = Array.isArray(formData.dependencies) ? formData.dependencies : [];
    const isSelected = existing.includes(dependencyId);

    if (!isSelected && hasCircularDependency(dependencyId)) {
      showNotification('error', 'Circular dependency detected. This selection is not allowed.');
      return;
    }

    const updated = isSelected
      ? existing.filter((id) => id !== dependencyId)
      : [...existing, dependencyId];

    setFormData((prev) => ({
      ...prev,
      dependencies: updated,
    }));
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
        dependencies: Array.isArray(formData.dependencies) ? formData.dependencies : [],
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

  const getProjectLabel = (project) => {
    if (!project) return '';
    if (typeof project === 'string') return project;
    return project.title || project.name || project.projectTitle || project.projectName || project.label || '';
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
    const draftComment = newComment.trim();
    if (!draftComment || isSendingComment) return;

    setIsSendingComment(true);
    setNewComment('');
    setCommentSelectionStart(0);

    try {
      const response = await tasksAPI.addComment(task._id, draftComment);
      if (response.data.success) {
        const createdComment = response.data.data?.comment;
        onTaskUpdated({
          ...task,
          comments: [...(task.comments || []), createdComment]
        });
      }
    } catch (error) {
      console.error('Comment error:', error);
      setNewComment(draftComment);
      showNotification('error', 'Failed to add comment');
    } finally {
      setIsSendingComment(false);
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
        const sharedUser = response.data.data?.user;
        showNotification('success', `Task shared with ${sharedUser?.email || shareEmail}`);
        onTaskUpdated({
          ...task,
          sharedWith: [...(task.sharedWith || []), sharedUser ? {
            _id: sharedUser._id || sharedUser.id,
            name: sharedUser.name,
            email: sharedUser.email || shareEmail,
          } : {
            _id: shareEmail,
            name: shareEmail.split('@')[0],
            email: shareEmail,
          }]
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

  const handleGenerateSubtasks = async () => {
    if (isGeneratingSubtasks || loading) return;
    
    setIsGeneratingSubtasks(true);
    try {
      const projectContext = formData.projectId?.title || task.projectId?.title || 'General';
      const taskTitle = formData.title || task.title;
      const taskDescription = formData.description || task.description;
      const category = formData.category || task.category;
      const estimatedMinutes = formData.estimatedDuration || task.estimatedDuration || 60;

      // Call AI service to generate subtasks
      const result = await aiService.generateSubtasks(
        projectContext,
        taskTitle,
        taskDescription,
        category,
        'execution',
        estimatedMinutes
      );

      if (!result?.subtasks || result.subtasks.length === 0) {
        showNotification('info', 'No subtasks were generated. Try updating the task description.');
        return;
      }

      // Store generated subtasks for review
      setPendingSubtasks(result.subtasks.map((s, idx) => ({ ...s, id: idx })));
      setReviewSubtaskEdits({});
      setShowSubtasksReview(true);
      showNotification('success', `Generated ${result.subtasks.length} subtasks ready for review!`);
    } catch (error) {
      console.error('Generate subtasks error:', error);
      showNotification('error', error.response?.data?.message || 'Failed to generate subtasks. Please try again.');
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  const handleAcceptSubtasks = async () => {
    if (!pendingSubtasks.length) return;

    try {
      const newSubtasks = [];
      
      for (const subtask of pendingSubtasks) {
        const editedTitle = reviewSubtaskEdits[subtask.id]?.title || subtask.title;
        
        if (!editedTitle.trim()) continue;

        try {
          const response = await subtasksAPI.addSubtask(task._id, {
            title: editedTitle,
            completed: false,
          });
          
          if (response?.data?.subtask) {
            newSubtasks.push(response.data.subtask);
          }
        } catch (error) {
          console.error('Failed to add subtask:', error);
        }
      }

      // Update form data with new subtasks
      setFormData((prev) => ({
        ...prev,
        subtasks: [
          ...(Array.isArray(prev.subtasks) ? prev.subtasks : []),
          ...newSubtasks,
        ],
      }));

      setShowSubtasksReview(false);
      setPendingSubtasks([]);
      setReviewSubtaskEdits({});
      showNotification('success', `Added ${newSubtasks.length} subtasks successfully!`);
    } catch (error) {
      console.error('Accept subtasks error:', error);
      showNotification('error', 'Failed to add some subtasks. Please try again.');
    }
  };

  const handleDenySubtasks = () => {
    setShowSubtasksReview(false);
    setPendingSubtasks([]);
    setReviewSubtaskEdits({});
    showNotification('info', 'Subtasks discarded.');
  };

  const handleEditSubtask = async (subtaskId, newTitle) => {
    if (!newTitle.trim()) {
      showNotification('error', 'Subtask title cannot be empty');
      return;
    }

    try {
      await subtasksAPI.updateSubtask(task._id, subtaskId, { title: newTitle });
      
      // Update form data
      setFormData((prev) => ({
        ...prev,
        subtasks: Array.isArray(prev.subtasks)
          ? prev.subtasks.map((s) =>
              s._id === subtaskId ? { ...s, title: newTitle } : s
            )
          : [],
      }));

      setEditingSubtaskId(null);
      setEditingSubtaskTitle('');
      showNotification('success', 'Subtask updated successfully!');
    } catch (error) {
      console.error('Failed to update subtask:', error);
      showNotification('error', 'Failed to update subtask. Please try again.');
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await subtasksAPI.deleteSubtask(task._id, subtaskId);
      
      // Update form data
      setFormData((prev) => ({
        ...prev,
        subtasks: Array.isArray(prev.subtasks)
          ? prev.subtasks.filter((s) => s._id !== subtaskId)
          : [],
      }));

      showNotification('success', 'Subtask deleted successfully!');
    } catch (error) {
      console.error('Failed to delete subtask:', error);
      showNotification('error', 'Failed to delete subtask. Please try again.');
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

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
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
                  disabled={loading}
                  style={styles.saveButton}
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

        {/* Notification */}
        {notification && (
          <div
            style={{
              ...styles.notification,
              marginBottom: '16px',
              backgroundColor: notification.type === 'error' ? `${errorColor}22` : `${successColor}22`,
              color: notification.type === 'error' ? errorColor : successColor,
              borderLeft: `4px solid ${notification.type === 'error' ? errorColor : successColor}`,
              padding: '12px 16px',
              borderRadius: '8px',
            }}
          >
            {notification.message}
          </div>
        )}

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

        {showSubtasksReview && (
          <div style={styles.confirmOverlay} onClick={() => handleDenySubtasks()}>
            <div style={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.confirmTitle}>Review Generated Subtasks</h3>
              <p style={styles.confirmText}>Edit the subtasks below and accept or deny them.</p>
              
              <div style={styles.subtasksReviewList}>
                {pendingSubtasks.map((subtask, idx) => (
                  <div key={subtask.id} style={styles.subtaskReviewItem}>
                    <div style={styles.subtaskItemLabel}>Subtask {idx + 1}</div>
                    <input
                      type="text"
                      value={reviewSubtaskEdits[subtask.id]?.title || subtask.title}
                      onChange={(e) => setReviewSubtaskEdits(prev => ({
                        ...prev,
                        [subtask.id]: { ...prev[subtask.id], title: e.target.value }
                      }))}
                      style={styles.subtaskReviewInput}
                      placeholder="Subtask title"
                    />
                    {subtask.estimated_minutes && (
                      <div style={styles.subtaskEstimate}>
                        ⏱️ ~{subtask.estimated_minutes} min
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={styles.confirmActions}>
                <button type="button" style={styles.confirmCancelBtn} onClick={() => handleDenySubtasks()}>Deny</button>
                <button type="button" style={{...styles.confirmDeleteBtn, backgroundColor: successColor}} onClick={handleAcceptSubtasks}>Accept</button>
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
          {task.projectId && (
            <span style={styles.badgeSecondary}>
              {getProjectLabel(task.projectId) || 'Project'}
            </span>
          )}
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

        {/* Generate Subtasks Button */}
        {isEditing && (
          <div style={{ ...styles.section, marginTop: '16px' }}>
            <button
              onClick={handleGenerateSubtasks}
              disabled={isGeneratingSubtasks || loading}
              style={{
                width: '100%',
                backgroundColor: isGeneratingSubtasks ? theme.textMuted : theme.accent,
                color: '#0A0908',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isGeneratingSubtasks ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isGeneratingSubtasks ? 0.6 : 1,
                transition: 'all 150ms ease',
              }}
              title="Generate AI-powered subtasks for this task"
            >
              {isGeneratingSubtasks ? (
                <>
                  <FaClock style={{ animation: 'spin 1s linear infinite' }} /> Generating Subtasks...
                </>
              ) : (
                <>
                  <FaRobot /> Generate Subtasks
                </>
              )}
            </button>
          </div>
        )}

        {/* Edit Subtasks Section */}
        {isEditing && displayedSubtasks.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <FaCheck style={{ fontSize: '16px' }} /> Subtasks ({displayedSubtasks.length})
            </h3>
            <div style={styles.subtasksEditList}>
              {displayedSubtasks.map((subtask) => (
                <div key={subtask._id} style={styles.subtaskEditItem}>
                  {editingSubtaskId === subtask._id ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                      <input
                        type="text"
                        value={editingSubtaskTitle}
                        onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                        style={styles.subtaskEditInput}
                        placeholder="Subtask title"
                        autoFocus
                      />
                      <button
                        onClick={() => handleEditSubtask(subtask._id, editingSubtaskTitle)}
                        style={{
                          ...styles.subtaskActionBtn,
                          backgroundColor: theme.success,
                        }}
                        title="Save"
                      >
                        <FaCheck />
                      </button>
                      <button
                        onClick={() => {
                          setEditingSubtaskId(null);
                          setEditingSubtaskTitle('');
                        }}
                        style={{
                          ...styles.subtaskActionBtn,
                          backgroundColor: theme.borderMedium,
                        }}
                        title="Cancel"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                      <span style={{ flex: 1, color: theme.textPrimary, fontSize: '13px' }}>
                        {subtask.title}
                      </span>
                      <button
                        onClick={() => {
                          setEditingSubtaskId(subtask._id);
                          setEditingSubtaskTitle(subtask.title);
                        }}
                        style={{
                          ...styles.subtaskActionBtn,
                          backgroundColor: theme.accent,
                        }}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteSubtask(subtask._id)}
                        style={{
                          ...styles.subtaskActionBtn,
                          backgroundColor: theme.error,
                        }}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}><FaTag style={{ fontSize: '16px' }} /> Depends On</h3>
          {isEditing ? (
            loadingDependencies ? (
              <p style={styles.description}>Loading dependency options...</p>
            ) : dependencyOptions.length === 0 ? (
              <p style={styles.description}>No tasks available to depend on.</p>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '180px',
                overflowY: 'auto',
                padding: '4px',
              }}>
                {dependencyOptions.map((item) => {
                  const checked = Array.isArray(formData.dependencies)
                    ? formData.dependencies.includes(item._id)
                    : false;
                  return (
                    <label
                      key={item._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: `1px solid ${theme.borderSubtle || theme.border}`,
                        backgroundColor: checked ? `${theme.primary}12` : theme.bgRaised,
                        color: theme.textPrimary,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleDependencyToggle(item._id)}
                      />
                      <span style={{ fontSize: '13px' }}>{item.title}</span>
                    </label>
                  );
                })}
              </div>
            )
          ) : (
            (() => {
              const selectedDeps = Array.isArray(formData.dependencies) ? formData.dependencies : [];
              if (selectedDeps.length === 0) {
                return <p style={styles.description}>No dependencies</p>;
              }

              const titleById = new Map(dependencyOptions.map((item) => [item._id, item.title]));
              return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedDeps.map((depId) => (
                    <span key={depId} style={styles.tag}>
                      {titleById.get(depId) || 'Linked task'}
                    </span>
                  ))}
                </div>
              );
            })()
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
              <div style={{ marginTop: '16px' }}>
                <p style={{
                  fontSize: '13px',
                  color: theme.textSecondary,
                  margin: '0 0 12px 0',
                }}>
                  Total logged: {(() => {
                    const totalMinutes = task?.timeTracking?.totalTime || 0;
                    const hours = Math.floor(totalMinutes / 60);
                    const mins = totalMinutes % 60;
                    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                  })()}
                </p>
                <button
                  onClick={() => navigate('/focus', { state: { preSelectedTask: task } })}
                  style={{
                    backgroundColor: `${theme.primary}12`,
                    border: `1.5px solid ${theme.primary}40`,
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.primary,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = `${theme.primary}20`;
                    e.target.style.borderColor = `${theme.primary}60`;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = `${theme.primary}12`;
                    e.target.style.borderColor = `${theme.primary}40`;
                  }}
                >
                  Open Focus Mode
                </button>
              </div>
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
                <p style={{ ...styles.commentText, marginBottom: '6px', fontWeight: '600', color: theme.textPrimary }}>
                  {typeof comment.user === 'object' ? (comment.user.name || comment.user.email || 'User') : 'User'}
                </p>
                <p style={styles.commentText}>{renderTextWithMentions(comment.text)}</p>
                <span style={styles.commentDate}>{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
          {canComment ? (
            <div style={styles.addComment}>
              <div style={styles.commentComposer}>
                <input
                  ref={commentInputRef}
                  type="text"
                  value={newComment}
                  onChange={(e) => {
                    setNewComment(e.target.value);
                    setCommentSelectionStart(e.target.selectionStart || e.target.value.length);
                  }}
                  onClick={(e) => setCommentSelectionStart(e.target.selectionStart || e.target.value.length)}
                  onKeyUp={(e) => setCommentSelectionStart(e.target.selectionStart || e.target.value.length)}
                  onBlur={() => {
                    setTimeout(() => {
                      if (commentInputRef.current && document.activeElement !== commentInputRef.current) {
                        setCommentSelectionStart(0);
                      }
                    }, 120);
                  }}
                  placeholder="Add a comment... Type @ to mention a collaborator"
                  style={styles.commentInput}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  autoComplete="off"
                />
                {mentionContext && (
                  <div style={styles.mentionDropdown}>
                    <div style={styles.mentionDropdownHeader}>
                      Mention a collaborator
                    </div>
                    {filteredMentionSuggestions.length > 0 ? (
                      filteredMentionSuggestions.map((person) => (
                        <button
                          key={person.id}
                          type="button"
                          style={styles.mentionOption}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => insertMention(person)}
                        >
                          <div style={styles.mentionAvatar}>{person.initial}</div>
                          <div style={{ minWidth: 0 }}>
                            <p style={styles.mentionName}>{person.name}</p>
                            <p style={styles.mentionMeta}>{person.email || 'Collaborator'}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div style={styles.mentionEmpty}>
                        No collaborators match this mention.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button type="button" onClick={handleAddComment} style={styles.sendButton} disabled={isSendingComment}>
                <FaPaperPlane /> {isSendingComment ? 'Sending...' : 'Send'}
              </button>
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