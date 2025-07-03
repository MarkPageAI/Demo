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

  // Timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTimeForQuestion, setTotalTimeForQuestion] = useState(0);

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

  // Reset selectedAnswerId when a new question arrives
  useEffect(() => {
    if (roomDetails?.roomState === 'question_displayed') {
      setSelectedAnswerId(null);
      setActionMessage(''); // Clear previous messages
    }
  }, [currentQuestion?.id, roomDetails?.roomState]);


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
  const showQuizArea = roomDetails.status === 'playing' && currentQuestion;
  const showAnswerReveal = roomDetails.roomState === 'answer_revealed' && currentQuestion && currentQuestion.correctChoiceId;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 p-4 bg-steam-gray-light shadow-md rounded-lg">
        <h2 className="text-3xl font-bold text-tech-blue">Room: {roomDetails.name}
          <span className="text-sm text-steam-gray-dark ml-2">(ID: {roomId})</span>
        </h2>
        <p className="text-creative-purple">Status: <strong className="font-semibold">{roomDetails.status}</strong> | Quiz State: <strong className="font-semibold">{roomDetails.roomState}</strong></p>
        {actionMessage && <p className={`mt-2 ${actionMessage.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>{actionMessage}</p>}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Players Section */}
        <div className="md:col-span-1 space-y-3">
          <h3 className="text-xl font-semibold text-tech-blue mb-2">Players</h3>
          {roomDetails.players && roomDetails.players.length > 0 ? (
            roomDetails.players.map(p => (
              <PlayerStatus
                key={p.id}
                playerName={p.username || `Player ${p.id.substring(0,6)}`}
                score={p.score}
                // Highlight if this player is the current user, or if they are the host
                isCurrentPlayer={user && p.id === user.id}
              />
            ))
          ) : (
            <p className="text-steam-gray">No players yet.</p>
          )}
        </div>

        {/* Main Quiz Area / Waiting Area */}
        <div className="md:col-span-2">
          {isHost && roomDetails.status === 'waiting' && roomDetails.roomState === 'waiting' && (
            <div className="bg-white p-6 rounded-lg shadow-xl text-center">
              <h3 className="text-2xl font-semibold text-creative-purple mb-4">Waiting for players...</h3>
              <p className="text-steam-gray mb-6">As the host, you can start the quiz when ready.</p>
              <button
                onClick={handleStartQuiz}
                className="bg-learning-yellow hover:bg-yellow-500 text-steam-gray-dark font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105"
              >
                Start Quiz
              </button>
            </div>
          )}

          {showQuizArea && (
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-tech-blue">
                  Question {questionMeta.number} of {questionMeta.total}
                </h3>
                <TimerCircle timeLeft={timeLeft} totalTime={totalTimeForQuestion} size={80} />
              </div>

              <QuestionCard question={currentQuestion} />

              <div className="mt-6 space-y-3">
                {currentQuestion.choices.map(choice => (
                  <AnswerOption
                    key={choice.id}
                    option={choice}
                    onSelect={() => handleSubmitAnswer(choice.id)}
                    isSelected={selectedAnswerId === choice.id}
                    // Reveal logic for after answer_reveal event
                    isCorrect={showAnswerReveal && choice.id === currentQuestion.correctChoiceId}
                    revealAnswer={showAnswerReveal}
                    // Disable if an answer is already selected OR if answer is revealed
                    disabled={selectedAnswerId !== null || showAnswerReveal}
                  />
                ))}
              </div>
            </div>
          )}

          {showAnswerReveal && (
            <div className="mt-6 p-6 bg-steam-gray-light rounded-lg shadow">
              <h4 className="text-2xl font-bold text-center text-creative-purple mb-3">Answer Revealed!</h4>
              <p className="text-lg text-center text-steam-gray-dark">
                Correct Answer was: <strong className="text-tech-blue">{currentQuestion.choices.find(c => c.id === currentQuestion.correctChoiceId)?.text}</strong>
              </p>
              {/* Player scores are updated in the PlayerStatus components via roomDetails.players update */}
            </div>
          )}

          {roomDetails.status === 'finished' && !showQuizArea && (
             <div className="bg-white p-6 rounded-lg shadow-xl text-center">
              <h3 className="text-2xl font-semibold text-creative-purple mb-4">Quiz Finished!</h3>
              <p className="text-steam-gray mb-6">The results are being calculated. You will be redirected shortly.</p>
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
