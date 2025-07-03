import React, { useState } from 'react'; // Import useState for image error handling

// Re-usable Avatar component (can be moved to a shared file if used elsewhere)
const AvatarDisplay = ({ userId, avatarHash, name }) => {
  const [imgError, setImgError] = useState(false);

  if (avatarHash && userId && !imgError) {
    const isAnimated = avatarHash.startsWith('a_');
    const extension = isAnimated ? 'gif' : 'png';
    const avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=64`;

    return (
      <img
        src={avatarUrl}
        alt={`${name}'s avatar`}
        className="w-10 h-10 rounded-full shadow-md shrink-0 object-cover"
        onError={() => setImgError(true)}
      />
    );
  }
  // Fallback to initials
  return (
    <div className="w-10 h-10 rounded-full bg-tech-blue flex items-center justify-center text-white font-semibold text-lg shrink-0">
      {(name || 'P').charAt(0).toUpperCase()}
    </div>
  );
};


const GlobalLeaderboard = ({ leaderboardData, loading, error }) => {
  if (loading) {
    return <p>Loading leaderboard...</p>;
  }

  if (error) {
    return <p>Error loading leaderboard: {error}</p>;
  }

  if (!leaderboardData || leaderboardData.length === 0) {
    return <p>No leaderboard data available yet. Play some games!</p>;
  }

  return (
    <div className="mt-8 p-6 bg-surface dark:bg-slate-800 shadow-lg rounded-lg border border-border dark:border-slate-700">
      <h2 className="text-3xl font-bold text-center text-creative-purple dark:text-purple-400 mb-6">Global Leaderboard</h2>
      {leaderboardData.length > 0 ? (
        <ul className="space-y-3">
          {leaderboardData.map((player, index) => (
            <li
              key={player.discordUserId}
              className={`p-3 rounded-md shadow flex flex-col sm:flex-row sm:items-center sm:justify-between transition-all duration-200 ease-in-out hover:shadow-xl border
                          ${index === 0 ? 'bg-yellow-300/70 dark:bg-yellow-500/50 border-yellow-500 dark:border-yellow-400' :
                            index === 1 ? 'bg-gray-300/70 dark:bg-gray-500/50 border-gray-400 dark:border-gray-500' :
                            index === 2 ? 'bg-yellow-600/50 dark:bg-yellow-700/40 border-yellow-700 dark:border-yellow-600' :
                            'bg-white dark:bg-slate-700 border-border dark:border-slate-600 hover:bg-tech-blue/5 dark:hover:bg-tech-blue/10'}`}
            >
              {/* Left part: Rank, Avatar, Name, Avg Time */}
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-0 flex-grow min-w-0"> {/* Added min-w-0 for truncation */}
                <span className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full shrink-0
                                 ${index === 0 ? 'bg-yellow-500 text-white' :
                                   index === 1 ? 'bg-gray-500 text-white' :
                                   index === 2 ? 'bg-yellow-700 text-white' :
                                   'bg-creative-purple dark:bg-purple-600 text-white'}`}>
                  {index + 1}
                </span>
                <AvatarDisplay
                  userId={player.discordUserId}
                  avatarHash={player.avatar}
                  name={player.username}
                />
                <div className="flex-grow min-w-0"> {/* Added min-w-0 for truncation */}
                  <p className={`font-semibold text-text-primary dark:text-slate-100 text-sm sm:text-base truncate`} title={player.username}>
                    {player.username}{player.discriminator && player.discriminator !== "0" && player.discriminator !== "0000" ? `#${player.discriminator}` : ''}
                  </p>
                  {player.averageTimePerQuestion !== undefined && (
                     <span className="block text-xs text-creative-purple/80 dark:text-purple-400/80">
                       Avg Time: {player.averageTimePerQuestion.toFixed(2)}s
                     </span>
                  )}
                </div>
              </div>
              {/* Right part: Score, Games Played */}
              <div className="text-xs sm:text-sm text-right shrink-0 sm:ml-2">
                <span className="block font-bold text-tech-blue dark:text-blue-400 text-sm sm:text-base">{player.totalScore} pts</span>
                <span className="text-text-muted dark:text-slate-400">Games: {player.gamesPlayed}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
         <p className="text-center text-text-secondary dark:text-slate-400">No leaderboard data available yet. Play some games!</p>
      )}
    </div>
  );
};

export default GlobalLeaderboard;
