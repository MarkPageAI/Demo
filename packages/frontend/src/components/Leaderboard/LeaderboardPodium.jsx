import React from 'react';
import PlayerStatus from '../Shared/PlayerStatus'; // Adjust path as needed

const PodiumPlace = ({ player, place, placeColor, glowColor }) => {
  if (!player) return <div className="w-full h-24 sm:h-32 md:h-40 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>; // Placeholder for empty spot

  const placeStyles = {
    1: { height: 'h-48 sm:h-56 md:h-64', order: 'order-2 sm:order-1 md:order-2', textSize: 'text-3xl sm:text-4xl', nameSize: 'large' },
    2: { height: 'h-40 sm:h-48 md:h-56', order: 'order-1 sm:order-2 md:order-1', textSize: 'text-2xl sm:text-3xl', nameSize: 'normal' },
    3: { height: 'h-32 sm:h-40 md:h-48', order: 'order-3 sm:order-3 md:order-3', textSize: 'text-xl sm:text-2xl', nameSize: 'normal' },
  };

  const currentStyle = placeStyles[place];

  return (
    <div className={`flex flex-col items-center justify-end ${currentStyle.height} ${currentStyle.order} w-1/3 px-1`}>
      <div className="mb-2 sm:mb-4">
        <PlayerStatus player={player} size={currentStyle.nameSize} showScore={true} />
      </div>
      <div
        className={`w-full p-3 sm:p-4 rounded-t-lg shadow-2xl flex flex-col items-center justify-center text-white font-bold
                    ${placeColor} ${glowColor ? `animate-pulse shadow-${glowColor}-500/80 dark:shadow-${glowColor}-400/80` : ''}`}
        style={{
          boxShadow: glowColor ? `0 0 15px 5px var(--tw-shadow-color, ${glowColor})` : undefined,
          minHeight: place === 1 ? '100px' : place === 2 ? '80px' : '60px', // Ensure some height for the bar itself
        }}
      >
        <span className={`${currentStyle.textSize}`}>{place}</span>
        <span className="text-xs sm:text-sm uppercase tracking-wider">Place</span>
      </div>
    </div>
  );
};


const LeaderboardPodium = ({ topPlayers = [] }) => {
  // Ensure we always have 3 players for layout, fill with null if fewer than 3
  const podiumPlayers = [null, null, null];
  if (topPlayers && topPlayers.length > 0) {
    podiumPlayers[0] = topPlayers.find(p => p.rank === 1) || (topPlayers.length >=1 ? topPlayers[0] : null) ; // Gold
    podiumPlayers[1] = topPlayers.find(p => p.rank === 2) || (topPlayers.length >=2 && topPlayers[0] !== topPlayers[1] ? topPlayers[1] : null); // Silver
    podiumPlayers[2] = topPlayers.find(p => p.rank === 3) || (topPlayers.length >=3 && topPlayers[0] !== topPlayers[2] && topPlayers[1] !== topPlayers[2] ? topPlayers[2] : null); // Bronze
  }

  // A simple way to map player to their actual rank if not provided in player object
  // This assumes topPlayers is sorted by rank or score if rank isn't present
  const rankedPodiumPlayers = [
    { player: podiumPlayers[0], actualPlace: 1, color: 'bg-yellow-500 dark:bg-yellow-400', glow: 'yellow' },
    { player: podiumPlayers[1], actualPlace: 2, color: 'bg-gray-400 dark:bg-gray-500', glow: 'gray' },
    { player: podiumPlayers[2], actualPlace: 3, color: 'bg-yellow-700 dark:bg-yellow-800', glow: 'yellow-700' } // Bronze
  ];


  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-4 sm:p-6 w-full max-w-2xl mx-auto my-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6 sm:mb-8">
        🏆 Top Performers 🏆
      </h2>
      <div className="flex items-end justify-center space-x-1 sm:space-x-2 h-72 sm:h-80 md:h-96">
        {/* Render 2nd place, then 1st, then 3rd for visual podium layout */}
        <PodiumPlace player={rankedPodiumPlayers[1].player} place={2} placeColor={rankedPodiumPlayers[1].color} glowColor={rankedPodiumPlayers[1].glow} />
        <PodiumPlace player={rankedPodiumPlayers[0].player} place={1} placeColor={rankedPodiumPlayers[0].color} glowColor={rankedPodiumPlayers[0].glow} />
        <PodiumPlace player={rankedPodiumPlayers[2].player} place={3} placeColor={rankedPodiumPlayers[2].color} glowColor={rankedPodiumPlayers[2].glow} />
      </div>
    </div>
  );
};

export default LeaderboardPodium;
