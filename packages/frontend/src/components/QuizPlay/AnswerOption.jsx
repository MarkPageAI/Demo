import React from 'react';
import { motion } from 'framer-motion';

const AnswerOption = ({ option, onSelect, isSelected, isCorrect, isRevealed }) => {
  const handleClick = () => {
    if (onSelect && !isRevealed) {
      onSelect(option.id);
    }
  };

  let bgColor = 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600';
  let textColor = 'text-gray-800 dark:text-gray-200';
  let ringColor = 'focus:ring-tech-blue';
  let animationProps = {};

  if (isRevealed) {
    if (isCorrect) {
      bgColor = 'bg-green-500 dark:bg-green-700';
      textColor = 'text-white';
      // "Pop" or "confetti-like" animation for correct answer
      animationProps = {
        scale: [1, 1.1, 1],
        transition: { duration: 0.3, times: [0, 0.5, 1] },
      };
    } else if (isSelected) {
      bgColor = 'bg-red-500 dark:bg-red-700';
      textColor = 'text-white';
      // "Shake" animation for incorrect selected answer
      animationProps = {
        x: [0, -5, 5, -5, 5, 0],
        transition: { duration: 0.4, times: [0, 0.1, 0.3, 0.5, 0.7, 1] },
      };
    } else {
      bgColor = 'bg-gray-300 dark:bg-gray-600';
      textColor = 'text-gray-700 dark:text-gray-300';
    }
  } else if (isSelected) {
    bgColor = 'bg-tech-blue dark:bg-tech-blue';
    textColor = 'text-white';
    ringColor = 'focus:ring-creative-purple';
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={isRevealed && isSelected} // Only disable if it was the selected one after reveal
      className={`w-full p-4 rounded-lg shadow transition-colors duration-150 ease-in-out
                  focus:outline-none focus:ring-2 ${ringColor} focus:ring-opacity-75
                  ${bgColor} ${textColor}
                  ${isRevealed && !isCorrect && !isSelected ? 'opacity-70' : ''}
                  ${!isRevealed ? 'cursor-pointer' : (isSelected ? 'cursor-not-allowed' : 'cursor-default')}`}
      whileHover={!isRevealed ? { scale: 1.03 } : {}}
      whileTap={!isRevealed ? { scale: 0.97 } : {}}
      animate={animationProps} // Apply reveal animations here
      aria-pressed={!isRevealed && isSelected}
      aria-label={`Answer: ${option.text}${isSelected ? ', selected' : ''}${isRevealed ? (isCorrect ? ', Correct' : (isSelected ? ', Incorrect' : '')) : ''}`}
    >
      <p className="text-base sm:text-lg">{option.text}</p>
    </motion.button>
  );
};

export default AnswerOption;
