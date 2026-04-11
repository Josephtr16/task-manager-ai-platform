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
  FaBullseye,
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

const Sidebar = ({ isCollapsed = false, onToggle = () => { }, sidebarWidth = 232 }) => {
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
    { icon: <FaBullseye />, label: 'Focus', path: '/focus' },
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
      backgroundColor: theme.bgCard,
      borderRight: `1px solid ${theme.border}`,
      display: 'flex',
      flexDirection: 'column',
      padding: isCollapsed ? '20px 8px' : '24px 10px',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 100,
      transition: 'width 200ms ease, padding 200ms ease',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: isCollapsed ? 'center' : 'flex-start',
      gap: isCollapsed ? '0' : '12px',
      padding: isCollapsed ? '24px 0 20px 0' : '24px 8px 20px 8px',
      marginBottom: '12px',
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
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      background: theme.accent,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: '"Fraunces", serif',
      fontStyle: 'italic',
      fontSize: '18px',
      fontWeight: '600',
      letterSpacing: '-0.02em',
    },
    logoText: {
      fontFamily: '"Geist", sans-serif',
      fontSize: '13px',
      fontWeight: '500',
      color: theme.textPrimary,
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
      lineHeight: 1,
    },
    collapseButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      border: `1px solid ${theme.borderMedium}`,
      cursor: 'pointer',
      color: theme.textSecondary,
      backgroundColor: theme.bgElevated,
      boxShadow: 'none',
      transition: 'all 150ms ease',
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
      gap: '4px',
      flex: 1,
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: isCollapsed ? 'center' : 'flex-start',
      gap: isCollapsed ? '0' : '12px',
      padding: isCollapsed ? '0' : '0 12px',
      height: '40px',
      margin: '2px 8px',
      borderRadius: '8px',
      border: '1px solid transparent',
      cursor: 'pointer',
      width: '100%',
      textAlign: isCollapsed ? 'center' : 'left',
      fontSize: '13px',
      fontWeight: '600',
      transition: 'all 150ms ease',
      position: 'relative',
      color: theme.textSecondary,
      outline: 'none',
      backgroundColor: 'transparent', // Default transparent
    },
    menuItemActive: {
      color: theme.accent,
      backgroundColor: theme.bgElevated,
      border: `1px solid ${theme.borderMedium}`,
    },
    menuIcon: {
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '20px',
      backgroundColor: 'transparent',
      borderRadius: '0',
      padding: '0',
      margin: '0',
    },
    menuLabel: {
      flex: 1,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      display: isCollapsed ? 'none' : 'block',
    },
    bottom: {
      borderTop: `1px solid ${theme.border}`,
      paddingTop: '16px',
      marginTop: 'auto',
    },
    userProfile: {
      display: 'flex',
      alignItems: isCollapsed ? 'center' : 'center',
      justifyContent: isCollapsed ? 'center' : 'space-between',
      flexDirection: isCollapsed ? 'column' : 'row',
      gap: isCollapsed ? '10px' : '12px',
      padding: isCollapsed ? '8px' : '12px',
      marginBottom: '12px',
      borderRadius: borderRadius.lg,
      backgroundColor: theme.bgElevated,
      border: `1px solid ${theme.border}`,
      width: '100%',
      minHeight: '72px',
    },
    avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: theme.accent,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: '"Fraunces", serif',
      fontStyle: 'italic',
      fontSize: '14px',
      fontWeight: '700',
      flexShrink: 0,
    },
    userInfo: {
      flex: 1,
      overflow: 'hidden',
      display: isCollapsed ? 'none' : 'block',
      minWidth: 0,
    },
    userName: {
      fontSize: '12px',
      fontWeight: '500',
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
      padding: '0 16px',
      height: '40px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'left',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 150ms ease',
      color: theme.textSecondary,
      backgroundColor: 'transparent',
    },
    logoutButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '0 16px',
      height: '40px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'left',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 150ms ease',
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
      width: '28px',
      height: '28px',
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
      top: '-1px',
      right: '-1px',
      minWidth: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: theme.accent,
      color: 'transparent',
      fontSize: '0',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0',
      boxShadow: `0 0 0 2px ${theme.bgCard}`,
      border: 'none',
    },
    notificationPanelBackdrop: {
      position: 'fixed',
      top: 0,
      left: `${sidebarWidth}px`,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(6px)',
      zIndex: 85,
      opacity: isNotificationOpen ? 1 : 0,
      pointerEvents: isNotificationOpen ? 'auto' : 'none',
      transition: 'opacity 250ms ease-out',
    },
    notificationPanel: {
      position: 'fixed',
      top: 0,
      left: `${sidebarWidth}px`,
      height: '100vh',
      width: '320px',
      backgroundColor: theme.bgCard,
      borderRight: `1px solid ${theme.border}`,
      boxShadow: theme.shadows.md,
      zIndex: 90,
      transform: isNotificationOpen ? 'translateX(0)' : 'translateX(-100%)',
      opacity: isNotificationOpen ? 1 : 0,
      pointerEvents: isNotificationOpen ? 'auto' : 'none',
      transition: 'transform 200ms ease, opacity 200ms ease',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    notificationHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px',
      borderBottom: `1px solid ${theme.border}`,
      backgroundColor: theme.bgCard,
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
      borderRadius: '8px',
      padding: '14px 16px',
      backgroundColor: theme.bgSurface,
      boxShadow: 'none',
      cursor: 'pointer',
      transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
      position: 'relative',
    },
    notificationUnread: {
      backgroundColor: theme.bgRaised,
    },
    notificationMessage: {
      fontSize: '13px',
      color: theme.textPrimary,
      margin: 0,
      lineHeight: 1.45,
      fontWeight: '500',
    },
    notificationMeta: {
      marginTop: '4px',
      fontSize: '11px',
      color: theme.textMuted,
    },
    markAllButton: {
      border: `1px solid ${theme.border}`,
      borderRadius: '8px',
      padding: '6px 10px',
      backgroundColor: theme.bgRaised,
      boxShadow: 'none',
      color: theme.primary,
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '600',
      transition: 'all 150ms ease',
    },
    emptyState: {
      fontSize: '13px',
      color: theme.textSecondary,
      textAlign: 'center',
      margin: '20px 14px 0 14px',
      padding: '20px 14px',
      borderRadius: borderRadius.lg,
      border: `1px dashed ${theme.border}`,
      backgroundColor: theme.bgSurface,
      boxShadow: 'none',
    },
    unreadDot: {
      position: 'absolute',
      right: '16px',
      top: '50%',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: theme.accent,
      transform: 'translateY(-50%)',
    },
  };

  return (
    <div style={styles.sidebar}>
      {/* Dynamic Hover Styles */}
      <style>{`
        .sidebar-menu-item .menu-icon {
          background-color: transparent !important;
          border-radius: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
          filter: none !important;
          width: auto !important;
          height: auto !important;
          min-width: unset !important;
          min-height: unset !important;
        }
        .sidebar-menu-item .menu-icon svg {
          background-color: transparent !important;
          border-radius: 0 !important;
          outline: none !important;
          box-shadow: none !important;
          filter: none !important;
          display: inline !important;
        }
        .sidebar-menu-item .menu-icon svg circle,
        .sidebar-menu-item .menu-icon svg ellipse,
        .sidebar-menu-item .menu-icon svg rect[rx],
        .sidebar-menu-item .menu-icon svg rect[ry] {
          fill: none !important;
          stroke: none !important;
        }
        .sidebar-menu-item:focus .menu-icon,
        .sidebar-menu-item:focus-visible .menu-icon {
          background-color: transparent !important;
          outline: none !important;
          box-shadow: none !important;
        }
        .sidebar-menu-item:hover {
          background-color: ${theme.bgElevated} !important;
          color: ${theme.textPrimary} !important;
          transform: ${isCollapsed ? 'none' : 'translateX(2px)'};
        }
        .sidebar-menu-item.active {
          background-color: ${theme.bgElevated} !important;
          color: ${theme.accent} !important;
          transform: none !important;
        }
        .sidebar-menu-item:hover .menu-icon {
          color: ${theme.textPrimary} !important;
        }
        .sidebar-menu-item.active .menu-icon {
          color: ${theme.accent} !important;
        }
        .logout-btn:hover {
          background-color: ${theme.error}15 !important;
          color: ${theme.error} !important;
        }
        .icon-btn:hover {
          background-color: ${theme.bgElevated} !important;
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
          box-shadow: ${theme.shadows.md} !important;
          border-color: ${theme.borderMedium} !important;
        }
        .notif-mark-all:hover {
          background-color: ${theme.type === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} !important;
        }
      `}</style>

      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoLeft}>
          <div style={styles.logoIcon}>
            TF
          </div>
          {!isCollapsed && <span style={styles.logoText}>TaskFlow</span>}
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
                    <span style={styles.badge} aria-hidden="true" />
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
                {!notification.read && <span style={styles.unreadDot} />}
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;