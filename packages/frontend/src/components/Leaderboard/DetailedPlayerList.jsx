import React from 'react';
import PlayerStatus from '../Shared/PlayerStatus'; // Adjust path as needed
import { motion } from 'framer-motion';

const DetailedPlayerList = ({ players = [], currentUser }) => {
  // Assuming players are already sorted by rank/score by the parent component
  // And players in top 3 (already on podium) might be excluded or styled differently if included.
  // For this example, we'll assume this list is for players *not* on the podium, or all players.

  if (!Array.isArray(players) || players.length === 0) {
    return (
      <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
        No other players to display.
      </div>
    );
  }

  const listItemVariants = {
    initial: { opacity: 0, x: -20 },
    animate: i => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' }
    }),
  };

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 sm:p-6 w-full max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 text-center">
        Full Standings
      </h3>
      <div className="space-y-3">
        {/* Header Row - Optional, but good for clarity */}
        <div className="hidden sm:grid grid-cols-12 gap-2 items-center font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5">Player</div>
          <div className="col-span-3 text-center">Score</div>
          <div className="col-span-3 text-center">Avg. Time</div>
        </div>

        {players.map((player, index) => {
          const isCurrentUser = currentUser && player.id === currentUser.id;
          // Player rank could be `player.rank` or `index + 1` if sorted and rank not present.
          // If top 3 are part of this list, their rank is fixed.
          // For this example, using index for simplicity if rank prop is missing.
          const rank = player.rank || (index + 1);

          return (
            <motion.div
              key={player.id}
              custom={index}
              variants={listItemVariants}
              initial="initial"
              animate="animate"
              className={`grid grid-cols-12 gap-2 items-center p-2 sm:px-3 sm:py-2 rounded-md transition-colors
                          ${isCurrentUser ? 'bg-tech-blue/10 dark:bg-learning-yellow/10 ring-2 ring-tech-blue dark:ring-learning-yellow' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
            >
              {/* Rank */}
              <div className="col-span-1 text-center font-semibold text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                {rank}
              </div>

              {/* Player Info (Avatar + Name) */}
              <div className="col-span-5">
                <PlayerStatus
                  player={player}
                  size="small"
                  showName={true}
                  className="!flex-row items-center space-x-2 text-left" // Override default column flex
                  nameTextSizes={{small: "text-sm sm:text-base"}} // Custom name size
                />
              </div>

              {/* Score */}
              <div className="col-span-3 text-center font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base">
                {player.score !== undefined ? player.score : 'N/A'}
              </div>

              {/* Average Time - Placeholder */}
              <div className="col-span-3 text-center text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                {player.avgTime ? `${player.avgTime}s` : 'N/A'}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DetailedPlayerList;
