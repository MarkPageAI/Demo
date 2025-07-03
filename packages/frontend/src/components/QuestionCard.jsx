import React from 'react';

const QuestionCard = ({ question, currentQuestionIndex, totalQuestions }) => {
  if (!question) {
    return <div className="text-white">Loading question...</div>;
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl mx-auto my-8">
      <div className="mb-4 text-sm text-steam-yellow">
        Question {currentQuestionIndex + 1} of {totalQuestions}
      </div>
      <h2 className="text-2xl font-semibold text-slate-100 mb-6">
        {question.text}
      </h2>
      {/* AnswerOptions will be mapped here */}
    </div>
  );
};

export default QuestionCard;
