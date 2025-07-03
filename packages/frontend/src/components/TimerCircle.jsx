import React from 'react';

const TimerCircle = ({ timeLeft, maxTime }) => {
  const percentage = maxTime > 0 ? (timeLeft / maxTime) * 100 : 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  let strokeColor = 'stroke-steam-yellow'; // Default: Learning Yellow
  if (percentage < 25) {
    strokeColor = 'stroke-red-500'; // Critical: Red
  } else if (percentage < 50) {
    strokeColor = 'stroke-orange-400'; // Warning: Orange
  }


  return (
    <div className="relative w-24 h-24 md:w-32 md:h-32">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        <circle
          className="text-slate-700"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          className={`transition-all duration-500 ease-linear ${strokeColor}`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl md:text-3xl font-bold text-slate-100">
          {timeLeft}
        </span>
      </div>
    </div>
  );
};

export default TimerCircle;
