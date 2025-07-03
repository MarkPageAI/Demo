import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../contexts/AudioContext';

// SVG Icon for Speaker On (Volume Up)
const SpeakerOnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
);

// SVG Icon for Speaker Off (Muted)
const SpeakerOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zm9.707-9.293a1 1 0 00-1.414 0L12.172 7.414a1 1 0 001.414 1.414l1.414-1.414a1 1 0 000-1.414zM15 12a1 1 0 01-1.414-1.414l1.414-1.414a1 1 0 111.414 1.414L15 12zm1.414 1.414a1 1 0 10-1.414 1.414l1.414 1.414a1 1 0 101.414-1.414l-1.414-1.414z" />
  </svg>
);


const MuteButton = () => {
  const { isMuted, toggleMute } = useAudio();

  return (
    <button
      onClick={toggleMute}
      aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
      className="p-2 rounded-full hover:bg-steam-gray-light dark:hover:bg-steam-gray-dark focus:outline-none focus:ring-2 focus:ring-creative-purple transition-colors"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isMuted ? (
          <motion.div
            key="speakerOff"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2 }}
            className="text-text-secondary dark:text-slate-400"
          >
            <SpeakerOffIcon />
          </motion.div>
        ) : (
          <motion.div
            key="speakerOn"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2 }}
            className="text-text-secondary dark:text-slate-400"
          >
            <SpeakerOnIcon />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

export default MuteButton;
