// src/components/Dashboard/QuickStats.js
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';
import { FaChartPie } from 'react-icons/fa';

const QuickStats = ({ stats }) => {
  const { theme } = useTheme();

  const styles = {
    container: {
      backgroundColor: theme.bgCard,
      borderRadius: borderRadius.lg,
      padding: '24px',
      boxShadow: theme.shadows.sm,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '20px',
    },
    iconWrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      borderRadius: '6px',
      backgroundColor: theme.bgElevated,
      color: theme.primary,
      border: `1px solid ${theme.border}`,
      fontSize: '13px',
    },
    title: {
      fontSize: '22px',
      fontWeight: '600',
      color: theme.textPrimary,
      margin: 0,
      fontFamily: '"Fraunces", serif',
    },
    list: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    item: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
    },
    label: {
      fontSize: '13px',
      fontWeight: '500',
      color: theme.textSecondary,
    },
    valueWrapper: {
      backgroundColor: theme.bgElevated,
      border: `1px solid ${theme.border}`,
      borderRadius: '6px',
      padding: '4px 8px',
      minWidth: '32px',
      textAlign: 'center',
    },
    value: {
      fontFamily: '"Geist Mono", monospace',
      fontSize: '13px',
      fontWeight: '800',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.iconWrapper}><FaChartPie /></span>
        <h3 style={styles.title}>Quick Stats</h3>
      </div>

      <div style={styles.list}>
        <div style={styles.item}>
          <span style={styles.label}>Urgent</span>
          <div style={styles.valueWrapper}>
            <span style={{ ...styles.value, color: theme.urgent }}>{stats?.urgent || 0}</span>
          </div>
        </div>
        <div style={styles.item}>
          <span style={styles.label}>High Priority</span>
          <div style={styles.valueWrapper}>
            <span style={{ ...styles.value, color: theme.warning }}>{stats?.highPriority || 0}</span>
          </div>
        </div>
        <div style={styles.item}>
          <span style={styles.label}>In Progress</span>
          <div style={styles.valueWrapper}>
            <span style={{ ...styles.value, color: theme.info }}>{stats?.inProgress || 0}</span>
          </div>
        </div>
        <div style={styles.item}>
          <span style={styles.label}>Overdue</span>
          <div style={styles.valueWrapper}>
            <span style={{ ...styles.value, color: theme.error }}>{stats?.overdue || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;