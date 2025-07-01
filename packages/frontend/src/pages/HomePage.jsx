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

  return (
    <div>
      <h1>Welcome to the Real-Time Quiz Game!</h1>

      {!isAuthenticated && (
        <p>Please log in with Discord to create or join quiz rooms.</p>
        // Login button is in Navbar
      )}

      {isAuthenticated && user && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid lightgreen' }}>
          <p>You are logged in as: <strong>{user.username}#{user.discriminator}</strong></p>
          <button onClick={handleCreateRoom} style={{ marginRight: '10px', padding: '10px' }}>
            Create New Quiz Room
          </button>
        </div>
      )}

      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid lightblue' }}>
        <h2>Join Existing Room</h2>
        <form onSubmit={handleJoinRoom}>
          <input
            type="text"
            value={roomIdToJoin}
            onChange={(e) => setRoomIdToJoin(e.target.value)}
            placeholder="Enter Room ID"
            style={{ padding: '10px', marginRight: '10px' }}
            disabled={!isAuthenticated} // Disable if not logged in
          />
          <button type="submit" style={{ padding: '10px' }} disabled={!isAuthenticated}>
            Join Room
          </button>
        </form>
      </div>

      {actionMessage && <p style={{ color: actionMessage.startsWith('Error') ? 'red' : 'green' }}>{actionMessage}</p>}

      <GlobalLeaderboard
        leaderboardData={leaderboard}
        loading={leaderboardLoading}
        error={leaderboardError}
      />
    </div>
  );
};

export default HomePage;
