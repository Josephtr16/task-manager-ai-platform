// src/components/Layout/Layout.js
import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { useFocus } from '../../context/FocusContext';

const Layout = ({ children, isFocusMode: isFocusModeProp }) => {
  const { theme } = useTheme();
  const { isFocusMode: contextFocusMode } = useFocus();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const isFocusMode = typeof isFocusModeProp === 'boolean' ? isFocusModeProp : contextFocusMode;

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

  const sidebarWidth = isFocusMode ? 0 : (isSidebarCollapsed ? 64 : 232);

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
      backgroundColor: theme.bgMain,
      transition: 'margin-left 200ms ease',
    },
  };

  return (
    <div style={styles.container}>
      {!isFocusMode && (
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={handleToggleSidebar}
          sidebarWidth={sidebarWidth}
        />
      )}
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
};

export default Layout;