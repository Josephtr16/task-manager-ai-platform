// src/components/Layout/Sidebar.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';
import {
  FaHome,
  FaTasks,
  FaClipboardList,
  FaRegCalendarAlt,
  FaRobot,
  FaCog,
  FaSignOutAlt,
  FaLayerGroup
} from 'react-icons/fa';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const menuItems = [
    { icon: <FaHome />, label: 'Dashboard', path: '/dashboard' },
    { icon: <FaTasks />, label: 'Tasks', path: '/tasks' },
    { icon: <FaClipboardList />, label: 'Kanban', path: '/kanban' },
    { icon: <FaRegCalendarAlt />, label: 'Calendar', path: '/calendar' },
    { icon: <FaRobot />, label: 'AI Insights', path: '/insights' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const styles = {
    sidebar: {
      width: '260px',
      minHeight: '100vh',
      backgroundColor: theme.bgMain,
      boxShadow: theme.type === 'dark' ? '4px 0 24px rgba(0,0,0,0.2)' : '4px 0 24px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 100,
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '0 12px 32px 12px',
      marginBottom: '16px',
    },
    logoIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '12px',
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphic,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      fontSize: '22px',
      fontWeight: '800',
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.aiPurple})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '0.5px',
    },
    nav: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      flex: 1,
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '14px 20px',
      borderRadius: borderRadius.lg,
      border: 'none',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'left',
      fontSize: '15px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      position: 'relative',
      color: theme.textSecondary,
      outline: 'none',
      backgroundColor: 'transparent', // Default transparent
    },
    menuItemActive: {
      color: theme.primary,
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphicActive,
    },
    menuIcon: {
      fontSize: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
    },
    menuLabel: {
      flex: 1,
    },
    bottom: {
      borderTop: `1px solid ${theme.border}`,
      paddingTop: '24px',
      marginTop: 'auto',
    },
    userProfile: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      marginBottom: '16px',
      borderRadius: borderRadius.lg,
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphic,
    },
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${theme.primary}, ${theme.aiPurple})`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: '16px',
      fontWeight: '700',
      flexShrink: 0,
      boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
    },
    userInfo: {
      flex: 1,
      overflow: 'hidden',
    },
    userName: {
      fontSize: '14px',
      fontWeight: '700',
      color: theme.textPrimary,
      margin: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    userEmail: {
      fontSize: '11px',
      color: theme.textMuted,
      margin: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    bottomActions: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    bottomButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '12px 20px',
      borderRadius: borderRadius.lg,
      border: 'none',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'left',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      color: theme.textSecondary,
      backgroundColor: 'transparent',
    },
    logoutButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '12px 20px',
      borderRadius: borderRadius.lg,
      border: 'none',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'left',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      backgroundColor: 'transparent',
      color: theme.error,
    },
    userActions: {
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
    },
    iconButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: 'transparent',
      color: theme.textSecondary,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      outline: 'none',
      fontSize: '16px',
    },
  };

  return (
    <div style={styles.sidebar}>
      {/* Dynamic Hover Styles */}
      <style>{`
        .sidebar-menu-item:hover {
          background-color: ${theme.type === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'} !important;
          color: ${theme.textPrimary} !important;
          transform: translateX(4px);
        }
        .sidebar-menu-item.active {
          background-color: ${theme.bgMain} !important;
          color: ${theme.primary} !important;
          transform: none !important;
        }
        .sidebar-menu-item:hover .menu-icon {
          color: ${theme.textPrimary} !important;
        }
        .sidebar-menu-item.active .menu-icon {
          color: ${theme.primary} !important;
        }
        .logout-btn:hover {
          background-color: ${theme.error}15 !important;
          color: ${theme.error} !important;
        }
        .icon-btn:hover {
          background-color: ${theme.type === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'} !important;
          color: ${theme.primary} !important;
        }
        .icon-btn.logout:hover {
          color: ${theme.error} !important;
        }
      `}</style>

      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoIcon}>
          <FaLayerGroup size={24} color={theme.primary} />
        </div>
        <span style={styles.logoText}>TaskFlow AI</span>
      </div>

      {/* Navigation Menu */}
      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`sidebar-menu-item ${isActive(item.path) ? 'active' : ''}`}
            style={{
              ...styles.menuItem,
              ...(isActive(item.path) ? styles.menuItemActive : styles.menuItemInactive),
            }}
          >
            <span
              className="menu-icon"
              style={{
                ...styles.menuIcon,
                color: isActive(item.path) ? theme.primary : theme.textSecondary
              }}
            >
              {item.icon}
            </span>
            <span style={styles.menuLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Section */}
      <div style={styles.bottom}>
        {/* User Profile */}
        <div style={styles.userProfile}>
          <div style={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={styles.userInfo}>
            <p style={styles.userName}>{user?.name}</p>
            <p style={styles.userEmail}>{user?.email}</p>
          </div>
          <div style={styles.userActions}>
            <button
              onClick={() => navigate('/settings')}
              style={styles.iconButton}
              className="icon-btn"
              title="Settings"
            >
              <FaCog />
            </button>
            <button
              onClick={handleLogout}
              style={styles.iconButton}
              className="icon-btn logout"
              title="Logout"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;