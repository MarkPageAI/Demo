import React from 'react';

const AnswerOption = ({ option, onSelect,isSelected, isCorrect, isRevealed }) => {
  const handleClick = () => {
    if (onSelect && !isRevealed) {
      onSelect(option.id);
    }
  };

  let bgColor = 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600';
  let textColor = 'text-gray-800 dark:text-gray-200';
  let ringColor = 'focus:ring-tech-blue';

  if (isRevealed) {
    if (isCorrect) {
      bgColor = 'bg-green-500 dark:bg-green-700';
      textColor = 'text-white';
    } else if (isSelected) {
      bgColor = 'bg-red-500 dark:bg-red-700';
      textColor = 'text-white';
    } else {
      bgColor = 'bg-gray-300 dark:bg-gray-600'; // Neutral for unselected, revealed answers
      textColor = 'text-gray-700 dark:text-gray-300';
    }
  } else if (isSelected) {
    bgColor = 'bg-tech-blue dark:bg-tech-blue';
    textColor = 'text-white';
    ringColor = 'focus:ring-creative-purple';
  }


  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isRevealed}
      className={`w-full p-4 rounded-lg shadow transition-colors duration-150 ease-in-out
                  focus:outline-none focus:ring-2 ${ringColor} focus:ring-opacity-75
                  ${bgColor} ${textColor}
                  ${isRevealed && !isCorrect && !isSelected ? 'opacity-70' : ''}
                  ${!isRevealed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
    >
      <p className="text-base sm:text-lg">{option.text}</p>
    </button>
  );
};

export default AnswerOption;
