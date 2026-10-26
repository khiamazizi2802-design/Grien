import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        // Sync with parent window if running inside an iframe on the same origin
        if (window !== window.parent) {
            try {
                const getParentTheme = () => {
                    const parentTheme = window.parent.document.documentElement.getAttribute('data-theme');
                    if (parentTheme && (parentTheme === 'dark' || parentTheme === 'light')) {
                        setTheme(parentTheme);
                    }
                };

                // Initial sync
                getParentTheme();

                // Observe parent data-theme attribute mutations
                const observer = new MutationObserver(() => {
                    getParentTheme();
                });

                observer.observe(window.parent.document.documentElement, {
                    attributes: true,
                    attributeFilter: ['data-theme']
                });

                return () => observer.disconnect();
            } catch (e) {
                console.warn('Theme synchronization with parent failed:', e);
            }
        }
    }, []);

    // Global theme synchronization via localStorage event across frames
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
                setTheme(e.newValue);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
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
