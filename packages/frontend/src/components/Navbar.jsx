import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api'; // Để lấy BASE_URL cho login

const Navbar = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const backendUrl = apiService.getBaseUrl();

  const handleLogout = async () => {
    await logout();
    // Có thể thêm navigate('/') ở đây nếu cần, nhưng AuthContext đã clear user
    // và các component khác sẽ re-render dựa trên isAuthenticated.
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f0f0f0', marginBottom: '1rem' }}>
      <div>
        <Link to="/" style={{ marginRight: '1rem', fontWeight: 'bold', textDecoration: 'none', color: '#333' }}>
          Quiz Game
        </Link>
      </div>
      <div>
        {loading ? (
          <span>Loading auth...</span>
        ) : isAuthenticated && user ? (
          <>
            <span style={{ marginRight: '1rem' }}>
              Welcome, {user.username}#{user.discriminator}!
              (ID: {user.id}, GameSessionID: {user.gameSessionId})
            </span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <a
            href={`${backendUrl}/auth/discord`}
            style={{ padding: '0.5rem 1rem', background: '#7289da', color: 'white', textDecoration: 'none', borderRadius: '4px'}}
          >
            Login with Discord
          </a>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
