import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Changed import path
import apiService from '../services/api'; // Để lấy BASE_URL cho login
import ThemeToggleButton from './ThemeToggleButton'; // Import the new button

const Navbar = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const backendUrl = apiService.getBaseUrl();

  const handleLogout = async () => {
    await logout();
    // Có thể thêm navigate('/') ở đây nếu cần, nhưng AuthContext đã clear user
    // và các component khác sẽ re-render dựa trên isAuthenticated.
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div>
            <Link to="/" className="text-2xl font-bold text-creative-purple hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
              STEAM Quiz Game
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {loading ? (
              <span className="text-gray-500 dark:text-gray-400">Loading...</span>
            ) : isAuthenticated && user ? (
              <>
                <Link to="/profile" className="text-gray-700 dark:text-gray-200 hover:text-tech-blue dark:hover:text-blue-400 transition-colors font-medium">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random&color=fff&size=32`}
                    alt="avatar"
                    className="w-8 h-8 rounded-full inline-block mr-2 border-2 border-learning-yellow"
                    loading="lazy"
                  />
                  {user.username}
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white py-1.5 px-3 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <a
                href={`${backendUrl}/auth/discord`}
                className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors shadow hover:shadow-lg"
              >
                Login with Discord
              </a>
            )}
            <ThemeToggleButton /> {/* Add the toggle button here */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
