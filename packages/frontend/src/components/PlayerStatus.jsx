import React from 'react';

// Placeholder for an avatar or icon
const Avatar = ({ name }) => (
  <div className="w-10 h-10 rounded-full bg-creative-purple flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
    {name ? name.charAt(0).toUpperCase() : '?'}
  </div>
);

const PlayerStatus = ({ playerName, score, isCurrentPlayer = false, averageTime = null }) => {
  // Basic structure for displaying a player's status

  return (
    <div
      className={`p-3 flex flex-col sm:flex-row items-center justify-between gap-2 rounded-lg shadow
                  ${isCurrentPlayer ? 'bg-learning-yellow/80 border-2 border-yellow-600' : 'bg-steam-gray-light border border-steam-gray'}`}
    >
      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <Avatar name={playerName} />
        <div className="flex-grow">
          <span className={`block font-semibold text-sm sm:text-base ${isCurrentPlayer ? 'text-steam-gray-dark' : 'text-tech-blue'}`}>
            {playerName || 'Waiting...'}
          </span>
          {averageTime !== null && (
            <span className={`block text-xs ${isCurrentPlayer ? 'text-steam-gray-dark/80' : 'text-creative-purple/80'}`}>
              Avg Time: {averageTime.toFixed(2)}s
            </span>
          )}
        </div>
      </div>
      <div className="text-right">
        <span className={`block text-lg font-bold ${isCurrentPlayer ? 'text-white' : 'text-steam-gray-dark'}`}>
          Score: <span className={isCurrentPlayer ? 'text-white' : 'text-creative-purple'}>{score}</span>
        </span>
      </div>
    </div>
  );
};

export default PlayerStatus;
