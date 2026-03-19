import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import projectService from '../services/projectService';
import { tasksAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { borderRadius } from '../theme';
import { FaArrowLeft, FaCalendarAlt, FaTrash, FaPlus, FaCheck, FaClock, FaFlag, FaTag, FaRobot } from 'react-icons/fa';
import AddTaskToProjectModal from '../components/Projects/AddTaskToProjectModal';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import AITaskSuggestionsModal from '../components/Projects/AITaskSuggestionsModal';

const ProjectDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
    const [showAISuggestions, setShowAISuggestions] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [loadingAI, setLoadingAI] = useState(false);

    useEffect(() => {
        loadProjectDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

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
        try {
            await projectService.deleteProject(id, localStorage.getItem('token'), deleteTasks);
            navigate('/projects');
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    const confirmDelete = () => {
        const result = window.confirm("Do you want to delete all tasks associated with this project as well? \n\nClick 'OK' to delete project AND tasks. \nClick 'Cancel' to delete project only, keeping tasks as standalone.");
        handleDeleteProject(result);
    };

    const handleTaskCreated = async (newTaskData) => {
        try {
            const response = await tasksAPI.createTask(newTaskData);
            const newTask = response.data.task;
            setTasks([newTask, ...tasks]);
            // Refresh project to update counters
            const data = await projectService.getProject(id, localStorage.getItem('token'));
            setProject(data.project);
        } catch (error) {
            console.error('Error creating task:', error);
            alert("Error creating task: " + (error.response?.data?.message || error.message));
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

    const toggleTaskComplete = async (task, e) => {
        e.stopPropagation();
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        try {
            const response = await tasksAPI.updateTask(task._id, { status: newStatus });
            handleTaskUpdated(response.data.task);
        } catch (error) {
            console.error('Error toggling task status:', error);
        }
    };

    const handleGetAISuggestions = async () => {
        setLoadingAI(true);
        setShowAISuggestions(true);
        try {
            const response = await projectService.getAISuggestions({
                title: project.title,
                description: project.description,
                category: project.category
            });
            setAiSuggestions(response.data);
        } catch (error) {
            console.error("Error getting AI suggestions:", error);
            alert("Failed to get AI suggestions. Please try again.");
            setShowAISuggestions(false);
        } finally {
            setLoadingAI(false);
        }
    };

    const handleAcceptAI = async (suggestedTasks) => {
        setShowAISuggestions(false);
        setLoading(true);
        try {
            // Create each task
            for (const task of suggestedTasks) {
                await tasksAPI.createTask({
                    title: task.title,
                    estimatedDuration: task.estimated_minutes,
                    projectId: id,
                    userId: project.userId,
                    status: 'todo'
                });
            }
            // Reload project details to show new tasks
            await loadProjectDetails();
        } catch (error) {
            console.error("Error creating AI suggested tasks:", error);
            alert("Error creating some tasks. Please check the list.");
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
        taskMeta: {
            fontSize: '13px',
            color: theme.textSecondary,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
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
                        <button 
                            style={styles.deleteButton} 
                            onClick={confirmDelete}
                            className="delete-btn"
                        >
                            <FaTrash /> Delete Project
                        </button>
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

                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>Project Tasks</h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            style={{ ...styles.addTaskBtn, backgroundColor: 'transparent', color: theme.primary, border: `1px solid ${theme.primary}` }} 
                            onClick={handleGetAISuggestions}
                            className="add-btn"
                        >
                            <FaRobot /> AI Suggest More
                        </button>
                        <button 
                            style={styles.addTaskBtn} 
                            onClick={() => setShowAddTaskModal(true)}
                            className="add-btn"
                        >
                            <FaPlus /> Add Task
                        </button>
                    </div>
                </div>

                <div style={styles.taskList}>
                    {tasks.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: theme.textSecondary }}>
                            No tasks for this project yet. Add one to get started!
                        </div>
                    ) : (
                        tasks.map(task => {
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
                                        onClick={(e) => toggleTaskComplete(task, e)}
                                    >
                                        <div style={{ transform: isDone ? 'scale(1)' : 'scale(0)', transition: '0.2s' }}>
                                            <FaCheck size={12} color="#fff" />
                                        </div>
                                    </div>
                                    
                                    <div style={{ flex: 1 }}>
                                        <h4 style={styles.taskTitle(isDone)}>{task.title}</h4>
                                        <div style={styles.taskMeta}>
                                            <span style={{ color: getPriorityColor(task.priority) }}>{task.priority.toUpperCase()}</span>
                                            {task.deadline && <span>Due: {formatDate(task.deadline)}</span>}
                                            {task.estimatedDuration && <span>{task.estimatedDuration}m</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <AddTaskToProjectModal
                    isOpen={showAddTaskModal}
                    onClose={() => setShowAddTaskModal(false)}
                    onTaskCreated={handleTaskCreated}
                    projectId={id}
                />

                <TaskDetailModal
                    task={selectedTask}
                    isOpen={showTaskDetailModal}
                    onClose={() => {
                        setShowTaskDetailModal(false);
                        setSelectedTask(null);
                    }}
                    onTaskUpdated={handleTaskUpdated}
                    onTaskDeleted={handleTaskDeleted}
                />

                <AITaskSuggestionsModal
                    isOpen={showAISuggestions}
                    onClose={() => setShowAISuggestions(false)}
                    suggestions={aiSuggestions}
                    onAccept={handleAcceptAI}
                    loading={loadingAI}
                />
            </div>
        </Layout>
    );
};

export default ProjectDetailPage;
