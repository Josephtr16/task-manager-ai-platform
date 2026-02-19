// src/components/Dashboard/StatsCard.js
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';

const StatsCard = ({ icon, label, value, subtitle, trend, color }) => {
  const { theme } = useTheme();

  const styles = {
    card: {
      backgroundColor: theme.bgMain, // Blends with background
      borderRadius: borderRadius.lg,
      padding: '24px',
      boxShadow: theme.shadows.card, // Neomorphic shadow
      border: `1px solid ${theme.border}`,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: theme.textSecondary,
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
    },
    valueContainer: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '8px',
      marginBottom: '8px',
    },
    value: {
      fontSize: '36px',
      fontWeight: '800',
      color: theme.textPrimary,
      margin: 0,
      textShadow: theme.type === 'dark' ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none',
    },
    trend: {
      fontSize: '20px',
    },
    subtitle: {
      fontSize: '13px',
      color: theme.textMuted,
      margin: '0 0 16px 0',
    },
    progressContainer: {
      padding: '2px', // Inner padding for inset effect
      borderRadius: '4px',
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphicInset, // Inset shadow for track
    },
    progressBar: {
      height: '6px',
      borderRadius: '3px',
      overflow: 'hidden',
      position: 'relative',
    },
    progress: {
      height: '100%',
      borderRadius: '3px',
      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 0 8px rgba(0,0,0,0.3)', // Glow effect
    },
  };

  return (
    <div style={styles.card} className="stats-card">
      <style>{`
        .stats-card:hover {
          transform: translateY(-4px);
          box-shadow: ${theme.type === 'dark' ? '12px 12px 24px #16191c, -12px -12px 24px #2c3136' : '12px 12px 24px #d1d5db, -12px -12px 24px #ffffff'} !important;
        }
      `}</style>
      <div style={styles.header}>
        <span style={styles.label}>{label}</span>
        <span style={{ fontSize: '24px' }}>{icon}</span>
      </div>

      <div style={styles.valueContainer}>
        <h2 style={styles.value}>{value}</h2>
        {trend && (
          <span style={{ ...styles.trend, color: trend > 0 ? theme.success : theme.error }}>
            {trend > 0 ? '↗' : '↘'}
          </span>
        )}
      </div>

      {subtitle && <p style={styles.subtitle}>{subtitle}</p>}

      <div style={styles.progressContainer}>
        <div style={{ ...styles.progressBar, backgroundColor: color + '20' }}>
          <div style={{ ...styles.progress, backgroundColor: color, width: `${Math.min(value, 100)}%` }} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;