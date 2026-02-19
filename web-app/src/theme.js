// src/theme.js

// src/theme.js

// Common colors shared between themes
const commonColors = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  aiPurple: '#8B7FFF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  urgent: '#EF4444',
  high: '#FF6B6B',
  medium: '#F59E0B',
  low: '#10B981',
  chart: {
    work: '#6366F1',
    personal: '#10B981',
    shopping: '#EF4444',
    learning: '#8B7FFF',
    health: '#F59E0B',
    family: '#EC4899',
  }
};

export const darkTheme = {
  ...commonColors,
  type: 'dark',
  bgMain: 'var(--bg-main)',
  bgCard: 'var(--bg-card)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  border: 'var(--border-color)',
  shadows: {
    neumorphic: 'var(--shadow-neu)',
    neumorphicInset: 'var(--shadow-neu-inset)',
    neumorphicHover: 'var(--shadow-neu)', // fallbacks or custom if needed
    neumorphicActive: 'var(--shadow-neu-inset)',
    card: 'var(--shadow-card)',
  }
};

export const lightTheme = {
  ...commonColors,
  type: 'light',
  bgMain: 'var(--bg-main)',
  bgCard: 'var(--bg-card)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  border: 'var(--border-color)',
  shadows: {
    neumorphic: 'var(--shadow-neu)',
    neumorphicInset: 'var(--shadow-neu-inset)',
    neumorphicHover: 'var(--shadow-neu)',
    neumorphicActive: 'var(--shadow-neu-inset)',
    card: 'var(--shadow-card)',
  }
};

// Deprecated: For backward compatibility during migration
// These will eventually be removed once all components use existing hooks
export const colors = darkTheme;
export const shadows = darkTheme.shadows;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '20px',
  xl: '30px',
  round: '50%',
};