import React, { Suspense, lazy, useEffect } from 'react'; // Corrected useEffect import
import { Routes, Route, useLocation } from 'react-router-dom'; // Added useLocation
// import HomePage from './pages/HomePage'; // Lazy loaded
// import RoomPage from './pages/RoomPage'; // Lazy loaded
// import ResultsPage from './pages/ResultsPage'; // Lazy loaded
// import NotFoundPage from './pages/NotFoundPage'; // Lazy loaded
import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider
import './App.css';

// Lazy load page components
const HomePage = lazy(() => import('./pages/HomePage'));
const RoomPage = lazy(() => import('./pages/RoomPage'));
const QuizPage = lazy(() => import('./pages/QuizPage')); // Assuming QuizPage exists and should be lazy loaded
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Fallback UI for Suspense
const PageLoader = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="text-xl font-semibold text-gray-700 dark:text-gray-300">Loading Page...</div>
    {/* You could add a spinner here */}
  </div>
);

function App() {
  const location = useLocation();

  useEffect(() => {
    const body = document.body;
    if (location.pathname.startsWith('/quiz/')) {
      body.classList.add('animated-gradient-background');
    } else {
      body.classList.remove('animated-gradient-background');
    }
    // Cleanup function to remove class if component unmounts (though App rarely does)
    // or if the path changes and it was previously on /quiz/
    return () => {
      body.classList.remove('animated-gradient-background');
    };
  }, [location.pathname]);

  return (
    <AuthProvider> {/* Wrap everything with AuthProvider */}
      {/*
        The 'App' div will sit on top of the body.
        The body has a base bg-gray-100/dark:bg-gray-900 set in index.html.
        When on /quiz/, the 'animated-gradient-background' class is added to the body.
        This gradient will visually replace the body's base background.
        The 'App' div itself does not need a special background, it will be effectively transparent
        against the body's background (either plain or gradient).
      */}
      <div className="App flex flex-col min-h-screen"> {/* Ensure full height and flex column */}
        <Navbar />
        {/* Apply padding, centering, and allow content to grow and scroll if needed */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/room/:roomId" element={<RoomPage />} />
              <Route path="/quiz/:roomId" element={<QuizPage />} /> {/* Added route for QuizPage */}
              <Route path="/results/:roomId" element={<ResultsPage />} />
              {/* Handle Discord OAuth Callback - A simple component to trigger verification */}
              <Route path="/auth/callback/discord" element={<DiscordCallbackHandler />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
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
