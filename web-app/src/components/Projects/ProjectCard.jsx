import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';
import { FaCalendarAlt, FaTasks, FaTag, FaFlag } from 'react-icons/fa';

const ProjectCard = ({ project }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return theme.success;
            case 'in-progress': return theme.info;
            case 'not-started': return theme.textMuted;
            default: return theme.textSecondary;
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
        card: {
            backgroundColor: theme.bgMain,
            borderRadius: borderRadius.lg,
            padding: '24px',
            boxShadow: theme.shadows.neumorphic,
            cursor: 'pointer',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
        },
        title: {
            fontSize: '18px',
            fontWeight: '700',
            color: theme.textPrimary,
            margin: '0 0 8px 0',
        },
        description: {
            fontSize: '14px',
            color: theme.textSecondary,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
        },
        badgesRow: {
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
        },
        badge: {
            fontSize: '12px',
            fontWeight: '600',
            padding: '4px 8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
        },
        progressSection: {
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        },
        progressHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: theme.textSecondary,
            fontWeight: '600',
        },
        progressBarBackground: {
            height: '8px',
            backgroundColor: theme.bgElevated || theme.border,
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: theme.shadows.neumorphicInset,
        },
        progressBarFill: {
            height: '100%',
            width: `${project.progress}%`,
            backgroundColor: project.progress < 30 ? theme.error : project.progress < 70 ? theme.warning : theme.success,
            borderRadius: '4px',
            transition: 'width 0.5s ease',
        },
        footer: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: `1px solid ${theme.border}`,
        },
        footerText: {
            fontSize: '12px',
            color: theme.textMuted,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
        }
    };

    return (
        <div 
            style={styles.card} 
            onClick={() => navigate(`/projects/${project._id}`)}
            className="project-card"
        >
            <style>{`
                .project-card:hover {
                    transform: translateY(-4px);
                    box-shadow: ${theme.shadows?.neumorphic || '0 10px 20px rgba(0,0,0,0.1)'} !important;
                    border-color: ${theme.primary}40 !important;
                }
            `}</style>
            <div style={styles.header}>
                <div>
                    <h3 style={styles.title}>{project.title}</h3>
                    {project.description && (
                        <p style={styles.description}>{project.description}</p>
                    )}
                </div>
            </div>

            <div style={styles.badgesRow}>
                <span style={{
                    ...styles.badge,
                    backgroundColor: getStatusColor(project.status) + '20',
                    color: getStatusColor(project.status)
                }}>
                    {project.status.replace('-', ' ').toUpperCase()}
                </span>
                <span style={{
                    ...styles.badge,
                    backgroundColor: theme.primary + '20',
                    color: theme.primary
                }}>
                    <FaTag size={10} /> {project.category}
                </span>
                <span style={{
                    ...styles.badge,
                    backgroundColor: getPriorityColor(project.priority) + '20',
                    color: getPriorityColor(project.priority)
                }}>
                    <FaFlag size={10} /> {project.priority.toUpperCase()}
                </span>
            </div>

            <div style={styles.progressSection}>
                <div style={styles.progressHeader}>
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                </div>
                <div style={styles.progressBarBackground}>
                    <div style={styles.progressBarFill} />
                </div>
                <div style={styles.progressHeader}>
                    <span>Tasks</span>
                    <span>{project.completedTasks} / {project.totalTasks}</span>
                </div>
            </div>

            <div style={styles.footer}>
                <span style={styles.footerText}>
                    <FaTasks size={12} /> {project.totalTasks} Tasks
                </span>
                {project.dueDate && (
                    <span style={styles.footerText}>
                        <FaCalendarAlt size={12} /> Due: {formatDate(project.dueDate)}
                    </span>
                )}
            </div>
        </div>
    );
};

export default ProjectCard;
