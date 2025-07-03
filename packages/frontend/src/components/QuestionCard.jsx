import React from 'react';

const QuestionCard = ({ question, onAnswer }) => {
  // Basic structure for a question card
  // Styling will be done using Tailwind CSS classes based on the design system

  if (!question) {
    return (
      <div className="p-3 sm:p-4 bg-surface dark:bg-slate-700 rounded-lg shadow-md text-text-secondary dark:text-slate-400">
        Loading question...
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-surface dark:bg-slate-700 rounded-lg shadow-xl border border-border dark:border-slate-600">
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-tech-blue dark:text-blue-400">{question.text}</h2>
      {/* Render options or other question elements here later */}
      {/* For now, a placeholder for where answer options would go */}
      <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
        <p className="text-sm sm:text-base text-text-muted dark:text-slate-400">Answer options will appear here.</p>
      </div>
      {/* Example of using a themed button, assuming 'onAnswer' is a generic handler for now */}
      {/* <button
        onClick={() => onAnswer('some_answer_id')}
        className="mt-6 bg-learning-yellow hover:bg-yellow-500 text-steam-gray-dark font-semibold py-2 px-4 rounded-lg shadow"
      >
        Submit (Example)
      </button> */}
    </div>
  );
};

export default QuestionCard;
