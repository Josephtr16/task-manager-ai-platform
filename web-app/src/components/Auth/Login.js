// src/components/Auth/Login.js
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authAPI } from '../../services/api';
import { FaCheckCircle, FaEnvelope, FaExclamationTriangle, FaLock, FaArrowRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import AuthLayout from './AuthLayout';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
  const tt = (key, fallback, options = {}) => t(key, { defaultValue: fallback, ...options });

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
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <div style={styles.logo}>
              <span style={styles.logoText}>TF</span>
            </div>
          </div>
          <h1 style={styles.title}>{tt('auth.welcomeBack', 'Welcome back')}</h1>
          <p style={styles.subtitle}>{tt('authExtras.signInPrompt', 'Sign in to continue')}</p>
        </div>

        {/* Messages */}
        {error && (
          <div style={styles.alertBox} className="alert-error">
            <div style={styles.alertIcon}>
              <FaExclamationTriangle size={18} />
            </div>
            <div style={styles.alertContent}>
              <p style={styles.alertText}>{error}</p>
              {error.includes('verify') && (
                <button
                  type="button"
                  onClick={handleResendEmail}
                  style={styles.resendLink}
                  disabled={resending}
                >
                  {resending ? tt('authExtras.sending', 'Sending...') : 'Resend verification email →'}
                </button>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div style={styles.alertBox} className="alert-success">
            <div style={styles.alertIcon}>
              <FaCheckCircle size={18} />
            </div>
            <p style={styles.alertText}>{successMessage}</p>
          </div>
        )}

        {resendSuccess && (
          <div style={styles.alertBox} className="alert-success">
            <div style={styles.alertIcon}>
              <FaEnvelope size={18} />
            </div>
            <p style={styles.alertText}>{resendSuccess}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email Input */}
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>{tt('auth.email', 'Email Address')}</label>
            <div style={styles.inputWrapper}>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tt('authExtras.emailPlaceholder', 'your.email@example.com')}
                style={styles.input}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={styles.inputGroup}>
            <div style={styles.labelRow}>
              <label htmlFor="password" style={styles.label}>{tt('auth.password', 'Password')}</label>
              <Link to="/forgot-password" style={styles.forgotLink}>
                {tt('authExtras.forgotShort', 'Forgot?')}
              </Link>
            </div>
            <div style={styles.inputWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tt('authExtras.passwordPlaceholder', 'Enter your password')}
                style={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.togglePasswordBtn}
                tabIndex="-1"
              >
                <span style={styles.togglePasswordText}>
                  {showPassword ? tt('common.hide', 'Hide') : tt('common.show', 'Show')}
                </span>
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              ...(loading && styles.submitBtnLoading),
            }}
            disabled={loading}
          >
            <span style={styles.submitBtnText}>
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  {tt('authExtras.signingIn', 'Signing in...')}
                </>
              ) : (
                <>
                  {tt('authExtras.signIn', 'Sign in')}
                  <FaArrowRight size={16} style={styles.arrowIcon} />
                </>
              )}
            </span>
          </button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            {tt('authExtras.alreadyHaveAccount', 'Already have an account?')} {' '}
            <Link to="/register" style={styles.signupLink}>
              {tt('auth.createAccount', 'Create account')}
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        .auth-login-container {
          animation: slideIn 0.5s ease-out;
        }

        #email:focus,
        #password:focus {
          border-color: ${theme.primary} !important;
          box-shadow: 0 0 0 3px ${theme.primary}22 !important;
          background-color: ${isDarkMode ? 'rgba(201, 146, 74, 0.05)' : 'rgba(201, 146, 74, 0.02)'} !important;
        }

        #email::placeholder,
        #password::placeholder {
          color: ${theme.textMuted};
        }

        .alert-error {
          animation: slideIn 0.3s ease-out;
        }

        .alert-success {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </AuthLayout>
  );
};

const getStyles = (theme, isDarkMode) => ({
  container: {
    animation: 'slideIn 0.5s ease-out',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    marginBottom: '36px',
    textAlign: 'center',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  logo: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accentWarm} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 8px 24px ${theme.primary}44`,
    animation: 'float 3s ease-in-out infinite',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '0.12em',
  },
  title: {
    fontFamily: '"Syne", sans-serif',
    fontSize: '32px',
    fontWeight: '800',
    color: theme.textPrimary,
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '15px',
    color: theme.textSecondary,
    margin: 0,
    fontWeight: '500',
  },
  
  // Alert Styles
  alertBox: {
    marginBottom: '24px',
    padding: '14px 16px',
    borderRadius: '12px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
  },
  alertIcon: {
    marginTop: '2px',
    minWidth: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertText: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '1.5',
  },
  resendLink: {
    backgroundColor: 'transparent',
    color: 'inherit',
    border: 'none',
    padding: '4px 0',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
    transition: 'opacity 150ms ease',
  },

  // Form Styles
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
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: theme.textSecondary,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  },
  forgotLink: {
    fontSize: '13px',
    fontWeight: '600',
    color: theme.primary,
    textDecoration: 'none',
    transition: 'opacity 150ms ease',
    cursor: 'pointer',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: theme.bgCard,
    border: `1.5px solid ${theme.border}`,
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '15px',
    color: theme.textPrimary,
    outline: 'none',
    transition: 'all 200ms ease',
    fontFamily: 'inherit',
  },
  togglePasswordBtn: {
    position: 'absolute',
    right: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    color: theme.textMuted,
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 8px',
    transition: 'color 150ms ease',
  },
  togglePasswordText: {
    fontSize: '11px',
  },

  // Submit Button
  submitBtn: {
    marginTop: '8px',
    paddingTop: '13px',
    paddingBottom: '13px',
    paddingLeft: '20px',
    paddingRight: '20px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: theme.primary,
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    boxShadow: `0 4px 12px ${theme.primary}44`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  submitBtnText: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  arrowIcon: {
    marginLeft: '4px',
    transition: 'transform 200ms ease',
  },
  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid #FFFFFF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  submitBtnLoading: {
    opacity: 0.8,
    cursor: 'not-allowed',
  },

  // Footer
  footer: {
    marginTop: '28px',
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: `1px solid ${theme.border}`,
  },
  footerText: {
    fontSize: '14px',
    color: theme.textMuted,
    margin: 0,
  },
  signupLink: {
    color: theme.primary,
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'opacity 150ms ease',
    cursor: 'pointer',
  },
});

export default Login;