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
    <div className="mt-8 p-6 bg-steam-gray-light shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold text-center text-creative-purple mb-6">Global Leaderboard</h2>
      {leaderboardData.length > 0 ? (
        <ul className="space-y-3">
          {leaderboardData.map((player, index) => (
            <li
              key={player.discordUserId} // Use discordUserId as key
              className={`p-4 rounded-md shadow flex items-center justify-between transition-all duration-200 ease-in-out hover:shadow-xl
                          ${index === 0 ? 'bg-yellow-300 border-2 border-yellow-500' :
                            index === 1 ? 'bg-gray-200 border-2 border-gray-400' :
                            index === 2 ? 'bg-yellow-500/70 border-2 border-yellow-700' : // Bronze-like
                            'bg-white hover:bg-tech-blue/5'}`}
            >
              <div className="flex items-center space-x-3">
                <span className={`text-lg font-bold w-8 text-center rounded-full p-1
                                 ${index === 0 ? 'bg-yellow-500 text-white' :
                                   index === 1 ? 'bg-gray-400 text-white' :
                                   index === 2 ? 'bg-yellow-700 text-white' :
                                   'bg-creative-purple text-white'}`}>
                  {index + 1}
                </span>
                <AvatarDisplay
                  userId={player.discordUserId}
                  avatarHash={player.avatar}
                  name={player.username}
                />
                <div>
                  <span className="font-semibold text-steam-gray-dark text-base sm:text-lg">
                    {player.username}{player.discriminator && player.discriminator !== "0" ? `#${player.discriminator}` : ''}
                  </span>
                  {/* Display averageTime if available from backend - assuming it might be added to leaderboard data */}
                  {player.averageTimePerQuestion !== undefined && (
                     <span className="block text-xs text-creative-purple/80">
                       Avg Time: {player.averageTimePerQuestion.toFixed(2)}s
                     </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="block text-lg font-bold text-tech-blue">{player.totalScore} pts</span>
                <span className="text-xs text-steam-gray">Games: {player.gamesPlayed}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
         <p className="text-center text-steam-gray">No leaderboard data available yet. Play some games!</p>
      )}
    </div>
  );
};

export default GlobalLeaderboard;
