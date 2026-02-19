// src/components/Auth/AuthLayout.js
import React, { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { IoMoon, IoSunny } from 'react-icons/io5';

const AuthLayout = ({ children }) => {
    const { theme, isDarkMode, toggleTheme } = useTheme();

    // Memoize styles to avoid unnecessary re-renders on every render, but update when theme changes
    const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

    return (
        <div style={styles.container}>
            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                style={styles.themeToggle}
                aria-label="Toggle Dark Mode"
            >
                {isDarkMode ? <IoSunny size={20} /> : <IoMoon size={20} />}
            </button>

            {/* Grid Pattern Overlay - Hidden */}
            <div style={styles.gridPattern}></div>

            <div style={styles.contentWrapper} className="content-wrapper">
                {/* Left Column - Form */}
                <div style={styles.formColumn} className="form-column">
                    <div style={styles.glowContainer}>
                        <div style={styles.formCard}>
                            {children}
                        </div>
                    </div>
                </div>

                {/* Right Column - Feature Panel */}
                <div style={styles.featureColumn} className="feature-column">
                    <div style={styles.featureContent}>
                        <h2 style={styles.featureTitle}>Plan smarter.<br />Finish faster.</h2>
                        <p style={styles.featureDescription}>
                            Experience the future of task management with AI-driven insights,
                            smart prioritization, and seamless collaboration.
                        </p>

                        <div style={styles.featureList}>
                            <div style={styles.featureItem}>
                                <span style={styles.featureIcon}>✨</span>
                                <span style={styles.featureItemText}>AI priority suggestions</span>
                            </div>
                            <div style={styles.featureItem}>
                                <span style={styles.featureIcon}>⚡</span>
                                <span style={styles.featureItemText}>Smart time estimates</span>
                            </div>
                            <div style={styles.featureItem}>
                                <span style={styles.featureIcon}>📊</span>
                                <span style={styles.featureItemText}>Clean productivity dashboard</span>
                            </div>
                        </div>

                        {/* Optional Mockup Placeholder */}
                        <div style={styles.mockupContainer}>
                            <div style={styles.mockupCard}>
                                <div style={styles.mockupHeader}>
                                    <div style={{ display: 'flex' }}>
                                        <div style={styles.mockupCheckbox}></div>
                                        <div>
                                            <div style={styles.mockupTitle}>Create a Project Plan</div>
                                            <span style={styles.mockupTag}>High priority</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div style={styles.mockupMeta}>
                                        <span>Progress</span>
                                        <span>60%</span>
                                    </div>
                                    <div style={styles.mockupProgressBg}>
                                        <div style={styles.mockupProgressBar}></div>
                                    </div>
                                    <div style={{ ...styles.mockupMeta, marginTop: '8px' }}>
                                        <span>⚡ 120m</span>
                                        <span>Tomorrow</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global CSS for animations and media queries */}
            <style>{`
        @keyframes float {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.05); }
          66% { transform: translate(-10px, 10px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 1024px) {
            .feature-column {
              display: none !important;
            }
            .form-column {
              padding: 1rem !important;
              background: transparent !important;
              flex: 1 !important;
            }
        }
        // Dynamic Autofill Styling
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px ${isDarkMode ? '#1F2937' : '#F5F7FB'} inset !important;
            -webkit-text-fill-color: ${isDarkMode ? '#F9FAFB' : '#334155'} !important;
            transition: background-color 5000s ease-in-out 0s;
        }
        @media (min-width: 1025px) {
             .content-wrapper {
                height: 100vh;
             }
        }
      `}</style>
        </div>
    );
};

