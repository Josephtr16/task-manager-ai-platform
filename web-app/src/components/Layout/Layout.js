// src/components/Layout/Layout.js
import React from 'react';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

const Layout = ({ children }) => {
  const { theme } = useTheme();

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: theme.bgMain,
    },
    main: {
      flex: 1,
      marginLeft: '260px', // Matches new sidebar width
      minHeight: '100vh',
      overflow: 'auto',
      backgroundColor: theme.bgMain, // Ensure background consistency
    },
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
};

export default Layout;