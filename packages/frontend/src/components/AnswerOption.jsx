import React from 'react';

const AnswerOption = ({ option, onSelect, isSelected, isCorrect, isRevealed }) => {
  let bgColor = 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600';
  if (isRevealed) {
    bgColor = isCorrect ? 'bg-green-500 text-white' : (isSelected ? 'bg-red-500 text-white' : bgColor);
  } else if (isSelected) {
    bgColor = 'bg-creative-purple text-white';
  }

  return (
    <button
      onClick={() => onSelect(option.id)}
      className={`w-full text-left p-4 rounded-lg shadow mb-2 transition-colors duration-150 ${bgColor}`}
      disabled={isRevealed}
      aria-pressed={isSelected && !isRevealed} // Indicate if selected before reveal
      aria-label={`Answer: ${option.text}${isSelected ? ', selected' : ''}${isRevealed && isCorrect ? ', Correct' : ''}${isRevealed && !isCorrect && isSelected ? ', Incorrect' : ''}`}
    >
      {option.text}
    </button>
  );
};

export default AnswerOption;
