import React from 'react';

const TimerCircle = ({ timeLeft, totalTime, size = 100 }) => {
  // timeLeft: seconds remaining
  // totalTime: initial total seconds for the timer
  // size: diameter of the circle in pixels

  const percentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const radius = size / 2 - 5; // 5 is half of strokeWidth to keep circle within bounds
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  let strokeColor = 'stroke-tech-blue'; // Default color
  if (percentage <= 25) {
    strokeColor = 'stroke-red-500'; // Critical time
  } else if (percentage <= 50) {
    strokeColor = 'stroke-learning-yellow'; // Warning time
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-steam-gray-light"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`transition-stroke-dashoffset duration-300 ease-linear ${strokeColor}`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute text-2xl font-bold text-steam-gray-dark">
        {timeLeft}
      </div>
    </div>
  );
};

export default TimerCircle;
