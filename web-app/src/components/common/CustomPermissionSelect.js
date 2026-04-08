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
      backgroundColor: theme.bgElevated || theme.bgMain,
      border: `1.5px solid ${theme.border}`,
      borderRadius: borderRadius.lg,
      color: theme.textPrimary,
      fontSize: '14px',
      fontWeight: '600',
      padding: '10px 14px',
      cursor: 'pointer',
      outline: 'none',
      transition: 'all 0.2s ease',
      boxShadow: theme.type === 'dark' 
        ? '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)' 
        : '0 2px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      userSelect: 'none',
    },
    buttonOpen: {
      borderColor: theme.primary,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      boxShadow: `0 0 0 3px ${theme.primary}25, inset 0 1px 0 rgba(255,255,255,0.05)`,
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: theme.bgElevated || theme.bgMain,
      border: `1.5px solid ${theme.primary}`,
      borderTop: 'none',
      borderBottomLeftRadius: borderRadius.lg,
      borderBottomRightRadius: borderRadius.lg,
      boxShadow: theme.type === 'dark' 
        ? '0 8px 16px rgba(0,0,0,0.3)' 
        : '0 8px 16px rgba(0,0,0,0.15)',
      zIndex: 1000,
      overflow: 'hidden',
      animation: 'slideDown 0.2s ease',
    },
    option: {
      padding: '12px 16px',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      fontSize: '14px',
      fontWeight: '600',
      color: theme.textPrimary,
      borderBottom: `1px solid ${theme.border}25`,
      userSelect: 'none',
    },
    optionHover: {
      backgroundColor: theme.primary,
      color: '#fff',
      paddingLeft: '20px',
    },
    optionSelected: {
      backgroundColor: theme.primary,
      color: '#fff',
    },
    chevron: {
      transition: 'transform 0.2s ease',
      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    },
  };

  return (
    <div style={styles.container} ref={containerRef}>
      <style>{`
        @keyframes slideDown {
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
        onMouseEnter={(e) => !isOpen && (e.target.style.borderColor = theme.primary + '60')}
        onMouseLeave={(e) => !isOpen && (e.target.style.borderColor = theme.border)}
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
                  Object.assign(e.target.style, styles.optionHover);
                }
              }}
              onMouseLeave={(e) => {
                if (value !== option) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = theme.textPrimary;
                  e.target.style.paddingLeft = '16px';
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
