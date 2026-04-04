import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import projectService from '../services/projectService';
import { tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { borderRadius } from '../theme';
import { formatTaskDuration } from '../utils/formatTaskDuration';
import { FaArrowLeft, FaCalendarAlt, FaTrash, FaPlus, FaCheck, FaClock, FaFlag, FaTag, FaShare, FaUserPlus } from 'react-icons/fa';
import AddTaskToProjectModal from '../components/Projects/AddTaskToProjectModal';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import AIProjectBreakdownModal from '../components/Projects/AIProjectBreakdownModal';

const ProjectDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
    const [showAIProjectBreakdown, setShowAIProjectBreakdown] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [shareEmail, setShareEmail] = useState('');

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        loadProjectDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const isOwner = project?.accessRole === 'owner';
    const myPermission = project?.myPermission || (isOwner ? 'edit' : 'view');
    const canCreateTasks = isOwner || myPermission === 'edit';
    const canGenerateTasks = isOwner || myPermission === 'edit';
    const canToggleTaskStatus = isOwner || myPermission === 'edit' || myPermission === 'complete';
    const canComment = isOwner || myPermission === 'edit' || myPermission === 'complete';
    const canEditTask = isOwner || myPermission === 'edit';
    const canDeleteTask = isOwner || myPermission === 'edit';

    const loadProjectDetails = async () => {
        try {
            setLoading(true);
            const data = await projectService.getProject(id, localStorage.getItem('token'));
            setProject(data.project);
            setTasks(data.tasks);
        } catch (error) {
            console.error('Error loading project details:', error);
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async (deleteTasks) => {
        if (!project || project.accessRole !== 'owner') {
            showNotification('error', 'Only the project owner can delete this project.');
            return;
        }
        try {
            await projectService.deleteProject(id, localStorage.getItem('token'), deleteTasks);
            navigate('/projects');
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    const confirmDelete = () => {
        setShowDeleteConfirm(true);
    };

    const handleTaskCreated = async (newTaskData) => {
        if (!canCreateTasks) {
            showNotification('error', 'You do not have permission to add tasks to this project.');
            return;
        }
        try {
            const response = await tasksAPI.createTask(newTaskData);
            const newTask = response.data.task;
            setTasks([newTask, ...tasks]);
            // Refresh project to update counters
            const data = await projectService.getProject(id, localStorage.getItem('token'));
            setProject(data.project);
        } catch (error) {
            console.error('Error creating task:', error);
            showNotification('error', "Error creating task: " + (error.response?.data?.message || error.message));
        }
    };

    const handleTaskUpdated = async (updatedTask) => {
        setTasks(tasks.map(t => t._id === updatedTask._id ? updatedTask : t));
        setSelectedTask(updatedTask);
        // Refresh project to update progress just in case status changed
        const data = await projectService.getProject(id, localStorage.getItem('token'));
        setProject(data.project);
    };

    const handleTaskDeleted = async (taskId) => {
        setTasks(tasks.filter(t => t._id !== taskId));
        setShowTaskDetailModal(false);
        setSelectedTask(null);
        // Refresh project
        const data = await projectService.getProject(id, localStorage.getItem('token'));
        setProject(data.project);
    };

    const handleShareProject = async () => {
        if (!project || project.accessRole !== 'owner') {
            showNotification('error', 'Only the project owner can share this project.');
            return;
        }
        if (!shareEmail.trim()) return;
        try {
            const response = await projectService.shareProject(id, shareEmail);
            if (response.user) {
                showNotification('success', `Project shared with ${response.user.email}`);
                setProject({
                    ...project,
                    pendingInvites: [
                        ...(project.pendingInvites || []),
                        {
                            userId: response.user.id,
                            name: response.user.name,
                            email: response.user.email,
                            invitedAt: new Date().toISOString(),
                        },
                    ],
                });
                setShareEmail('');
            }
        } catch (error) {
            console.error('Share error:', error);
            showNotification('error', 'Failed to share project: ' + (error.response?.data?.message || error.message));
        }
    };

    const toggleTaskComplete = async (task, e) => {
        if (!canToggleTaskStatus) {
            e.stopPropagation();
            return;
        }
        e.stopPropagation();
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        try {
            const response = await tasksAPI.updateTask(task._id, { status: newStatus });
            handleTaskUpdated(response.data.task);
        } catch (error) {
            console.error('Error toggling task status:', error);
        }
    };

    const normalizeTaskCategory = (category) => {
        const allowedCategories = ['Work', 'Personal', 'Health', 'Shopping', 'Learning', 'Family'];
        return allowedCategories.includes(category) ? category : 'Work';
    };

    const normalizeTaskPriority = (priority) => {
        const normalized = String(priority || 'medium').toLowerCase();
        if (['low', 'medium', 'high', 'urgent'].includes(normalized)) {
            return normalized;
        }
        return 'medium';
    };

    const normalizeTaskDeadline = (deadline) => {
        if (!deadline) {
            return undefined;
        }

        const deadlineValue = String(deadline).trim();
        const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(deadlineValue);

        if (isIsoDate) {
            return deadlineValue;
        }

        const parsed = new Date(deadlineValue);
        if (Number.isNaN(parsed.getTime())) {
            return undefined;
        }

        return parsed.toISOString().split('T')[0];
    };

    const handleAddAcceptedAIProjectTasks = async (acceptedTasks) => {
        if (!canGenerateTasks) {
            showNotification('error', 'You do not have permission to generate tasks for this project.');
            return;
        }
        if (!acceptedTasks || acceptedTasks.length === 0) {
            showNotification('info', 'No tasks accepted. Please accept at least one task.');
            return;
        }

        setLoading(true);
        try {
            for (const task of acceptedTasks) {
                await tasksAPI.createTask({
                    title: task.title,
                    description: task.description || '',
                    estimatedDuration: Number(task.estimated_minutes) || 240,
                    priority: normalizeTaskPriority(task.priority),
                    category: normalizeTaskCategory(task.category),
                    projectId: id,
                    status: 'todo',
                    deadline: normalizeTaskDeadline(task.deadline),
                    subtasks: Array.isArray(task.subtasks)
                        ? task.subtasks
                            .map((subtask) => ({
                                title: subtask.title || subtask.description || '',
                                completed: false,
                            }))
                            .filter((subtask) => subtask.title)
                        : [],
                });
            }

            await loadProjectDetails();
            setShowAIProjectBreakdown(false);
            showNotification('success', 'Accepted AI tasks added to project successfully.');
        } catch (error) {
            console.error('Error creating accepted AI project tasks:', error);
            console.error('Error details:', error.response?.data);
            showNotification('error', `Error creating accepted tasks: ${error.response?.data?.message || error.message || 'Please try again.'}`);
        } finally {
            setLoading(false);
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

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const sortedTasks = [...tasks].sort((a, b) => {
        const aHasDeadline = Boolean(a.deadline);
        const bHasDeadline = Boolean(b.deadline);

        // Put tasks without deadlines at the end.
        if (!aHasDeadline && !bHasDeadline) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        if (!aHasDeadline) {
            return 1;
        }
        if (!bHasDeadline) {
            return -1;
        }

        return new Date(a.deadline) - new Date(b.deadline);
    });

    const handleRemoveSharedUser = async (sharedUserId) => {
        if (!isOwner) {
            return;
        }

        try {
            await projectService.removeSharedUser(id, sharedUserId);
            await loadProjectDetails();
            showNotification('success', 'Collaborator removed successfully.');
        } catch (error) {
            console.error('Error removing shared user:', error);
            showNotification('error', error.response?.data?.message || 'Failed to remove collaborator.');
        }
    };

    const handleChangeCollaboratorPermission = async (sharedUserId, permission) => {
        if (!isOwner) {
            return;
        }

        try {
            await projectService.updateCollaboratorPermission(id, sharedUserId, permission);
            await loadProjectDetails();
            showNotification('success', 'Collaborator permission updated.');
        } catch (error) {
            console.error('Error updating collaborator permission:', error);
            showNotification('error', error.response?.data?.message || 'Failed to update permission.');
        }
    };

    const styles = {
        container: {
            padding: '32px',
            minHeight: '100vh',
            backgroundColor: theme.bgMain,
        },
        loading: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            color: theme.textPrimary,
        },
        backButton: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: theme.textSecondary,
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '24px',
            transition: 'color 0.2s',
        },
        projectHeader: {
            backgroundColor: theme.bgMain,
            borderRadius: borderRadius.lg,
            padding: '32px',
            boxShadow: theme.shadows.neumorphic,
            marginBottom: '32px',
            border: `1px solid ${theme.border}`,
            position: 'relative',
        },
        projectTopRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px',
        },
        title: {
            fontSize: '32px',
            fontWeight: '800',
            color: theme.textPrimary,
            margin: '0 0 12px 0',
        },
        description: {
            fontSize: '16px',
            color: theme.textSecondary,
            margin: 0,
            maxWidth: '800px',
            lineHeight: '1.6',
        },
        deleteButton: {
            background: theme.bgMain,
            color: theme.error,
            border: 'none',
            borderRadius: borderRadius.md,
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: theme.shadows.neumorphic,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        metaGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: `1px solid ${theme.border}`,
        },
        metaItem: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        },
        metaLabel: {
            fontSize: '13px',
            color: theme.textMuted,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
        },
        metaValue: {
            fontSize: '16px',
            color: theme.textPrimary,
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        progressSection: {
            marginTop: '32px',
        },
        progressHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
            fontSize: '14px',
            fontWeight: '600',
            color: theme.textSecondary,
        },
        progressBarBg: {
            height: '12px',
            backgroundColor: theme.bgElevated || theme.border,
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: theme.shadows.neumorphicInset,
        },
        progressBarFill: {
            height: '100%',
            width: `${project?.progress || 0}%`,
            backgroundColor: (project?.progress || 0) < 30 ? theme.error : (project?.progress || 0) < 70 ? theme.warning : theme.success,
            borderRadius: '6px',
            transition: 'width 0.8s ease-out',
        },
        sectionHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
        },
        sectionTitle: {
            fontSize: '24px',
            fontWeight: '700',
            color: theme.textPrimary,
            margin: 0,
        },
        addTaskBtn: {
            backgroundColor: theme.primary,
            color: '#fff',
            border: 'none',
            borderRadius: borderRadius.md,
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: theme.shadows.neumorphic,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        notification: {
            marginBottom: '16px',
            padding: '12px 14px',
            borderRadius: borderRadius.md,
            fontSize: '14px',
            fontWeight: '600',
        },
        taskList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
        },
        taskItem: {
            backgroundColor: theme.bgMain,
            borderRadius: borderRadius.lg,
            padding: '20px',
            boxShadow: theme.shadows.neumorphic,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.2s ease',
        },
        checkbox: (checked) => ({
            width: '24px',
            height: '24px',
            borderRadius: '8px',
            border: `2px solid ${checked ? theme.success : theme.border}`,
            backgroundColor: checked ? theme.success : theme.bgMain,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: checked ? 'none' : theme.shadows.neumorphicInset,
        }),
        taskTitle: (checked) => ({
            fontSize: '16px',
            fontWeight: '600',
            color: checked ? theme.textMuted : theme.textPrimary,
            textDecoration: checked ? 'line-through' : 'none',
            margin: '0 0 4px 0',
        }),
        taskDescription: (checked) => ({
            fontSize: '13px',
            color: checked ? theme.textMuted : theme.textSecondary,
            margin: '0 0 8px 0',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
        }),
        taskMeta: {
            fontSize: '13px',
            color: theme.textSecondary,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
        },
        taskTags: {
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginTop: '8px',
        },
        taskTag: {
            fontSize: '11px',
            fontWeight: '700',
            padding: '4px 8px',
            borderRadius: '999px',
            backgroundColor: `${theme.primary}15`,
            color: theme.primary,
            border: `1px solid ${theme.primary}25`,
        },
        confirmOverlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1500,
            padding: '16px',
        },
        confirmDialog: {
            width: '100%',
            maxWidth: '520px',
            backgroundColor: theme.bgMain,
            borderRadius: borderRadius.lg,
            border: `1px solid ${theme.border}`,
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
            padding: '22px',
        },
        confirmTitle: {
            margin: 0,
            fontSize: '20px',
            fontWeight: '700',
            color: theme.textPrimary,
        },
        confirmText: {
            margin: '12px 0 18px 0',
            color: theme.textSecondary,
            lineHeight: '1.55',
            fontSize: '14px',
        },
        confirmActions: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            flexWrap: 'wrap',
        },
        confirmBtn: {
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.bgMain,
            color: theme.textPrimary,
            borderRadius: borderRadius.md,
            padding: '9px 14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: theme.shadows.neumorphic,
        },
        dangerBtn: {
            border: 'none',
            backgroundColor: theme.error,
            color: '#fff',
            borderRadius: borderRadius.md,
            padding: '9px 14px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: theme.shadows.neumorphic,
        },
        shareSection: {
            backgroundColor: theme.bgMain,
            borderRadius: borderRadius.lg,
            padding: '24px',
            boxShadow: theme.shadows.neumorphic,
            marginBottom: '32px',
            border: `1px solid ${theme.border}`,
        },
        shareSectionTitle: {
            fontSize: '18px',
            fontWeight: '700',
            color: theme.textPrimary,
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        shareInputContainer: {
            display: 'flex',
            gap: '12px',
            marginBottom: '12px',
        },
        shareInput: {
            flex: 1,
            backgroundColor: theme.bgElevated || theme.bgMain,
            border: `1px solid ${theme.border}`,
            borderRadius: borderRadius.md,
            padding: '10px 14px',
            fontSize: '14px',
            color: theme.textPrimary,
            outline: 'none',
            boxShadow: theme.shadows.neumorphicInset,
        },
        shareButton: {
            backgroundColor: theme.primary,
            color: '#fff',
            border: 'none',
            borderRadius: borderRadius.md,
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: theme.shadows.neumorphic,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
        },
        sharedInfo: {
            fontSize: '13px',
            color: theme.textMuted,
            marginTop: '8px',
        },
        collaboratorsList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '12px',
        },
        collaboratorRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: borderRadius.md,
            backgroundColor: theme.bgElevated || theme.bgMain,
            border: `1px solid ${theme.border}`,
        },
        collaboratorActions: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        permissionSelect: {
            backgroundColor: theme.bgMain,
            border: `1px solid ${theme.border}`,
            borderRadius: borderRadius.md,
            color: theme.textPrimary,
            fontSize: '12px',
            fontWeight: '600',
            padding: '6px 8px',
        },
        removeShareButton: {
            border: 'none',
            borderRadius: borderRadius.md,
            backgroundColor: theme.error,
            color: '#fff',
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
        },
        readOnlyNotice: {
            marginTop: '12px',
            fontSize: '13px',
            color: theme.textMuted,
        },
    };

    if (loading) {
        return (
            <Layout>
                <div style={styles.loading}>Loading project specifics...</div>
            </Layout>
        );
    }

    if (!project) {
        return (
            <Layout>
                <div style={styles.loading}>Project not found.</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <style>{`
                .back-btn:hover { color: ${theme.primary} !important; }
                .task-item:hover { transform: translateX(4px); border-color: ${theme.primary}40 !important; }
                .delete-btn:hover { background-color: ${theme.error}15 !important; }
                .add-btn:hover { transform: translateY(-2px); }
            `}</style>
            <div style={styles.container}>
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

                <button 
                    style={styles.backButton} 
                    onClick={() => navigate('/projects')}
                    className="back-btn"
                >
                    <FaArrowLeft /> Back to Projects
                </button>

                <div style={styles.projectHeader}>
                    <div style={styles.projectTopRow}>
                        <div>
                            <h1 style={styles.title}>{project.title}</h1>
                            {project.description && (
                                <p style={styles.description}>{project.description}</p>
                            )}
                        </div>
                        {isOwner && (
                            <button 
                                style={styles.deleteButton} 
                                onClick={confirmDelete}
                                className="delete-btn"
                            >
                                <FaTrash /> Delete Project
                            </button>
                        )}
                    </div>

                    <div style={styles.metaGrid}>
                        <div style={styles.metaItem}>
                            <span style={styles.metaLabel}>Status</span>
                            <span style={styles.metaValue}>{project.status.toUpperCase().replace('-', ' ')}</span>
                        </div>
                        <div style={styles.metaItem}>
                            <span style={styles.metaLabel}>Priority</span>
                            <span style={{...styles.metaValue, color: getPriorityColor(project.priority)}}>
                                <FaFlag size={14} /> {project.priority.toUpperCase()}
                            </span>
                        </div>
                        <div style={styles.metaItem}>
                            <span style={styles.metaLabel}>Category</span>
                            <span style={styles.metaValue}><FaTag size={14} /> {project.category}</span>
                        </div>
                        {project.dueDate && (
                            <div style={styles.metaItem}>
                                <span style={styles.metaLabel}>Due Date</span>
                                <span style={styles.metaValue}><FaCalendarAlt size={14} /> {formatDate(project.dueDate)}</span>
                            </div>
                        )}
                        <div style={styles.metaItem}>
                            <span style={styles.metaLabel}>Est. Hours</span>
                            <span style={styles.metaValue}><FaClock size={14} /> {project.estimatedTotalHours || 0}h</span>
                        </div>
                    </div>

                    <div style={styles.progressSection}>
                        <div style={styles.progressHeader}>
                            <span>Overall Progress</span>
                            <span>{project.progress}%</span>
                        </div>
                        <div style={styles.progressBarBg}>
                            <div style={styles.progressBarFill} />
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '13px', color: theme.textMuted, textAlign: 'right' }}>
                            {project.completedTasks} of {project.totalTasks} tasks completed
                        </div>
                    </div>
                </div>

                {isOwner ? (
                    <div style={styles.shareSection}>
                        <h3 style={styles.shareSectionTitle}><FaShare /> Share Project</h3>
                        <div style={styles.shareInputContainer}>
                            <input
                                type="email"
                                value={shareEmail}
                                onChange={(e) => setShareEmail(e.target.value)}
                                placeholder="Enter email to share with"
                                style={styles.shareInput}
                                onKeyPress={(e) => e.key === 'Enter' && handleShareProject()}
                            />
                            <button onClick={handleShareProject} style={styles.shareButton}><FaUserPlus /> Invite</button>
                        </div>

                        <>
                            <p style={styles.sharedInfo}>Pending invites ({project.pendingInvites?.length || 0})</p>
                            <div style={styles.collaboratorsList}>
                                {project.pendingInvites?.length ? (
                                    project.pendingInvites.map((invite) => (
                                        <div key={`invite-${invite.userId}`} style={styles.collaboratorRow}>
                                            <span>{invite.name || invite.email || 'Pending user'} ({invite.email || 'no-email'})</span>
                                        </div>
                                    ))
                                ) : (
                                    <div style={styles.collaboratorRow}>
                                        <span>No pending invites yet.</span>
                                    </div>
                                )}
                            </div>
                        </>

                        <>
                            <p style={styles.sharedInfo}>Collaborators ({project.collaborators?.length || 0})</p>
                            <div style={styles.collaboratorsList}>
                                {project.collaborators?.length ? (
                                    project.collaborators.map((sharedUser) => (
                                        <div key={`shared-${sharedUser.userId}`} style={styles.collaboratorRow}>
                                            <span>{sharedUser.name || 'User'} ({sharedUser.email || 'no-email'})</span>
                                            <div style={styles.collaboratorActions}>
                                                <select
                                                    value={sharedUser.permission || 'complete'}
                                                    onChange={(e) => handleChangeCollaboratorPermission(sharedUser.userId, e.target.value)}
                                                    style={styles.permissionSelect}
                                                >
                                                    <option value="view">View</option>
                                                    <option value="complete">Complete</option>
                                                    <option value="edit">Edit</option>
                                                </select>
                                                {String(sharedUser.userId) !== String(user?.id) && (
                                                    <button
                                                        type="button"
                                                        style={styles.removeShareButton}
                                                        onClick={() => handleRemoveSharedUser(sharedUser.userId)}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={styles.collaboratorRow}>
                                        <span>No collaborators yet. Invite a user, then they must accept before permissions appear.</span>
                                    </div>
                                )}
                            </div>
                        </>
                    </div>
                ) : (
                    <div style={styles.shareSection}>
                        <h3 style={styles.shareSectionTitle}><FaShare /> Shared Project</h3>
                        <p style={styles.readOnlyNotice}>
                            Your permission: {myPermission}. {myPermission === 'view' && 'You can view project tasks only.'}
                            {myPermission === 'complete' && ' You can complete tasks and add comments.'}
                            {myPermission === 'edit' && ' You can add, edit, and delete project tasks.'}
                        </p>
                    </div>
                )}

                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>Project Tasks</h2>
                    {canCreateTasks && (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {canGenerateTasks && (
                                <button
                                    style={{ ...styles.addTaskBtn, backgroundColor: theme.success, color: '#fff' }}
                                    onClick={() => setShowAIProjectBreakdown(true)}
                                    className="add-btn"
                                >
                                    🤖 Generate Tasks with AI
                                </button>
                            )}
                            <button 
                                style={styles.addTaskBtn} 
                                onClick={() => setShowAddTaskModal(true)}
                                className="add-btn"
                            >
                                <FaPlus /> Add Task
                            </button>
                        </div>
                    )}
                </div>

                <div style={styles.taskList}>
                    {sortedTasks.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: theme.textSecondary }}>
                            No tasks for this project yet. Add one to get started!
                        </div>
                    ) : (
                        sortedTasks.map(task => {
                            const isDone = task.status === 'done';
                            return (
                                <div 
                                    key={task._id} 
                                    style={styles.taskItem}
                                    className="task-item"
                                    onClick={() => {
                                        setSelectedTask(task);
                                        setShowTaskDetailModal(true);
                                    }}
                                >
                                    <div 
                                        style={styles.checkbox(isDone)}
                                        onClick={(e) => canToggleTaskStatus && toggleTaskComplete(task, e)}
                                    >
                                        <div style={{ transform: isDone ? 'scale(1)' : 'scale(0)', transition: '0.2s' }}>
                                            <FaCheck size={12} color="#fff" />
                                        </div>
                                    </div>
                                    
                                    <div style={{ flex: 1 }}>
                                        <h4 style={styles.taskTitle(isDone)}>{task.title}</h4>
                                        {task.description && (
                                            <p style={styles.taskDescription(isDone)}>{task.description}</p>
                                        )}
                                        <div style={styles.taskMeta}>
                                            <span style={{ color: getPriorityColor(task.priority) }}>{task.priority.toUpperCase()}</span>
                                            {task.deadline && <span>Due: {formatDate(task.deadline)}</span>}
                                            {task.estimatedDuration && <span>{formatTaskDuration(task.estimatedDuration)}</span>}
                                        </div>
                                        {Array.isArray(task.tags) && task.tags.length > 0 && (
                                            <div style={styles.taskTags}>
                                                {task.tags.map((tag, idx) => (
                                                    <span key={`${task._id}-tag-${idx}`} style={styles.taskTag}>
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {canCreateTasks && (
                    <AddTaskToProjectModal
                        isOpen={showAddTaskModal}
                        onClose={() => setShowAddTaskModal(false)}
                        onTaskCreated={handleTaskCreated}
                        projectId={id}
                    />
                )}

                <TaskDetailModal
                    task={selectedTask}
                    isOpen={showTaskDetailModal}
                    canComplete={canToggleTaskStatus}
                    canComment={canComment}
                    canEdit={canEditTask}
                    canDelete={canDeleteTask}
                    canTrackTime={canEditTask}
                    canManageAttachments={canEditTask}
                    canShareTask={canEditTask}
                    canToggleSubtasks={canToggleTaskStatus}
                    onClose={() => {
                        setShowTaskDetailModal(false);
                        setSelectedTask(null);
                    }}
                    onTaskUpdated={handleTaskUpdated}
                    onTaskDeleted={handleTaskDeleted}
                />

                {canGenerateTasks && (
                    <AIProjectBreakdownModal
                        isOpen={showAIProjectBreakdown}
                        onClose={() => setShowAIProjectBreakdown(false)}
                        project={project}
                        onAddAcceptedTasks={handleAddAcceptedAIProjectTasks}
                    />
                )}

                {showDeleteConfirm && (
                    <div style={styles.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
                        <div style={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
                            <h3 style={styles.confirmTitle}>Delete Project</h3>
                            <p style={styles.confirmText}>
                                Choose how to delete this project.
                                Delete with tasks removes both project and all associated tasks.
                                Delete project only keeps tasks as standalone items.
                            </p>
                            <div style={styles.confirmActions}>
                                <button type="button" style={styles.confirmBtn} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                                <button
                                    type="button"
                                    style={styles.confirmBtn}
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        handleDeleteProject(false);
                                    }}
                                >
                                    Delete Project Only
                                </button>
                                <button
                                    type="button"
                                    style={styles.dangerBtn}
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        handleDeleteProject(true);
                                    }}
                                >
                                    Delete Project + Tasks
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ProjectDetailPage;
