import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const DarkModeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors
                 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2
                 focus:ring-tech-blue dark:focus:ring-learning-yellow"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        // Moon icon (placeholder) - could be replaced with SVG or icon font
        <span role="img" aria-label="Moon" style={{ fontSize: '1.5rem' }}>🌙</span>
      ) : (
        // Sun icon (placeholder) - could be replaced with SVG or icon font
        <span role="img" aria-label="Sun" style={{ fontSize: '1.5rem' }}>☀️</span>
      )}
    </button>
  );
};

export default DarkModeToggle;
