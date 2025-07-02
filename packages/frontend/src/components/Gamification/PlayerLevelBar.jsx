import React from 'react';
import { motion } from 'framer-motion';

const PlayerLevelBar = ({
  currentLevel,
  currentXp,
  xpForNextLevel, // XP needed to reach next level from the start of current level
  // Example: Level 1 (0 XP) -> Level 2 (100 XP needed). If player is Level 1, 50 XP, then currentXp=50, xpForNextLevel=100
  totalXpForCurrentLevel = 0, // Optional: XP accumulated at the START of the current level. If not provided, currentXp is progress within this level.
  label = "Level"
}) => {

  const xpProgressInLevel = currentXp - totalXpForCurrentLevel;
  const percentage = xpForNextLevel > 0 ? (xpProgressInLevel / xpForNextLevel) * 100 : 0;
  const clampedPercentage = Math.max(0, Math.min(100, percentage)); // Ensure percentage is between 0 and 100

  return (
    <div className="my-4 p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100">
          {label} {currentLevel}
        </span>
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          XP: {currentXp.toLocaleString()} / {(totalXpForCurrentLevel + xpForNextLevel).toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5 sm:h-6 overflow-hidden border border-gray-300 dark:border-gray-600">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-learning-yellow via-orange-500 to-red-600 dark:from-yellow-400 dark:via-orange-600 dark:to-red-700 flex items-center justify-center"
          initial={{ width: 0 }}
          animate={{ width: `${clampedPercentage}%` }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          {clampedPercentage > 15 && ( // Only show if bar is wide enough
             <span className="text-xs font-bold text-white text-shadow-sm hidden sm:inline">
               {clampedPercentage.toFixed(0)}%
             </span>
          )}
        </motion.div>
      </div>
      {xpProgressInLevel >= xpForNextLevel && (
        <motion.p
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          className="text-center text-sm text-green-500 dark:text-green-400 font-semibold mt-2"
        >
          Level Up Ready!
        </motion.p>
      )}
       {/* Basic text shadow utility for better readability on gradient */}
      <style jsx global>{`
        .text-shadow-sm {
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

export default PlayerLevelBar;
