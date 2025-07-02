import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Changed import path
import apiService from '../services/api';
import GlobalLeaderboard from '../components/GlobalLeaderboard';
import ParticleBackground from '../components/ParticleBackground'; // Import ParticleBackground
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'; // Import motion

const HomePage = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [roomIdToJoin, setRoomIdToJoin] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);
  const [actionMessage, setActionMessage] = useState(''); // For create/join room messages

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLeaderboardLoading(true);
      setLeaderboardError(null);
      try {
        const data = await apiService.getGlobalLeaderboard(10); // Get top 10
        setLeaderboard(data);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        setLeaderboardError(error.message);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const handleCreateRoom = async () => {
    setActionMessage('Creating room...');
    if (!isAuthenticated) {
      setActionMessage('Please log in to create a room.');
      return;
    }
    try {
      // Simple room creation, no specific name or options for now
      const roomData = await apiService.createRoom({});
      setActionMessage(`Room created! ID: ${roomData.id}. Redirecting...`);
      navigate(`/room/${roomData.id}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      setActionMessage(`Error creating room: ${error.message}`);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setActionMessage('Joining room...');
    if (!roomIdToJoin.trim()) {
      setActionMessage('Please enter a Room ID.');
      return;
    }
    if (!isAuthenticated) {
      // Backend will also check, but good to have a client-side check
      setActionMessage('Please log in to join a room.');
      // Optionally, redirect to login or show login prompt
      return;
    }
    try {
      const roomData = await apiService.joinRoom(roomIdToJoin.trim());
      setActionMessage(`Successfully joined room: ${roomData.name}. Redirecting...`);
      navigate(`/room/${roomData.id}`);
    } catch (error) {
      console.error('Failed to join room:', error);
      setActionMessage(`Error joining room: ${error.message}`);
    }
  };

  if (authLoading) {
    return <div>Loading authentication status...</div>;
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <ParticleBackground /> {/* Add particle background */}

      {/* Content Wrapper to ensure it's above the particles and centered */}
      <motion.div
        className="relative z-10 w-full max-w-4xl space-y-8"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
      >
        <motion.div variants={sectionVariants} className="text-center bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 backdrop-blur-md p-6 rounded-xl shadow-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-creative-purple mb-3">
            Welcome to STEAM Quiz Game!
          </h1>
          {!isAuthenticated && (
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              Please log in with Discord to create or join quiz rooms.
            </p>
            // Login button is in Navbar
          )}
        </motion.div>

        {isAuthenticated && user && (
          <motion.div variants={sectionVariants} className="bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 backdrop-blur-md p-6 rounded-xl shadow-2xl text-center">
            <p className="text-lg text-gray-800 dark:text-gray-100 mb-4">
              You are logged in as:
              <strong className="text-tech-blue ml-1">{user.username}</strong>
            </p>
            <button
              onClick={handleCreateRoom}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Create New Quiz Room
            </button>
          </motion.div>
        )}

        <motion.div variants={sectionVariants} className="bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 backdrop-blur-md p-6 rounded-xl shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-semibold text-learning-yellow mb-4 text-center">Join Existing Room</h2>
          <form onSubmit={handleJoinRoom} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <input
              type="text"
              value={roomIdToJoin}
              onChange={(e) => setRoomIdToJoin(e.target.value)}
              placeholder="Enter Room ID"
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-tech-blue focus:border-transparent dark:bg-gray-700 dark:text-white flex-grow w-full sm:w-auto"
              disabled={!isAuthenticated}
              aria-label="Room ID to join"
            />
            <button
              type="submit"
              className="bg-tech-blue hover:bg-blue-600 text-white font-bold py-3 px-5 rounded-lg text-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 w-full sm:w-auto"
              disabled={!isAuthenticated}
            >
              Join Room
            </button>
          </form>
        </motion.div>

        {actionMessage && (
          <motion.p
            variants={sectionVariants}
            className={`text-center p-3 rounded-lg shadow-md ${actionMessage.startsWith('Error') ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200' : 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200'}`}
          >
            {actionMessage}
          </motion.p>
        )}

        <motion.div variants={sectionVariants}>
          <GlobalLeaderboard
            leaderboardData={leaderboard}
            loading={leaderboardLoading}
            error={leaderboardError}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HomePage;
