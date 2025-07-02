import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion'; // motion is used for motion.li

const PlayerList = ({ players, hostId }) => {
  if (!players || players.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No players in the room yet. Waiting for participants...</p>;
  }

  const playerVariants = {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50, transition: { duration: 0.3 } },
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
      <h4 className="text-2xl font-semibold text-creative-purple mb-4">
        Players Joined ({players.length})
      </h4>
      <ul className="space-y-3">
        <AnimatePresence>
          {players.map((player, index) => (
            <motion.li
              key={player.id || player.discordUserId || index} // Use a stable key
              custom={index}
              variants={playerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layout // Animate layout changes
              className={`flex items-center p-3 rounded-lg transition-colors duration-200 ease-in-out
                          ${player.id === hostId || player.discordUserId === hostId
                            ? 'bg-learning-yellow bg-opacity-20 border-l-4 border-learning-yellow'
                            : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
            >
              <img
                src={player.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name || player.username)}&background=random&color=fff&size=128`}
                alt={player.name || player.username}
                className="w-10 h-10 rounded-full mr-4 border-2 border-tech-blue"
                loading="lazy"
              />
              <div className="flex-grow">
                <strong className="text-gray-800 dark:text-gray-100 font-medium">
                  {player.name || `${player.username}#${player.discriminator}`}
                </strong>
                {(player.id === hostId || player.discordUserId === hostId) && (
                  <span className="ml-2 text-xs font-semibold bg-creative-purple text-white px-2 py-0.5 rounded-full">
                    Host
                  </span>
                )}
              </div>
              {/* Display score if available and non-zero, or if explicitly part of waiting room info */}
              {typeof player.score === 'number' && (
                <span className="text-lg font-bold text-tech-blue dark:text-blue-400">
                  {player.score}
                </span>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
};

export default PlayerList;
