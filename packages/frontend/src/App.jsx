import React, { Suspense, lazy } from 'react'; // Import Suspense and lazy
import { Routes, Route } from 'react-router-dom';
// import HomePage from './pages/HomePage'; // Lazy load
// import RoomPage from './pages/RoomPage'; // Lazy load
// import ResultsPage from './pages/ResultsPage'; // Lazy load
// import ProfilePage from './pages/ProfilePage'; // Lazy load
// import NotFoundPage from './pages/NotFoundPage'; // Lazy load
import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';
// Removed './App.css' import as Tailwind will handle styling

// Lazy load page components
const HomePage = lazy(() => import('./pages/HomePage'));
const RoomPage = lazy(() => import('./pages/RoomPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Basic loading spinner for Suspense fallback
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-creative-purple"></div>
  </div>
);


function App() {
  return (
    <AuthProvider>
      <div className="App min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
        <Navbar />
        <main className="container mx-auto p-4 flex-grow">
          <Suspense fallback={<LoadingFallback />}> {/* Wrap Routes with Suspense */}
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/room/:roomId" element={<RoomPage />} />
              <Route path="/results/:roomId" element={<ResultsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              {/* Handle Discord OAuth Callback - A simple component to trigger verification */}
              {/* DiscordCallbackHandler is small, so maybe not lazy load, or lazy load if it grows */}
              <Route path="/auth/callback/discord" element={<DiscordCallbackHandler />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
        <footer className="bg-gray-200 dark:bg-gray-800 p-4 text-center">
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
import { useEffect } from 'react'; // Already imported above, ensure it's fine or manage imports
import { useNavigate } from 'react-router-dom'; // Already imported
import { useAuth } from './hooks/useAuth'; // Changed import path

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
