import React from 'react';
import PlayerStatus from '../Shared/PlayerStatus'; // Adjust path as needed

const WaitingRoomPlayerList = ({ players = [] }) => {
  if (!Array.isArray(players)) {
    // Handle cases where players might not be an array yet (e.g., loading)
    // Or ensure the parent component always passes an array.
    console.warn("WaitingRoomPlayerList expects 'players' prop to be an array.");
    players = [];
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 w-full max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-2">
        Players in Room
      </h2>
      <p className="text-center text-tech-blue dark:text-learning-yellow font-medium mb-6">
        {players.length} {players.length === 1 ? 'player' : 'players'} currently waiting
      </p>

      {players.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {players.map((player) => (
            <PlayerStatus
              key={player.id || player.name} // Ensure player has a unique id
              player={player}
              size="normal"
              showName={true}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
          No players yet. Waiting for participants...
        </p>
      )}

      {/* Placeholder for future elements like "Start Game" button for admin */}
      {/* Or instructions for players */}
    </div>
  );
};

export default WaitingRoomPlayerList;
