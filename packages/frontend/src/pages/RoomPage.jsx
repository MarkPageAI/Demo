import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import websocketService from '../services/websocket';
// import PlayerList from '../components/PlayerList'; // To be replaced or refactored
// import QuestionDisplay from '../components/QuestionDisplay'; // To be replaced

// New Components
import PlayerStatus from '../components/PlayerStatus';
import TimerCircle from '../components/TimerCircle';
import QuestionCard from '../components/QuestionCard';
import AnswerOption from '../components/AnswerOption';
import { motion, AnimatePresence } from 'framer-motion'; // Import Framer Motion


const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [roomDetails, setRoomDetails] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionMeta, setQuestionMeta] = useState({ number: 0, total: 0, startTime: null, endTime: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [selectedAnswerId, setSelectedAnswerId] = useState(null); // For user's current selection

  // Timer states for question countdown
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTimeForQuestion, setTotalTimeForQuestion] = useState(0);

  // States for correct answer celebration pause
  const CORRECT_ANSWER_PAUSE_DURATION = 5; // seconds, configurable
  const [isCelebratingCorrectAnswer, setIsCelebratingCorrectAnswer] = useState(false);
  const [celebrationCountdown, setCelebrationCountdown] = useState(CORRECT_ANSWER_PAUSE_DURATION);
  const [nextQuestionData, setNextQuestionData] = useState(null); // Stores next question if it arrives during celebration

  // STEAM Tips
  const steamTips = [
    "STEAM stands for Science, Technology, Engineering, Arts, and Mathematics.",
    "The 'A' in STEAM emphasizes creativity and design thinking.",
    "Coding is a fundamental skill in many STEAM fields.",
    "The Mars Rover 'Perseverance' uses advanced robotics and AI, core STEAM concepts.",
    "3D printing is a STEAM technology that allows for rapid prototyping.",
    "Biotechnology combines biology and technology to create new products.",
    "Data science involves extracting insights from large datasets using STEAM skills.",
    "Renewable energy technologies like solar and wind power are key areas of STEAM innovation.",
    "The Fibonacci sequence appears surprisingly often in nature and art.",
    "Game development often requires a blend of programming, art, and physics."
  ];
  const [currentSteamTip, setCurrentSteamTip] = useState('');

  useEffect(() => {
    if (roomDetails?.status === 'waiting') {
      setCurrentSteamTip(steamTips[Math.floor(Math.random() * steamTips.length)]);
    }
  }, [roomDetails?.status]);


  useEffect(() => {
    let timerInterval;
    if (questionMeta.startTime && questionMeta.endTime && roomDetails?.roomState === 'question_displayed') {
      const startTimeMs = new Date(questionMeta.startTime).getTime();
      const endTimeMs = new Date(questionMeta.endTime).getTime();
      const totalDuration = Math.max(0, Math.round((endTimeMs - startTimeMs) / 1000));
      setTotalTimeForQuestion(totalDuration);

      const updateTimer = () => {
        const nowMs = Date.now();
        const remaining = Math.max(0, Math.round((endTimeMs - nowMs) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) {
          clearInterval(timerInterval);
          // Optionally trigger auto-submit or timeout logic here if needed
        }
      };
      updateTimer(); // Initial call
      timerInterval = setInterval(updateTimer, 1000);
    } else {
      setTimeLeft(0); // Reset timer when no question or not in question_displayed state
      setTotalTimeForQuestion(0);
    }
    return () => clearInterval(timerInterval);
  }, [questionMeta.startTime, questionMeta.endTime, roomDetails?.roomState]);


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
  }, [roomId, navigate]);

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
        console.log("Room details updated via WebSocket:", message.payload);
        break;
      case 'new_question':
        console.log("[RoomPage] handleWebSocketMessage: Received 'new_question' event. Payload:", JSON.stringify(message.payload, null, 2));
        if (isCelebratingCorrectAnswer) {
          console.log("[RoomPage] Currently celebrating correct answer, deferring next question.");
          setNextQuestionData(message.payload);
        } else {
          setIsLoading(false); // Stop loading indicator shown by handleStartQuiz
          setRoomDetails(prevDetails => ({
              ...prevDetails,
              status: 'playing',
              roomState: 'question_displayed',
              currentQuestionIndex: message.payload.questionNumber - 1,
              players: message.payload.players
          }));
          setCurrentQuestion(message.payload.question);
          setQuestionMeta({
            number: message.payload.questionNumber,
            total: message.payload.totalQuestions,
            startTime: message.payload.questionStartTime,
            endTime: message.payload.questionEndTime,
          });
          setSelectedAnswerId(null); // Reset selection for the new question
          setActionMessage(''); // Clear previous messages
          console.log("New question set:", message.payload.question);
        }
        break;
      case 'answer_reveal':
        console.log("Answer reveal received via WebSocket:", message.payload);
        const { players: updatedPlayers, correctChoiceId } = message.payload;

        setRoomDetails(prevDetails => ({
            ...prevDetails,
            roomState: 'answer_revealed',
            players: updatedPlayers
        }));
        setCurrentQuestion(prevQ => prevQ ? ({ ...prevQ, correctChoiceId: correctChoiceId, serverAnswers: updatedPlayers }) : null);

        // Check if the current user answered correctly
        const currentUserPlayer = updatedPlayers.find(p => p.id === user?.id);
        const previousPlayerState = roomDetails?.players.find(p => p.id === user?.id);

        // A simple way to check if score increased. More robust would be to check if selectedAnswerId === correctChoiceId
        // This assumes scores only increase on correct answers.
        const answeredCorrectly = selectedAnswerId === correctChoiceId;

        if (answeredCorrectly) {
          console.log("[RoomPage] User answered correctly! Starting celebration pause.");
          setIsCelebratingCorrectAnswer(true);
          setCelebrationCountdown(CORRECT_ANSWER_PAUSE_DURATION);
        }
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
    if (!roomId) {
      navigate('/'); // Should not happen if routes are correct
      return;
    }

    fetchRoomDetails();

    websocketService.connect(); // Connect WebSocket
    websocketService.addMessageListener(handleWebSocketMessage);

    // Subscribe to room events after connection is likely established
    // A small delay or onopen callback in websocketService might be more robust
    const wsSubTimeout = setTimeout(() => {
        if (websocketService.getSocket() && websocketService.getSocket().readyState === WebSocket.OPEN && user) {
            websocketService.sendMessage({
              action: 'subscribe_room',
              payload: {
                roomId: roomId,
                discordUserId: user.id,
                username: user.username
              }
            });
        } else {
            console.warn("WebSocket not open or user not available when attempting to subscribe.");
        }
    }, 500);

    return () => {
      websocketService.removeMessageListener(handleWebSocketMessage);
      // Consider whether to disconnect globally or manage subscriptions more granularly
      // For instance, if user navigates between rooms without full page reload.
      // websocketService.disconnect();
      clearTimeout(wsSubTimeout);
    };
  }, [roomId, fetchRoomDetails, handleWebSocketMessage, navigate, user]); // Added user to dependencies


  const handleStartQuiz = async () => {
    if (!roomDetails || !user || roomDetails.hostId !== user.id) {
      alert("You are not the host or room details are not loaded.");
      return;
    }
    try {
      setActionMessage('Attempting to start quiz...');
      console.log(`[RoomPage] handleStartQuiz: Attempting to start quiz for room ${roomId}`);
      // Optimistically update UI to show quiz is starting
      setRoomDetails(prev => ({ ...prev, status: 'playing', roomState: 'starting' }));
      setIsLoading(true); // Show a general loading indicator for this async action

      await apiService.startQuiz(roomId);

      console.log(`[RoomPage] handleStartQuiz: startQuiz API call successful for room ${roomId}. Waiting for new_question event.`);
      setActionMessage('Quiz start signal sent! Waiting for the first question...');
      // setIsLoading(false); // Keep loading until new_question arrives or timeout
    } catch (err) {
      console.error("[RoomPage] handleStartQuiz: Failed to start quiz API call:", err);
      setRoomDetails(prev => ({ ...prev, status: 'waiting', roomState: 'waiting' })); // Revert optimistic update
      setIsLoading(false);
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
    if (!currentQuestion || selectedAnswerId || roomDetails?.roomState !== 'question_displayed') return;

    setSelectedAnswerId(choiceId); // Mark as selected to prevent re-submission & for UI update
    try {
        await apiService.submitAnswer(roomId, choiceId);
        // Feedback will primarily come via WebSocket 'answer_reveal'
        console.log(`Answer ${choiceId} submitted for question ${currentQuestion.id}`);
        // Optionally, give immediate local feedback:
        // setActionMessage("Answer submitted! Waiting for results...");
    } catch (error) {
        console.error("Error submitting answer:", error);
        setActionMessage(`Failed to submit answer: ${error.message}`);
        setSelectedAnswerId(null); // Allow re-submission if API call failed
    }
  };

  // Reset selectedAnswerId when a new question arrives (and not celebrating)
  useEffect(() => {
    if (roomDetails?.roomState === 'question_displayed' && !isCelebratingCorrectAnswer) {
      setSelectedAnswerId(null);
      setActionMessage(''); // Clear previous messages
    }
  }, [currentQuestion?.id, roomDetails?.roomState, isCelebratingCorrectAnswer]);

  // useEffect for celebration countdown
  useEffect(() => {
    if (isCelebratingCorrectAnswer && celebrationCountdown > 0) {
      const timer = setTimeout(() => {
        setCelebrationCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isCelebratingCorrectAnswer && celebrationCountdown === 0) {
      setIsCelebratingCorrectAnswer(false);
      setCelebrationCountdown(CORRECT_ANSWER_PAUSE_DURATION); // Reset for next time
      if (nextQuestionData) {
        console.log("[RoomPage] Celebration ended, processing deferred next question:", nextQuestionData);
        // Manually trigger the new question logic with stored data
        // This replicates the 'new_question' case but without relying on another WebSocket message
        setIsLoading(false);
        setRoomDetails(prevDetails => ({
            ...prevDetails,
            status: 'playing',
            roomState: 'question_displayed',
            currentQuestionIndex: nextQuestionData.questionNumber - 1,
            players: nextQuestionData.players
        }));
        setCurrentQuestion(nextQuestionData.question);
        setQuestionMeta({
          number: nextQuestionData.questionNumber,
          total: nextQuestionData.totalQuestions,
          startTime: nextQuestionData.questionStartTime,
          endTime: nextQuestionData.questionEndTime,
        });
        setSelectedAnswerId(null);
        setActionMessage('');
        setNextQuestionData(null); // Clear the stored data
      } else {
        // If no next question was pending, it might mean the quiz ended or waiting for server.
        // If roomState is still 'answer_revealed', it will show the revealed answers.
        // If server sends 'quiz_finished' or another 'new_question' later, that will be handled.
        console.log("[RoomPage] Celebration ended, no pending next question data.");
      }
    }
  }, [isCelebratingCorrectAnswer, celebrationCountdown, nextQuestionData, roomDetails?.players]);


  if (authLoading || isLoading) {
    return <div className="flex justify-center items-center h-screen"><p className="text-xl text-steam-gray-dark">Loading room information...</p></div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error} <button onClick={() => navigate('/')} className="ml-2 p-2 bg-tech-blue text-white rounded">Go Home</button></div>;
  }

  if (!roomDetails) {
    return <div className="p-4 text-center">Room not found or still loading. <button onClick={fetchRoomDetails} className="ml-2 p-2 bg-creative-purple text-white rounded">Retry Load</button></div>;
  }

  const isHost = isAuthenticated && user && roomDetails.hostId === user.id;
  const showQuizArea = roomDetails.status === 'playing' && currentQuestion && roomDetails.roomState === 'question_displayed';
  const showAnswerRevealDisplay = roomDetails.roomState === 'answer_revealed' && currentQuestion && currentQuestion.correctChoiceId;

  // Logging before render
  console.log(`[RoomPage] Rendering:
    isLoading: ${isLoading}, authLoading: ${authLoading}, error: ${error},
    roomDetails.status: ${roomDetails?.status}, roomDetails.roomState: ${roomDetails?.roomState},
    currentQuestion ID: ${currentQuestion?.id}, currentQuestion text: ${currentQuestion?.text?.substring(0,20)},
    questionMeta number: ${questionMeta?.number},
    showQuizArea: ${showQuizArea}, showAnswerRevealDisplay: ${showAnswerRevealDisplay},
    isCelebrating: ${isCelebratingCorrectAnswer}`);

  const showAnimatedBg = showQuizArea && !isCelebratingCorrectAnswer;

  return (
    <div className={`container mx-auto p-4 min-h-screen ${showAnimatedBg ? 'quiz-active-background' : ''}`}>
      <div className="mb-6 p-4 bg-surface dark:bg-slate-800 shadow-md rounded-lg border border-border dark:border-slate-700">
        <h2 className="text-3xl font-bold text-tech-blue dark:text-blue-400">Room: {roomDetails.name}
          <span className="text-sm text-text-muted dark:text-slate-400 ml-2">(ID: {roomId})</span>
        </h2>
        <p className="text-creative-purple dark:text-purple-400">Status: <strong className="font-semibold">{roomDetails.status}</strong> | Quiz State: <strong className="font-semibold">{roomDetails.roomState}</strong></p>
        {actionMessage && <p className={`mt-2 text-sm ${actionMessage.startsWith('Error') ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{actionMessage}</p>}
      </div>

      {/* Changed to md:grid-cols-4 to give more space to quiz area on medium+ screens */}
      <div className="grid md:grid-cols-4 gap-6">
        {/* Players Section - now takes 1/4 on md+ screens */}
        <div className="md:col-span-1 space-y-3">
          <h3 className="text-xl font-semibold text-tech-blue dark:text-blue-400 mb-2">Players ({roomDetails.players?.length || 0})</h3>
          <AnimatePresence>
            {roomDetails.players && roomDetails.players.length > 0 ? (
              roomDetails.players.map(p => (
                <motion.div
                  key={p.discordUserId} // Use discordUserId as key
                  layout
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <PlayerStatus
                    userId={p.discordUserId}
                    avatarHash={p.avatar}
                    playerName={p.username || `Player ${p.discordUserId.substring(0,6)}`}
                    score={p.score}
                    isCurrentPlayer={user && p.discordUserId === user.id}
                  />
                </motion.div>
              ))
            ) : (
              <p className="text-steam-gray">No players yet.</p>
            )}
          </AnimatePresence>
        </div>

        {/* Main Quiz Area / Waiting Area - now takes 3/4 on md+ screens */}
        <div className="md:col-span-3 relative">
          {roomDetails.status === 'waiting' && roomDetails.roomState === 'waiting' && (
            <div className="bg-surface dark:bg-slate-800 p-6 rounded-lg shadow-xl text-center border border-border dark:border-slate-700">
              {isHost ? (
                <>
                  <h3 className="text-2xl font-semibold text-creative-purple dark:text-purple-400 mb-4">Waiting for players...</h3>
                  <p className="text-text-secondary dark:text-slate-400 mb-6">As the host, you can start the quiz when ready.</p>
                  <button
                    onClick={handleStartQuiz}
                    className="bg-learning-yellow hover:bg-yellow-500 dark:hover:bg-yellow-600 text-slate-800 dark:text-slate-900 font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105"
                  >
                    Start Quiz
                  </button>
                </>
              ) : (
                <h3 className="text-2xl font-semibold text-creative-purple dark:text-purple-400 mb-4">Waiting for the host to start the quiz...</h3>
              )}
              {currentSteamTip && (
                <motion.div
                  key={currentSteamTip} // Animate when tip changes
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-8 p-4 bg-tech-blue/10 dark:bg-blue-900/30 border border-tech-blue/30 dark:border-blue-700 rounded-lg text-sm text-tech-blue dark:text-blue-300"
                >
                  <p className="font-semibold">💡 STEAM Fact/Tip:</p>
                  <p>{currentSteamTip}</p>
                </motion.div>
              )}
            </div>
          )}

          <AnimatePresence mode="wait">
            {isCelebratingCorrectAnswer && (
              <motion.div
                key="celebration"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5 }}
                className="bg-surface dark:bg-slate-800 p-6 rounded-lg shadow-xl text-center flex flex-col items-center justify-center border border-border dark:border-slate-700"
                style={{ minHeight: '300px' }} // Ensure it has some height
              >
                <motion.h3
                  className="text-4xl font-bold text-learning-yellow dark:text-yellow-400 mb-3"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  Correct!
                </motion.h3>
                <motion.div
                  className="text-5xl mb-4"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: [1, 1.3, 1], rotate: [0, -15, 15, -15, 0] }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 10 }}
                >
                  🎉
                </motion.div>
                <motion.p
                  className="text-xl text-steam-gray-dark"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  Next question in: <strong className="text-creative-purple dark:text-purple-400 text-2xl tabular-nums">{celebrationCountdown}</strong>s
                </motion.p>
              </motion.div>
            )}

            {!isCelebratingCorrectAnswer && showQuizArea && (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="bg-surface dark:bg-slate-800 p-6 rounded-lg shadow-xl border border-border dark:border-slate-700"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-tech-blue dark:text-blue-400">
                    Question {questionMeta.number} of {questionMeta.total}
                  </h3>
                  <TimerCircle timeLeft={timeLeft} totalTime={totalTimeForQuestion} size={80} />
                </div>

                <QuestionCard question={currentQuestion} /> {/* QuestionCard itself is themed */}

                <div className="mt-6 space-y-3"> {/* AnswerOption components are themed */}
                  {currentQuestion.choices.map(choice => (
                    <AnswerOption
                      key={choice.id} // Keep this key for React's list rendering
                      option={choice}
                      onSelect={() => handleSubmitAnswer(choice.id)}
                      isSelected={selectedAnswerId === choice.id}
                      isCorrect={roomDetails.roomState === 'answer_revealed' && choice.id === currentQuestion.correctChoiceId}
                      revealAnswer={roomDetails.roomState === 'answer_revealed'}
                      disabled={selectedAnswerId !== null || roomDetails.roomState === 'answer_revealed' || timeLeft === 0}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {showAnswerRevealDisplay && !showQuizArea && !isCelebratingCorrectAnswer && (
            <div className="mt-6 p-6 bg-surface dark:bg-slate-800 rounded-lg shadow border border-border dark:border-slate-700">
              <h4 className="text-2xl font-bold text-center text-creative-purple dark:text-purple-400 mb-3">Answer Revealed!</h4>
              <p className="text-lg text-center text-text-secondary dark:text-slate-300">
                Correct Answer was: <strong className="text-tech-blue dark:text-blue-300">{currentQuestion.choices.find(c => c.id === currentQuestion.correctChoiceId)?.text}</strong>
              </p>
            </div>
          )}

          {roomDetails.status === 'finished' && !showQuizArea && !isCelebratingCorrectAnswer && (
             <div className="bg-surface dark:bg-slate-800 p-6 rounded-lg shadow-xl text-center border border-border dark:border-slate-700">
              <h3 className="text-2xl font-semibold text-creative-purple dark:text-purple-400 mb-4">Quiz Finished!</h3>
              <p className="text-text-secondary dark:text-slate-400 mb-6">The results are being calculated. You will be redirected shortly.</p>
              {/* Navigation to results page is handled in WebSocket 'quiz_finished' event */}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleLeaveRoom}
          disabled={isLeaving}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors"
        >
          {isLeaving ? 'Leaving...' : 'Leave Room'}
        </button>
      </div>
    </div>
  );
};

export default RoomPage;
