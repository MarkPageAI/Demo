import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionCard from '../components/QuizPlay/QuestionCard';
import TimerCircle from '../components/QuizPlay/TimerCircle';
// import { useParams } from 'react-router-dom'; // If using room ID from URL

// Sample questions data (replace with actual data fetching)
const sampleQuestions = [
  {
    id: 'q1',
    text: 'What is the powerhouse of the cell?',
    options: [
      { id: 'o1a', text: 'Nucleus' },
      { id: 'o1b', text: 'Ribosome' },
      { id: 'o1c', text: 'Mitochondria' },
      { id: 'o1d', text: 'Endoplasmic Reticulum' },
    ],
    correctAnswerId: 'o1c',
    duration: 15, // seconds
  },
  {
    id: 'q2',
    text: 'What is the chemical symbol for water?',
    options: [
      { id: 'o2a', text: 'H2O' },
      { id: 'o2b', text: 'CO2' },
      { id: 'o2c', text: 'O2' },
      { id: 'o2d', text: 'NaCl' },
    ],
    correctAnswerId: 'o2a',
    duration: 10,
  },
  {
    id: 'q3',
    text: 'Which planet is known as the Red Planet?',
    options: [
      { id: 'o3a', text: 'Earth' },
      { id: 'o3b', text: 'Mars' },
      { id: 'o3c', text: 'Jupiter' },
      { id: 'o3d', text: 'Venus' },
    ],
    correctAnswerId: 'o3b',
    duration: 12,
  },
];

const QuizPage = () => {
  // const { roomId } = useParams(); // Example if using roomId
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [announcement, setAnnouncement] = useState(''); // For ARIA live region

  const currentQuestion = sampleQuestions[currentQuestionIndex];

  useEffect(() => {
    if (currentQuestion) {
      setAnnouncement(`New question: ${currentQuestion.text}. Timer started for ${currentQuestion.duration} seconds.`);
    }
  }, [currentQuestion]);

  const handleAnswerSubmission = (questionId, submittedOptionId) => {
    if (!isRevealed) {
      setTimeout(() => {
        setIsRevealed(true);
        const isCorrect = submittedOptionId === currentQuestion.correctAnswerId;
        if (isCorrect) {
          setScore(prevScore => prevScore + 10);
          setAnnouncement(`Selected ${currentQuestion.options.find(o => o.id === submittedOptionId)?.text}. Correct!`);
        } else {
          setAnnouncement(`Selected ${currentQuestion.options.find(o => o.id === submittedOptionId)?.text}. Incorrect. The correct answer was ${currentQuestion.options.find(o => o.id === currentQuestion.correctAnswerId)?.text}.`);
        }
      }, 500);
    }
  };

  const handleNextQuestion = () => {
    setIsRevealed(false);
    setAnnouncement(''); // Clear previous announcement
    if (currentQuestionIndex < sampleQuestions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      // End of quiz - navigate to results or show summary
      alert(`Quiz Over! Your score: ${score}`);
      // Replace with navigation: navigate(`/results/${roomId}`);
      setCurrentQuestionIndex(0); // Reset for demo
      setScore(0);
    }
  };

  const handleTimeout = () => {
    if (!isRevealed) {
      setIsRevealed(true); // Reveal answers, selected answer (if any) will be marked by QuestionCard
      // No points awarded for timeout or mark as incorrect
    }
    // Consider automatically moving to next question after a short delay on timeout
    // Adding a slight delay to allow user to see the revealed answer on timeout
    setTimeout(handleNextQuestion, 2000);
  };


  if (!currentQuestion) {
    return <div className="text-center p-8">Loading quiz...</div>;
  }

  const cardVariants = {
    initial: { opacity: 0, x: "-50vw", scale: 0.8 },
    animate: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: "50vw", scale: 0.8, transition: { duration: 0.4, ease: "easeIn" } },
  };

  // Ensure TimerCircle also rerenders properly by changing its key
  const timerKey = `timer-${currentQuestion.id}-${isRevealed}`;


  return (
    <div className="container mx-auto p-4 flex flex-col items-center overflow-x-hidden"> {/* Prevent horizontal scroll from animations */}
      {/* ARIA Live Region for announcements */}
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {announcement}
      </div>

      <div className="my-4 sm:my-6">
        <TimerCircle
          key={timerKey}
          duration={currentQuestion.duration}
          onTimeout={handleTimeout}
          size={window.innerWidth < 640 ? 80 : 100} // Smaller timer on small screens
          strokeWidth={window.innerWidth < 640 ? 8 : 10}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id} // Important for AnimatePresence to detect changes
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full max-w-2xl" // Ensure motion.div takes width for layout
        >
          <QuestionCard
            question={currentQuestion}
            onAnswerSelect={handleAnswerSubmission} // Renamed prop for clarity
            revealedAnswers={isRevealed}
          />
        </motion.div>
      </AnimatePresence>

      {isRevealed && (
        <motion.button
          onClick={handleNextQuestion}
          className="mt-6 sm:mt-8 px-6 py-3 bg-creative-purple text-white font-semibold rounded-lg shadow-md hover:bg-opacity-80 transition-colors focus:outline-none focus:ring-2 focus:ring-creative-purple focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          {currentQuestionIndex < sampleQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
        </motion.button>
      )}
       <div className="mt-4 text-lg font-bold text-gray-700 dark:text-gray-200">Score: {score}</div>
    </div>
  );
};

export default QuizPage;
