import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

// Example task icons (could be actual SVGs or image URLs)
const taskIcons = {
  'play_quiz': '🎮', // Game controller
  'win_streak': '🏆', // Trophy
  'answer_questions': '❓', // Question mark
  'invite_friend': '👥', // Group of users
};

const DailyTasks = ({ tasks, onClaimTask }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg mx-auto my-4">
        <h3 className="text-xl font-semibold text-creative-purple mb-3">Daily Tasks</h3>
        <p className="text-gray-500 dark:text-gray-400">No daily tasks available at the moment. Check back later!</p>
      </div>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        type: 'spring',
        stiffness: 150,
      },
    }),
  };

  const getTaskIcon = (taskType) => taskIcons[taskType] || '🎯'; // Default target icon

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg mx-auto my-4">
      <h3 className="text-2xl font-bold text-center text-creative-purple mb-6">Daily Challenges</h3>
      <ul className="space-y-4">
        {tasks.map((task, index) => (
          <motion.li
            key={task.id}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className={`p-4 rounded-lg shadow-lg border-l-4
                        ${task.isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-800 dark:bg-opacity-30'
                                          : 'border-tech-blue bg-gray-50 dark:bg-gray-700'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getTaskIcon(task.type)}</span>
                <div>
                  <h4 className={`font-semibold ${task.isCompleted ? 'text-green-700 dark:text-green-300' : 'text-gray-800 dark:text-gray-100'}`}>
                    {task.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{task.description}</p>
                </div>
              </div>
              {task.isCompleted && !task.isClaimed && (
                <motion.button
                  onClick={() => onClaimTask(task.id)}
                  className="bg-learning-yellow hover:bg-yellow-500 text-white font-semibold py-1.5 px-4 rounded-md shadow transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Claim Reward ✨
                </motion.button>
              )}
              {task.isCompleted && task.isClaimed && (
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">Claimed ✔️</span>
              )}
              {!task.isCompleted && (
                <div className="text-right">
                  <span className="text-sm font-medium text-tech-blue dark:text-blue-400">
                    {task.currentProgress} / {task.targetProgress}
                  </span>
                  <div className="w-20 h-2 bg-gray-300 dark:bg-gray-500 rounded-full mt-1 overflow-hidden">
                    <motion.div
                      className="h-full bg-tech-blue"
                      initial={{ width: 0 }}
                      animate={{ width: `${(task.currentProgress / task.targetProgress) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

export default DailyTasks;
