import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FaChevronDown } from 'react-icons/fa';

const CustomSelect = ({
    options,
    value,
    onChange,
    placeholder = "Select...",
    icon: Icon,
    label
}) => {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const selectedOption = options.find(opt => opt.value === value);

    const styles = {
        container: {
            position: 'relative',
            width: '100%',
            marginBottom: '20px',
        },
        label: {
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: theme.textPrimary,
            marginBottom: '8px',
        },
        trigger: {
            backgroundColor: theme.bgMain,
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: theme.shadows.neumorphicInset,
            border: '1px solid transparent',
            transition: 'all 0.2s ease',
            minHeight: '45px',
        },
        triggerOpen: {
            // border: `1px solid ${theme.primary}`,
        },
        valueContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: theme.textPrimary,
        },
        icon: {
            color: theme.textMuted,
            fontSize: '16px',
        },
        placeholder: {
            color: theme.textMuted,
        },
        dropdown: {
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            backgroundColor: theme.bgMain,
            borderRadius: '12px',
            boxShadow: theme.shadows.neumorphic,
            zIndex: 100,
            overflow: 'hidden',
            padding: '8px',
            border: `1px solid ${theme.border}`,
        },
        option: {
            padding: '10px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background-color 0.2s',
            color: theme.textPrimary,
        },
        optionHover: {
            backgroundColor: theme.bgElevated,
        }
    };

    return (
        <div style={styles.container} ref={wrapperRef}>
            {label && <label style={styles.label}>{label}</label>}

            <div
                style={{
                    ...styles.trigger,
                    ...(isOpen && styles.triggerOpen)
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div style={styles.valueContainer}>
                    {Icon && <Icon style={styles.icon} />}
                    {selectedOption ? (
                        <span style={{
                            color: selectedOption.color || theme.textPrimary,
                            fontWeight: selectedOption.color ? '600' : '400'
                        }}>
                            {selectedOption.label}
                        </span>
                    ) : (
                        <span style={styles.placeholder}>{placeholder}</span>
                    )}
                </div>
                <FaChevronDown style={{
                    color: theme.textSecondary,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '12px'
                }} />
            </div>

            {isOpen && (
                <div style={styles.dropdown}>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className="custom-select-option"
                            style={{
                                ...styles.option,
                                backgroundColor: option.value === value ? `${theme.primary}20` : 'transparent',
                                color: option.color || theme.textPrimary
                            }}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                            {option.value === value && (
                                <span style={{ color: theme.primary, fontSize: '12px' }}>●</span>
                            )}
                        </div>
                    ))}
                    <style>{`
                        .custom-select-option:hover {
                            background-color: ${theme.bgElevated} !important;
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
