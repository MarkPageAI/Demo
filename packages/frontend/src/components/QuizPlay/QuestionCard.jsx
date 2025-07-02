import React, { useState } from 'react';
import AnswerOption from './AnswerOption';

const QuestionCard = ({ question, onAnswerSelect, revealedAnswers }) => {
  const [selectedOptionId, setSelectedOptionId] = useState(null);

  if (!question) {
    return <div className="text-center p-4">Loading question...</div>;
  }

  const handleSelectOption = (optionId) => {
    if (!revealedAnswers) {
      setSelectedOptionId(optionId);
      if (onAnswerSelect) {
        onAnswerSelect(question.id, optionId);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-xl p-6 sm:p-8 w-full max-w-2xl mx-auto my-8 transition-all duration-300 ease-in-out">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 sm:mb-8 text-center">
        {question.text}
      </h2>
      <div className="space-y-3 sm:space-y-4">
        {question.options.map((option) => (
          <AnswerOption
            key={option.id}
            option={option}
            onSelect={() => handleSelectOption(option.id)}
            isSelected={selectedOptionId === option.id}
            isCorrect={revealedAnswers ? question.correctAnswerId === option.id : undefined}
            isRevealed={!!revealedAnswers}
          />
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
