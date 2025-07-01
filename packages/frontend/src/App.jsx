import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import ResultsPage from './pages/ResultsPage';
import NotFoundPage from './pages/NotFoundPage';
import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider
import './App.css';

function App() {
  return (
    <AuthProvider> {/* Wrap everything with AuthProvider */}
      <div className="App">
        <Navbar />
        <main className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="/results/:roomId" element={<ResultsPage />} />
            {/* Handle Discord OAuth Callback - A simple component to trigger verification */}
            <Route path="/auth/callback/discord" element={<DiscordCallbackHandler />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <footer>
          <p>&copy; 2024 Quiz Game</p>
        </footer>
      </div>
    </AuthProvider>
  );
}

// Simple component to handle the callback logic
// This page will be hit after Discord redirects back to our frontend.
// The backend should have set a session cookie.
// This component's job is to call verifyAuthentication from AuthContext.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

const DiscordCallbackHandler = () => {
  const { verifyAuthentication } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      await verifyAuthentication();
      // After verification (which updates AuthContext), navigate to home or dashboard
      navigate('/');
    };
    handleAuth();
  }, [verifyAuthentication, navigate]);

  return <div>Loading user session... Please wait.</div>;
};


export default App;
