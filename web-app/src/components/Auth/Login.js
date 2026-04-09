// src/components/Auth/Login.js
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authAPI } from '../../services/api';
import { FaCheckCircle, FaEnvelope, FaExclamationTriangle } from 'react-icons/fa';
import AuthLayout from './AuthLayout';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const { login } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const navigate = useNavigate();

  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setResending(true);
    setError('');
    setResendSuccess('');

    try {
      await authAPI.resendVerificationEmail(email);
      setResendSuccess('Verification email sent! Check your inbox.');
      setTimeout(() => setResendSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const styles = getStyles(theme, isDarkMode);

  return (
    <AuthLayout>
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <div style={styles.logo}>TF</div>
          <h1 style={styles.title}>TaskFlow AI</h1>
        </div>
        <p style={styles.subtitle}>Sign in to your account</p>
      </div>

      {error && (
        <div style={styles.error}>
          <FaExclamationTriangle />
          <span>{error}</span>
          {error.includes('verify') && (
            <button
              type="button"
              onClick={handleResendEmail}
              style={styles.resendButton}
              disabled={resending}
            >
              {resending ? 'Sending...' : 'Resend email'}
            </button>
          )}
        </div>
      )}

      {successMessage && (
        <div style={styles.success}>
          <FaCheckCircle />
          <span>{successMessage}</span>
        </div>
      )}

      {resendSuccess && (
        <div style={styles.success}>
          <FaEnvelope />
          <span>{resendSuccess}</span>
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
          <div style={styles.forgotRow}>
            <Link to="/forgot-password" style={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>
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
    marginBottom: '28px',
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
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: `linear-gradient(135deg, ${theme.primary}, ${theme.accentWarm})`,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '800',
    letterSpacing: '0.08em',
  },
  title: {
    fontFamily: '"Syne", sans-serif',
    fontSize: '30px',
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: '-0.04em',
    margin: 0,
  },
  subtitle: {
    fontSize: '15px',
    color: theme.textSecondary,
    margin: 0,
  },
  error: {
    backgroundColor: `${theme.error}14`,
    border: `1px solid ${theme.error}30`,
    borderLeft: `3px solid ${theme.error}`,
    borderRadius: '14px',
    padding: '14px 16px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: theme.error,
    fontSize: '14px',
    justifyContent: 'space-between',
  },
  resendButton: {
    backgroundColor: theme.error,
    color: '#FFF',
    border: 'none',
    borderRadius: '999px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    whiteSpace: 'nowrap',
    marginLeft: '8px',
  },
  success: {
    backgroundColor: `${theme.success}14`,
    border: `1px solid ${theme.success}30`,
    borderLeft: `3px solid ${theme.success}`,
    borderRadius: '14px',
    padding: '14px 16px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: theme.success,
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
  forgotRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '4px',
  },
  forgotLink: {
    color: theme.primary,
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '600',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: theme.textSecondary, // Muted label
    marginBottom: '2px',
    letterSpacing: '0.01em',
  },
  input: {
    backgroundColor: theme.bgCard,
    border: `1px solid ${theme.border}`,
    borderRadius: '14px',
    padding: '14px 16px',
    fontSize: '15px',
    color: theme.textPrimary,
    outline: 'none',
    transition: 'all 150ms ease',
    boxShadow: 'none',
  },
  button: {
    backgroundColor: theme.primary,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '999px',
    padding: '14px 18px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '12px',
    transition: 'all 150ms ease',
    boxShadow: theme.shadows.float,
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