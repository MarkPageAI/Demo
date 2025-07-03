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
      scale: [1, 1.08, 1.03, 1.08, 1], // More pronounced pulse
      // Adding a green box-shadow glow effect for correct answers
      boxShadow: [
        "0 0 0px rgba(52, 211, 153, 0)", // from-green-400 via #34D399
        "0 0 25px rgba(52, 211, 153, 0.8)",
        "0 0 5px rgba(52, 211, 153, 0.3)",
        "0 0 25px rgba(52, 211, 153, 0.8)",
        "0 0 0px rgba(52, 211, 153, 0)"
      ],
      transition: { duration: 0.9, ease: "easeInOut" }
    }
  };

  // Determine animation target state based on props
  let animateTarget = "animate"; // Default target state key from variants
  if (revealAnswer) {
    if (isCorrect) {
      animateTarget = "correct";
    } else if (isSelected && !isCorrect) {
      animateTarget = "shake";
    }
    // If revealAnswer is true but it's not the selected incorrect one, nor the correct one,
    // it will just stay in its "animate" state (which is opacity 1, y 0), but its bg/text color changes.
  }

  return (
    <motion.button
      variants={optionVariants}
      initial="initial" // Animation on first mount
      animate={animateTarget} // Target state for animation changes
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
