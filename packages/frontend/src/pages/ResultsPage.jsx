import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import apiService from '../services/api';
import PlayerStatus from '../components/PlayerStatus'; // Using PlayerStatus for individual player display
import { useAuth } from '../contexts/AuthContext'; // To highlight current user

const ResultsPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user to highlight them

  const [finalRoomDetails, setFinalRoomDetails] = useState(location.state?.finalRoomDetails || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!finalRoomDetails && roomId) {
      console.warn(`ResultsPage: finalRoomDetails not found in location state for room ${roomId}. Fetching current room details as fallback.`);
      setIsLoading(true);
      apiService.getRoomDetails(roomId)
        .then(data => {
          if (data.status === 'finished' || data.status === 'playing') {
            // Ensure players are sorted by score descending for the leaderboard
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
    } else if (finalRoomDetails && finalRoomDetails.players) {
        // If details are passed via state, ensure they are sorted.
        // The server should ideally send them sorted in the 'quiz_finished' event.
        const sortedPlayers = [...finalRoomDetails.players].sort((a, b) => b.score - a.score);
        if (JSON.stringify(sortedPlayers) !== JSON.stringify(finalRoomDetails.players)) {
            setFinalRoomDetails(prev => ({...prev, players: sortedPlayers}));
        }
    }
  }, [finalRoomDetails, roomId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900 text-white">
        Loading results...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-red-400 p-4 md:p-8 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p className="text-lg mb-6 text-center">{error}</p>
        <Link
          to="/"
          className="bg-steam-blue text-white font-semibold py-2 px-6 rounded-lg hover:bg-steam-blue/90 transition duration-150"
        >
          Go to Homepage
        </Link>
      </div>
    );
  }

  if (!finalRoomDetails || !finalRoomDetails.players || finalRoomDetails.players.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-300 p-4 md:p-8 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-steam-yellow mb-4">Quiz Results</h1>
        <p className="text-lg mb-6 text-center">
          No quiz result data available for Room ID: {roomId}.
          <br />
          This might happen if you refreshed the page or navigated here directly after the quiz ended.
        </p>
        <Link
          to="/"
          className="bg-steam-purple text-white font-semibold py-2 px-6 rounded-lg hover:bg-steam-purple/90 transition duration-150"
        >
          Go to Homepage
        </Link>
      </div>
    );
  }

  const { players, name: roomName } = finalRoomDetails;
  // Players should already be sorted from useEffect or server.

  const getPodiumColor = (index) => {
    if (index === 0) return 'border-yellow-400 bg-yellow-400/10'; // Gold
    if (index === 1) return 'border-slate-400 bg-slate-400/10'; // Silver
    if (index === 2) return 'border-orange-400 bg-orange-400/10'; // Bronze
    return 'border-slate-700';
  };
  const getPodiumEmoji = (index) => {
    if (index === 0) return '🏆';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  }


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <header className="text-center my-8 md:my-12">
        <h1 className="text-4xl md:text-5xl font-bold text-steam-blue">
          Quiz Finished!
        </h1>
        <p className="text-slate-300 mt-2 text-lg">
          Results for room: <span className="font-semibold text-steam-yellow">{roomName || roomId}</span>
        </p>
      </header>

      <section className="max-w-2xl mx-auto bg-slate-800 p-6 rounded-lg shadow-xl">
        <h2 className="text-3xl font-semibold text-center mb-8 text-steam-purple border-b border-slate-700 pb-3">
          Final Leaderboard
        </h2>

        {/* Podium for Top 3 */}
        {players.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 text-center">
            {players.slice(0, 3).map((player, index) => (
              <div
                key={player.discordUserId || player.id}
                className={`p-4 rounded-lg border-2 ${getPodiumColor(index)} ${index === 0 ? 'md:order-2' : (index === 1 ? 'md:order-1' : 'md:order-3')} transform md:scale-${110 - index*10} shadow-lg`}
              >
                <div className="text-3xl mb-2">{getPodiumEmoji(index)}</div>
                <h3 className="text-xl font-semibold text-slate-100 truncate" title={player.username}>
                  {player.username || 'Anonymous'}
                </h3>
                <p className="text-2xl font-bold text-steam-yellow">{player.score} pts</p>
              </div>
            ))}
          </div>
        )}

        {/* Rest of the players */}
        {players.length > 3 && (
            <h3 className="text-xl font-semibold mt-8 mb-4 text-slate-300">Full Standings:</h3>
        )}
        <div className="space-y-3">
          {players.map((player, index) => (
            <PlayerStatus
              key={player.discordUserId || player.id} // Ensure key is stable
              user={{ username: player.username, id: player.discordUserId }}
              score={player.score}
              isCurrentUser={user && player.discordUserId === user.id}
              // You can add rank prop to PlayerStatus if you want to display it there
              // rank={index + 1}
              // Or style based on index if not top 3
              customDisplay={ index < 3 ? null : `${index + 1}.`} // Pass rank for non-podium
            />
          ))}
        </div>
      </section>

      <footer className="text-center mt-12">
        <Link
          to="/"
          className="bg-steam-blue text-white font-semibold py-3 px-8 rounded-lg hover:bg-steam-blue/80 transition duration-150 text-lg mr-4"
        >
          Back to Home
        </Link>
        {/* "Play Another Game" could eventually try to re-create or join a similar room */}
        <Link
          to="/" // For now, just navigates home
          className="bg-steam-purple text-white font-semibold py-3 px-8 rounded-lg hover:bg-steam-purple/80 transition duration-150 text-lg"
        >
          Play Another Game
        </Link>
      </footer>
    </div>
  );
};

export default ResultsPage;
