import React from 'react';

const QuestionCard = ({ question }) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-4">
      <h2 className="text-2xl font-semibold text-tech-blue mb-4">{question.text}</h2>
      {/* Options will be rendered here by AnswerOption components */}
    </div>
  );
};

export default QuestionCard;
