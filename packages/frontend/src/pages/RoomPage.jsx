import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Changed import path
import apiService from '../services/api';
import websocketService from '../services/websocket';
import PlayerList from '../components/PlayerList';
// import QuestionDisplay from '../components/QuestionDisplay'; // Will be replaced by QuestionCard and AnswerOption
import QuestionCard from '../components/QuestionCard';
import AnswerOption from '../components/AnswerOption';
import TimerCircle from '../components/TimerCircle';
import PlayerStatus from '../components/PlayerStatus';
import WaitingRoomInfo from '../components/WaitingRoomInfo'; // <-- Import new component
// import InGameLeaderboard from '../components/InGameLeaderboard';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

// Mock data for current question
const MOCK_QUESTION = {
  id: 'q1',
  text: 'What is the powerhouse of the cell?',
  choices: [
    { id: 'c1', text: 'Nucleus' },
    { id: 'c2', text: 'Ribosome' },
    { id: 'c3', text: 'Mitochondria' },
    { id: 'c4', text: 'Endoplasmic Reticulum' },
  ],
  correctChoiceId: 'c3', // Example, will be revealed later
};

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [roomDetails, setRoomDetails] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(MOCK_QUESTION); // Initialize with mock data for now
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [questionMeta, setQuestionMeta] = useState({ number: 1, total: 10, startTime: Date.now(), endTime: Date.now() + 30000 }); // Mock meta
  const [isLoading, setIsLoading] = useState(false); // Set to false as we use mock data initially
  const [error, setError] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState(null); // For countdown

  // Fetch initial room details
  const fetchRoomDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getRoomDetails(roomId);
      setRoomDetails(data);
      // If quiz is already in progress, try to fetch current question
      if (data.status === 'playing' && data.roomState === 'question_displayed') {
        fetchCurrentQuestion();
      }
    } catch (err) {
      console.error("Failed to fetch room details:", err);
      setError(err.message || 'Failed to load room. It might not exist or you may not have access.');
      // Consider redirecting if room not found or critical error
      if (err.message.toLowerCase().includes('not found')) {
        setTimeout(() => navigate('/'), 3000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [roomId, navigate, fetchCurrentQuestion]); // Added fetchCurrentQuestion

  // Fetch current question if quiz is active
  const fetchCurrentQuestion = useCallback(async () => {
    try {
      const data = await apiService.getCurrentQuestion(roomId);
      setCurrentQuestion(data.question);
      setQuestionMeta({
        number: data.questionNumber,
        total: data.totalQuestions,
        startTime: data.questionStartTime,
        endTime: data.questionEndTime,
      });
    } catch (err) {
      console.warn("Failed to fetch current question (it might not be active yet):", err.message);
      setCurrentQuestion(null); // No active question
    }
  }, [roomId]);


  // WebSocket message handler
  const handleWebSocketMessage = useCallback((message) => {
    console.log("RoomPage received WebSocket message:", message);
    if (message.payload && message.payload.roomId !== roomId) {
      // Message is not for this room, ignore (should be filtered by server subscription ideally)
      return;
    }

    switch (message.event) {
      case 'room_updated':
        setRoomDetails(prevDetails => ({ ...prevDetails, ...message.payload }));
        // If room status changes to 'waiting' and it was 'countdown', clear timer
        if (message.payload.status === 'waiting' && roomDetails?.status === 'countdown') {
          setTimeUntilStart(null);
        }
        console.log("Room details updated via WebSocket:", message.payload);
        break;
      case 'quiz_starting_countdown': // New event for countdown
        setRoomDetails(prevDetails => ({ ...prevDetails, status: 'countdown', roomState: 'countdown' }));
        setTimeUntilStart(message.payload.duration); // e.g., 5 seconds
        console.log("Quiz starting countdown received:", message.payload);
        break;
      case 'new_question':
        setRoomDetails(prevDetails => ({
            ...prevDetails,
            status: 'playing',
            roomState: 'question_displayed',
            currentQuestionIndex: message.payload.questionNumber -1,
            players: message.payload.players // Ensure players list (with scores) is updated
        }));
        setCurrentQuestion(message.payload.question);
        setQuestionMeta({
          number: message.payload.questionNumber,
          total: message.payload.totalQuestions,
          startTime: message.payload.questionStartTime,
          endTime: message.payload.questionEndTime,
        });
        console.log("New question received via WebSocket:", message.payload.question);
        break;
      case 'answer_reveal':
        setRoomDetails(prevDetails => ({
            ...prevDetails,
            roomState: 'answer_revealed',
            players: message.payload.players // Update players with new scores
        }));
        // Update currentQuestion to include correctChoiceId for display
        setCurrentQuestion(prevQ => prevQ ? ({ ...prevQ, correctChoiceId: message.payload.correctChoiceId, serverAnswers: message.payload.players }) : null);
        console.log("Answer reveal received via WebSocket:", message.payload);
        break;
      case 'quiz_finished':
        setRoomDetails(prevDetails => ({ ...prevDetails, status: 'finished', roomState: 'finished', players: message.payload.players }));
        setCurrentQuestion(null); // No more questions
        console.log("Quiz finished event received. Navigating to results.");
        // Pass final room state to results page
        navigate(`/results/${roomId}`, { state: { finalRoomDetails: {...roomDetails, players: message.payload.players, status: 'finished', roomState: 'finished'} } });
        break;
      case 'error':
        setError(message.payload.message || 'An error occurred via WebSocket.');
        break;
      default:
        console.log("Unhandled WebSocket event:", message.event);
    }
  }, [roomId, navigate, roomDetails]); // roomDetails in dependency for navigate state

  // Effect for initial data load and WebSocket setup
  useEffect(() => {
    // Keep WebSocket logic, but adjust for mock data if needed for development
    if (import.meta.env.MODE === 'development' && !roomId) {
      // Simulate room details for development without backend
      setRoomDetails({
        name: 'Mock Development Room',
        status: 'playing', // Simulate quiz in progress
        roomState: 'question_displayed',
        players: [{ id: 'user1', name: 'Dev Player 1', score: 0, avatarUrl: null, isHost: true }],
        hostId: 'user1',
      });
      setCurrentQuestion(MOCK_QUESTION); // Ensure mock question is set
      setIsLoading(false);
      return; // Skip WebSocket setup if in dev with no roomId
    }

    if (!roomId) {
      navigate('/');
      return;
    }

    fetchRoomDetails();
    websocketService.connect();
    websocketService.addMessageListener(handleWebSocketMessage);

    const wsSubTimeout = setTimeout(() => {
      if (websocketService.getSocket()?.readyState === WebSocket.OPEN && user) {
        websocketService.sendMessage({
          action: 'subscribe_room',
          payload: { roomId, discordUserId: user.id, username: user.username },
        });
      } else {
        console.warn("WebSocket not open or user not available for subscription.");
      }
    }, 500);

    return () => {
      websocketService.removeMessageListener(handleWebSocketMessage);
      websocketService.disconnect();
      clearTimeout(wsSubTimeout);
    };
  }, [roomId, fetchRoomDetails, handleWebSocketMessage, navigate, user]); // Added user to dependencies

  // Effect for countdown timer
  useEffect(() => {
    if (timeUntilStart === null || timeUntilStart <= 0) return;

    const timerId = setInterval(() => {
      setTimeUntilStart(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerId);
          // The 'new_question' event from WebSocket should take over
          // or if client-driven, transition to quiz start here
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeUntilStart]);

  const handleStartQuiz = async () => {
    if (!roomDetails || !user || roomDetails.hostId !== user.id) {
      alert("You are not the host or room details are not loaded.");
      return;
    }
    try {
      setActionMessage('Starting quiz...');
      await apiService.startQuiz(roomId);
      // Server will broadcast 'new_question', no need to set state here directly for that
      setActionMessage('Quiz start signal sent!');
    } catch (err) {
      console.error("Failed to start quiz:", err);
      setError(err.message || 'Failed to start quiz.');
      setActionMessage(`Error starting quiz: ${err.message}`);
    }
  };

  const [actionMessage, setActionMessage] = useState(''); // For start/leave room messages

  const handleLeaveRoom = async () => {
    setIsLeaving(true);
    setActionMessage('Leaving room...');
    try {
      await apiService.leaveRoom(roomId);
      // No need to update state, just navigate away
      navigate('/');
    } catch (err) {
      console.error("Failed to leave room:", err);
      setError(err.message || 'Failed to leave room.');
      setActionMessage(`Error leaving room: ${err.message}`);
      setIsLeaving(false);
    }
  };

  const handleSubmitAnswer = async (choiceId) => {
    if (!currentQuestion || isAnswerRevealed) return;

    setSelectedAnswer(choiceId); // Visually mark selection immediately

    // Simulate revealing answer after a short delay for mock environment
    if (import.meta.env.MODE === 'development' && !roomId) {
      setTimeout(() => {
        setIsAnswerRevealed(true);
        // Simulate next question after another delay
        setTimeout(() => {
          setIsAnswerRevealed(false);
          setSelectedAnswer(null);
          // Cycle through mock questions or show a "quiz finished" message
          // For now, just reset to the same question for simplicity
          setCurrentQuestion({ ...MOCK_QUESTION, id: `q${Date.now()}` }); // New key to force re-render if needed
          setQuestionMeta(prev => ({ ...prev, number: prev.number + 1, startTime: Date.now(), endTime: Date.now() + 30000 }));
        }, 3000); // Time to see revealed answer
      }, 1000); // Time to see selection
      return;
    }

    // Real submission logic
    try {
        await apiService.submitAnswer(roomId, choiceId);
        // Server will broadcast 'answer_reveal' which updates UI state
        console.log(`Answer ${choiceId} submitted for question ${currentQuestion.id}`);
    } catch (error) {
        console.error("Error submitting answer:", error);
        alert(`Failed to submit answer: ${error.message}`);
        setSelectedAnswer(null); // Revert optimistic UI update on error
    }
  };

  const handleTimeUp = () => {
    console.log("Time is up!");
    if (import.meta.env.MODE === 'development' && !roomId) {
      setIsAnswerRevealed(true); // Show correct answer
       setTimeout(() => {
          setIsAnswerRevealed(false);
          setSelectedAnswer(null);
          setCurrentQuestion({ ...MOCK_QUESTION, id: `q${Date.now()}` });
          setQuestionMeta(prev => ({ ...prev, number: prev.number + 1, startTime: Date.now(), endTime: Date.now() + 30000 }));
        }, 3000);
    }
    // In a real scenario, the server would likely handle time up and broadcast next state.
    // If client needs to do something, like auto-submitting null, it would go here.
  };


  if (authLoading || isLoading) {
    return <div className="flex justify-center items-center h-screen"><p className="text-xl">Loading room information...</p></div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error} <button onClick={() => navigate('/')} className="ml-2 bg-tech-blue text-white px-3 py-1 rounded">Go Home</button></div>;
  }

  if (!roomDetails) {
    return <div className="flex justify-center items-center h-screen"><p className="text-xl">Room not found or still loading.</p> <button onClick={fetchRoomDetails} className="ml-2 bg-creative-purple text-white px-3 py-1 rounded">Retry Load</button></div>;
  }

  const isHost = isAuthenticated && user && roomDetails.hostId === user.id;
  const isWaitingOrCountdown = roomDetails.status === 'waiting' || roomDetails.status === 'countdown';
  const quizInProgress = roomDetails.status === 'playing' && currentQuestion;

  // Animation variants for Framer Motion
  const questionVariants = {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
  };

  const optionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
      },
    }),
  };


  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-creative-purple mb-1">Room: {roomDetails.name}
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">(ID: {roomId || 'DEV'})</span>
        </h2>
        <p className="text-gray-700 dark:text-gray-300">Status: <strong className="text-tech-blue">{roomDetails.status}</strong> | Quiz State: <strong className="text-learning-yellow">{roomDetails.roomState}</strong></p>
        {actionMessage && <p className={`mt-2 ${actionMessage.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>{actionMessage}</p>}
      </div>

      {/* PlayerStatus example - can be mapped for all players or just current user */}
      {user && roomDetails.players && !isWaitingOrCountdown && roomDetails.players.find(p => p.id === user.id) && (
        <div className="my-4">
           <PlayerStatus player={roomDetails.players.find(p => p.id === user.id) || { name: user.username, score: 0, avatarUrl: user.avatar }} />
        </div>
      )}

      {isWaitingOrCountdown && (
        <WaitingRoomInfo
          roomStatus={roomDetails.status}
          isHost={isHost}
          onStartQuiz={handleStartQuiz} // Pass handleStartQuiz
          timeUntilStart={timeUntilStart}
        />
      )}

      {/* PlayerList: Display in waiting/countdown, or as a sidebar during quiz */}
      {(isWaitingOrCountdown || quizInProgress) && roomDetails.players && (
         <div className={`mt-6 ${quizInProgress ? 'lg:w-1/4 lg:fixed lg:right-0 lg:top-1/4 px-4' : ''}`}>
            <PlayerList players={roomDetails.players} hostId={roomDetails.hostId} />
         </div>
      )}

      <div className="my-6 text-center"> {/* Centered leave button */}
        { /* Only show Start Quiz button in WaitingRoomInfo now */ }
        <button
          onClick={handleLeaveRoom}
          disabled={isLeaving}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow hover:shadow-md"
        >
          {isLeaving ? 'Leaving...' : 'Leave Room'}
        </button>
      </div>

      {quizInProgress && (
        <motion.div
          key={currentQuestion.id} // Important for re-triggering animation on question change
          variants={questionVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.5 }}
          className={`bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 mt-6 ${quizInProgress ? 'lg:mr-[27%]' : ''}`} // Merged classNames
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-tech-blue">
              Question {questionMeta.number} of {questionMeta.total}
            </h3>
            <TimerCircle
              key={currentQuestion.id + questionMeta.startTime} // Re-create timer if question or start time changes
              duration={Math.max(0, Math.floor((new Date(questionMeta.endTime).getTime() - Date.now()) / 1000))}
              onTimeUp={handleTimeUp}
            />
          </div>

          <QuestionCard question={currentQuestion} />

          <div className="mt-4 space-y-3">
            {currentQuestion.choices.map((option, index) => (
              <motion.div key={option.id} custom={index} variants={optionVariants} initial="hidden" animate="visible">
                <AnswerOption
                  option={option}
                  onSelect={() => handleSubmitAnswer(option.id)}
                  isSelected={selectedAnswer === option.id}
                  isCorrect={option.id === currentQuestion.correctChoiceId}
                  isRevealed={isAnswerRevealed}
                />
              </motion.div>
            ))}
          </div>

          {isAnswerRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-yellow-100 dark:bg-yellow-700 rounded-lg"
            >
              <h4 className="text-lg font-semibold text-learning-yellow">Answer Revealed!</h4>
              <p className="text-gray-800 dark:text-gray-200">
                Correct Answer was: {currentQuestion.choices.find(c => c.id === currentQuestion.correctChoiceId)?.text}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* In-game leaderboard or simplified player list could go here if needed during quiz */}
      {quizInProgress && roomDetails.players && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-creative-purple mb-2">Players</h3>
          <PlayerList players={roomDetails.players} hostId={roomDetails.hostId} />
        </div>
      )}

    </div>
  );
};

export default RoomPage;
