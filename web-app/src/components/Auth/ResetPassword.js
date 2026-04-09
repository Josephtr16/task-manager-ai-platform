import React, { useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import AuthLayout from './AuthLayout';

const ResetPassword = () => {
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const email = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token || !email) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({ email, token, newPassword });
      setSuccess('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login', { state: { message: 'Password reset successful. Please log in.' } }), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    header: { textAlign: 'center', marginBottom: '24px' },
    title: { margin: 0, color: theme.textPrimary, fontSize: '28px', fontWeight: '600', fontFamily: '"Fraunces", serif' },
    subtitle: { margin: '8px 0 0 0', color: theme.textSecondary, fontSize: '14px' },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    label: { fontSize: '14px', color: theme.textSecondary, fontWeight: '600' },
    input: {
      backgroundColor: theme.bgRaised,
      border: `1px solid ${theme.borderSubtle || theme.border}`,
      borderRadius: '8px',
      padding: '11px 14px',
      color: theme.textPrimary,
      boxShadow: 'none',
      outline: 'none',
    },
    button: {
      border: 'none',
      borderRadius: '8px',
      padding: '0 16px',
      height: '40px',
      backgroundColor: theme.primary,
      color: '#0A0908',
      fontWeight: '600',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.6 : 1,
      boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,146,74,0.3) inset',
    },
    msgError: {
      background: `${theme.error}14`,
      color: theme.error,
      border: `1px solid ${theme.error}30`,
      borderRadius: '8px',
      padding: '10px 12px',
      fontSize: '14px',
    },
    msgSuccess: {
      background: `${theme.success}14`,
      color: theme.success,
      border: `1px solid ${theme.success}30`,
      borderRadius: '8px',
      padding: '10px 12px',
      fontSize: '14px',
    },
    footer: { marginTop: '20px', textAlign: 'center', fontSize: '14px', color: theme.textMuted },
    link: { color: theme.primary, textDecoration: 'none', fontWeight: '600' },
  };

  return (
    <AuthLayout>
      <div style={styles.header}>
        <h1 style={styles.title}>Reset Password</h1>
        <p style={styles.subtitle}>Enter your new password.</p>
      </div>

      {error ? <div style={styles.msgError}>{error}</div> : null}
      {success ? <div style={styles.msgSuccess}>{success}</div> : null}

      <form style={styles.form} onSubmit={handleSubmit}>
        <label style={styles.label}>New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={styles.input}
          placeholder="At least 6 characters"
          minLength={6}
          required
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <div style={styles.footer}>
        <Link to="/login" style={styles.link}>Back to login</Link>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
