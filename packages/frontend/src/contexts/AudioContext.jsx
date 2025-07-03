import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

// Define your audio file paths here (assuming they are in the public folder)
const WAITING_MUSIC_SRC = '/audio/waiting_room_music.mp3'; // Replace with your actual file
const GAMEPLAY_MUSIC_SRC = '/audio/gameplay_music.mp3';   // Replace with your actual file

export const AudioProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(() => {
    const savedMuteState = localStorage.getItem('isMuted');
    return savedMuteState ? JSON.parse(savedMuteState) : false;
  });
  const [currentTrack, setCurrentTrack] = useState(null); // 'waiting', 'gameplay', or null

  const waitingAudioRef = useRef(null);
  const gameplayAudioRef = useRef(null);

  // Initialize audio elements
  useEffect(() => {
    waitingAudioRef.current = new Audio(WAITING_MUSIC_SRC);
    waitingAudioRef.current.loop = true;
    gameplayAudioRef.current = new Audio(GAMEPLAY_MUSIC_SRC);
    gameplayAudioRef.current.loop = true;

    // Cleanup audio elements on unmount
    return () => {
      waitingAudioRef.current?.pause();
      waitingAudioRef.current = null;
      gameplayAudioRef.current?.pause();
      gameplayAudioRef.current = null;
    };
  }, []);

  // Effect to handle mute state for audio elements
  useEffect(() => {
    if (waitingAudioRef.current) {
      waitingAudioRef.current.muted = isMuted;
    }
    if (gameplayAudioRef.current) {
      gameplayAudioRef.current.muted = isMuted;
    }
    localStorage.setItem('isMuted', JSON.stringify(isMuted));
  }, [isMuted]);

  const playAudio = useCallback(async (audioRef) => {
    if (audioRef.current && audioRef.current.paused) {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.warn("Audio autoplay was prevented. User interaction might be needed.", error);
        // UI could show a "click to enable sound" button if needed
      }
    }
  }, []);

  const pauseAudio = useCallback((audioRef) => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, []);

  const playWaitingMusic = useCallback(() => {
    if (currentTrack === 'gameplay') {
      pauseAudio(gameplayAudioRef);
    }
    setCurrentTrack('waiting');
    if (!isMuted) playAudio(waitingAudioRef);
    else pauseAudio(waitingAudioRef); // Ensure it's paused if muted on track switch
  }, [currentTrack, playAudio, pauseAudio, isMuted]);

  const playGameplayMusic = useCallback(() => {
    if (currentTrack === 'waiting') {
      pauseAudio(waitingAudioRef);
    }
    setCurrentTrack('gameplay');
    if (!isMuted) playAudio(gameplayAudioRef);
    else pauseAudio(gameplayAudioRef); // Ensure it's paused if muted on track switch
  }, [currentTrack, playAudio, pauseAudio, isMuted]);

  const stopAllMusic = useCallback(() => {
    pauseAudio(waitingAudioRef);
    pauseAudio(gameplayAudioRef);
    setCurrentTrack(null);
  }, [pauseAudio]);

  const toggleMute = useCallback(() => {
    setIsMuted(prevMuted => {
      const newMutedState = !prevMuted;
      // If unmuting and a track is supposed to be playing, try to play it
      if (!newMutedState) {
        if (currentTrack === 'waiting') playAudio(waitingAudioRef);
        else if (currentTrack === 'gameplay') playAudio(gameplayAudioRef);
      }
      return newMutedState;
    });
  }, [currentTrack, playAudio]);

  return (
    <AudioContext.Provider value={{ isMuted, toggleMute, playWaitingMusic, playGameplayMusic, stopAllMusic, currentTrack }}>
      {children}
    </AudioContext.Provider>
  );
};
