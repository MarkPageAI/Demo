import React from 'react';
import { motion } from 'framer-motion';

// Placeholder icon, replace with actual icons or a library
const QuestIcon = ({ type = "default" }) => {
  const icons = {
    play: "🎮", // Play games
    win: "🏆",  // Win games
    score: "⭐", // Achieve score
    default: "🎯" // Default target
  };
  return <span className="text-2xl mr-3">{icons[type] || icons.default}</span>;
};


const DailyQuestCard = ({ quest, onClaimReward }) => {
  if (!quest) return null;

  const {
    id,
    title,
    description,
    reward, // e.g., { type: 'xp', amount: 100 } or { type: 'badge', name: 'Daily Challenger' }
    currentProgress,
    targetProgress,
    isCompleted, // Quest logic determines this
    isClaimed,   // Backend/state determines this
    iconType      // e.g., 'play', 'win', 'score' for QuestIcon
  } = quest;

  const percentage = targetProgress > 0 ? (currentProgress / targetProgress) * 100 : 0;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  const canClaim = isCompleted && !isClaimed;

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-5 border border-gray-200 dark:border-gray-700 w-full max-w-sm mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center mb-3">
        <QuestIcon type={iconType} />
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1" id={`quest-${id}-progresslabel`}>
          <span>Progress: {title}</span>
          <span>{currentProgress}/{targetProgress}</span>
        </div>
        <div
          className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3.5 overflow-hidden"
          role="progressbar"
          aria-labelledby={`quest-${id}-progresslabel`}
          aria-valuenow={currentProgress}
          aria-valuemin="0"
          aria-valuemax={targetProgress}
          aria-valuetext={`${currentProgress} of ${targetProgress} completed for ${title}`}
        >
          <motion.div
            className={`h-full rounded-full ${isCompleted ? 'bg-green-500 dark:bg-green-600' : 'bg-tech-blue dark:bg-tech-blue'}`}
            initial={{ width: 0 }}
            animate={{ width: `${clampedPercentage}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Reward Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Reward: <span className="font-semibold text-creative-purple dark:text-learning-yellow">
          {reward.amount} {reward.type === 'xp' ? 'XP' : reward.name || reward.type}
        </span>
      </div>

      {/* Action Button */}
      <div className="text-center">
        {isClaimed ? (
          <motion.p
            className="text-sm font-semibold text-green-600 dark:text-green-400 py-2"
            initial={{ opacity:0, scale: 0.8 }}
            animate={{ opacity:1, scale: [1, 1.1, 1] }} // Pop effect
            transition={{ duration: 0.4, times: [0, 0.7, 1] }}
          >
            Reward Claimed! ✨
          </motion.p>
        ) : canClaim ? (
          <motion.button
            onClick={() => onClaimReward && onClaimReward(id)}
            className="w-full px-4 py-2.5 bg-learning-yellow hover:bg-yellow-500 dark:bg-learning-yellow dark:hover:bg-yellow-500 text-gray-800 dark:text-gray-900 font-bold rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-600"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Claim Reward
          </motion.button>
        ) : isCompleted && !canClaim ? ( // Completed but not claimable (e.g. already claimed via another mechanism)
             <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 py-2">Completed</p>
        ) : (
          <button
            disabled
            className="w-full px-4 py-2.5 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 font-semibold rounded-lg cursor-not-allowed"
          >
            In Progress
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default DailyQuestCard;
