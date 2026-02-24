// src/components/Auth/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AuthLayout from './AuthLayout';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const styles = getStyles(theme, isDarkMode);

  return (
    <AuthLayout>
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <div style={styles.logo}>✨</div>
          <h1 style={styles.title}>TaskFlow AI</h1>
        </div>
        <p style={styles.subtitle}>Sign in to your account</p>
      </div>

      {error && (
        <div style={styles.error}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            style={styles.input}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={styles.input}
            required
          />
        </div>

        <button
          type="submit"
          style={{
            ...styles.button,
            ...(loading && styles.buttonDisabled),
          }}
          disabled={loading}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = theme.primaryDark;
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${theme.primary}66`;
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = theme.primary;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div style={styles.footer}>
        <p style={styles.footerText}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>
            Sign up
          </Link>
        </p>
      </div>
      <style>{`
        input:focus {
            border-color: ${theme.primary} !important;
            box-shadow: 0 0 0 3px ${theme.primary}33 !important;
        }
        input::placeholder {
            color: ${isDarkMode ? '#6B7280' : theme.textMuted};
        }
      `}</style>
    </AuthLayout>
  );
};

const getStyles = (theme, isDarkMode) => ({
  // Container & Card styles removed (handled by AuthLayout)
  header: {
    marginBottom: '32px',
    textAlign: 'center',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  logo: {
    fontSize: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: '-0.02em',
    margin: 0,
  },
  subtitle: {
    fontSize: '15px',
    color: theme.textSecondary,
    margin: 0,
  },
  error: {
    backgroundColor: '#FEF2F2', // Light red bg
    border: '1px solid #EF4444',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#B91C1C', // Dark red text
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: theme.textSecondary, // Muted label
    marginBottom: '2px',
  },
  input: {
    backgroundColor: theme.bgCard,
    border: 'none',
    borderRadius: '12px',
    padding: '14px 18px',
    fontSize: '15px',
    color: theme.textPrimary,
    outline: 'none',
    transition: 'all 0.3s ease',
    boxShadow: theme.shadows.neumorphicInset,
  },
  button: {
    backgroundColor: theme.primary,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px', // Matches input radius
    padding: '14px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '12px',
    transition: 'all 0.2s',
    boxShadow: isDarkMode
      ? '0 4px 12px rgba(99, 102, 241, 0.3)' // Subtle glow
      : '0 4px 12px rgba(99, 102, 241, 0.2)',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '14px',
    color: theme.textMuted,
    margin: 0,
  },
  link: {
    color: theme.primary,
    textDecoration: 'none',
    fontWeight: '600',
  },
});

export default Login;