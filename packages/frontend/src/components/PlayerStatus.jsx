import React from 'react';

const PlayerStatus = ({ player }) => {
  return (
    <div className="flex items-center bg-gray-200 dark:bg-gray-700 p-3 rounded-lg shadow">
      <img
        src={player.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=random`}
        alt={`${player.name}'s avatar`}
        className="w-10 h-10 rounded-full mr-3 border-2 border-creative-purple"
        loading="lazy"
      />
      <div>
        <p className="font-semibold text-gray-800 dark:text-gray-100">{player.name}</p>
        <p className="text-sm text-tech-blue dark:text-learning-yellow">Score: {player.score}</p>
      </div>
    </div>
  );
};

export default PlayerStatus;
