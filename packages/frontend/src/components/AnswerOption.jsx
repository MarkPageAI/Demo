import React from 'react';

const AnswerOption = ({ option, onSelect,isSelected, isCorrect, isRevealed }) => {
  let buttonClasses = "w-full text-left p-4 rounded-md border border-slate-600 hover:bg-slate-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-steam-blue mb-3 ";

  if (isRevealed) {
    if (isCorrect) {
      buttonClasses += "bg-green-500 hover:bg-green-500 text-white border-green-500";
    } else if (isSelected) {
      buttonClasses += "bg-red-500 hover:bg-red-500 text-white border-red-500";
    } else {
      buttonClasses += "bg-slate-700 text-slate-300";
    }
  } else {
    if (isSelected) {
      buttonClasses += "bg-steam-blue text-white border-steam-blue";
    } else {
      buttonClasses += "bg-slate-700 text-slate-100 hover:border-steam-blue";
    }
  }


  return (
    <button
      onClick={() => onSelect(option.id)}
      className={buttonClasses}
      disabled={isRevealed}
    >
      <span className="font-medium">{option.text}</span>
    </button>
  );
};

export default AnswerOption;
