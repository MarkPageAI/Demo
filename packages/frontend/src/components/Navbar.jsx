import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api'; // Để lấy BASE_URL cho login
import DarkModeToggle from './Shared/DarkModeToggle'; // Import the toggle

const Navbar = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const backendUrl = apiService.getBaseUrl();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-tech-blue dark:text-learning-yellow hover:opacity-80 transition-opacity">
              STEAM Quiz
            </Link>
          </div>

          {/* Right side: Auth status and DarkModeToggle */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {loading ? (
              <span className="text-sm text-gray-700 dark:text-gray-300">Verifying...</span>
            ) : isAuthenticated && user ? (
              <>
                <span className="text-sm text-gray-700 dark:text-gray-300 hidden md:block">
                  Hi, <span className="font-semibold">{user.username}</span>!
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-creative-purple hover:bg-opacity-80 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-creative-purple dark:focus:ring-offset-gray-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <a
                href={`${backendUrl}/auth/discord`}
                className="px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800" // Discord-like blue
              >
                Login with Discord
              </a>
            )}
            <DarkModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
