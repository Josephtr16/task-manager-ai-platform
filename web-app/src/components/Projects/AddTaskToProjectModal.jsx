import React, { useEffect, useState } from 'react';
import { FaTimes, FaCalendarAlt, FaTag, FaFlag, FaPlus, FaPaperclip, FaClock } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';
import { tasksAPI } from '../../services/api';
import CustomSelect from '../common/CustomSelect';

const AddTaskToProjectModal = ({ isOpen, onClose, onTaskCreated, projectId }) => {
    const { theme } = useTheme();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        category: 'Work',
        priority: 'medium',
        estimatedDuration: 60,
        dependencies: [],
        tags: [],
        subtasks: []
    });
    const [tagInput, setTagInput] = useState('');
    const [newSubtask, setNewSubtask] = useState('');
    const [dependencyOptions, setDependencyOptions] = useState([]);
    const [loadingDependencies, setLoadingDependencies] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        const newTask = {
            ...formData,
            projectId,
        };
        
        if (newTask.dueDate) {
            newTask.deadline = newTask.dueDate;
        }
        delete newTask.dueDate;

        onTaskCreated(newTask);
        onClose();
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            dueDate: '',
            category: 'Work',
            priority: 'medium',
            dependencies: [],
            tags: [],
            subtasks: []
        });
        setNewSubtask('');
        setTagInput('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDependencyToggle = (taskId) => {
        setFormData((prev) => {
            const current = Array.isArray(prev.dependencies) ? prev.dependencies : [];
            const exists = current.includes(taskId);
            return {
                ...prev,
                dependencies: exists ? current.filter((id) => id !== taskId) : [...current, taskId],
            };
        });
    };

    useEffect(() => {
        const loadDependencyOptions = async () => {
            if (!isOpen || !projectId) {
                return;
            }

            setLoadingDependencies(true);
            try {
                const response = await tasksAPI.getTasks({ projectId, limit: 200 });
                const list = Array.isArray(response?.data?.tasks)
                    ? response.data.tasks
                    : Array.isArray(response?.data)
                        ? response.data
                        : [];
                setDependencyOptions(list.filter((item) => item?._id));
            } catch (error) {
                console.error('Failed to load task dependencies:', error);
                setDependencyOptions([]);
            } finally {
                setLoadingDependencies(false);
            }
        };

        loadDependencyOptions();
    }, [isOpen, projectId]);

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
        { value: 'Finance', label: 'Finance' },
        { value: 'Education', label: 'Education' }
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
        tagsContainer: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '12px',
        },
        tag: {
            backgroundColor: theme.bgMain,
            color: theme.primary,
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: theme.shadows.neumorphic,
        },
        removeTag: {
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.6,
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
            backgroundColor: theme.bgMain,
            borderRadius: borderRadius.sm,
            boxShadow: theme.shadows.neumorphic,
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
            backgroundColor: theme.bgMain,
            color: theme.textSecondary,
            border: 'none',
            borderRadius: borderRadius.md,
            cursor: 'pointer',
            boxShadow: theme.shadows.neumorphic,
            display: 'flex',
            alignItems: 'center',
        },
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
        submitButton: {
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
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={() => { resetForm(); onClose(); }}>
            <style>{`
                .close-btn:hover {
                    color: ${theme.error} !important;
                    box-shadow: ${theme.shadows.neumorphic} !important;
                }
                .cancel-btn:hover {
                    color: ${theme.textPrimary} !important;
                    transform: translateY(-1px);
                }
                .submit-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px ${theme.primary}66 !important;
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
                    <h2 style={styles.title}>Add Task to Project</h2>
                    <button style={styles.closeButton} onClick={() => { resetForm(); onClose(); }} className="close-btn">
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Task Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g., Draft Marketing Copy"
                            style={styles.input}
                            required
                            autoFocus
                        />
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
                        <label style={styles.label}><FaTag /> Depends On</label>
                        {loadingDependencies ? (
                            <p style={{ ...styles.label, margin: 0, fontWeight: '500' }}>Loading tasks...</p>
                        ) : dependencyOptions.length === 0 ? (
                            <p style={{ ...styles.label, margin: 0, fontWeight: '500' }}>No tasks available yet.</p>
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                maxHeight: '170px',
                                overflowY: 'auto',
                                paddingRight: '4px',
                            }}>
                                {dependencyOptions.map((item) => {
                                    const checked = Array.isArray(formData.dependencies) && formData.dependencies.includes(item._id);
                                    return (
                                        <label
                                            key={item._id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '8px 10px',
                                                borderRadius: borderRadius.md,
                                                border: `1px solid ${theme.border}`,
                                                backgroundColor: checked ? `${theme.primary}15` : theme.bgMain,
                                                boxShadow: theme.shadows.neumorphic,
                                                cursor: 'pointer',
                                                color: theme.textPrimary,
                                                fontSize: '14px',
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => handleDependencyToggle(item._id)}
                                            />
                                            <span>{item.title}</span>
                                        </label>
                                    );
                                })}
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
                            onClick={() => { resetForm(); onClose(); }}
                            style={styles.cancelButton}
                            className="cancel-btn"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={styles.submitButton}
                            className="submit-btn"
                        >
                            <FaPlus /> Add Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTaskToProjectModal;
