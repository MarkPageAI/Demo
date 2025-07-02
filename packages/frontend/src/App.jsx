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
      <div className="App flex flex-col min-h-screen"> {/* Ensure full height and flex column */}
        <Navbar />
        {/* Apply padding, centering, and allow content to grow and scroll if needed */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="/results/:roomId" element={<ResultsPage />} />
            {/* Handle Discord OAuth Callback - A simple component to trigger verification */}
            <Route path="/auth/callback/discord" element={<DiscordCallbackHandler />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <footer className="bg-gray-200 dark:bg-gray-800 text-center p-4 text-sm text-gray-600 dark:text-gray-400 w-full">
          <p>&copy; {new Date().getFullYear()} STEAM Quiz Game. All rights reserved.</p>
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
