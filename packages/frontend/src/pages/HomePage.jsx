import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import GlobalLeaderboard from '../components/GlobalLeaderboard'; // Assuming this component will also be styled or is already Tailwind-compatible

const HomePage = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [roomIdToJoin, setRoomIdToJoin] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLeaderboardLoading(true);
      setLeaderboardError(null);
      try {
        const data = await apiService.getGlobalLeaderboard(10);
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
      // Consider showing a modal or redirecting to login via Navbar action
      return;
    }
    try {
      const roomData = await apiService.createRoom({});
      setActionMessage(`Room created! ID: ${roomData.id}. Redirecting...`);
      navigate(`/room/${roomData.id}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      setActionMessage(`Error creating room: ${error.message || 'Unknown error'}`);
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
      setActionMessage('Please log in to join a room.');
      return;
    }
    try {
      const roomData = await apiService.joinRoom(roomIdToJoin.trim());
      setActionMessage(`Successfully joined room: ${roomData.name || roomData.id}. Redirecting...`);
      navigate(`/room/${roomData.id}`);
    } catch (error) {
      console.error('Failed to join room:', error);
      setActionMessage(`Error joining room: ${error.message || 'Room not found or access denied.'}`);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900 text-white">
        Loading authentication status...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <header className="text-center my-8 md:my-12">
        <h1 className="text-4xl md:text-5xl font-bold text-steam-blue">
          Real-Time Quiz Game
        </h1>
        <p className="text-slate-300 mt-2 text-lg">
          Challenge your knowledge and compete with friends!
        </p>
      </header>

      {!isAuthenticated && (
        <div className="text-center bg-slate-800 p-6 rounded-lg shadow-xl max-w-md mx-auto">
          <p className="text-lg text-steam-yellow mb-4">
            Please log in with Discord to create or join quiz rooms.
          </p>
          <p className="text-sm text-slate-400">
            (Login button is in the navigation bar)
          </p>
        </div>
      )}

      {isAuthenticated && user && (
        <section className="mb-8 md:mb-12 p-6 bg-slate-800 rounded-lg shadow-xl max-w-lg mx-auto">
          <div className="text-center mb-6">
            <p className="text-lg">
              Welcome back, <strong className="text-steam-purple">{user.username}</strong>!
            </p>
          </div>
          <button
            onClick={handleCreateRoom}
            className="w-full bg-steam-blue text-white font-semibold py-3 px-6 rounded-lg hover:bg-steam-blue/90 transition duration-150 text-lg"
          >
            Create New Quiz Room
          </button>
        </section>
      )}

      <section className="mb-8 md:mb-12 p-6 bg-slate-800 rounded-lg shadow-xl max-w-lg mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-6 text-slate-100">
          Join an Existing Room
        </h2>
        <form onSubmit={handleJoinRoom} className="space-y-4">
          <div>
            <label htmlFor="roomId" className="block text-sm font-medium text-slate-300 mb-1">
              Room ID
            </label>
            <input
              id="roomId"
              type="text"
              value={roomIdToJoin}
              onChange={(e) => setRoomIdToJoin(e.target.value)}
              placeholder="Enter Room ID"
              className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg p-3 focus:ring-2 focus:ring-steam-purple focus:border-steam-purple placeholder-slate-400"
              disabled={!isAuthenticated}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-steam-purple text-white font-semibold py-3 px-6 rounded-lg hover:bg-steam-purple/90 transition duration-150 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isAuthenticated}
          >
            Join Room
          </button>
        </form>
      </section>

      {actionMessage && (
        <div className={`my-4 p-3 rounded-md text-center max-w-lg mx-auto ${
          actionMessage.startsWith('Error') ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
        }`}>
          {actionMessage}
        </div>
      )}

      {/* Assuming GlobalLeaderboard will be styled or is already Tailwind-compatible */}
      {/* It might need props for styling if it's not self-contained with Tailwind */}
      <section className="max-w-2xl mx-auto">
        <GlobalLeaderboard
          leaderboardData={leaderboard}
          loading={leaderboardLoading}
          error={leaderboardError}
        />
      </section>
    </div>
  );
};

export default HomePage;
