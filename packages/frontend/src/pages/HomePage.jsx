import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import GlobalLeaderboard from '../components/GlobalLeaderboard';

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

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen"><p className="text-xl text-text-secondary dark:text-slate-400">Loading authentication status...</p></div>;
  }

  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="text-4xl sm:text-5xl font-bold text-center text-creative-purple dark:text-purple-400 mb-10">
        Welcome to the Real-Time Quiz Game!
      </h1>

      {!isAuthenticated && (
        <p className="text-center text-text-secondary dark:text-slate-300 mb-8">
          Please log in with Discord to create or join quiz rooms. The login button is in the navbar.
        </p>
      )}

      {isAuthenticated && user && (
        <div className="mb-8 p-4 bg-surface dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg shadow text-center">
          <p className="text-text-primary dark:text-slate-100 mb-3">
            You are logged in as: <strong className="text-tech-blue dark:text-blue-400">{user.username}</strong>
          </p>
          <button
            onClick={handleCreateRoom}
            className="px-6 py-2 bg-learning-yellow hover:bg-yellow-500 dark:hover:bg-yellow-600 text-slate-800 dark:text-slate-900 font-semibold rounded-lg shadow transition-colors"
          >
            Create New Quiz Room
          </button>
        </div>
      )}

      <div className="mb-8 p-6 bg-surface dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-center text-tech-blue dark:text-blue-400 mb-6">Join Existing Room</h2>
        <form onSubmit={handleJoinRoom} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <input
            type="text"
            value={roomIdToJoin}
            onChange={(e) => setRoomIdToJoin(e.target.value)}
            placeholder="Enter Room ID"
            className="px-4 py-2 border border-border dark:border-slate-600 rounded-md shadow-sm focus:ring-creative-purple focus:border-creative-purple dark:bg-slate-800 dark:text-slate-100 flex-grow w-full sm:w-auto"
            disabled={!isAuthenticated}
          />
          <button
            type="submit"
            className="px-6 py-2 bg-creative-purple hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-semibold rounded-lg shadow transition-colors disabled:opacity-50 w-full sm:w-auto"
            disabled={!isAuthenticated}
          >
            Join Room
          </button>
        </form>
      </div>

      {actionMessage && <p className={`text-center my-4 text-sm ${actionMessage.startsWith('Error') ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{actionMessage}</p>}

      <GlobalLeaderboard
        leaderboardData={leaderboard}
        loading={leaderboardLoading}
        error={leaderboardError}
      />
    </div>
  );
};

export default HomePage;
