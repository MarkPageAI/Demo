import React from 'react';
import PlayerStatus from './PlayerStatus'; // Assuming PlayerStatus can be adapted or used as a base
import { useAuth } from '../contexts/AuthContext'; // To highlight current user

const GlobalLeaderboard = ({ leaderboardData, loading, error }) => {
  const { user: currentUser } = useAuth();

  if (loading) {
    return <p className="text-center text-slate-400 py-4">Loading leaderboard...</p>;
  }

  if (error) {
    return <p className="text-center text-red-400 py-4">Error loading leaderboard: {error}</p>;
  }

  if (!leaderboardData || leaderboardData.length === 0) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl text-center">
        <h2 className="text-2xl font-semibold text-steam-purple mb-4">Global Leaderboard</h2>
        <p className="text-slate-300">No leaderboard data available yet. Play some games to make your mark!</p>
      </div>
    );
  }

  return (
    <section className="bg-slate-800 p-4 md:p-6 rounded-lg shadow-xl">
      <h2 className="text-2xl md:text-3xl font-semibold text-center mb-6 text-steam-purple border-b border-slate-700 pb-3">
        Global Leaderboard
      </h2>
      <div className="space-y-3">
        {leaderboardData.map((player, index) => (
          <div key={player.discordUserId} className="flex items-center p-3 bg-slate-700 rounded-md shadow">
            <span className={`text-lg font-semibold mr-4 w-8 text-center ${
              index === 0 ? 'text-yellow-400' :
              index === 1 ? 'text-slate-300' :
              index === 2 ? 'text-orange-400' : 'text-slate-400'
            }`}>
              {index + 1}.
            </span>
            <div className="flex-grow">
              <PlayerStatus
                user={{ username: player.username, id: player.discordUserId, discriminator: player.discriminator }} // Pass discriminator if available and needed by PlayerStatus
                score={player.totalScore}
                isCurrentUser={currentUser && player.discordUserId === currentUser.id}
                // PlayerStatus by default shows "Score: X", let's adapt if we want "Total Score" or "Games Played"
                // We can pass additional info via a custom prop or modify PlayerStatus
                // For now, this will show their username and score.
              />
            </div>
             <div className="text-sm text-slate-400 ml-4 text-right whitespace-nowrap">
                Games: {player.gamesPlayed}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GlobalLeaderboard;
