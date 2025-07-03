import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import GlobalLeaderboard from '../components/GlobalLeaderboard';

// Import new components for demonstration
import QuestionCard from '../components/QuestionCard';
import AnswerOption from '../components/AnswerOption';
import TimerCircle from '../components/TimerCircle';
import PlayerStatus from '../components/PlayerStatus';

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

      {/* Placeholder for New Component Showcase */}
      <div className="mt-12 p-6 border-t-2 border-creative-purple">
        <h2 className="text-3xl font-bold text-center mb-8 text-creative-purple">Component Showcase</h2>

        <div className="grid md:grid-cols-2 gap-8 items-start">

          <div>
            <h3 className="text-xl font-semibold mb-4 text-tech-blue">Timer & Player Status</h3>
            <div className="flex flex-col items-center space-y-6 mb-8 p-4 bg-steam-gray-light rounded-lg shadow">
              <TimerCircle timeLeft={45} totalTime={60} size={120} />
              <PlayerStatus playerName="Jules" score={1200} isCurrentPlayer={true} />
              <PlayerStatus playerName="Opponent" score={950} />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4 text-tech-blue">Question & Answers</h3>
            <QuestionCard question={{ text: "What is the powerhouse of the cell?" }} />
            <div className="mt-4 space-y-3">
              <AnswerOption
                option={{ id: '1', text: 'Mitochondria' }}
                onSelect={() => console.log('Selected Mitochondria')}
                isSelected={false}
              />
              <AnswerOption
                option={{ id: '2', text: 'Nucleus' }}
                onSelect={() => console.log('Selected Nucleus')}
                isSelected={true} // Example of a selected state
              />
              <AnswerOption
                option={{ id: '3', text: 'Ribosome' }}
                onSelect={() => console.log('Selected Ribosome')}
                isSelected={false}
                isCorrect={true} // Example to show correct answer styling if revealAnswer was true
                revealAnswer={false} // Set to true to see "correct" styling
              />
               <AnswerOption
                option={{ id: '4', text: 'Endoplasmic Reticulum' }}
                onSelect={() => console.log('Selected ER')}
                isSelected={false}
                isCorrect={false}
                revealAnswer={false} // Set to true to see "incorrect" styling if this was also selected
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomePage;
