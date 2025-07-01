import React from 'react';

const GlobalLeaderboard = ({ leaderboardData, loading, error }) => {
  if (loading) {
    return <p>Loading leaderboard...</p>;
  }

  if (error) {
    return <p>Error loading leaderboard: {error}</p>;
  }

  if (!leaderboardData || leaderboardData.length === 0) {
    return <p>No leaderboard data available yet. Play some games!</p>;
  }

  return (
    <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
      <h2>Global Leaderboard</h2>
      <ol>
        {leaderboardData.map((player, index) => (
          <li key={player.discordUserId} style={{ marginBottom: '0.5rem', padding: '0.25rem', background: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
            <span>{index + 1}. </span>
            <strong>{player.username}#{player.discriminator}</strong> -
            Score: {player.totalScore} -
            Games Played: {player.gamesPlayed}
            {/* Avatar: <img src={`https://cdn.discordapp.com/avatars/${player.discordUserId}/${player.avatar}.png?size=32`} alt={player.username} /> */}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default GlobalLeaderboard;
