import React from 'react';
import { motion } from 'framer-motion';

const TopicProgressBar = ({ topicName, progress, color = 'bg-tech-blue' }) => {
  // progress is a value between 0 and 100
  const validProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-steam-gray-dark">{topicName}</span>
        <span className="text-sm font-medium text-creative-purple">{validProgress}%</span>
      </div>
      <div className="w-full bg-steam-gray-light rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
        <motion.div
          className={`h-2.5 rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${validProgress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default TopicProgressBar;
