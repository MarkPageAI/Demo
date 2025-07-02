import React, { useState, useEffect } from 'react';
import BadgePopup from '../components/BadgePopup';
import LevelExperienceBar from '../components/LevelExperienceBar';
import DailyTasks from '../components/DailyTasks';
import { useAuth } from '../hooks/useAuth'; // Changed import path

// Mock Data (replace with API calls later)
const MOCK_USER_PROFILE = {
  name: "PlayerOne",
  avatarUrl: "https://ui-avatars.com/api/?name=PlayerOne&background=random",
  level: 5,
  currentXp: 1250,
  xpToNextLevel: 2000, // This is the total XP needed for level 6
  badges: [
    { id: 'b1', name: 'Quiz Novice', description: 'Completed your first quiz!', iconUrl: 'https://img.icons8.com/color/96/000000/medal2.png' },
    { id: 'b2', name: 'Math Whiz', description: 'Answered 50 Math questions correctly.', iconUrl: 'https://img.icons8.com/color/96/000000/pi.png' },
    { id: 'b3', name: 'Speed Demon', description: 'Answered 10 questions in under 5 seconds each.', iconUrl: 'https://img.icons8.com/color/96/000000/running-rabbit.png' },
  ],
  dailyTasks: [
    { id: 'dt1', name: 'Play 3 Quizzes', description: 'Complete 3 quiz sessions.', type: 'play_quiz', currentProgress: 1, targetProgress: 3, isCompleted: false, isClaimed: false, reward: '50 XP' },
    { id: 'dt2', name: 'Win a Quiz', description: 'Finish 1st in any quiz.', type: 'win_streak', currentProgress: 0, targetProgress: 1, isCompleted: false, isClaimed: false, reward: '100 XP, 1 Gem' },
    { id: 'dt3', name: 'Answer 10 Questions', description: 'Correctly answer 10 questions in total.', type: 'answer_questions', currentProgress: 10, targetProgress: 10, isCompleted: true, isClaimed: false, reward: '75 XP' },
    { id: 'dt4', name: 'Perfect Score', description: 'Get a perfect score in one quiz.', type: 'play_quiz', currentProgress: 0, targetProgress: 1, isCompleted: true, isClaimed: true, reward: '200 XP' },
  ]
};

const ProfilePage = () => {
  const { user } = useAuth(); // Assuming useAuth provides basic user info like name/id
  const [profileData, setProfileData] = useState(MOCK_USER_PROFILE);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [isBadgePopupOpen, setIsBadgePopupOpen] = useState(false);

  // In a real app, fetch profileData based on authenticated user
  useEffect(() => {
    if (user) {
      // Replace with actual API call: apiService.getUserProfile(user.id).then(setProfileData);
      // For now, we can customize mock data slightly if user info is available
      setProfileData(prev => ({
        ...prev,
        name: user.username || prev.name,
        avatarUrl: user.avatar || prev.avatarUrl,
      }));
    }
  }, [user]);

  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge);
    setIsBadgePopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsBadgePopupOpen(false);
    setSelectedBadge(null);
  };

  const handleClaimTask = (taskId) => {
    console.log(`Claiming reward for task: ${taskId}`);
    // Simulate claiming: update task state and potentially user XP/rewards
    setProfileData(prev => ({
      ...prev,
      dailyTasks: prev.dailyTasks.map(task =>
        task.id === taskId ? { ...task, isClaimed: true } : task
      ),
      // Example: Add XP if task has XP reward
      // currentXp: prev.currentXp + (prev.dailyTasks.find(t => t.id === taskId)?.reward.includes('XP') ? parseInt(prev.dailyTasks.find(t => t.id === taskId).reward) : 0)
    }));
    // Potentially show a small notification for claimed reward
  };

  // Simulate unlocking a new badge for demonstration
  useEffect(() => {
    const timer = setTimeout(() => {
        const newBadge = { id: 'b_new', name: 'Welcome Aboard!', description: 'You visited your profile!', iconUrl: 'https://img.icons8.com/fluency/96/confetti.png' };
        // Check if not already shown or part of initial badges to avoid loop
        if (!profileData.badges.find(b => b.id === newBadge.id) && !isBadgePopupOpen) {
            // Add to profileData.badges if you want to persist it on the page
            // setProfileData(prev => ({...prev, badges: [...prev.badges, newBadge]}));
            setSelectedBadge(newBadge);
            setIsBadgePopupOpen(true);
        }
    }, 3000); // Show after 3 seconds
    return () => clearTimeout(timer);
  }, [isBadgePopupOpen, profileData.badges]); // Added dependencies


  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="text-center my-8">
        <img
          src={profileData.avatarUrl}
          alt={`${profileData.name}'s avatar`}
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mx-auto mb-4 border-4 border-creative-purple shadow-lg"
          loading="lazy"
        />
        <h1 className="text-3xl sm:text-4xl font-bold text-tech-blue dark:text-blue-400">
          {profileData.name}'s Profile
        </h1>
      </header>

      <section className="my-6">
        <LevelExperienceBar
          currentLevel={profileData.level}
          currentXp={profileData.currentXp}
          xpToNextLevel={profileData.xpToNextLevel - ((profileData.level -1) * 1000)} // Assuming some logic for base XP per level
          nextLevelThreshold={profileData.xpToNextLevel} // This should be XP needed for *next* level from 0 for that level
        />
      </section>

      <section className="my-10">
        <h2 className="text-2xl font-semibold text-creative-purple mb-4 text-center sm:text-left">My Badges</h2>
        {profileData.badges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {profileData.badges.map(badge => (
              <motion.div
                key={badge.id}
                className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md text-center cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => handleBadgeClick(badge)}
                whileHover={{ y: -5, scale: 1.05 }}
              >
                <img
                  src={badge.iconUrl || `https://ui-avatars.com/api/?name=${badge.name.charAt(0)}&background=F59E0B&color=fff&size=128&font-size=0.5`}
                  alt={badge.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-2"
                  loading="lazy"
                />
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">{badge.name}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center">No badges earned yet. Keep playing!</p>
        )}
      </section>

      <section className="my-10">
        <DailyTasks tasks={profileData.dailyTasks} onClaimTask={handleClaimTask} />
      </section>

      <BadgePopup badge={selectedBadge} isOpen={isBadgePopupOpen} onClose={handleClosePopup} />
    </div>
  );
};

export default ProfilePage;
