import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const steamTips = [
  { id: 1, category: "Science", text: "The speed of light is approximately 299,792 kilometers per second!" },
  { id: 2, category: "Technology", text: "The first computer programmer was Ada Lovelace, an English mathematician." },
  { id: 3, category: "Engineering", text: "The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion." },
  { id: 4, category: "Art", text: "The Mona Lisa has no eyebrows; it was the fashion in Renaissance Florence to shave them." },
  { id: 5, category: "Math", text: "A 'googol' is the number 1 followed by 100 zeros." },
  { id: 6, category: "Science", text: "Octopuses have three hearts and blue blood." },
  { id: 7, category: "Technology", text: "The first gigabyte hard drive, IBM 3380, weighed over 500 pounds and cost $40,000 in 1980." },
  { id: 8, category: "Engineering", text: "The Great Wall of China is not a single continuous wall but a series of fortifications." },
  { id: 9, category: "Art", text: "Vincent Van Gogh only sold one painting during his lifetime: 'The Red Vineyard'." },
  { id: 10, category: "Math", text: "Zero is the only number that cannot be represented by Roman numerals." },
];

const EducationalTip = ({ interval = 10000 }) => { // Default interval 10 seconds
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    // Pick a random tip initially
    setCurrentTipIndex(Math.floor(Math.random() * steamTips.length));

    const timer = setInterval(() => {
      setCurrentTipIndex(prevIndex => (prevIndex + 1) % steamTips.length);
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  const currentTip = steamTips[currentTipIndex];

  const tipVariants = {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, x: 50, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-md w-full max-w-lg mx-auto my-4 overflow-hidden">
      <motion.div
        key={currentTip.id} // AnimatePresence works on direct children, so key on the motion.div
        variants={tipVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative" // For AnimatePresence if we wrap it later for multiple items
      >
        <h4 className="text-sm font-semibold text-creative-purple dark:text-learning-yellow mb-1">
          💡 STEAM Fact ({currentTip.category})
        </h4>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {currentTip.text}
        </p>
      </motion.div>
    </div>
  );
};

// If you want AnimatePresence to work correctly for items changing,
// it should wrap the motion component directly.
// The current setup animates the content of the box changing.
// If you wanted the whole box to animate in/out, AnimatePresence would be outside this component.

export default EducationalTip;
