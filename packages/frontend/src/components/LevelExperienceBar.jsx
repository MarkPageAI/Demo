import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const LevelExperienceBar = ({ currentLevel, currentXp, nextLevelThreshold }) => { // Removed xpToNextLevel
  const percentage = nextLevelThreshold > 0 ? Math.min((currentXp / nextLevelThreshold) * 100, 100) : 0;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md w-full max-w-md mx-auto my-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-creative-purple">
          Level {currentLevel}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {currentXp} / {nextLevelThreshold} XP to Level {currentLevel + 1}
        </span>
      </div>
      <div className="h-4 sm:h-5 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden relative border border-gray-400 dark:border-gray-500">
        <motion.div
          className="h-full bg-gradient-to-r from-learning-yellow to-yellow-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        {/* Optional: Adding a subtle shine effect to the bar */}
        <motion.div
            className="absolute top-0 left-0 h-full w-1/4 bg-white opacity-20"
            initial={{ x: "-100%"}}
            animate={{ x: "400%"}} // Moves across 4 times the width of the bar
            transition={{ duration: 2, ease: "linear", repeat: Infinity, delay: 0.5 }}
            style={{ filter: 'blur(2px)'}}
        />
      </div>
      {percentage >= 100 && (
        <motion.p
          className="text-center text-sm text-green-500 dark:text-green-400 mt-2 font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          🎉 Level Up Ready! 🎉
        </motion.p>
      )}
    </div>
  );
};

export default LevelExperienceBar;
