// src/components/Layout/Sidebar.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius } from '../../theme';
import { notificationsAPI } from '../../services/api';
import {
  FaHome,
  FaTasks,
  FaClipboardList,
  FaRegCalendarAlt,
  FaRobot,
  FaCog,
  FaSignOutAlt,
  FaLayerGroup,
  FaFolder,
  FaBell,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';

const Sidebar = ({ isCollapsed = false, onToggle = () => { }, sidebarWidth = 260 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const menuItems = [
    { icon: <FaHome />, label: 'Dashboard', path: '/dashboard' },
    { icon: <FaTasks />, label: 'Tasks', path: '/tasks' },
    { icon: <FaFolder />, label: 'Projects', path: '/projects' },
    { icon: <FaClipboardList />, label: 'Kanban', path: '/kanban' },
    { icon: <FaRegCalendarAlt />, label: 'Calendar', path: '/calendar' },
    { icon: <FaRobot />, label: 'AI Insights', path: '/insights' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTimeAgo = (dateValue) => {
    const date = new Date(dateValue);
    const now = new Date();
    const diffSeconds = Math.max(1, Math.floor((now - date) / 1000));

    if (diffSeconds < 60) return 'just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      const list = response.data?.notifications || [];
      const unread = response.data?.unreadCount || 0;
      setNotifications(list);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await notificationsAPI.markRead(notificationId);
      setNotifications((prev) => prev.map((n) => (
        n._id === notificationId ? { ...n, read: true } : n
      )));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const styles = {
    sidebar: {
      width: `${sidebarWidth}px`,
      minHeight: '100vh',
      backgroundColor: theme.bgMain,
      boxShadow: theme.type === 'dark' ? '4px 0 24px rgba(0,0,0,0.2)' : '4px 0 24px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      padding: isCollapsed ? '20px 10px' : '24px 16px',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 100,
      transition: 'width 0.28s cubic-bezier(0.22, 1, 0.36, 1), padding 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: isCollapsed ? 'center' : 'flex-start',
      gap: isCollapsed ? '0' : '16px',
      padding: isCollapsed ? '0 0 24px 0' : '0 8px 26px 8px',
      marginBottom: '16px',
      width: '100%',
    },
    logoLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      overflow: 'visible',
      minWidth: 0,
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
      whiteSpace: 'nowrap',
      lineHeight: 1,
    },
    collapseButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '30px',
      height: '44px',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      color: theme.textSecondary,
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphic,
      transition: 'all 0.2s ease',
      flexShrink: 0,
      position: 'absolute',
      right: '-14px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 130,
    },
    nav: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      flex: 1,
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: isCollapsed ? 'center' : 'flex-start',
      gap: isCollapsed ? '0' : '16px',
      padding: isCollapsed ? '12px' : '14px 20px',
      borderRadius: borderRadius.lg,
      border: 'none',
      cursor: 'pointer',
      width: '100%',
      textAlign: isCollapsed ? 'center' : 'left',
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
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      display: isCollapsed ? 'none' : 'block',
    },
    bottom: {
      borderTop: `1px solid ${theme.border}`,
      paddingTop: '24px',
      marginTop: 'auto',
    },
    userProfile: {
      display: 'flex',
      alignItems: isCollapsed ? 'center' : 'center',
      justifyContent: isCollapsed ? 'center' : 'space-between',
      flexDirection: isCollapsed ? 'column' : 'row',
      gap: isCollapsed ? '10px' : '12px',
      padding: isCollapsed ? '10px 8px' : '12px',
      marginBottom: '16px',
      borderRadius: borderRadius.lg,
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphic,
      width: '100%',
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
      display: isCollapsed ? 'none' : 'block',
      minWidth: 0,
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
      gap: isCollapsed ? '8px' : '4px',
      alignItems: 'center',
      flexDirection: isCollapsed ? 'column' : 'row',
      marginLeft: isCollapsed ? 0 : '8px',
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
    bellWrapper: {
      position: 'relative',
      display: 'inline-flex',
    },
    badge: {
      position: 'absolute',
      top: '-4px',
      right: '-4px',
      minWidth: '18px',
      height: '18px',
      borderRadius: '999px',
      backgroundColor: '#ef4444',
      color: '#fff',
      fontSize: '10px',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 4px',
      boxShadow: theme.type === 'dark'
        ? '0 6px 14px rgba(239,68,68,0.45)'
        : '0 6px 14px rgba(239,68,68,0.35)',
      border: `1px solid ${theme.type === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)'}`,
    },
    notificationPanelBackdrop: {
      position: 'fixed',
      top: 0,
      left: `${sidebarWidth}px`,
      right: 0,
      bottom: 0,
      background: theme.type === 'dark' ? 'rgba(9, 12, 18, 0.2)' : 'rgba(18, 24, 32, 0.08)',
      backdropFilter: 'blur(2px)',
      zIndex: 85,
      opacity: isNotificationOpen ? 1 : 0,
      pointerEvents: isNotificationOpen ? 'auto' : 'none',
      transition: 'opacity 0.28s ease',
    },
    notificationPanel: {
      position: 'fixed',
      top: '14px',
      left: `${sidebarWidth + 10}px`,
      height: 'calc(100vh - 28px)',
      width: '360px',
      backgroundColor: theme.bgMain,
      background: theme.bgMain,
      border: `1px solid ${theme.border}`,
      borderRadius: '24px',
      boxShadow: theme.shadows.card,
      zIndex: 90,
      clipPath: isNotificationOpen ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
      opacity: isNotificationOpen ? 1 : 0,
      pointerEvents: isNotificationOpen ? 'auto' : 'none',
      transition: 'clip-path 0.36s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.24s ease',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    notificationHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 18px 14px 18px',
      borderBottom: `1px solid ${theme.border}`,
      backgroundColor: theme.bgMain,
    },
    notificationList: {
      flex: 1,
      overflowY: 'auto',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    notificationItem: {
      border: `1px solid ${theme.border}`,
      borderRadius: borderRadius.md,
      padding: '12px 14px',
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphic,
      cursor: 'pointer',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
    },
    notificationUnread: {
      borderLeft: `3px solid ${theme.primary}`,
      boxShadow: theme.shadows.neumorphicInset,
    },
    notificationMessage: {
      fontSize: '13px',
      color: theme.textPrimary,
      margin: 0,
      lineHeight: 1.45,
      fontWeight: '500',
    },
    notificationMeta: {
      marginTop: '8px',
      fontSize: '11px',
      color: theme.textMuted,
    },
    markAllButton: {
      border: `1px solid ${theme.border}`,
      borderRadius: '10px',
      padding: '6px 10px',
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphic,
      color: theme.primary,
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
    },
    emptyState: {
      fontSize: '13px',
      color: theme.textSecondary,
      textAlign: 'center',
      margin: '20px 14px 0 14px',
      padding: '20px 14px',
      borderRadius: borderRadius.lg,
      border: `1px dashed ${theme.border}`,
      backgroundColor: theme.bgMain,
      boxShadow: theme.shadows.neumorphicInset,
    },
  };

  return (
    <div style={styles.sidebar}>
      {/* Dynamic Hover Styles */}
      <style>{`
        .sidebar-menu-item:hover {
          background-color: ${theme.type === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'} !important;
          color: ${theme.textPrimary} !important;
          transform: ${isCollapsed ? 'none' : 'translateX(4px)'};
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
        .sidebar-edge-toggle:hover {
          color: ${theme.primary} !important;
          transform: translateY(-50%) scale(1.04);
        }
        .notif-item:hover {
          transform: translateY(-1px);
          box-shadow: ${theme.shadows.card} !important;
          border-color: ${theme.primary}33 !important;
        }
        .notif-mark-all:hover {
          background-color: ${theme.type === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} !important;
        }
      `}</style>

      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoLeft}>
          <div style={styles.logoIcon}>
            <FaLayerGroup size={24} color={theme.primary} />
          </div>
          {!isCollapsed && <span style={styles.logoText}>TaskFlow AI</span>}
        </div>
      </div>

      <button
        onClick={onToggle}
        style={styles.collapseButton}
        className="icon-btn sidebar-edge-toggle"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}
      </button>

      {/* Navigation Menu */}
      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`sidebar-menu-item ${isActive(item.path) ? 'active' : ''}`}
            title={isCollapsed ? item.label : ''}
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
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              style={styles.iconButton}
              className="icon-btn"
              title="Notifications"
            >
              <span style={styles.bellWrapper}>
                <FaBell />
                {unreadCount > 0 && (
                  <span style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </span>
            </button>
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

      <div
        style={styles.notificationPanelBackdrop}
        onClick={() => setIsNotificationOpen(false)}
      />

      <aside style={styles.notificationPanel}>
        <div style={styles.notificationHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaBell color={theme.primary} />
            <strong style={{ color: theme.textPrimary, fontSize: '15px' }}>Notifications</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={handleMarkAllRead} style={styles.markAllButton} className="notif-mark-all">Mark all read</button>
            <button
              onClick={() => setIsNotificationOpen(false)}
              style={styles.iconButton}
              className="icon-btn"
              title="Close"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div style={styles.notificationList}>
          {notifications.length === 0 ? (
            <div style={styles.emptyState}>No notifications yet.</div>
          ) : (
            notifications.map((notification, index) => (
              <div
                key={notification._id}
                style={{
                  ...styles.notificationItem,
                  ...(notification.read ? {} : styles.notificationUnread),
                  transitionDelay: `${Math.min(index * 20, 160)}ms`,
                }}
                className="notif-item"
                onClick={() => {
                  if (!notification.read) {
                    handleMarkRead(notification._id);
                  }
                }}
              >
                <p style={styles.notificationMessage}>{notification.message}</p>
                <div style={styles.notificationMeta}>{formatTimeAgo(notification.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;