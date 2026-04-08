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
    title: { margin: 0, color: theme.textPrimary, fontSize: '28px', fontWeight: '700' },
    subtitle: { margin: '8px 0 0 0', color: theme.textSecondary, fontSize: '14px' },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    label: { fontSize: '14px', color: theme.textSecondary, fontWeight: '600' },
    input: {
      backgroundColor: theme.bgCard,
      border: 'none',
      borderRadius: '12px',
      padding: '14px 16px',
      color: theme.textPrimary,
      boxShadow: theme.shadows.neumorphicInset,
      outline: 'none',
    },
    button: {
      border: 'none',
      borderRadius: '10px',
      padding: '14px',
      backgroundColor: theme.primary,
      color: '#fff',
      fontWeight: '700',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.6 : 1,
    },
    msgError: {
      background: '#FEF2F2',
      color: '#B91C1C',
      border: '1px solid #EF4444',
      borderRadius: '8px',
      padding: '10px 12px',
      fontSize: '14px',
    },
    msgSuccess: {
      background: '#F0FDF4',
      color: '#15803D',
      border: '1px solid #22C55E',
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
