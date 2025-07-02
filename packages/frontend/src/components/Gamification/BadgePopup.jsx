import React, { useEffect } from 'react';

const BadgePopup = ({ badge, onClose }) => {
  if (!badge) {
    return null;
  }

  const { name, description, iconUrl, achievementDate } = badge;

  // Handle Escape key press for closing the modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Close on backdrop click
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-popup-title"
        aria-describedby="badge-popup-description"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md mx-auto text-center transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modal-appear"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        {iconUrl ? (
          <img src={iconUrl} alt={`${name} badge`} className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 rounded-full shadow-lg border-4 border-yellow-400 dark:border-learning-yellow" loading="lazy"/>
        ) : (
          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 rounded-full shadow-lg border-4 border-yellow-400 dark:border-learning-yellow bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-4xl sm:text-5xl text-yellow-500 dark:text-learning-yellow">🏆</span>
          </div>
        )}

        <h2 id="badge-popup-title" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Achievement Unlocked!
        </h2>
        <h3 className="text-xl sm:text-2xl font-semibold text-creative-purple dark:text-learning-yellow mb-3">
          {name}
        </h3>
        <p id="badge-popup-description" className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">
          {description}
        </p>
        {achievementDate && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Achieved on: {new Date(achievementDate).toLocaleDateString()}
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-4 px-6 py-3 bg-tech-blue hover:bg-opacity-80 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tech-blue dark:focus:ring-offset-gray-800"
        >
          Awesome!
        </button>
      </div>
      {/* Basic CSS for modal animation - could be moved to index.css or App.css */}
      <style jsx global>{`
        @keyframes modal-appear-animation {
          0% {
            opacity: 0;
            transform: scale(0.90) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-appear {
          animation: modal-appear-animation 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default BadgePopup;
