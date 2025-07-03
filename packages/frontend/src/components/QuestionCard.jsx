import React from 'react';

const QuestionCard = ({ question, onAnswer }) => {
  // Basic structure for a question card
  // Styling will be done using Tailwind CSS classes based on the design system

  if (!question) {
    return <div className="p-4 bg-steam-gray-light rounded-lg shadow-md">Loading question...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl border border-steam-gray">
      <h2 className="text-2xl font-bold mb-4 text-tech-blue">{question.text}</h2>
      {/* Render options or other question elements here later */}
      {/* For now, a placeholder for where answer options would go */}
      <div className="mt-4 space-y-2">
        <p className="text-steam-gray">Answer options will appear here.</p>
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
