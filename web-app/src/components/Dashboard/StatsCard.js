// src/components/Dashboard/StatsCard.js
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';

const StatsCard = ({ icon, label, value, subtitle, trend, color, customContent = null, progress = null }) => {
  const { theme } = useTheme();

  const styles = {
    card: {
      backgroundColor: theme.bgCard,
      borderRadius: borderRadius.lg,
      padding: '24px',
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      transition: 'all 150ms ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '176px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '18px',
    },
    iconChip: {
      width: '28px',
      height: '28px',
      borderRadius: '6px',
      backgroundColor: theme.bgElevated,
      border: `1px solid ${theme.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color || theme.primary,
      fontSize: '14px',
    },
    label: {
      fontSize: '11px',
      fontWeight: '700',
      color: theme.textSecondary,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontFamily: '"Fraunces", serif',
    },
    valueContainer: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '8px',
      marginBottom: '8px',
    },
    value: {
      fontFamily: '"Fraunces", serif',
      fontSize: '52px',
      fontWeight: '600',
      lineHeight: 1,
      color: theme.textPrimary,
      margin: 0,
      letterSpacing: '-0.02em',
    },
    trend: {
      fontSize: '20px',
    },
    subtitle: {
      fontSize: '12px',
      color: theme.textMuted,
      margin: '0 0 16px 0',
      fontFamily: '"Fraunces", serif',
    },
    progressWrap: {
      marginTop: '14px',
    },
    progressTrack: {
      width: '100%',
      height: '10px',
      borderRadius: '999px',
      backgroundColor: theme.bgElevated,
      border: `1px solid ${theme.border}`,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 'inherit',
      boxShadow: '0 0 10px rgba(0,0,0,0.12)',
    },
    progressMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '8px',
      fontSize: '12px',
      color: theme.textMuted,
      fontFamily: '"Fraunces", serif',
    },
    customContent: {
      marginTop: '4px',
      fontFamily: '"Fraunces", serif',
    },
  };

  return (
    <div style={styles.card} className="stats-card">
      <style>{`
        .stats-card:hover {
          transform: translateY(-2px);
          box-shadow: ${theme.shadows.float} !important;
          border-color: ${theme.primary}33 !important;
        }
      `}</style>
      <div style={styles.header}>
        <span style={styles.label}>{label}</span>
        <span style={styles.iconChip}>{icon}</span>
      </div>

      {customContent ? (
        <div style={styles.customContent}>{customContent}</div>
      ) : (
        <>
          <div style={styles.valueContainer}>
            <h2 style={styles.value}>{value}</h2>
            {trend && (
              <span style={{ ...styles.trend, color: trend > 0 ? theme.success : theme.error }}>
                {trend > 0 ? '↗' : '↘'}
              </span>
            )}
          </div>

          {subtitle && <p style={styles.subtitle}>{subtitle}</p>}

          {progress && (
            <div style={styles.progressWrap}>
              <div style={styles.progressTrack} aria-hidden="true">
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${Math.min(100, Math.max(0, progress.total > 0 ? (progress.current / progress.total) * 100 : 0))}%`,
                    backgroundColor: progress.color || color || theme.primary,
                  }}
                />
              </div>
              <div style={styles.progressMeta}>
                <span>{progress.labelLeft || ''}</span>
                <span>{progress.labelRight || ''}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StatsCard;