const getStyles = (theme, isDarkMode) => ({
    container: {
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        background: theme.bgMain, // Matches Dashboard #212529
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: theme.textPrimary,
        transition: 'background 0.3s ease, color 0.3s ease',
    },
    themeToggle: {
        position: 'absolute',
        top: '24px',
        right: '24px',
        zIndex: 50,
        background: 'transparent',
        border: `1px solid ${theme.border}`,
        borderRadius: '50%',
        width: '40px', // Slightly smaller
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: theme.textSecondary,
        transition: 'all 0.2s ease',
        outline: 'none',
        '&:hover': {
            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            color: theme.textPrimary,
        }
    },
    // Grid removed/invisible
    gridPattern: {
        display: 'none',
    },
    contentWrapper: {
        display: 'flex',
        width: '100%',
        zIndex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    formColumn: {
        flex: '1.5',
        minWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
    },
    glowContainer: {
        position: 'relative',
        zIndex: 1,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
    },
    featureColumn: {
        flex: '1',
        minWidth: '350px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem',
        position: 'relative',
        flexDirection: 'column',
    },
    formCard: {
        width: '100%',
        maxWidth: '480px', // Slightly narrower for cleaner look
        background: theme.bgCard,
        borderRadius: '24px', // Reduced radius
        padding: '48px', // Reduced padding
        // Soft UI Hybrid: Subtle inner highlight + Deep shadow
        boxShadow: isDarkMode
            ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.02), 0 24px 60px -12px rgba(0, 0, 0, 0.5)'
            : theme.shadows.card,
        border: 'none',
        animation: 'fadeUp 0.6s ease-out',
        position: 'relative',
        zIndex: 2,
    },
    featureContent: {
        maxWidth: '480px',
        width: '100%',
        color: theme.textPrimary,
        textAlign: 'left',
        zIndex: 2,
        animation: 'fadeUp 0.8s ease-out 0.2s backwards',
        display: 'flex',
        flexDirection: 'column',
    },
    featureTitle: {
        fontSize: '36px', // Slightly smaller
        fontWeight: '800',
        marginBottom: '16px',
        lineHeight: '1.1',
        color: theme.textPrimary,
        letterSpacing: '-0.03em',
    },
    featureDescription: {
        fontSize: '16px',
        lineHeight: '1.6',
        marginBottom: '32px',
        // Brighter contrast for readability
        color: isDarkMode ? '#D1D5DB' : theme.textSecondary,
    },
    featureList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '28px',
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 20px',
        background: theme.bgCard,
        borderRadius: '16px',
        // Soft Hybrid UI: Top Highlight + Soft Drop + Border
        boxShadow: isDarkMode
            ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 4px 20px -2px rgba(0, 0, 0, 0.2)'
            : '0 4px 12px -2px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.02)' : `1px solid ${theme.border}`,
        cursor: 'default',
        width: '100%',
        maxWidth: '360px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: isDarkMode
                ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 12px 24px -4px rgba(0, 0, 0, 0.3)'
                : '0 12px 24px -4px rgba(0, 0, 0, 0.08)',
        }
    },
    featureIcon: {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: isDarkMode ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.primary,
        fontSize: '18px',
        flexShrink: 0,
        // icon inner glow
        boxShadow: isDarkMode ? 'inset 0 0 12px rgba(99, 102, 241, 0.15)' : 'none',
    },
    featureItemText: {
        fontSize: '15px',
        fontWeight: '600',
        color: theme.textPrimary,
        lineHeight: '1.4',
    },
    // Blobs HIDDEN 
    blobTopLeft: { display: 'none' },
    blobBottomRight: { display: 'none' },
    blobCenter: { display: 'none' },

    mockupContainer: {
        position: 'relative',
        perspective: '1000px',
        marginTop: '24px',
        alignSelf: 'flex-start',
        marginLeft: '0',
        opacity: 0.9,
    },
    mockupCard: {
        background: isDarkMode ? '#1A1D21' : '#ffffff',
        borderRadius: '12px',
        padding: '16px',
        // Hybrid Soft Shadow
        boxShadow: isDarkMode
            ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 20px 40px -8px rgba(0,0,0,0.4)'
            : '0 8px 24px -6px rgba(0, 0, 0, 0.12)',
        transform: 'rotateX(5deg) rotateY(-5deg) rotateZ(2deg)',
        border: isDarkMode ? '1px solid rgba(255,255,255,0.02)' : 'none',
        width: '260px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        transition: 'all 0.3s ease',
    },
    mockupHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2px',
    },
    mockupCheckbox: {
        width: '16px',
        height: '16px',
        borderRadius: '4px',
        border: `2px solid ${theme.textMuted}`,
        marginRight: '12px',
        marginTop: '2px',
    },
    mockupTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: theme.textPrimary,
        marginBottom: '4px',
        lineHeight: '1.4',
    },
    mockupTag: {
        fontSize: '10px',
        fontWeight: '600',
        color: theme.primary,
        background: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
        padding: '2px 8px',
        borderRadius: '4px',
        display: 'inline-block',
        marginBottom: '8px',
    },
    mockupMeta: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: theme.textMuted,
        marginBottom: '6px',
    },
    mockupProgressBg: {
        width: '100%',
        height: '4px',
        background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F1F5F9',
        borderRadius: '2px',
        overflow: 'hidden',
    },
    mockupProgressBar: {
        width: '60%',
        height: '100%',
        background: theme.primary,
        borderRadius: '2px',
    },
});

export default AuthLayout;
