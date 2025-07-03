import React from 'react';

// Placeholder for an avatar or icon if available
const Avatar = ({ user }) => (
  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-steam-purple flex items-center justify-center text-white font-bold text-lg mr-3 md:mr-4">
    {user && user.username ? user.username.substring(0, 1).toUpperCase() : '?'}
  </div>
);

const PlayerStatus = ({ user, score, isCurrentUser = false }) => {
  return (
    <div
      className={`flex items-center p-3 md:p-4 rounded-lg shadow ${
        isCurrentUser ? 'bg-steam-blue/20 border border-steam-blue' : 'bg-slate-700'
      }`}
    >
      <Avatar user={user} />
      <div className="flex-grow">
        <div className={`text-sm md:text-base font-semibold ${isCurrentUser ? 'text-steam-blue' : 'text-slate-100'}`}>
          {user ? user.username : 'Player'}
          {isCurrentUser && <span className="text-xs text-slate-300"> (You)</span>}
        </div>
        <div className="text-xs md:text-sm text-slate-300">
          Score: {score}
        </div>
      </div>
      {/* Optionally, add a badge or icon for rank if needed */}
    </div>
  );
};

export default PlayerStatus;
