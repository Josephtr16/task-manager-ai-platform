// src/components/Layout/Layout.js
import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

const Layout = ({ children }) => {
  const { theme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved === 'true') {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  };

  const sidebarWidth = isSidebarCollapsed ? 88 : 260;

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: theme.bgMain,
    },
    main: {
      flex: 1,
      marginLeft: `${sidebarWidth}px`,
      minHeight: '100vh',
      overflowX: 'hidden',
      backgroundColor: theme.bgMain, // Ensure background consistency
      transition: 'margin-left 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
    },
  };

  return (
    <div style={styles.container}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={handleToggleSidebar}
        sidebarWidth={sidebarWidth}
      />
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
};

export default Layout;