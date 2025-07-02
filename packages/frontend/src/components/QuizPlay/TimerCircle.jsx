import React, { useState, useEffect, useRef } from 'react';

const TimerCircle = ({ duration, onTimeout, size = 80, strokeWidth = 8 }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (timeLeft / duration) * circumference;

  useEffect(() => {
    setTimeLeft(duration); // Reset timer when duration changes
  }, [duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (onTimeout) {
        onTimeout();
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
  }, [timeLeft, onTimeout, duration]);

  // Color logic: Green -> Yellow -> Red
  let progressColorClass = 'text-green-500'; // Tailwind class for stroke color
  if (timeLeft <= duration * 0.25) {
    progressColorClass = 'text-red-500';
  } else if (timeLeft <= duration * 0.5) {
    progressColorClass = 'text-yellow-500';
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor" // Use Tailwind's text color for the track
          className="text-gray-300 dark:text-gray-600"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor" // Use Tailwind's text color for the progress
          className={`${progressColorClass} transition-colors duration-500`}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.5s linear' }}
        />
      </svg>
      <div className="absolute text-xl font-bold text-gray-800 dark:text-gray-100">
        {timeLeft}
      </div>
    </div>
  );
};

export default TimerCircle;
