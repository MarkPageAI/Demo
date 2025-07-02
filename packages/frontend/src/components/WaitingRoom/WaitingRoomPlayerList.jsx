import React from 'react';
import PlayerStatus from '../Shared/PlayerStatus'; // Adjust path as needed
import { motion, AnimatePresence } from 'framer-motion';

const WaitingRoomPlayerList = ({ players = [] }) => {
  if (!Array.isArray(players)) {
    console.warn("WaitingRoomPlayerList expects 'players' prop to be an array.");
    players = [];
  }

  const playerVariants = {
    initial: { opacity: 0, y: 20, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2, ease: "easeIn" } },
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 w-full max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">
        Players in Room
      </h2>
      <p className="text-center text-tech-blue dark:text-learning-yellow font-semibold mb-6 text-lg">
        {players.length} {players.length === 1 ? 'Player' : 'Players'} Waiting
      </p>

      {players.length > 0 ? (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-6">
          <AnimatePresence>
            {players.map((player) => (
              <motion.div
                layout // Enables shared layout animations if items reorder
                key={player.id || player.name} // Ensure player has a unique id
                variants={playerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <PlayerStatus
                  player={player}
                  size="normal"
                  showName={true}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-6">
          No players yet. Waiting for participants...
        </p>
      )}

      {/* Placeholder for future elements */}
    </div>
  );
};

export default WaitingRoomPlayerList;
