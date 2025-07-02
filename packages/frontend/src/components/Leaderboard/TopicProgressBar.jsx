import React from 'react';
import { motion } from 'framer-motion';

const TopicProgressBar = ({ topicsData = [], title = "Progress by Topic" }) => {
  if (!Array.isArray(topicsData) || topicsData.length === 0) {
    return (
      <div className="my-6 p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg text-center text-gray-500 dark:text-gray-400">
        No topic progress data available.
      </div>
    );
  }

  // Define a few distinct colors for topics, can be expanded or made dynamic
  const topicColors = [
    'bg-tech-blue',
    'bg-creative-purple',
    'bg-learning-yellow',
    'bg-green-500',
    'bg-pink-500',
    'bg-indigo-500',
  ];
  const darkTopicTextColors = [ // For better contrast on dark backgrounds if needed for text on bar
    'text-white',
    'text-white',
    'text-gray-800', // Yellow needs dark text
    'text-white',
    'text-white',
    'text-white'
  ];


  return (
    <div className="my-6 bg-white dark:bg-gray-800 shadow-xl rounded-lg p-4 sm:p-6 w-full max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 text-center">
        {title}
      </h3>
      <div className="space-y-4">
        {topicsData.map((topic, index) => {
          const percentage = topic.maxScore > 0 ? (topic.score / topic.maxScore) * 100 : 0;
          const barColor = topicColors[index % topicColors.length];
          // const textColorOnBar = darkTopicTextColors[index % darkTopicTextColors.length];

          return (
            <motion.div
              key={topic.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="w-full"
            >
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{topic.name}</span>
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  {topic.score} / {topic.maxScore} ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 sm:h-5 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${barColor} flex items-center justify-end pr-2`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.1 + 0.2 }}
                >
                  {/* Optional: Text on bar if space allows and contrast is good */}
                  {/* {percentage > 15 && ( // Only show if bar is wide enough
                    <span className={`text-xs font-medium ${textColorOnBar} hidden sm:inline`}>{percentage.toFixed(0)}%</span>
                  )} */}
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TopicProgressBar;
