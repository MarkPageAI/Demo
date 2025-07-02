import React from 'react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion'; // motion is used, keep both

const BadgePopup = ({ badge, isOpen, onClose }) => {
  if (!badge) return null;

  const popupVariants = {
    hidden: { opacity: 0, scale: 0.7 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } },
    exit: { opacity: 0, scale: 0.7, transition: { duration: 0.2 } },
  };

  const sparkleVariants = {
    animate: (i) => ({
      opacity: [0, 1, 0],
      scale: [0, 1.2, 0],
      x: Math.random() * 100 - 50, // Random position around the badge
      y: Math.random() * 100 - 50,
      rotate: Math.random() * 360,
      transition: {
        delay: i * 0.1,
        duration: 0.8 + Math.random() * 0.4,
        repeat: Infinity,
        repeatType: 'loop',
        ease: "easeInOut"
      }
    })
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} // Close on backdrop click
        >
          <motion.div
            role="dialog" // ARIA role for dialog
            aria-modal="true" // ARIA attribute for modal
            aria-labelledby="badge-popup-title" // ARIA label for title
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-gradient-to-br from-creative-purple to-tech-blue p-6 sm:p-8 rounded-xl shadow-2xl text-center relative overflow-hidden max-w-sm w-full"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside popup
          >
            {/* Sparkles background effect */}
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={sparkleVariants}
                animate="animate"
                className="absolute w-3 h-3 bg-yellow-300 rounded-full"
                style={{ top: '50%', left: '50%' }} // Centered, then transformed by animation
              />
            ))}

            <motion.img
              src={badge.iconUrl || `https://ui-avatars.com/api/?name=${badge.name.charAt(0)}&background=F59E0B&color=fff&size=128&font-size=0.5&bold=true`}
              alt={badge.name}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mx-auto mb-4 border-4 border-yellow-400 shadow-lg"
              loading="lazy"
              initial={{ scale: 0.5, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
            />
            <h3 id="badge-popup-title" className="text-2xl sm:text-3xl font-bold text-white mb-2">{badge.name}</h3>
            <p className="text-yellow-200 text-sm sm:text-base mb-1">Unlocked!</p>
            <p className="text-gray-100 text-sm sm:text-base mb-6">{badge.description}</p>
            <button
              onClick={onClose}
              className="bg-learning-yellow hover:bg-yellow-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-300"
              aria-label="Close badge notification"
            >
              Awesome!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BadgePopup;
