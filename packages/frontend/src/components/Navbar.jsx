import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api'; // Để lấy BASE_URL cho login
import ThemeToggleButton from './ThemeToggleButton'; // Import the toggle button

const Navbar = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const backendUrl = apiService.getBaseUrl();

  const handleLogout = async () => {
    await logout();
    // Có thể thêm navigate('/') ở đây nếu cần, nhưng AuthContext đã clear user
    // và các component khác sẽ re-render dựa trên isAuthenticated.
  };

  return (
    <nav className="bg-surface border-b border-border shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div>
            {/* Link color will use CSS variable from index.css for <a> tags, or can be specific */}
            <Link to="/" className="text-2xl font-bold text-creative-purple dark:text-learning-yellow hover:opacity-80 transition-opacity">
              Quiz Game
            </Link>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <ThemeToggleButton />
            {loading ? (
              <span className="text-text-secondary dark:text-slate-400">Loading...</span>
            ) : isAuthenticated && user ? (
              <>
                <span className="text-sm text-text-secondary dark:text-slate-300 hidden sm:inline">
                  Welcome, {user.username}!
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs sm:text-sm rounded-md bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <a
                href={`${backendUrl}/auth/discord`}
                className="px-3 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors text-sm"
              >
                Login with Discord
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
