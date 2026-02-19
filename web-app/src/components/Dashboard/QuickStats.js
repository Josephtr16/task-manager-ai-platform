// src/components/Dashboard/QuickStats.js
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';

const QuickStats = ({ stats }) => {
  const { theme } = useTheme();

  const styles = {
    container: {
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.lg,
      padding: '24px',
      boxShadow: theme.shadows.neumorphic, // Pop out
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '20px',
    },
    title: {
      fontSize: '18px',
      fontWeight: '700',
      color: theme.textPrimary,
      margin: 0,
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
      padding: '8px 4px',
    },
    label: {
      fontSize: '15px',
      fontWeight: '500',
      color: theme.textSecondary,
    },
    valueWrapper: {
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphicInset, // Inset for values
      borderRadius: '8px',
      padding: '4px 12px',
      minWidth: '40px',
      textAlign: 'center',
    },
    value: {
      fontSize: '18px',
      fontWeight: '800',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={{ fontSize: '20px' }}>📊</span>
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