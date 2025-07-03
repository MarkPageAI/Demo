import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
// import PlayerList from '../components/PlayerList'; // Replaced
import PlayerStatus from '../components/PlayerStatus'; // Use new component
import TopicProgressBar from '../components/TopicProgressBar';
import TopicPerformanceChart from '../components/TopicPerformanceChart'; // Import chart component
import apiService from '../services/api'; // Potentially to fetch room details if not in location state
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { motion } from 'framer-motion'; // Import motion

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

  // Small local component for podium avatars
  const PodiumAvatar = ({ userId, avatarHash, name }) => {
    const [imgError, setImgError] = useState(false);
    if (avatarHash && userId && !imgError) {
      const isAnimated = avatarHash.startsWith('a_');
      const extension = isAnimated ? 'gif' : 'png';
      const avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=128`;
      return <img src={avatarUrl} alt={`${name}'s avatar`} className="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-white shadow-lg object-cover" onError={() => setImgError(true)} />;
    }
    return <div className="w-24 h-24 rounded-full bg-creative-purple flex items-center justify-center text-white font-bold text-4xl mx-auto mb-3 border-4 border-white shadow-lg">{name ? name.charAt(0).toUpperCase() : '?'}</div>;
  };

  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-4xl font-bold text-creative-purple mb-4">Quiz Finished for "{roomName}"!</h1>
      <h2 className="text-3xl font-semibold text-tech-blue mb-8">Final Leaderboard</h2>

      {topPlayers.length > 0 && (
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-learning-yellow mb-6">🏆 Top Players 🏆</h3>
          <div className="grid md:grid-cols-3 gap-4 justify-items-center">
            {topPlayers.map((player, index) => (
              <motion.div
                key={player.id || player.discordUserId}
                className={`p-4 rounded-lg shadow-xl border-2 w-full max-w-sm ${medalColors[index] || 'bg-steam-gray-light border-steam-gray'}`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: `0px 0px 15px 5px ${index === 0 ? 'rgba(251, 191, 36, 0.7)' : index === 1 ? 'rgba(192, 192, 192, 0.7)' : 'rgba(205, 127, 50, 0.7)'}` // Gold, Silver, Bronze glow
                }}
              >
                <PodiumAvatar userId={player.id} avatarHash={player.avatar} name={player.username} />
                <div className="text-center">
                  <motion.span
                    className="text-5xl block -mt-8" // Adjusted margin for medal overlap
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.2 + 0.3, type: "spring", stiffness: 150 }}
                  >
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </motion.span>
                  <h4 className="text-xl font-bold text-steam-gray-dark mt-1">{index + 1}. {player.username}</h4>
                  <p className="text-2xl font-semibold text-creative-purple">Score: {player.score}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Placeholder for Topic Progress - visible only if currentUser has topicPerformance data */}
      {currentUser && finalRoomDetails.players.find(p => p.id === currentUser.id)?.topicPerformance && (
        <div className="my-12 p-6 bg-white shadow-lg rounded-lg max-w-lg mx-auto">
          <h3 className="text-2xl font-semibold text-creative-purple mb-6 text-center">Your Topic Performance</h3>
          {finalRoomDetails.players.find(p => p.id === currentUser.id).topicPerformance.map(topic => (
            <TopicProgressBar
              key={topic.name}
              topicName={topic.name}
              progress={topic.progress}
              color={topic.color || 'bg-tech-blue'} // Allow custom color per topic if provided
            />
          ))}
          <div className="mt-6">
            <TopicPerformanceChart data={finalRoomDetails.players.find(p => p.id === currentUser.id).topicPerformance} />
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
                userId={player.id} // Pass userId
                avatarHash={player.avatar} // Pass avatarHash
                playerName={player.username}
                score={player.score}
                isCurrentPlayer={currentUser && player.id === currentUser.id}
                averageTime={player.averageTime} // Pass directly, PlayerStatus handles null
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
                userId={player.id} // Pass userId
                avatarHash={player.avatar} // Pass avatarHash
                playerName={player.username}
                score={player.score}
                isCurrentPlayer={currentUser && player.id === currentUser.id}
                averageTime={player.averageTime} // Also pass averageTime here
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
