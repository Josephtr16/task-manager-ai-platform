import React, { createContext, useState, useContext, useEffect } from 'react';
import { lightTheme, darkTheme } from '../theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        // Default to light (false) if no preference, or if saved is 'light'
        return savedTheme === 'dark';
    });

    const theme = isDarkMode ? darkTheme : lightTheme;

    const toggleTheme = () => {
        setIsDarkMode(prev => {
            const newMode = !prev;
            localStorage.setItem('theme', newMode ? 'dark' : 'light');
            return newMode;
        });
    };

    useEffect(() => {
        // Apply global body styles
        document.body.style.backgroundColor = theme.bgMain;
        document.body.style.color = theme.textPrimary;

        // Update scrollbar styles dynamically if possible, or use a class on body
        // For simplicity, we'll toggle a class on the body
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
        } else {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
        }
    }, [theme, isDarkMode]);

    return (
        <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
