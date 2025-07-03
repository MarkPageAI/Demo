import React from 'react';

// Placeholder for an avatar or icon
const Avatar = ({ name }) => (
  <div className="w-10 h-10 rounded-full bg-creative-purple flex items-center justify-center text-white font-bold text-lg shadow-md">
    {name ? name.charAt(0).toUpperCase() : '?'}
  </div>
);

const PlayerStatus = ({ playerName, score, isCurrentPlayer = false }) => {
  // Basic structure for displaying a player's status

  return (
    <div
      className={`p-3 flex items-center justify-between rounded-lg shadow
                  ${isCurrentPlayer ? 'bg-learning-yellow border-2 border-yellow-600' : 'bg-steam-gray-light border border-steam-gray'}`}
    >
      <div className="flex items-center space-x-3">
        <Avatar name={playerName} />
        <span className={`font-semibold ${isCurrentPlayer ? 'text-steam-gray-dark' : 'text-tech-blue'}`}>
          {playerName || 'Waiting...'}
        </span>
      </div>
      <div className="text-lg font-bold text-steam-gray-dark">
        Score: <span className={isCurrentPlayer ? 'text-white' : 'text-creative-purple'}>{score}</span>
      </div>
    </div>
  );
};

export default PlayerStatus;
