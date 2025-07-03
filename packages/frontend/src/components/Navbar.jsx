import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api'; // For BASE_URL

const Navbar = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const backendUrl = apiService.getBaseUrl();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-slate-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-steam-blue hover:text-steam-blue/80 transition-colors">
          STEAM Quiz Game
        </Link>
        <div className="mt-3 sm:mt-0 flex items-center space-x-4">
          {loading ? (
            <span className="text-sm text-slate-400">Loading...</span>
          ) : isAuthenticated && user ? (
            <>
              <span className="text-sm hidden md:inline">
                Welcome, <strong className="text-steam-purple">{user.username}</strong>!
              </span>
              {/* Avatar can be added here if available */}
              {/* <img src={user.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full" /> */}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded-md transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <a
              href={`${backendUrl}/auth/discord`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-4 rounded-md transition-colors flex items-center"
            >
              {/* Simple Discord Icon Placeholder */}
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.297 3.453A9.95 9.95 0 0012.013 0C6.677 0 2.172 3.896 2.172 8.802c0 3.537 2.41 6.533 5.703 7.87.07.07.152.18.152.297v1.506c0 .098-.07.19-.152.242a3.24 3.24 0 01-.646.378c-.582.308-1.153.53-1.646.677-.318.09-.53.35-.53.678A1.294 1.294 0 006.3 21.75c2.03.586 3.992.818 5.86.818 5.337 0 9.842-3.897 9.842-8.803 0-2.17-.97-4.294-2.553-5.86a9.825 9.825 0 00-4.952-2.453zm-6.28 9.388c-.99 0-1.79-.788-1.79-1.764s.8-1.764 1.79-1.764c.99 0 1.79.788 1.79 1.764s-.8 1.764-1.79 1.764zm4.003 0c-.99 0-1.79-.788-1.79-1.764s.8-1.764 1.79-1.764c.99 0 1.79.788 1.79 1.764s-.8 1.764-1.79 1.764z"></path></svg>
              Login with Discord
            </a>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
