import React from 'react';

const PlayerStatus = ({
  player,
  size = 'normal', // 'small', 'normal', 'large'
  showName = true,
  showScore = false,
  className = '',
}) => {
  if (!player) {
    return null; // Or a placeholder for an empty slot
  }

  const { name, avatarUrl, score } = player;

  const avatarSizes = {
    small: 'w-8 h-8 text-sm',
    normal: 'w-12 h-12 text-base',
    large: 'w-16 h-16 text-lg',
  };

  const nameTextSizes = {
    small: 'text-xs mt-1',
    normal: 'text-sm mt-2',
    large: 'text-base mt-2',
  };

  const scoreTextSizes = {
    small: 'text-xs',
    normal: 'text-sm',
    large: 'text-base',
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return '';
    const words = nameStr.split(' ');
    if (words.length > 1) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`rounded-full ${avatarSizes[size]} flex items-center justify-center bg-creative-purple text-white font-semibold overflow-hidden shadow-md`}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name || 'Player Avatar'} className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {showName && name && (
        <p className={`font-medium text-gray-700 dark:text-gray-300 ${nameTextSizes[size]} text-center truncate w-20 sm:w-24`}>
          {name}
        </p>
      )}
      {showScore && typeof score === 'number' && (
         <p className={`font-bold text-tech-blue dark:text-learning-yellow ${scoreTextSizes[size]}`}>
           {score}
         </p>
      )}
    </div>
  );
};

export default PlayerStatus;
