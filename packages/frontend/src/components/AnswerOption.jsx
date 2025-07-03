import React from 'react';
import { motion } from 'framer-motion';

const AnswerOption = ({ option, onSelect, isSelected, isCorrect, revealAnswer, disabled }) => {
  // Determine background color based on state
  let bgColor = 'bg-steam-gray-light hover:bg-steam-gray'; // Default
  let textColor = 'text-steam-gray-dark';
  let borderColor = 'border-transparent'; // Default no border

  if (revealAnswer) {
    if (isCorrect) {
      bgColor = 'bg-green-500';
      textColor = 'text-white';
      borderColor = 'border-green-700';
    } else if (isSelected && !isCorrect) {
      bgColor = 'bg-red-500';
      textColor = 'text-white';
      borderColor = 'border-red-700';
    } else {
      // Other non-selected, non-correct options when answer is revealed
      bgColor = 'bg-steam-gray-light opacity-60';
      textColor = 'text-steam-gray';
    }
  } else if (isSelected) {
    bgColor = 'bg-creative-purple'; // Selected by user before reveal
    textColor = 'text-white';
    borderColor = 'border-creative-purple'; // Add border to selected
  }

  // Animation variants
  const optionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    shake: {
      x: [0, -8, 8, -4, 4, 0],
      transition: { duration: 0.4 }
    },
    correct: {
      scale: [1, 1.05, 1],
      transition: { duration: 0.5 }
    }
  };

  // Determine animation state
  let animationState = "animate";
  if (revealAnswer) {
    if (isSelected && !isCorrect) {
      animationState = "shake";
    } else if (isCorrect) {
      animationState = "correct";
    }
  }

  return (
    <motion.button
      variants={optionVariants}
      initial="initial"
      animate={animationState} // Use "animate" for initial render, then "shake" or "correct"
      exit="exit"
      whileHover={{ scale: disabled || revealAnswer ? 1 : 1.03 }}
      whileTap={{ scale: disabled || revealAnswer ? 1 : 0.97 }}
      onClick={() => onSelect(option.id)}
      disabled={disabled || revealAnswer}
      className={`w-full p-4 rounded-lg shadow text-left transition-colors duration-100 ease-in-out border-2
                  ${bgColor}
                  ${textColor}
                  ${borderColor}
                  ${!revealAnswer && !isSelected ? 'focus:ring-2 focus:ring-creative-purple focus:outline-none' : ''}
                  disabled:opacity-70 disabled:cursor-not-allowed`}
    >
      <p className="text-lg font-medium">{option.text}</p>
    </motion.button>
  );
};

export default AnswerOption;
