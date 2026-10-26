import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className={`p-3 rounded-2xl flex items-center justify-center transition-all ${
                theme === 'dark' 
                ? 'bg-white/5 border border-white/10 text-yellow-400' 
                : 'bg-[var(--bg-secondary)] border border-[var(--border-main)] text-indigo-600'
            } ${className}`}
        >
            {theme === 'dark' ? (
                <Sun size={20} className="fill-yellow-400/20" />
            ) : (
                <Moon size={20} className="fill-indigo-600/20" />
            )}
        </motion.button>
    );
};

export default ThemeToggle;
