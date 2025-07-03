import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
// import PlayerList from '../components/PlayerList'; // Replaced
import PlayerStatus from '../components/PlayerStatus'; // Use new component
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

  // Make sure to get the current user from AuthContext to highlight them if needed.
  const { user: currentUser } = useAuth();

  // Define medal colors for top players
  const medalColors = [
    'bg-yellow-400 border-yellow-500', // Gold
    'bg-gray-300 border-gray-400',   // Silver
    'bg-yellow-600 border-yellow-700'    // Bronze (using a darker yellow/orange for bronze)
  ];

  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-4xl font-bold text-creative-purple mb-4">Quiz Finished for "{roomName}"!</h1>
      <h2 className="text-3xl font-semibold text-tech-blue mb-8">Final Leaderboard</h2>

      {topPlayers.length > 0 && (
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-learning-yellow mb-6">🏆 Top Players 🏆</h3>
          <div className="grid md:grid-cols-3 gap-4 justify-items-center">
            {topPlayers.map((player, index) => (
              <div key={player.id || player.discordUserId}
                   className={`p-4 rounded-lg shadow-xl border-2 w-full max-w-sm ${medalColors[index] || 'bg-steam-gray-light border-steam-gray'}`}>
                <div className="text-center">
                  <span className="text-4xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <h4 className="text-xl font-bold text-steam-gray-dark mt-2">{index + 1}. {player.username}</h4>
                  <p className="text-2xl font-semibold text-creative-purple">Score: {player.score}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {otherPlayers.length > 0 && (
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-tech-blue mb-6">Rest of the Players</h3>
          <div className="space-y-3 max-w-md mx-auto">
            {otherPlayers.map(player => (
              <PlayerStatus
                key={player.id || player.discordUserId}
                playerName={player.username}
                score={player.score}
                isCurrentPlayer={currentUser && player.id === currentUser.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fallback if topPlayers is empty but sortedPlayers has players (e.g. less than 3 players total) */}
      {topPlayers.length === 0 && sortedPlayers.length > 0 && (
         <div className="mb-12">
          <h3 className="text-2xl font-semibold text-tech-blue mb-6">All Players</h3>
          <div className="space-y-3 max-w-md mx-auto">
            {sortedPlayers.map(player => (
              <PlayerStatus
                key={player.id || player.discordUserId}
                playerName={player.username}
                score={player.score}
                isCurrentPlayer={currentUser && player.id === currentUser.id}
              />
            ))}
          </div>
        </div>
      )}


      <div className="mt-12 space-x-4">
        <button
          onClick={() => navigate('/')}
          className="bg-tech-blue hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors"
        >
          Back to Home
        </button>
        <button
          onClick={() => navigate('/')} // Should eventually lead to a new game/lobby
          className="bg-learning-yellow hover:bg-yellow-500 text-steam-gray-dark font-bold py-3 px-6 rounded-lg shadow-md transition-colors"
        >
          Play Another Game
        </button>
      </div>
    </div>
  );
};

export default ResultsPage;
