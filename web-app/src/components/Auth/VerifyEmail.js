// src/components/Auth/VerifyEmail.js
import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AuthLayout from './AuthLayout';

const VerifyEmail = () => {
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('');
    const { verifyEmail } = useAuth();
    const { theme, isDarkMode } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const token = queryParams.get('token');
        const email = queryParams.get('email');

        if (!token || !email) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const handleVerification = async () => {
            const result = await verifyEmail(email, token);
            if (result.success) {
                setStatus('success');
                setMessage(result.message);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login', { state: { message: result.message } });
                }, 3000);
            } else {
                setStatus('error');
                setMessage(result.message);
            }
        };

        handleVerification();
    }, [location.search, verifyEmail, navigate]);

    const styles = getStyles(theme, isDarkMode);

    return (
        <AuthLayout>
            <div style={styles.header}>
                <div style={styles.logoContainer}>
                    <div style={styles.logo}>✨</div>
                    <h1 style={styles.title}>TaskFlow AI</h1>
                </div>
                <h2 style={styles.subtitle}>Email Verification</h2>
            </div>

            <div style={styles.content}>
                {status === 'verifying' && (
                    <div style={styles.statusContainer}>
                        <div style={styles.spinner}>⏳</div>
                        <p style={styles.statusText}>Verifying your email...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div style={styles.statusContainer}>
                        <div style={styles.successIcon}>✅</div>
                        <p style={styles.successText}>{message}</p>
                        <p style={styles.subText}>Redirecting to login...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div style={styles.statusContainer}>
                        <div style={styles.errorIcon}>❌</div>
                        <p style={styles.errorText}>{message}</p>
                        <Link to="/login" style={styles.button}>
                            Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
};

const getStyles = (theme, isDarkMode) => ({
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
        fontSize: '20px',
        fontWeight: '600',
        color: theme.textSecondary,
        margin: 0,
    },
    content: {
        textAlign: 'center',
        minHeight: '150px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    statusContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    },
    spinner: {
        fontSize: '48px',
        animation: 'spin 2s linear infinite',
    },
    statusText: {
        fontSize: '16px',
        color: theme.textSecondary,
    },
    successIcon: {
        fontSize: '48px',
    },
    successText: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#22C55E',
    },
    subText: {
        fontSize: '14px',
        color: theme.textMuted,
    },
    errorIcon: {
        fontSize: '48px',
    },
    errorText: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#EF4444',
    },
    button: {
        backgroundColor: theme.primary,
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '10px',
        padding: '12px 24px',
        fontSize: '15px',
        fontWeight: '600',
        textDecoration: 'none',
        marginTop: '16px',
        transition: 'all 0.2s',
        boxShadow: `0 4px 12px ${theme.primary}66`,
    },
});

export default VerifyEmail;
