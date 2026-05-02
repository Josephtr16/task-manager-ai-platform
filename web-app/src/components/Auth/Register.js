// src/components/Auth/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AuthLayout from './AuthLayout';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tt = (key, fallback, options = {}) => t(key, { defaultValue: fallback, ...options });

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError(tt('authExtras.invalidEmail', 'Please enter a valid email address.'));
      return;
    }

    if (password !== confirmPassword) {
      setError(tt('authExtras.passwordMismatch', 'Passwords do not match.'));
      return;
    }

    if (password.length < 6) {
      setError(tt('authExtras.passwordTooShort', 'Password must be at least 6 characters.'));
      return;
    }

    setLoading(true);

    const result = await register(name, email, password);

    if (result.success) {
      // Navigate to login with a success message
      navigate('/login', { state: { message: result.message } });
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
          <div style={styles.logo}>TF</div>
          <h1 style={styles.title}>{t('app.name')}</h1>
        </div>
        <p style={styles.subtitle}>{tt('auth.createAccount', 'Create your account')}</p>
      </div>

      {error && (
        <div style={styles.error}>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>{tt('auth.fullName', 'Full name')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            style={styles.input}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>{tt('auth.email', 'Email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={tt('authExtras.emailPlaceholder', 'your.email@example.com')}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>{tt('auth.password', 'Password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={tt('authExtras.passwordPlaceholder', 'Enter your password')}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>{tt('auth.confirmPassword', 'Confirm password')}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={tt('authExtras.passwordPlaceholder', 'Enter your password')}
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
          {loading ? tt('authExtras.creatingAccount', 'Creating account...') : tt('auth.createAccount', 'Create account')}
        </button>
      </form>

      <div style={styles.footer}>
        <p style={styles.footerText}>
          {tt('authExtras.alreadyHaveAccount', 'Already have an account?')}{' '}
          <Link to="/login" style={styles.link}>
            {tt('auth.login', 'Sign in')}
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
    fontWeight: '600',
    color: theme.textSecondary,
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

export default Register;