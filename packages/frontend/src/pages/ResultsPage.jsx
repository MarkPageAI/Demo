import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import apiService from '../services/api';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// Mock data for demonstration - replace with actual data from location.state or API
const MOCK_RESULTS = {
  name: "Tech Titans Quiz",
  hostId: 'user1',
  players: [
    { id: 'user2', name: 'Alice', username: 'Alice', score: 120, avatarUrl: 'https://ui-avatars.com/api/?name=Alice&background=2563EB&color=fff', avgTime: 5.2, categories: { 'Math': 80, 'Science': 90, 'Tech': 70 } },
    { id: 'user1', name: 'Bob (Host)', username: 'Bob', score: 150, avatarUrl: 'https://ui-avatars.com/api/?name=Bob&background=F59E0B&color=fff', avgTime: 4.5, categories: { 'Math': 95, 'Science': 85, 'Tech': 90 } },
    { id: 'user3', name: 'Charlie', username: 'Charlie', score: 90, avatarUrl: 'https://ui-avatars.com/api/?name=Charlie&background=8B5CF6&color=fff', avgTime: 6.1, categories: { 'Math': 70, 'Science': 60, 'Tech': 80 } },
    { id: 'user4', name: 'Diana', username: 'Diana', score: 110, avatarUrl: 'https://ui-avatars.com/api/?name=Diana&background=10B981&color=fff', avgTime: 5.8, categories: { 'Math': 75, 'Science': 80, 'Tech': 65 } },
    { id: 'user5', name: 'Edward', username: 'Edward', score: 150, avatarUrl: 'https://ui-avatars.com/api/?name=Edward&background=EF4444&color=fff', avgTime: 4.8, categories: { 'Math': 90, 'Science': 90, 'Tech': 85 } },
  ].sort((a, b) => b.score - a.score || a.avgTime - b.avgTime) // Sort by score, then by time
};

const podiumColors = {
  gold: 'bg-yellow-400 dark:bg-yellow-500',
  silver: 'bg-gray-300 dark:bg-gray-400',
  bronze: 'bg-yellow-600 dark:bg-yellow-700',
};

const categoryColors = {
  'Math': '#3B82F6', // tech-blue
  'Science': '#8B5CF6', // creative-purple
  'Tech': '#F59E0B', // learning-yellow
  'Engineering': '#10B981', // Emerald
  'Arts': '#EC4899', // Pink
};


const ResultsPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [finalRoomDetails, setFinalRoomDetails] = useState(location.state?.finalRoomDetails || MOCK_RESULTS); // Use mock for dev
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In a real app, if location.state.finalRoomDetails is null, fetch from API
    if (!location.state?.finalRoomDetails && roomId && import.meta.env.MODE !== 'development') {
      setIsLoading(true);
      apiService.getRoomDetails(roomId) // This endpoint might need to be specific for "finished" room results
        .then(data => {
          if (data.status === 'finished' && data.players) {
            // Ensure players are sorted by score, then by average time if scores are tied
            data.players.sort((a, b) => b.score - a.score || (a.avgTime || Infinity) - (b.avgTime || Infinity));
            setFinalRoomDetails(data);
          } else {
            setError('Quiz results are not available or the quiz is not finished.');
            setFinalRoomDetails(MOCK_RESULTS); // Fallback to mock on error for now
          }
        })
        .catch(err => {
          console.error("Error fetching room results:", err);
          setError(err.message || 'Could not load room results.');
          setFinalRoomDetails(MOCK_RESULTS); // Fallback to mock on error
        })
        .finally(() => setIsLoading(false));
    } else if (location.state?.finalRoomDetails) {
        // If data is passed, ensure it's sorted
        const passedDetails = location.state.finalRoomDetails;
        passedDetails.players.sort((a, b) => b.score - a.score || (a.avgTime || Infinity) - (b.avgTime || Infinity));
        setFinalRoomDetails(passedDetails);
    }
  }, [roomId, location.state]);


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-xl font-semibold text-creative-purple">Loading results...</div>;
  }

  if (error && !finalRoomDetails) { // Only show full error if no data at all
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Error Loading Results</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
        <Link to="/" className="bg-tech-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">
          Go to Homepage
        </Link>
      </div>
    );
  }

  // If error but we have mock/fallback data, we can show a warning but still render
  if (!finalRoomDetails || !finalRoomDetails.players || finalRoomDetails.players.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-bold text-creative-purple mb-4">Quiz Results</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">No result data available for Room ID: {roomId || 'N/A'}.</p>
        <Link to="/" className="bg-tech-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">
          Go to Homepage
        </Link>
      </div>
    );
  }

  const { name: roomName } = finalRoomDetails; // Removed unused 'players'
  const sortedPlayers = finalRoomDetails.players; // Already sorted

  const topPlayers = sortedPlayers.slice(0, 3);
  // const otherPlayers = sortedPlayers.slice(3); // This was unused

  const getPodiumHeight = (index) => {
    if (index === 0) return 'h-48 sm:h-64'; // Gold
    if (index === 1) return 'h-40 sm:h-56'; // Silver
    if (index === 2) return 'h-32 sm:h-48'; // Bronze
    return 'h-24 sm:h-32';
  };

  const getPodiumColorClass = (index) => {
    if (index === 0) return podiumColors.gold;
    if (index === 1) return podiumColors.silver;
    if (index === 2) return podiumColors.bronze;
    return 'bg-gray-200 dark:bg-gray-600';
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-50 dark:bg-gray-900">
      {error && <p className="text-center text-red-500 bg-red-100 dark:bg-red-800 dark:text-red-200 p-3 rounded-md mb-4">Warning: {error}. Displaying available/mock data.</p>}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl sm:text-5xl font-bold text-creative-purple mb-2">
          Quiz Finished: <span className="text-tech-blue">{roomName || 'Untitled Quiz'}</span>!
        </h1>
        <h2 className="text-2xl sm:text-3xl font-semibold text-learning-yellow">Final Leaderboard</h2>
      </motion.div>

      {/* Podium Section */}
      {topPlayers.length > 0 && (
        <motion.div
          className="flex justify-around items-end mb-12 sm:mb-16 px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          {/* Silver (2nd place) - Rendered first for flex order */}
          {topPlayers[1] && (
            <motion.div
              className="flex flex-col items-center mx-1 sm:mx-2 order-2"
              initial={{ opacity:0, y: 50 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.7, type: "spring" }}
            >
              <img
                src={topPlayers[1].avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(topPlayers[1].name)}&size=128`}
                alt={topPlayers[1].name}
                className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-4 border-gray-400 dark:border-gray-500 mb-2 shadow-lg"
                loading="lazy"
              />
              <p className="text-sm sm:text-lg font-semibold text-gray-700 dark:text-gray-200">{topPlayers[1].name}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Score: {topPlayers[1].score}</p>
              <div
                className={`w-20 sm:w-32 ${getPodiumHeight(1)} ${getPodiumColorClass(1)} rounded-t-lg shadow-xl flex items-center justify-center text-2xl sm:text-4xl font-bold text-white relative overflow-hidden`}
              >
                <span className="z-10">2</span>
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-white opacity-20 rounded-full transform rotate-45"></div>
              </div>
            </motion.div>
          )}

          {/* Gold (1st place) */}
          {topPlayers[0] && (
             <motion.div
              className="flex flex-col items-center mx-1 sm:mx-2 order-1" // Central item
              initial={{ opacity:0, y: 50 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.5, type: "spring", stiffness: 120 }}
            >
              <div className="relative mb-2">
                <img
                  src={topPlayers[0].avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(topPlayers[0].name)}&size=128`}
                  alt={topPlayers[0].name}
                  className="w-20 h-20 sm:w-32 sm:h-32 rounded-full border-4 border-yellow-400 dark:border-yellow-500 shadow-2xl"
                  loading="lazy"
                />
                <span className="absolute -top-2 -right-2 text-2xl sm:text-3xl animate-bounce">🏆</span>
              </div>
              <p className="text-base sm:text-xl font-bold text-gray-800 dark:text-gray-100">{topPlayers[0].name}</p>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Score: {topPlayers[0].score}</p>
              <div
                className={`w-24 sm:w-40 ${getPodiumHeight(0)} ${getPodiumColorClass(0)} rounded-t-lg shadow-2xl flex items-center justify-center text-3xl sm:text-5xl font-bold text-white relative overflow-hidden`}
                style={{ boxShadow: '0 0 20px 5px rgba(250, 204, 21, 0.7)' }} // Gold glow
              >
                <span className="z-10">1</span>
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="absolute -top-6 -left-6 w-20 h-20 bg-white opacity-20 rounded-full transform rotate-45"></div>
              </div>
            </motion.div>
          )}

          {/* Bronze (3rd place) */}
          {topPlayers[2] && (
            <motion.div
              className="flex flex-col items-center mx-1 sm:mx-2 order-3"
              initial={{ opacity:0, y: 50 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.9, type: "spring" }}
            >
              <img
                src={topPlayers[2].avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(topPlayers[2].name)}&size=128`}
                alt={topPlayers[2].name}
                className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-4 border-yellow-700 dark:border-yellow-800 mb-2 shadow-lg"
                loading="lazy"
              />
              <p className="text-sm sm:text-lg font-semibold text-gray-700 dark:text-gray-200">{topPlayers[2].name}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Score: {topPlayers[2].score}</p>
              <div
                className={`w-20 sm:w-32 ${getPodiumHeight(2)} ${getPodiumColorClass(2)} rounded-t-lg shadow-xl flex items-center justify-center text-2xl sm:text-4xl font-bold text-white relative overflow-hidden`}
              >
                 <span className="z-10">3</span>
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-white opacity-20 rounded-full transform rotate-45"></div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Detailed Player List */}
      <motion.div
        className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-4 sm:p-6 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: topPlayers.length > 0 ? 1.2 : 0.3, duration: 0.5 }}
      >
        <h3 className="text-xl sm:text-2xl font-semibold text-creative-purple mb-4">Full Standings</h3>
        <ul className="space-y-3">
          {sortedPlayers.map((player, index) => (
            <motion.li
              key={player.id || player.discordUserId || index}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (topPlayers.length > 0 ? 1.2 : 0.3) + index * 0.1 }}
              className={`flex items-center p-3 rounded-lg transition-colors duration-150 ease-in-out
                          ${index < 3 ? 'font-semibold ' + getPodiumColorClass(index) + ' text-gray-900 dark:text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              <span className={`mr-3 font-bold text-sm sm:text-base w-6 text-center ${index < 3 ? '' : 'text-tech-blue'}`}>
                {index + 1}.
              </span>
              <img
                src={player.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name || player.username)}&size=64`}
                alt={player.name || player.username}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-3 border-2 border-gray-300 dark:border-gray-600"
                loading="lazy"
              />
              <span className={`flex-grow text-sm sm:text-base ${index < 3 ? 'text-gray-800 dark:text-gray-50' : 'text-gray-700 dark:text-gray-200'}`}>
                {player.name || player.username}
                {player.id === finalRoomDetails.hostId && <span className="text-xs ml-1">(Host)</span>}
              </span>
              <span className={`text-sm sm:text-base font-bold ${index < 3 ? 'text-gray-800 dark:text-gray-50' : 'text-learning-yellow'}`}>
                {player.score} pts
              </span>
              {player.avgTime && (
                <span className={`ml-2 sm:ml-4 text-xs sm:text-sm ${index < 3 ? 'text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                  Avg: {player.avgTime.toFixed(1)}s
                </span>
              )}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Performance by Category (Placeholder/Example) */}
      {sortedPlayers.find(p => p.categories) && ( // Check if category data exists
        <motion.div
          className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-4 sm:p-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (topPlayers.length > 0 ? 1.5 : 0.6), duration: 0.5 }}
        >
          <h3 className="text-xl sm:text-2xl font-semibold text-creative-purple mb-6">Performance by Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPlayers.filter(p => p.categories).map(player => (
              <div key={player.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow">
                <div className="flex items-center mb-3">
                  <img
                    src={player.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name || player.username)}&size=64`}
                    alt={player.name}
                    className="w-8 h-8 rounded-full mr-2"
                    loading="lazy"
                  />
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100">{player.name || player.username}</h4>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={Object.entries(player.categories).map(([name, value]) => ({ name, value }))} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.3}/>
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(val) => `${val}%`} style={{ fontSize: '0.75rem' }}/>
                    <YAxis dataKey="name" type="category" width={60} style={{ fontSize: '0.75rem' }}/>
                    <Tooltip
                        formatter={(val) => `${val}%`} // Changed 'value' to 'val' to avoid conflict if any, though original was likely fine
                        cursor={{fill: 'rgba(200,200,200,0.2)'}}
                        contentStyle={{backgroundColor: 'rgba(30,41,59,0.8)', border: 'none', borderRadius: '0.5rem', color: '#fff', fontSize: '0.8rem'}}
                    />
                    <Bar dataKey="value" barSize={15} radius={[0, 5, 5, 0]}>
                        {Object.entries(player.categories).map(([name], index) => ( // Removed unused 'value' from map destructuring
                            <Cell key={`cell-${index}`} fill={categoryColors[name] || '#8884d8'} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </motion.div>
      )}


      <motion.div
        className="text-center mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: (topPlayers.length > 0 ? 1.8 : 0.9), duration: 0.5 }}
      >
        <button
          onClick={() => navigate('/')}
          className="bg-tech-blue hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors shadow-md hover:shadow-lg mr-4"
        >
          Back to Home
        </button>
        <button
          onClick={() => navigate('/')} // Placeholder for "Play Another Game"
          className="bg-learning-yellow hover:bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors shadow-md hover:shadow-lg"
        >
          Play Another Game
        </button>
      </motion.div>
    </div>
  );
};

export default ResultsPage;
