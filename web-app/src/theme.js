const commonColors = {
  primary: '#C9924A',
  primaryDark: '#A97533',
  primaryLight: '#E0B56F',
  accent: '#C9924A',
  accentWarm: '#B87355',
  aiPurple: '#B87355',
  success: '#5E8A6E',
  warning: '#C9924A',
  error: '#B85C5C',
  info: '#5A7FA0',
  urgent: '#B85C5C',
  high: '#C9924A',
  medium: '#5A7FA0',
  low: '#5E8A6E',
  chart: {
    work: '#C9924A',
    personal: '#5E8A6E',
    shopping: '#B85C5C',
    learning: '#B87355',
    health: '#5A7FA0',
    family: '#A07050',
  },
};

const sharedTokens = {
  bgBase: 'var(--bg-base)',
  bgSurface: 'var(--bg-surface)',
  bgRaised: 'var(--bg-raised)',
  bgOverlay: 'var(--bg-overlay)',
  bgMain: 'var(--bg-base)',
  bgCard: 'var(--bg-surface)',
  bgElevated: 'var(--bg-raised)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  textDisabled: 'var(--text-disabled)',
  border: 'var(--border-subtle)',
  borderColor: 'var(--border-subtle)',
  borderSubtle: 'var(--border-subtle)',
  borderMedium: 'var(--border-medium)',
  borderStrong: 'var(--border-strong)',
  accentDim: 'var(--accent-dim)',
  accentGlow: 'var(--accent-glow)',
  copper: 'var(--copper)',
  sage: 'var(--sage)',
  rose: 'var(--rose)',
  sky: 'var(--sky)',
  shadows: {
    xs: 'var(--shadow-xs)',
    subtle: 'var(--shadow-xs)',
    sm: 'var(--shadow-sm)',
    card: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    float: 'var(--shadow-lg)',
    glow: 'var(--shadow-glow)',
  },
};

export const darkTheme = {
  ...commonColors,
  ...sharedTokens,
  type: 'dark',
};

export const lightTheme = {
  ...commonColors,
  ...sharedTokens,
  type: 'light',
};

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
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  round: '50%',
};