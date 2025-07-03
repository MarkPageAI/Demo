import React from 'react';
import { motion } from 'framer-motion';

const AnswerOption = ({ option, onSelect, isSelected, isCorrect, revealAnswer, disabled }) => {
  let optionStyleClasses = "";
  const baseButtonClasses = "w-full p-4 rounded-lg shadow text-left transition-colors duration-100 ease-in-out border-2 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed font-medium text-lg";

  if (revealAnswer) {
    if (isCorrect) {
      optionStyleClasses = "bg-green-500 dark:bg-green-600 text-white border-green-700 dark:border-green-500";
    } else if (isSelected && !isCorrect) {
      optionStyleClasses = "bg-red-500 dark:bg-red-600 text-white border-red-700 dark:border-red-500";
    } else {
      // Other non-selected, non-correct options when answer is revealed
      optionStyleClasses = "bg-surface/60 dark:bg-slate-700/60 border-border/50 dark:border-slate-600/50 text-text-muted dark:text-slate-400";
    }
  } else if (isSelected) {
    optionStyleClasses = "bg-creative-purple dark:bg-purple-700 text-white border-creative-purple dark:border-purple-500 ring-2 ring-purple-500 dark:ring-purple-400";
  } else {
    // Default, not selected, not revealed
    optionStyleClasses = "bg-surface hover:bg-steam-gray-light dark:bg-slate-700 dark:hover:bg-slate-600 border-border dark:border-slate-600 text-text-primary dark:text-slate-100 focus:ring-2 focus:ring-creative-purple dark:focus:ring-purple-500";
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
      whileHover={{ scale: (disabled || revealAnswer) ? 1 : 1.03 }}
      whileTap={{ scale: (disabled || revealAnswer) ? 1 : 0.97 }}
      onClick={() => onSelect(option.id)}
      disabled={disabled || revealAnswer}
      className={`${baseButtonClasses} ${optionStyleClasses}`}
    >
      <p>{option.text}</p> {/* Removed font-medium and text-lg to inherit from baseButtonClasses or let optionStyleClasses handle it */}
    </motion.button>
  );
};

export default AnswerOption;
