import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';
import { FaChevronDown } from 'react-icons/fa';

const CustomPermissionSelect = ({ value, onChange, options = ['view', 'complete', 'edit'] }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const styles = {
    container: {
      position: 'relative',
      display: 'inline-block',
      width: '100%',
    },
    button: {
      backgroundColor: theme.bgCard,
      border: `1px solid ${theme.border}`,
      borderRadius: borderRadius.lg,
      color: theme.textPrimary,
      fontSize: '14px',
      fontWeight: '600',
      padding: '10px 14px',
      cursor: 'pointer',
      outline: 'none',
      transition: 'all 150ms ease',
      boxShadow: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      userSelect: 'none',
    },
    buttonOpen: {
      borderColor: theme.primary,
      boxShadow: `0 0 0 3px ${theme.primary}22`,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: theme.bgElevated,
      border: `1px solid ${theme.border}`,
      borderTop: 'none',
      borderBottomLeftRadius: borderRadius.lg,
      borderBottomRightRadius: borderRadius.lg,
      boxShadow: theme.shadows.float,
      zIndex: 1000,
      overflow: 'hidden',
      animation: 'slideUp 150ms ease',
    },
    option: {
      padding: '12px 16px',
      cursor: 'pointer',
      transition: 'all 150ms ease',
      fontSize: '14px',
      fontWeight: '600',
      color: theme.textPrimary,
      borderBottom: `1px solid ${theme.border}`,
      userSelect: 'none',
    },
    optionHover: {
      backgroundColor: theme.bgCard,
      color: theme.primary,
    },
    optionSelected: {
      backgroundColor: `${theme.primary}20`,
      color: theme.primary,
    },
    chevron: {
      transition: 'transform 150ms ease',
      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    },
  };

  return (
    <div style={styles.container} ref={containerRef}>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <button
        style={{
          ...styles.button,
          ...(isOpen ? styles.buttonOpen : {}),
        }}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={(e) => !isOpen && (e.currentTarget.style.borderColor = `${theme.primary}60`)}
        onMouseLeave={(e) => !isOpen && (e.currentTarget.style.borderColor = theme.border)}
      >
        <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
        <FaChevronDown size={12} style={styles.chevron} />
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          {options.map((option) => (
            <div
              key={option}
              style={{
                ...styles.option,
                ...(value === option ? styles.optionSelected : {}),
              }}
              onMouseEnter={(e) => {
                if (value !== option) {
                  Object.assign(e.currentTarget.style, styles.optionHover);
                }
              }}
              onMouseLeave={(e) => {
                if (value !== option) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = theme.textPrimary;
                }
              }}
              onClick={() => handleSelect(option)}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomPermissionSelect;
