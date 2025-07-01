import React from 'react';

const PlayerList = ({ players, hostId }) => {
  if (!players || players.length === 0) {
    return <p>No players in the room yet.</p>;
  }

  return (
    <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #eee' }}>
      <h4>Players ({players.length}):</h4>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {players.map(player => (
          <li
            key={player.discordUserId}
            style={{
              padding: '0.5rem',
              borderBottom: '1px solid #f0f0f0',
              background: player.discordUserId === hostId ? 'lightgoldenrodyellow' : 'transparent'
            }}
          >
            {/*
            // Can add avatar later if needed and if URLs are reliable
            // <img
            //   src={`https://cdn.discordapp.com/avatars/${player.discordUserId}/${player.avatar}.png?size=32`}
            //   alt={player.username}
            //   style={{ width: '24px', height: '24px', borderRadius: '50%', marginRight: '8px' }}
            // />
            */}
            <strong>{player.username}#{player.discriminator}</strong>
            {player.discordUserId === hostId && ' (Host)'}
            {/* Display score if available, useful for in-game leaderboard */}
            {typeof player.score === 'number' && ` - Score: ${player.score}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;
