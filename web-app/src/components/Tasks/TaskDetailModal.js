// src/components/Tasks/TaskDetailModal.js
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { tasksAPI, timeTrackingAPI } from '../../services/api';
import {
  FaEdit, FaTrash, FaTimes, FaSave,
  FaStopwatch, FaPaperclip, FaComment, FaShare,
  FaTag, FaCheck, FaFileUpload, FaPaperPlane, FaUserPlus,
  FaRobot, FaPlay, FaPause
} from 'react-icons/fa';

const TaskDetailModal = ({ task, isOpen, onClose, onTaskUpdated, onTaskDeleted }) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [shareEmail, setShareEmail] = useState('');

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      // Removed backdropFilter
    },
    modal: {
      backgroundColor: theme.bgMain,
      borderRadius: '16px',
      width: '100%',
      maxWidth: '700px',
      maxHeight: '90vh',
      overflow: 'auto',
      padding: '32px',
      boxShadow: '0 20px 50px rgba(0,0,0,0.3)', // Stronger shadow
      color: theme.textPrimary,
      border: `1px solid ${theme.border}40`,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '20px',
      gap: '16px',
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
      fontSize: '24px',
      fontWeight: '700',
      color: theme.textPrimary,
    },
    titleInput: {
      fontSize: '24px',
      fontWeight: '700',
      backgroundColor: theme.bgMain,
      color: theme.textPrimary,
      border: 'none',
      borderBottom: `2px solid ${theme.primary}`,
      outline: 'none',
      width: '100%',
    },
    checkboxContainer: {
      width: '24px',
      height: '24px',
      borderRadius: '8px',
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphicInset,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      border: `1px solid transparent`,
      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      flexShrink: 0,
    },
    checkboxChecked: {
      backgroundColor: theme.success,
      boxShadow: `0 0 10px ${theme.success}60`,
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
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      padding: '8px 20px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: theme.shadows.neumorphic,
      transition: 'all 0.2s',
    },
    deleteButton: {
      backgroundColor: theme.error,
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      padding: '8px 20px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: theme.shadows.neumorphic,
      transition: 'all 0.2s',
    },
    saveButton: {
      backgroundColor: theme.success,
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      padding: '8px 20px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: theme.shadows.neumorphic,
      transition: 'all 0.2s',
    },
    sendButton: {
      backgroundColor: theme.primary,
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      padding: '0 24px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: theme.shadows.neumorphic,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
    },
    cancelEditButton: {
      backgroundColor: theme.bgMain,
      color: theme.textSecondary,
      border: 'none',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: theme.shadows.neumorphic,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: theme.textSecondary,
      fontSize: '20px',
      cursor: 'pointer',
      padding: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      transition: 'color 0.2s',
    },
    badges: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      marginBottom: '24px',
    },
    badge: {
      fontSize: '12px',
      fontWeight: '600',
      padding: '6px 12px',
      borderRadius: '6px',
    },
    badgeSecondary: {
      fontSize: '12px',
      fontWeight: '500',
      padding: '6px 12px',
      borderRadius: '6px',
      backgroundColor: theme.bgMain,
      color: theme.textSecondary,
      textTransform: 'capitalize',
      boxShadow: theme.shadows.neumorphic,
    },
    section: {
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: '600',
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
      backgroundColor: theme.bgMain,
      border: `1px solid transparent`,
      borderRadius: '12px',
      padding: '12px',
      fontSize: '14px',
      color: theme.textPrimary,
      resize: 'vertical',
      fontFamily: 'inherit',
      outline: 'none',
      boxShadow: theme.shadows.neumorphicInset,
    },
    input: {
      backgroundColor: theme.bgMain,
      border: `1px solid transparent`,
      borderRadius: '12px',
      padding: '12px',
      fontSize: '14px',
      color: theme.textPrimary,
      width: '100%',
      outline: 'none',
      boxShadow: theme.shadows.neumorphicInset,
    },
    timerButton: {
      color: '#fff',
      border: 'none',
      borderRadius: '16px',
      padding: '16px 24px',
      fontSize: '16px',
      fontWeight: '700',
      cursor: 'pointer',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.2)',
      transition: 'all 0.3s ease',
      backgroundImage: `linear-gradient(135deg, ${theme.success}, #059669)`,
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
      backgroundColor: theme.bgMain,
      color: theme.textSecondary,
      border: `1px solid ${theme.border}`,
      boxShadow: theme.shadows.neumorphic,
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
      backgroundColor: theme.bgMain,
      borderRadius: '8px',
      boxShadow: theme.shadows.neumorphic,
    },
    subtaskText: {
      fontSize: '14px',
      color: theme.textPrimary,
    },
    aiInsight: {
      backgroundColor: theme.bgMain,
      border: `1px solid ${theme.aiPurple}40`,
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
      boxShadow: theme.shadows.neumorphic,
    },
    aiInsightText: {
      fontSize: '14px',
      color: theme.aiPurple,
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
      gap: '8px',
      fontSize: '14px',
      color: theme.textPrimary,
      padding: '8px',
      backgroundColor: theme.bgMain,
      borderRadius: '8px',
      boxShadow: theme.shadows.neumorphic,
    },
    fileSize: {
      color: theme.textMuted,
      fontSize: '12px'
    },
    uploadButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      backgroundColor: theme.bgMain,
      border: `1px dashed ${theme.primary}`,
      color: theme.primary,
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
      boxShadow: theme.shadows.neumorphic,
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
      backgroundColor: theme.bgMain,
      padding: '12px',
      borderRadius: '8px',
      boxShadow: theme.shadows.neumorphic,
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
      backgroundColor: theme.bgMain,
      border: `1px solid transparent`,
      borderRadius: '12px',
      padding: '12px',
      fontSize: '14px',
      color: theme.textPrimary,
      outline: 'none',
      boxShadow: theme.shadows.neumorphicInset,
    },
    shareInputContainer: {
      display: 'flex',
      gap: '12px',
      marginBottom: '8px'
    },
    shareInput: {
      flex: 1,
      backgroundColor: theme.bgMain,
      border: `1px solid transparent`,
      borderRadius: '12px',
      padding: '12px',
      fontSize: '14px',
      color: theme.textPrimary,
      outline: 'none',
      boxShadow: theme.shadows.neumorphicInset,
    },
    shareButton: {
      backgroundColor: theme.info || '#3b82f6', // Fallback defaults
      color: '#fff',
      border: 'none',
      borderRadius: '12px', // Consistency
      padding: '12px 20px',
      cursor: 'pointer',
      boxShadow: theme.shadows.neumorphic,
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

  useEffect(() => {
    if (task) {
      setFormData(task);
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
    setLoading(true);
    try {
      const response = await tasksAPI.updateTask(task._id, formData);
      if (response.data.success) {
        onTaskUpdated(response.data.task);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setLoading(true);
      try {
        const response = await tasksAPI.deleteTask(task._id);
        if (response.data.success) {
          onTaskDeleted(task._id);
          onClose();
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete task');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleTimer = async () => {
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
      alert('Failed to upload file');
    }
  };

  /* Comments Helper */
  const handleAddComment = async () => {
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
      alert('Failed to add comment');
    }
  };

  /* Share Helper */
  const handleShare = async () => {
    if (!shareEmail.trim()) return;
    try {
      const response = await tasksAPI.shareTask(task._id, shareEmail);
      if (response.data.success) {
        alert(`Task shared with ${response.data.user.email}`);
        onTaskUpdated({
          ...task,
          sharedWith: [...(task.sharedWith || []), response.data.user.id]
        });
        setShareEmail('');
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to share task: ' + (error.response?.data?.message || error.message));
    }
  };

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
      `}</style>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
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
                <button
                  onClick={() => setIsEditing(true)}
                  style={styles.editButton}
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  style={styles.deleteButton}
                  disabled={loading}
                >
                  <FaTrash /> Delete
                </button>
                <button onClick={onClose} style={styles.closeButton}>
                  <FaTimes />
                </button>
              </>
            )}
          </div>
        </div>

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
              backgroundColor: theme.aiPurple + '20',
              color: theme.aiPurple
            }}>
              🤖 AI {task.aiPriorityScore}%
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

        {/* Time Tracking */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}><FaStopwatch style={{ fontSize: '16px' }} /> Time Tracking</h3>
          <button
            onClick={handleToggleTimer}
            style={{
              ...styles.timerButton,
              backgroundColor: isTracking ? theme.error : theme.success, // Use theme colors
            }}
          >
            {isTracking ? <><FaPause /> Stop Timer</> : <><FaPlay /> Start Timer</>}
          </button>
          {isTracking && (
            <p style={{
              ...styles.trackingText,
              color: theme.error // Ensure error color usage
            }}>⏱️ Timer is running...</p>
          )}
        </div>

        {/* Attachments */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}><FaPaperclip style={{ fontSize: '16px' }} /> Attachments</h3>
          <div style={styles.attachmentsList}>
            {task.attachments?.map((file, i) => (
              <div key={i} style={styles.attachmentItem}>
                <span><FaPaperclip /> {file.filename}</span>
                <span style={styles.fileSize}>({Math.round(file.filesize / 1024)}KB)</span>
              </div>
            ))}
          </div>
          <label style={styles.uploadButton}>
            <FaFileUpload /> Upload File
            <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
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
        </div>

        {/* Sharing */}
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
        {task.subtasks && task.subtasks.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <FaCheck style={{ fontSize: '16px' }} /> Subtasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})
            </h3>
            <div style={styles.subtasksList}>
              {task.subtasks.map((subtask, index) => (
                <div key={subtask._id || index} style={styles.subtaskItem}>
                  <Checkbox
                    checked={subtask.completed}
                    onChange={() => console.log('Toggle subtask:', subtask._id)}
                    style={{ marginRight: '12px' }}
                  />
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