import React, { useState, useEffect } from 'react';
import { FaTimes, FaRobot, FaCheck, FaTrash, FaPlus, FaClock, FaExclamationTriangle, FaEdit } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';

const AITaskSuggestionsModal = ({ isOpen, onClose, suggestions, onAccept, loading }) => {
    const { theme } = useTheme();
    const [editableTasks, setEditableTasks] = useState([]);

    useEffect(() => {
        if (suggestions && suggestions.suggested_subtasks) {
            setEditableTasks(suggestions.suggested_subtasks.map((task, index) => ({
                ...task,
                id: `suggested-${index}`,
                checked: true,
                isEditing: false
            })));
        }
    }, [suggestions]);

    if (!isOpen) return null;

    const handleToggleTask = (id) => {
        setEditableTasks(prev => prev.map(task => 
            task.id === id ? { ...task, checked: !task.checked } : task
        ));
    };

    const handleRemoveTask = (id) => {
        setEditableTasks(prev => prev.filter(task => task.id !== id));
    };

    const handleAddTask = () => {
        const newTask = {
            id: `custom-${Date.now()}`,
            title: 'New Task',
            estimated_minutes: 60,
            checked: true,
            isEditing: true
        };
        setEditableTasks(prev => [...prev, newTask]);
    };

    const handleUpdateTask = (id, field, value) => {
        setEditableTasks(prev => prev.map(task => 
            task.id === id ? { ...task, [field]: value } : task
        ));
    };

    const toggleEdit = (id) => {
        setEditableTasks(prev => prev.map(task => 
            task.id === id ? { ...task, isEditing: !task.isEditing } : task
        ));
    };

    const totalMinutes = editableTasks
        .filter(t => t.checked)
        .reduce((sum, task) => sum + parseInt(task.estimated_minutes || 0), 0);
    
    const totalHours = (totalMinutes / 60).toFixed(1);

    const getDifficultyColor = (minutes) => {
        if (minutes <= 30) return theme.success; // Quick
        if (minutes <= 120) return theme.primary; // Standard
        if (minutes <= 240) return theme.warning; // Long
        return theme.error; // Major
    };

    const getDifficultyLabel = (minutes) => {
        if (minutes <= 30) return 'Quick';
        if (minutes <= 120) return 'Standard';
        if (minutes <= 240) return 'Long';
        return 'Major';
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
            zIndex: 1100,
            backdropFilter: 'blur(4px)',
        },
        modal: {
            backgroundColor: theme.bgMain,
            borderRadius: borderRadius.xl,
            padding: '32px',
            width: '95%',
            maxWidth: '800px',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: `1px solid ${theme.border}`,
            position: 'relative',
            color: theme.textPrimary,
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
        },
        aiBadge: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: `${theme.primary}15`,
            color: theme.primary,
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '700',
            marginBottom: '8px',
            width: 'fit-content'
        },
        mockBadge: {
            backgroundColor: `${theme.warning}15`,
            color: theme.warning,
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            marginLeft: '8px',
            textTransform: 'uppercase'
        },
        analysisCard: {
            backgroundColor: theme.bgElevated || theme.bgMain,
            borderRadius: borderRadius.lg,
            padding: '20px',
            marginBottom: '24px',
            border: `1px solid ${theme.border}`,
            boxShadow: theme.shadows.neumorphic,
        },
        reasoning: {
            fontSize: '15px',
            lineHeight: '1.6',
            color: theme.textSecondary,
            fontStyle: 'italic',
            marginBottom: '16px',
        },
        statsRow: {
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
        },
        statItem: {
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
        },
        statLabel: {
            fontSize: '12px',
            color: theme.textMuted,
            fontWeight: '600',
            textTransform: 'uppercase'
        },
        statValue: {
            fontSize: '18px',
            fontWeight: '700',
            color: theme.textPrimary
        },
        taskList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '32px',
        },
        taskItem: (checked) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            borderRadius: borderRadius.md,
            backgroundColor: theme.bgMain,
            border: `1px solid ${checked ? theme.primary + '40' : theme.border}`,
            boxShadow: theme.shadows.neumorphic,
            transition: 'all 0.2s',
            opacity: checked ? 1 : 0.6
        }),
        checkbox: (checked) => ({
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            border: `2px solid ${checked ? theme.primary : theme.border}`,
            backgroundColor: checked ? theme.primary : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
        }),
        taskTitle: {
            flex: 1,
            fontSize: '15px',
            fontWeight: '600',
            border: 'none',
            background: 'transparent',
            color: theme.textPrimary,
            outline: 'none',
            padding: '4px 0'
        },
        durationInput: {
            width: '60px',
            padding: '4px 8px',
            borderRadius: '4px',
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.bgElevated || theme.bgMain,
            color: theme.textPrimary,
            fontSize: '13px',
            fontWeight: '600'
        },
        badge: (color) => ({
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '700',
            backgroundColor: `${color}15`,
            color: color,
            minWidth: '60px',
            textAlign: 'center'
        }),
        actionBtn: {
            background: 'none',
            border: 'none',
            color: theme.textMuted,
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
        },
        footer: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: `1px solid ${theme.border}`,
            paddingTop: '24px',
            marginTop: 'auto'
        },
        summary: {
            fontSize: '14px',
            color: theme.textSecondary,
        },
        btnGroup: {
            display: 'flex',
            gap: '12px',
        },
        secondaryBtn: {
            padding: '10px 20px',
            borderRadius: borderRadius.md,
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.bgMain,
            color: theme.textPrimary,
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
        },
        primaryBtn: {
            padding: '10px 24px',
            borderRadius: borderRadius.md,
            border: 'none',
            backgroundColor: theme.primary,
            color: '#fff',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: theme.shadows.neumorphic,
        },
        loadingOverlay: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 0',
            gap: '20px'
        },
        spinner: {
            width: '40px',
            height: '40px',
            border: `4px solid ${theme.primary}20`,
            borderTop: `4px solid ${theme.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .action-btn-hover:hover { color: ${theme.primary} !important; }
                .delete-btn-hover:hover { color: ${theme.error} !important; }
                .btn-hover:hover { transform: translateY(-1px); opacity: 0.9; }
            `}</style>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <div>
                        <div style={styles.aiBadge}>
                            <FaRobot /> AI Task Breakdown
                            <span style={styles.mockBadge}>Mock Data</span>
                        </div>
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>AI Suggestions</h2>
                    </div>
                    <button 
                        style={{ ...styles.actionBtn, fontSize: '20px' }} 
                        onClick={onClose}
                        className="delete-btn-hover"
                    >
                        <FaTimes />
                    </button>
                </div>

                {loading ? (
                    <div style={styles.loadingOverlay}>
                        <div style={styles.spinner} />
                        <p style={{ fontWeight: '600', color: theme.textSecondary }}>AI is analyzing your project requirements...</p>
                    </div>
                ) : (
                    <>
                        <div style={styles.analysisCard}>
                            <p style={styles.reasoning}>"{suggestions?.reasoning}"</p>
                            <div style={styles.statsRow}>
                                <div style={styles.statItem}>
                                    <span style={styles.statLabel}>Complexity</span>
                                    <span style={styles.statValue}>
                                        {suggestions?.is_large_task ? 'Complex / Large' : 'Standard / Medium'}
                                    </span>
                                </div>
                                <div style={styles.statItem}>
                                    <span style={styles.statLabel}>Est. Total Time</span>
                                    <span style={styles.statValue}>
                                        <FaClock size={14} style={{ marginRight: '6px' }} />
                                        {suggestions?.estimated_total_hours} Hours
                                    </span>
                                </div>
                                <div style={styles.statItem}>
                                    <span style={styles.statLabel}>Task Count</span>
                                    <span style={styles.statValue}>{editableTasks.length} Suggestions</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Suggested Task List</h3>
                            <button 
                                style={{ ...styles.secondaryBtn, padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                onClick={handleAddTask}
                            >
                                <FaPlus /> Add Task
                            </button>
                        </div>

                        <div style={styles.taskList}>
                            {editableTasks.map(task => (
                                <div key={task.id} style={styles.taskItem(task.checked)}>
                                    <div 
                                        style={styles.checkbox(task.checked)}
                                        onClick={() => handleToggleTask(task.id)}
                                    >
                                        {task.checked && <FaCheck size={12} color="#fff" />}
                                    </div>

                                    {task.isEditing ? (
                                        <input 
                                            style={styles.taskTitle}
                                            value={task.title}
                                            onChange={(e) => handleUpdateTask(task.id, 'title', e.target.value)}
                                            onBlur={() => toggleEdit(task.id)}
                                            autoFocus
                                        />
                                    ) : (
                                        <div 
                                            style={{ ...styles.taskTitle, cursor: 'text' }}
                                            onClick={() => toggleEdit(task.id)}
                                        >
                                            {task.title}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={styles.badge(getDifficultyColor(task.estimated_minutes))}>
                                            {getDifficultyLabel(task.estimated_minutes)}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <input 
                                                type="number"
                                                style={styles.durationInput}
                                                value={task.estimated_minutes}
                                                onChange={(e) => handleUpdateTask(task.id, 'estimated_minutes', e.target.value)}
                                            />
                                            <span style={{ fontSize: '12px', color: theme.textMuted, whiteSpace: 'nowrap' }}>minutes</span>
                                        </div>
                                        <button 
                                            style={styles.actionBtn}
                                            className="delete-btn-hover"
                                            onClick={() => handleRemoveTask(task.id)}
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={styles.footer}>
                            <div style={styles.summary}>
                                <strong>Total Plan:</strong> {totalHours} hours across {editableTasks.filter(t => t.checked).length} tasks
                            </div>
                            <div style={styles.btnGroup}>
                                <button style={styles.secondaryBtn} onClick={onClose} className="btn-hover">
                                    Cancel
                                </button>
                                <button 
                                    style={{ ...styles.secondaryBtn, color: theme.primary, borderColor: theme.primary }} 
                                    onClick={() => onAccept(editableTasks.filter(t => t.checked))}
                                    className="btn-hover"
                                >
                                    Accept Selected
                                </button>
                                <button 
                                    style={styles.primaryBtn} 
                                    onClick={() => onAccept(editableTasks)}
                                    className="btn-hover"
                                >
                                    <FaCheck /> Accept All Suggestions
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AITaskSuggestionsModal;
