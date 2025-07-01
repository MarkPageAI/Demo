import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import PlayerList from '../components/PlayerList'; // Re-use for displaying final scores
import apiService from '../services/api'; // Potentially to fetch room details if not in location state

const ResultsPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Attempt to get finalRoomDetails from navigation state
  const [finalRoomDetails, setFinalRoomDetails] = useState(location.state?.finalRoomDetails || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!finalRoomDetails && roomId) {
      // If state is not passed (e.g., direct navigation or refresh), try to fetch room details.
      // Note: Backend might have cleaned up some quiz-specific data if the room is just 'finished'.
      // The `quiz_finished` event payload is the most reliable source for final scores.
      // This fetch is a fallback and might not show the exact end-of-quiz state.
      console.warn(`ResultsPage: finalRoomDetails not found in location state for room ${roomId}. Fetching current room details as fallback.`);
      setIsLoading(true);
      apiService.getRoomDetails(roomId)
        .then(data => {
          if (data.status === 'finished' || data.status === 'playing') { // Accept 'playing' if server hasn't fully transitioned but scores are there
            // Sort players by score manually if not already sorted by server for this fallback
            data.players.sort((a, b) => b.score - a.score);
            setFinalRoomDetails(data);
          } else {
            setError('Quiz results are not available for this room, or the quiz is not finished.');
          }
        })
        .catch(err => {
          console.error("Error fetching room details for results:", err);
          setError(err.message || 'Could not load room details.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [finalRoomDetails, roomId]);

  if (isLoading) {
    return <div>Loading results...</div>;
  }

  if (error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error}</p>
        <Link to="/">Go to Homepage</Link>
      </div>
    );
  }

  if (!finalRoomDetails || !finalRoomDetails.players) {
    return (
      <div>
        <h1>Quiz Results</h1>
        <p>No quiz result data available for Room ID: {roomId}. This might happen if you refreshed the page or navigated here directly after the quiz ended on another device.</p>
        <Link to="/">Go to Homepage</Link>
      </div>
    );
  }

  const { players, name: roomName, hostId } = finalRoomDetails;
  const sortedPlayers = players; // Already sorted by server in 'quiz_finished' event or manually in fallback

  const topPlayers = sortedPlayers.slice(0, 3);
  const otherPlayers = sortedPlayers.slice(3);

  return (
    <div>
      <h1>Quiz Finished for "{roomName}"!</h1>
      <h2 style={{ color: 'green' }}>Final Leaderboard</h2>

      {topPlayers.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3>🏆 Top Players 🏆</h3>
          {topPlayers.map((player, index) => (
            <div key={player.discordUserId} style={{ padding: '10px', margin: '5px', background: ['gold', 'silver', '#cd7f32'][index] || 'lightgray', borderRadius: '5px' }}>
              <h4>{index + 1}. {player.username}#{player.discriminator} - Score: {player.score}</h4>
            </div>
          ))}
        </div>
      )}

      {/* Re-use PlayerList for a consistent display, or create a dedicated one */}
      {/* If using PlayerList, it will show all players including top 3 again, which might be okay or can be filtered */}
      <h3>All Players:</h3>
      <PlayerList players={sortedPlayers} hostId={hostId} />


      <div style={{ marginTop: '2rem' }}>
        <button onClick={() => navigate('/')} style={{ padding: '10px 15px', marginRight: '10px' }}>
          Back to Home
        </button>
        {/* "Play Again" could eventually try to re-create or join a similar room */}
        <button onClick={() => navigate('/')} style={{ padding: '10px 15px' }}>
          Play Another Game
        </button>
      </div>
    </div>
  );
};

export default ResultsPage;
