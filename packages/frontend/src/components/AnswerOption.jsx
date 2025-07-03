import React from 'react';

const AnswerOption = ({ option, onSelect, isSelected, isCorrect, revealAnswer }) => {
  // Basic structure for an answer option
  // Styling will use Tailwind CSS from the design system

  // Determine background color based on state
  let bgColor = 'bg-steam-gray-light hover:bg-steam-gray'; // Default
  if (revealAnswer) {
    if (isCorrect) {
      bgColor = 'bg-green-500 text-white'; // Correct answer
    } else if (isSelected && !isCorrect) {
      bgColor = 'bg-red-500 text-white'; // Incorrectly selected
    } else {
      bgColor = 'bg-steam-gray-light'; // Not selected, or not the correct one
    }
  } else if (isSelected) {
    bgColor = 'bg-creative-purple text-white'; // Selected by user
  }

  return (
    <button
      onClick={() => onSelect(option.id)}
      disabled={revealAnswer} // Disable button after an answer is revealed
      className={`w-full p-4 rounded-lg shadow text-left transition-colors duration-150 ease-in-out
                  ${bgColor}
                  ${revealAnswer && isCorrect ? 'border-2 border-green-700' : ''}
                  ${revealAnswer && isSelected && !isCorrect ? 'border-2 border-red-700' : ''}
                  ${!revealAnswer ? 'focus:ring-2 focus:ring-creative-purple focus:outline-none' : ''}
                  disabled:opacity-75 disabled:cursor-not-allowed`}
    >
      <p className="text-lg">{option.text}</p>
    </button>
  );
};

export default AnswerOption;
