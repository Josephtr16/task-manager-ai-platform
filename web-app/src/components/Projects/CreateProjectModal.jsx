import React, { useState } from 'react';
import { FaTimes, FaCalendarAlt, FaTag, FaFlag, FaPlus, FaRobot } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';
import CustomSelect from '../common/CustomSelect';
import api from '../../services/api';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
    const { theme } = useTheme();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        category: 'Work',
        priority: 'medium',
        estimatedTotalHours: 0
    });
    const [loadingEnhance, setLoadingEnhance] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e, tasks = []) => {
        if (e) e.preventDefault();
        
        const dataToSubmit = { 
            ...formData,
            tasks: tasks.map(t => ({
                title: t.title,
                estimatedDuration: t.estimated_minutes,
                status: 'todo'
            }))
        };
        
        if (!dataToSubmit.dueDate) {
            delete dataToSubmit.dueDate;
        }

        onProjectCreated(dataToSubmit);
        resetForm();
    };

    const handleEnhanceProject = async () => {
        if (!formData.title.trim()) {
            setNotificationMessage('Please enter a project title first');
            setTimeout(() => setNotificationMessage(''), 3000);
            return;
        }

        setLoadingEnhance(true);
        try {
            const response = await api.post('/ai/enhance-project', {
                name: formData.title,
                description: formData.description,
            });
            const result = response.data;

            if (result) {
                const aiCategory = result.category;
                const allowedCategories = ['Work', 'Personal', 'Health', 'Shopping', 'Study'];
                const normalizedCategory = allowedCategories.includes(aiCategory)
                    ? aiCategory
                    : formData.category;

                setFormData(prev => ({
                    ...prev,
                    description: result.description || prev.description,
                    category: normalizedCategory,
                    estimatedTotalHours: Number.isFinite(result.estimated_hours)
                        ? result.estimated_hours
                        : prev.estimatedTotalHours
                }));
                setNotificationMessage('✨ Project enhanced by AI');
                setTimeout(() => setNotificationMessage(''), 3000);
            }
        } catch (error) {
            console.error("Error enhancing project:", error);
            setNotificationMessage('Failed to enhance project. Please try again.');
            setTimeout(() => setNotificationMessage(''), 3000);
        } finally {
            setLoadingEnhance(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            dueDate: '',
            category: 'Work',
            priority: 'medium',
            estimatedTotalHours: 0
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        },
        modal: {
            backgroundColor: theme.bgMain,
            borderRadius: borderRadius.xl,
            padding: '32px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: `1px solid ${theme.border}`,
            position: 'relative',
            color: theme.textPrimary,
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            borderBottom: `2px solid ${theme.bgMain}`,
            paddingBottom: '16px',
            boxShadow: `0 1px 0 ${theme.border}40`,
        },
        title: {
            fontSize: '24px',
            fontWeight: '800',
            color: theme.textPrimary,
            margin: 0
        },
        closeButton: {
            background: 'transparent',
            border: 'none',
            color: theme.textSecondary,
            fontSize: '20px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
        },
        formGroup: {
            marginBottom: '20px',
        },
        label: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: theme.textSecondary,
            marginBottom: '8px',
        },
        input: {
            width: '100%',
            padding: '12px 16px',
            fontSize: '15px',
            backgroundColor: theme.bgMain,
            border: 'none',
            borderRadius: borderRadius.md,
            color: theme.textPrimary,
            boxShadow: theme.shadows.neumorphicInset,
            outline: 'none',
            transition: 'box-shadow 0.2s',
            boxSizing: 'border-box'
        },
        textarea: {
            width: '100%',
            padding: '12px 16px',
            fontSize: '15px',
            backgroundColor: theme.bgMain,
            border: 'none',
            borderRadius: borderRadius.md,
            color: theme.textPrimary,
            boxShadow: theme.shadows.neumorphicInset,
            outline: 'none',
            resize: 'vertical',
            minHeight: '100px',
            boxSizing: 'border-box'
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
            display: 'flex',
            gap: '12px',
        },
        priorityBtn: (option) => ({
            flex: 1,
            padding: '10px',
            borderRadius: borderRadius.md,
            border: 'none',
            backgroundColor: formData.priority === option.value ? option.color : theme.bgMain,
            color: formData.priority === option.value ? '#fff' : theme.textSecondary,
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: formData.priority === option.value
                ? `inset 3px 3px 6px rgba(0,0,0,0.2)`
                : theme.shadows.neumorphic,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
        }),
        footer: {
            marginTop: '32px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '16px',
        },
        cancelButton: {
            padding: '12px 24px',
            borderRadius: borderRadius.lg,
            border: 'none',
            backgroundColor: theme.bgMain,
            color: theme.textSecondary,
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: theme.shadows.neumorphic,
            transition: 'all 0.2s',
        },
        createButton: {
            padding: '12px 32px',
            borderRadius: borderRadius.lg,
            border: 'none',
            backgroundColor: theme.primary,
            color: '#fff',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: theme.shadows.neumorphic,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
        },
        aiEnhanceButton: {
            padding: '10px 16px',
            borderRadius: borderRadius.md,
            border: `1px solid ${theme.primary}`,
            backgroundColor: 'transparent',
            color: theme.primary,
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: theme.shadows.neumorphic,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            marginTop: '8px',
        },
    };

    return (
        <div style={styles.overlay} onClick={() => { resetForm(); onClose(); }}>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .close-btn:hover {
                    color: ${theme.error} !important;
                    box-shadow: ${theme.shadows.neumorphic} !important;
                }
                .cancel-btn:hover {
                    color: ${theme.textPrimary} !important;
                    transform: translateY(-1px);
                }
                .create-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px ${theme.primary}66 !important;
                }
                .ai-enhance-btn:hover:not(:disabled) {
                    background-color: ${theme.primary}11 !important;
                    transform: translateY(-1px);
                }
                .ai-enhance-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                /* Custom DatePicker Styles */
                .react-datepicker {
                    background-color: ${theme.bgMain} !important;
                    border: 1px solid ${theme.border} !important;
                    border-radius: 12px !important;
                    font-family: 'Inter', sans-serif !important;
                    box-shadow: ${theme.shadows.neumorphic} !important;
                    color: ${theme.textPrimary} !important;
                }
                .react-datepicker__header {
                    background-color: ${theme.bgMain} !important;
                    border-bottom: 1px solid ${theme.border} !important;
                    border-top-left-radius: 12px !important;
                    border-top-right-radius: 12px !important;
                }
                .react-datepicker__current-month,
                .react-datepicker-time__header,
                .react-datepicker-year-header {
                    color: ${theme.textPrimary} !important;
                    font-weight: 600 !important;
                }
                .react-datepicker__day-name {
                    color: ${theme.textSecondary} !important;
                }
                .react-datepicker__day {
                    color: ${theme.textPrimary} !important;
                    border-radius: 50% !important;
                }
                .react-datepicker__day:hover {
                    background-color: ${theme.bgElevated} !important;
                }
                .react-datepicker__day--selected,
                .react-datepicker__day--keyboard-selected {
                    background-color: ${theme.primary} !important;
                    color: #fff !important;
                    box-shadow: 0 0 10px ${theme.primary}66 !important;
                }
                .react-datepicker__input-container input {
                    width: 100%;
                    background-color: ${theme.bgMain};
                    border: none;
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: ${theme.textPrimary};
                    box-shadow: ${theme.shadows.neumorphicInset};
                    outline: none;
                    box-sizing: border-box;
                }
                .react-datepicker__triangle {
                    display: none;
                }
                .react-datepicker__navigation-icon::before {
                    border-color: ${theme.textSecondary} !important;
                }
                .react-datepicker__navigation:hover *::before {
                    border-color: ${theme.textPrimary} !important;
                }
            `}</style>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Create New Project</h2>
                    <button style={styles.closeButton} onClick={() => { resetForm(); onClose(); }} className="close-btn">
                        <FaTimes />
                    </button>
                </div>

                {notificationMessage && (
                    <div style={{
                        padding: '12px 16px',
                        marginBottom: '16px',
                        borderRadius: borderRadius.md,
                        backgroundColor: notificationMessage.includes('Failed') ? `${theme.error}22` : `${theme.primary}22`,
                        color: notificationMessage.includes('Failed') ? theme.error : theme.primary,
                        fontSize: '14px',
                        fontWeight: '500',
                        animation: 'slideDown 0.3s ease-out'
                    }} className="notification">
                        {notificationMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Project Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g., Q3 Marketing Campaign"
                            style={styles.input}
                            required
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={handleEnhanceProject}
                            style={{
                                ...styles.aiEnhanceButton,
                                opacity: loadingEnhance ? 0.6 : 1,
                                cursor: loadingEnhance ? 'not-allowed' : 'pointer'
                            }}
                            disabled={loadingEnhance}
                            className="ai-enhance-btn"
                        >
                            {loadingEnhance ? (
                                <>
                                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Enhancing...
                                </>
                            ) : (
                                <>✨ AI Enhance Project</>
                            )}
                        </button>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Add details about the project's goals..."
                            style={styles.textarea}
                        />
                    </div>

                    <div style={styles.row}>
                        <div style={styles.col}>
                            <label style={styles.label}><FaCalendarAlt /> Due Date</label>
                            <DatePicker
                                selected={formData.dueDate ? new Date(formData.dueDate) : null}
                                onChange={date => setFormData(prev => ({ ...prev, dueDate: date ? date.toISOString() : '' }))}
                                dateFormat="MM/dd/yyyy"
                                placeholderText="mm/dd/yyyy"
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
                        <label style={styles.label}>Estimated Total Hours (Optional)</label>
                        <input
                            type="number"
                            name="estimatedTotalHours"
                            value={formData.estimatedTotalHours}
                            onChange={handleInputChange}
                            placeholder="0"
                            min="0"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.footer}>
                        <button
                            type="button"
                            onClick={() => { resetForm(); onClose(); }}
                            style={styles.cancelButton}
                            className="cancel-btn"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={styles.createButton}
                            className="create-btn"
                        >
                            <FaPlus /> Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
