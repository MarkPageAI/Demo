import React, { useState, useEffect, useCallback } from 'react';

const QuestionDisplay = ({ question, onSubmitAnswer, questionStartTime, questionEndTime, roomState }) => {
  const [selectedChoiceId, setSelectedChoiceId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const calculateTimeLeft = useCallback(() => {
    if (!questionEndTime) return null;
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((questionEndTime - now) / 1000));
    return remaining;
  }, [questionEndTime]);

  useEffect(() => {
    // Reset selection when a new question comes or state changes significantly
    setSelectedChoiceId(null);
    setSubmitted(false);
    setTimeLeft(calculateTimeLeft()); // Initial time calculation
  }, [question.id, calculateTimeLeft]); // question.id ensures reset for new questions

  useEffect(() => {
    if (roomState !== 'question_displayed' || !questionEndTime) {
      setTimeLeft(0); // Stop timer if not in question display phase
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        // Optionally, auto-submit or just let server handle timeout
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [questionEndTime, roomState, calculateTimeLeft]);

  const handleChoiceClick = (choiceId) => {
    if (submitted || roomState !== 'question_displayed' || timeLeft <= 0) return;
    setSelectedChoiceId(choiceId);
  };

  const handleSubmit = () => {
    if (!selectedChoiceId || submitted || roomState !== 'question_displayed' || timeLeft <= 0) return;
    setSubmitted(true);
    onSubmitAnswer(selectedChoiceId);
  };

  const isAnswerRevealed = roomState === 'answer_revealed';

  if (!question) {
    return <p>Waiting for question...</p>;
  }

  return (
    <div>
      <h4>{question.text}</h4>
      {questionEndTime && roomState === 'question_displayed' && (
        <p>Time Left: <strong>{timeLeft !== null ? timeLeft : 'Calculating...'}s</strong></p>
      )}
      {/* Progress bar can be added here based on timeLeft and question.duration */}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
        {question.choices.map((choice) => {
          let buttonStyle = {};
          if (isAnswerRevealed) {
            if (choice.id === question.correctChoiceId) {
              buttonStyle = { backgroundColor: 'lightgreen', fontWeight: 'bold' };
            } else if (selectedChoiceId === choice.id) {
              buttonStyle = { backgroundColor: 'salmon' };
            }
          } else if (selectedChoiceId === choice.id) {
            buttonStyle = { backgroundColor: 'lightblue' };
          }

          return (
            <button
              key={choice.id}
              onClick={() => handleChoiceClick(choice.id)}
              disabled={submitted || isAnswerRevealed || (roomState === 'question_displayed' && timeLeft <= 0)}
              style={{
                padding: '10px',
                textAlign: 'left',
                cursor: (submitted || isAnswerRevealed || (roomState === 'question_displayed' && timeLeft <= 0)) ? 'not-allowed' : 'pointer',
                ...buttonStyle
              }}
            >
              {choice.text}
            </button>
          );
        })}
      </div>

      {!isAnswerRevealed && roomState === 'question_displayed' && timeLeft > 0 && (
        <button
          onClick={handleSubmit}
          disabled={!selectedChoiceId || submitted}
          style={{ marginTop: '1rem', padding: '10px 15px' }}
        >
          {submitted ? 'Answered' : 'Submit Answer'}
        </button>
      )}

      {isAnswerRevealed && question.correctChoiceId && (
         <div style={{marginTop: '1rem', padding: '0.5rem', border: '1px dashed gray'}}>
            <p style={{fontWeight: 'bold'}}>
                The correct answer was: {question.choices.find(c => c.id === question.correctChoiceId)?.text}
            </p>
            {selectedChoiceId && selectedChoiceId !== question.correctChoiceId && (
                <p style={{color: 'darkred'}}>Your answer was: {question.choices.find(c => c.id === selectedChoiceId)?.text}</p>
            )}
            {selectedChoiceId && selectedChoiceId === question.correctChoiceId && (
                <p style={{color: 'darkgreen'}}>You answered correctly!</p>
            )}
            {!selectedChoiceId && (
                <p style={{fontStyle: 'italic'}}>You did not answer this question.</p>
            )}
         </div>
      )}
    </div>
  );
};

export default QuestionDisplay;
