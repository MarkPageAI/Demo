import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/api'; // Import the actual apiService

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetches user status on initial load or when explicitly called by verifyAuthentication
  const fetchUserStatus = useCallback(async () => {
    console.log("AuthProvider: Attempting to fetch user status...");
    setLoading(true);
    try {
      const data = await apiService.checkAuthStatus();
      if (data.loggedIn && data.user) {
        setUser(data.user);
        console.log("AuthProvider: User status fetched and set", data.user);
      } else {
        setUser(null);
        console.log("AuthProvider: User not logged in or no user data from status check.");
      }
    } catch (error) {
      console.error('AuthProvider: Failed to fetch auth status:', error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial check when AuthProvider mounts
    fetchUserStatus();
  }, [fetchUserStatus]);

  // This function is typically called by the OAuth callback handler component
  const verifyAuthentication = useCallback(async () => {
    console.log("AuthProvider: Verifying authentication by re-fetching user status...");
    // Re-fetch user status. If backend session is established, this will get the user.
    await fetchUserStatus();
  }, [fetchUserStatus]);

  const logout = async () => {
    console.log("AuthProvider: Attempting to logout...");
    setLoading(true);
    try {
      await apiService.logout();
      setUser(null);
      console.log("AuthProvider: User logged out successfully via API.");
      // Frontend redirect can be handled by the component calling logout
    } catch (error) {
      console.error('AuthProvider: Logout failed:', error.message);
      // Still clear user locally even if API call fails, as session might be invalid
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // login function might not be directly used if all logins are OAuth based,
  // but can be useful for manually setting user after some other auth mechanism or testing.
  const login = (userData) => {
    setUser(userData);
    console.log("AuthProvider: User manually set (e.g., after non-OAuth login or for testing).");
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
    verifyAuthentication, // Exposed for callback handler
    fetchUserStatus // Could be exposed if manual refresh is needed elsewhere
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Show children only when not loading, or show a global loader */}
      {/* For simplicity, we'll show children directly and components can check loading status */}
      {/* {!loading ? children : <div>Loading application state...</div>} */}
      {children}
    </AuthContext.Provider>
  );
};
