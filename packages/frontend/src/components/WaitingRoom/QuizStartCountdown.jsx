import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QuizStartCountdown = ({ duration = 5, onCountdownEnd }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef(null);

  useEffect(() => {
    setTimeLeft(duration); // Reset if duration changes (e.g. admin restarts countdown)
  }, [duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (onCountdownEnd) {
        onCountdownEnd();
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeLeft, onCountdownEnd, duration]);

  const digitVariants = {
    initial: { opacity: 0, y: -30, scale: 0.5 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 15 } },
    exit: { opacity: 0, y: 30, scale: 0.5, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 my-4">
      <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-2">
        Quiz starting in...
      </p>
      <div className="text-6xl sm:text-8xl font-bold text-creative-purple dark:text-learning-yellow w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={timeLeft}
            variants={digitVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {timeLeft > 0 ? timeLeft : 'Go!'}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuizStartCountdown;
