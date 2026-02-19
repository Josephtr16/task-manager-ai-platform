// src/pages/SettingsPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { borderRadius } from '../theme';
import { FaUser, FaPalette, FaBell, FaRobot, FaLock, FaMoon, FaSun, FaSave } from 'react-icons/fa';

const SettingsPage = () => {
  const { user } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    theme: isDarkMode ? 'dark' : 'light',
    notifications: true,
    emailDigest: false,
    aiSuggestions: true,
    autoPrioritize: true,
    dataSharing: false,
    language: 'en',
    timezone: 'UTC-5',
  });

  // Sync formal state with global theme state
  useEffect(() => {
    setFormData(prev => ({ ...prev, theme: isDarkMode ? 'dark' : 'light' }));
  }, [isDarkMode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleThemeChange = (newTheme) => {
    if ((newTheme === 'dark' && !isDarkMode) || (newTheme === 'light' && isDarkMode)) {
      toggleTheme();
    }
  };

  const handleSave = () => {
    // API call to save settings would go here
    const btn = document.getElementById('save-btn');
    if (btn) {
      btn.innerText = 'Saved!';
      setTimeout(() => btn.innerText = 'Save Changes', 2000);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FaUser /> },
    { id: 'appearance', label: 'Appearance', icon: <FaPalette /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
    { id: 'ai', label: 'AI Features', icon: <FaRobot /> },
    { id: 'privacy', label: 'Privacy', icon: <FaLock /> },
  ];

  const styles = {
    container: {
      padding: '32px',
      minHeight: '100vh',
      backgroundColor: theme.bgMain, // Neomorphic background
    },
    pageTitle: {
      fontSize: '32px',
      fontWeight: '800',
      color: theme.textPrimary,
      marginBottom: '32px',
      textShadow: theme.type === 'dark' ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none',
    },
    contentWrapper: {
      display: 'flex',
      gap: '32px',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
    },
    sidebar: {
      flex: '0 0 250px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.lg,
      padding: '16px',
      boxShadow: theme.shadows.neumorphic, // Neomorphic card
    },
    tabButton: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      border: 'none',
      backgroundColor: 'transparent',
      color: theme.textSecondary,
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      borderRadius: borderRadius.md,
      transition: 'all 0.2s',
      textAlign: 'left',
    },
    tabButtonActive: {
      color: theme.primary,
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphic, // Selected tab pops out
    },
    tabIcon: {
      marginRight: '12px',
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center',
    },
    mainContent: {
      flex: 1,
      minWidth: '300px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    },
    section: {
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.lg,
      padding: '32px',
      boxShadow: theme.shadows.neumorphic, // Neomorphic card
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: '24px',
      borderBottom: `2px solid ${theme.bgMain}`,
      paddingBottom: '12px',
      boxShadow: `0 1px 0 ${theme.border}`, // Subtle divider
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      fontSize: '15px',
      backgroundColor: theme.bgMain,
      border: 'none',
      borderRadius: borderRadius.md,
      color: theme.textPrimary,
      boxShadow: theme.shadows.neumorphicInset, // Inset input
      outline: 'none',
      transition: 'box-shadow 0.2s',
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      fontSize: '15px',
      backgroundColor: theme.bgMain,
      border: 'none',
      borderRadius: borderRadius.md,
      color: theme.textPrimary,
      boxShadow: theme.shadows.neumorphicInset,
      outline: 'none',
      resize: 'vertical',
    },
    settingItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 0',
      borderBottom: `1px solid ${theme.bgMain}`, // Separator
      boxShadow: `0 1px 0 ${theme.border}`,
    },
    settingInfo: {
      flex: 1,
      paddingRight: '16px',
    },
    settingLabel: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '16px',
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: '4px',
    },
    settingDesc: {
      fontSize: '13px',
      color: theme.textMuted,
    },
    themeToggle: {
      display: 'flex',
      backgroundColor: theme.bgMain,
      borderRadius: borderRadius.md,
      padding: '4px',
      boxShadow: theme.shadows.neumorphicInset, // Inset toggle container
    },
    themeBtn: {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 16px',
      border: 'none',
      backgroundColor: 'transparent',
      color: theme.textSecondary,
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      borderRadius: '6px',
      transition: 'all 0.2s',
    },
    themeBtnActive: {
      backgroundColor: theme.bgMain,
      color: theme.primary,
      boxShadow: theme.shadows.neumorphic, // Active state pops out
    },
    toggleLabel: {
      position: 'relative',
      display: 'inline-block',
      width: '48px',
      height: '26px',
      cursor: 'pointer',
    },
    toggleInput: {
      opacity: 0,
      width: 0,
      height: 0,
    },
    toggleSlider: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.bgMain,
      borderRadius: '34px',
      boxShadow: theme.shadows.neumorphicInset, // Inset track
      transition: '0.4s',
    },
    aiCard: {
      marginBottom: '16px',
      padding: '16px',
      borderRadius: borderRadius.lg,
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphic, // Highlight AI section
      border: `1px solid ${theme.aiPurple}20`,
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: '24px',
    },
    saveButton: {
      backgroundColor: theme.primary,
      color: '#fff',
      border: 'none',
      borderRadius: borderRadius.lg, // Fully rounded
      padding: '12px 32px',
      fontSize: '16px',
      fontWeight: '700',
      cursor: 'pointer',
      boxShadow: theme.shadows.neumorphic,
      display: 'flex',
      alignItems: 'center',
      transition: 'all 0.2s',
    },
    logoutButton: {
      marginTop: '24px',
      backgroundColor: theme.bgMain,
      color: theme.error,
      border: `1px solid ${theme.error}40`,
      borderRadius: borderRadius.md,
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      width: '100%',
      boxShadow: theme.shadows.neumorphic,
    },
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Profile Settings</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Bio</label>
              <textarea
                name="bio"
                rows="4"
                placeholder="Tell us about yourself"
                style={styles.textarea}
              />
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Appearance</h2>
            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
                <span style={styles.settingLabel}>Theme Mode</span>
                <span style={styles.settingDesc}>Select your preferred interface theme</span>
              </div>
              <div style={styles.themeToggle}>
                <button
                  style={{
                    ...styles.themeBtn,
                    ...(formData.theme === 'light' && styles.themeBtnActive)
                  }}
                  onClick={() => handleThemeChange('light')}
                >
                  <FaSun style={{ marginRight: '8px' }} /> Light
                </button>
                <button
                  style={{
                    ...styles.themeBtn,
                    ...(formData.theme === 'dark' && styles.themeBtnActive)
                  }}
                  onClick={() => handleThemeChange('dark')}
                >
                  <FaMoon style={{ marginRight: '8px' }} /> Dark
                </button>
              </div>
            </div>
            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
                <span style={styles.settingLabel}>Compact View</span>
                <span style={styles.settingDesc}>Reduce padding for more data density</span>
              </div>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  style={styles.toggleInput}
                  checked={false} // Placeholder
                  readOnly
                />
                <span style={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Notifications</h2>
            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
                <span style={styles.settingLabel}>Push Notifications</span>
                <span style={styles.settingDesc}>Receive alerts for task updates</span>
              </div>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  name="notifications"
                  checked={formData.notifications}
                  onChange={handleInputChange}
                  style={styles.toggleInput}
                />
                <span style={styles.toggleSlider}></span>
              </label>
            </div>
            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
                <span style={styles.settingLabel}>Email Digest</span>
                <span style={styles.settingDesc}>Daily summary of your tasks</span>
              </div>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  name="emailDigest"
                  checked={formData.emailDigest}
                  onChange={handleInputChange}
                  style={styles.toggleInput}
                />
                <span style={styles.toggleSlider}></span>
              </label>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>AI Capabilities</h2>
            <div style={styles.aiCard}>
              <div style={styles.settingItem}>
                <div style={styles.settingInfo}>
                  <span style={{ ...styles.settingLabel, color: theme.aiPurple }}>
                    <FaRobot style={{ marginRight: '8px' }} /> Smart Suggestions
                  </span>
                  <span style={styles.settingDesc}>Get AI-powered task recommendations based on your habits</span>
                </div>
                <label style={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    name="aiSuggestions"
                    checked={formData.aiSuggestions}
                    onChange={handleInputChange}
                    style={styles.toggleInput}
                  />
                  <span style={styles.toggleSlider}></span>
                </label>
              </div>
            </div>
            <div style={styles.aiCard}>
              <div style={styles.settingItem}>
                <div style={styles.settingInfo}>
                  <span style={{ ...styles.settingLabel, color: theme.aiPurple }}>
                    <FaRobot style={{ marginRight: '8px' }} /> Auto-Prioritization
                  </span>
                  <span style={styles.settingDesc}>Let AI categorize and prioritize your incoming tasks</span>
                </div>
                <label style={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    name="autoPrioritize"
                    checked={formData.autoPrioritize}
                    onChange={handleInputChange}
                    style={styles.toggleInput}
                  />
                  <span style={styles.toggleSlider}></span>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Privacy & Security</h2>
            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
                <span style={styles.settingLabel}>Data Sharing</span>
                <span style={styles.settingDesc}>Allow anonymous data collection to improve AI models</span>
              </div>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  name="dataSharing"
                  checked={formData.dataSharing}
                  onChange={handleInputChange}
                  style={styles.toggleInput}
                />
                <span style={styles.toggleSlider}></span>
              </label>
            </div>
            <button style={styles.logoutButton}>
              Log out of all devices
            </button>
          </div>
        );
    }
  };

  return (
    <Layout>
      <div style={styles.container}>
        <style>{`
          input:checked + span {
            background-color: ${theme.bgMain}; 
          }
          
          input:checked + span:before {
            transform: translateX(22px);
            background-color: ${theme.success};
          }
          
          span:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 4px;
            bottom: 4px;
            background-color: ${theme.textSecondary};
            border-radius: 50%;
            transition: 0.4s;
            box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
          }

          input:checked + span {
            box-shadow: ${theme.shadows.neumorphicInset}; // Keep inset
          }
        `}</style>
        <h1 style={styles.pageTitle}>Settings</h1>

        <div style={styles.contentWrapper}>
          {/* Sidebar */}
          <div style={styles.sidebar}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === tab.id && styles.tabButtonActive)
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                <span style={styles.tabIcon}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div style={styles.mainContent}>
            {renderContent()}

            <div style={styles.actions}>
              <button
                id="save-btn"
                style={styles.saveButton}
                onClick={handleSave}
              >
                <FaSave style={{ marginRight: '8px' }} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;