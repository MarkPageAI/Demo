import React, { useState } from 'react';

const Avatar = ({ userId, avatarHash, name }) => {
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
    <div className="w-10 h-10 rounded-full bg-creative-purple flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
      {name ? name.charAt(0).toUpperCase() : '?'}
    </div>
  );
};

const PlayerStatus = ({ userId, avatarHash, playerName, score, isCurrentPlayer = false, averageTime = null }) => {
  // Basic structure for displaying a player's status
  const baseClasses = "p-3 flex flex-col sm:flex-row items-center justify-between gap-2 rounded-lg shadow border";
  const themeClasses = isCurrentPlayer
    ? "bg-learning-yellow/70 dark:bg-learning-yellow/60 border-yellow-500 dark:border-yellow-400"
    : "bg-surface dark:bg-slate-700 border-border dark:border-slate-600";

  const nameColor = isCurrentPlayer
    ? "text-slate-800 dark:text-slate-900"
    : "text-tech-blue dark:text-blue-400";

  const avgTimeColor = isCurrentPlayer
    ? "text-slate-700 dark:text-slate-800"
    : "text-creative-purple dark:text-purple-400";

  const scoreTextColor = isCurrentPlayer
    ? "text-slate-800 dark:text-slate-900"
    : "text-text-secondary dark:text-slate-300";

  const scoreValueColor = isCurrentPlayer
    ? "text-slate-900 dark:text-white"
    : "text-creative-purple dark:text-purple-300";


  return (
    <div className={`${baseClasses} ${themeClasses}`}>
      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <Avatar userId={userId} avatarHash={avatarHash} name={playerName} />
        <div className="flex-grow">
          <span className={`block font-semibold text-sm sm:text-base ${nameColor}`}>
            {playerName || 'Waiting...'}
          </span>
          {averageTime !== null && (
            <span className={`block text-xs ${avgTimeColor}`}>
              Avg Time: {averageTime.toFixed(2)}s
            </span>
          )}
        </div>
      </div>
      <div className="text-right">
        <span className={`block text-lg font-bold ${scoreTextColor}`}>
          Score: <span className={scoreValueColor}>{score}</span>
        </span>
      </div>
    </div>
  );
};

export default PlayerStatus;
