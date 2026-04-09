import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import AuthLayout from './AuthLayout';

const ForgotPassword = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setSuccess('If your account exists, a reset link has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    header: { textAlign: 'center', marginBottom: '24px' },
    title: { margin: 0, color: theme.textPrimary, fontSize: '28px', fontWeight: '800', fontFamily: '"Syne", sans-serif', letterSpacing: '-0.04em' },
    subtitle: { margin: '8px 0 0 0', color: theme.textSecondary, fontSize: '14px' },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    label: { fontSize: '14px', color: theme.textSecondary, fontWeight: '600' },
    input: {
      backgroundColor: theme.bgCard,
      border: `1px solid ${theme.border}`,
      borderRadius: '14px',
      padding: '14px 16px',
      color: theme.textPrimary,
      boxShadow: 'none',
      outline: 'none',
    },
    button: {
      border: 'none',
      borderRadius: '999px',
      padding: '14px',
      backgroundColor: theme.primary,
      color: '#fff',
      fontWeight: '700',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.6 : 1,
      boxShadow: theme.shadows.float,
    },
    msgError: {
      background: `${theme.error}14`,
      color: theme.error,
      border: `1px solid ${theme.error}30`,
      borderLeft: `3px solid ${theme.error}`,
      borderRadius: '14px',
      padding: '10px 12px',
      fontSize: '14px',
    },
    msgSuccess: {
      background: `${theme.success}14`,
      color: theme.success,
      border: `1px solid ${theme.success}30`,
      borderLeft: `3px solid ${theme.success}`,
      borderRadius: '14px',
      padding: '10px 12px',
      fontSize: '14px',
    },
    footer: { marginTop: '20px', textAlign: 'center', fontSize: '14px', color: theme.textMuted },
    link: { color: theme.primary, textDecoration: 'none', fontWeight: '600' },
  };

  return (
    <AuthLayout>
      <div style={styles.header}>
        <h1 style={styles.title}>Forgot Password</h1>
        <p style={styles.subtitle}>Enter your email to receive a password reset link.</p>
      </div>

      {error ? <div style={styles.msgError}>{error}</div> : null}
      {success ? <div style={styles.msgSuccess}>{success}</div> : null}

      <form style={styles.form} onSubmit={handleSubmit}>
        <label style={styles.label}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          placeholder="your.email@example.com"
          required
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div style={styles.footer}>
        Remembered your password? <Link to="/login" style={styles.link}>Back to login</Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
