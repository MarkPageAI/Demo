import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import websocketService from '../services/websocket';

// Import new UI components
import QuestionCard from '../components/QuestionCard';
import AnswerOption from '../components/AnswerOption';
import TimerCircle from '../components/TimerCircle';
import PlayerStatus from '../components/PlayerStatus'; // To replace/enhance PlayerList items

// TODO: PlayerList might need to be refactored to use PlayerStatus, or PlayerStatus used directly.
// For now, assuming PlayerList is a container for multiple PlayerStatus items or similar.
// Let's keep PlayerList for now and style it, or replace its rendering logic.
// For this step, we will focus on integrating the new components into the main quiz flow.

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [roomDetails, setRoomDetails] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  const [questionMeta, setQuestionMeta] = useState({
    number: 0,
    total: 0,
    startTime: null,
    endTime: null,
  });
  const [timeLeft, setTimeLeft] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Timer effect
  useEffect(() => {
    if (roomDetails?.roomState === 'question_displayed' && questionMeta.startTime && questionMeta.endTime) {
      const now = Date.now();
      const startTimeMs = new Date(questionMeta.startTime).getTime();
      const endTimeMs = new Date(questionMeta.endTime).getTime();

      if (now > endTimeMs) {
        setTimeLeft(0);
        return;
      }

      setTimeLeft(Math.max(0, Math.ceil((endTimeMs - now) / 1000)));

      const interval = setInterval(() => {
        const newTimeLeft = Math.max(0, Math.ceil((endTimeMs - Date.now()) / 1000));
        setTimeLeft(newTimeLeft);
        if (newTimeLeft === 0) {
          clearInterval(interval);
          // Optionally auto-submit or handle timeout if needed by game logic
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(0); // Reset timer if not in question display state
    }
  }, [roomDetails?.roomState, questionMeta.startTime, questionMeta.endTime]);


  const fetchRoomDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getRoomDetails(roomId);
      setRoomDetails(data);
      if (data.status === 'playing' && data.roomState === 'question_displayed') {
        fetchCurrentQuestion(); // This will be called if page is reloaded mid-game
      }
    } catch (err) {
      console.error("Failed to fetch room details:", err);
      setError(err.message || 'Failed to load room. It might not exist or you may not have access.');
      if (err.message?.toLowerCase().includes('not found')) {
        setTimeout(() => navigate('/'), 3000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [roomId, navigate]); // fetchCurrentQuestion removed as it's called conditionally

  const fetchCurrentQuestion = useCallback(async () => {
    // This is mainly for re-joining/reloading a page when a question is active
    try {
      const data = await apiService.getCurrentQuestion(roomId);
      setCurrentQuestion(data.question);
      setSelectedAnswerId(null); // Reset selection for new question
      setIsAnswerSubmitted(false); // Reset submission status
      setQuestionMeta({
        number: data.questionNumber,
        total: data.totalQuestions,
        startTime: data.questionStartTime,
        endTime: data.questionEndTime,
      });
    } catch (err) {
      console.warn("Failed to fetch current question (it might not be active yet):", err.message);
      setCurrentQuestion(null);
    }
  }, [roomId]);


  const handleWebSocketMessage = useCallback((message) => {
    console.log("RoomPage received WebSocket message:", message);
    if (message.payload && message.payload.roomId !== roomId) return;

    switch (message.event) {
      case 'room_updated':
        setRoomDetails(prev => ({ ...prev, ...message.payload, players: message.payload.players || prev.players }));
        break;
      case 'new_question':
        setRoomDetails(prev => ({
          ...prev,
          status: 'playing',
          roomState: 'question_displayed',
          currentQuestionIndex: message.payload.questionNumber - 1,
          players: message.payload.players, // Scores might be reset or not sent initially
        }));
        setCurrentQuestion(message.payload.question);
        setSelectedAnswerId(null); // Reset selection for new question
        setIsAnswerSubmitted(false); // Reset submission status
        setQuestionMeta({
          number: message.payload.questionNumber,
          total: message.payload.totalQuestions,
          startTime: message.payload.questionStartTime,
          endTime: message.payload.questionEndTime,
        });
        break;
      case 'answer_reveal':
        setRoomDetails(prev => ({
          ...prev,
          roomState: 'answer_revealed',
          players: message.payload.players, // Update players with new scores
        }));
        setCurrentQuestion(prevQ => prevQ ? ({ ...prevQ, correctChoiceId: message.payload.correctChoiceId }) : null);
        // isAnswerSubmitted is kept true or managed by QuestionCard/AnswerOption states
        break;
      case 'quiz_finished':
        setRoomDetails(prev => ({ ...prev, status: 'finished', roomState: 'finished', players: message.payload.players }));
        setCurrentQuestion(null);
        navigate(`/results/${roomId}`, { state: { finalRoomDetails: { ...roomDetails, players: message.payload.players, status: 'finished', roomState: 'finished' } } });
        break;
      case 'error':
        setError(message.payload.message || 'An error occurred via WebSocket.');
        break;
      default:
        console.log("Unhandled WebSocket event:", message.event);
    }
  }, [roomId, navigate, roomDetails]);

  useEffect(() => {
    if (!roomId || authLoading) return; // Wait for auth to complete before potentially using user ID
    if (!isAuthenticated && !authLoading) { // If auth is done and user is not authenticated
        setError("You must be logged in to enter a room.");
        setTimeout(() => navigate('/'), 3000);
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
  }, [roomId, authLoading, isAuthenticated, user, fetchRoomDetails, handleWebSocketMessage, navigate]);


  const handleStartQuiz = async () => {
    if (!roomDetails || !user || roomDetails.hostId !== user.id) {
      setActionMessage("You are not the host or room details are not loaded.");
      return;
    }
    setActionMessage('Starting quiz...');
    try {
      await apiService.startQuiz(roomId);
      setActionMessage('Quiz start signal sent!');
      // Server broadcasts 'new_question'
    } catch (err) {
      console.error("Failed to start quiz:", err);
      setError(err.message || 'Failed to start quiz.');
      setActionMessage(`Error starting quiz: ${err.message}`);
    }
  };

  const handleLeaveRoom = async () => {
    setIsLeaving(true);
    setActionMessage('Leaving room...');
    try {
      await apiService.leaveRoom(roomId);
      navigate('/');
    } catch (err) {
      console.error("Failed to leave room:", err);
      setError(err.message || 'Failed to leave room.');
      setActionMessage(`Error leaving room: ${err.message}`);
      setIsLeaving(false);
    }
  };

  const handleSelectAnswer = (choiceId) => {
    if (isAnswerSubmitted || roomDetails?.roomState === 'answer_revealed') return;
    setSelectedAnswerId(choiceId);
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !selectedAnswerId || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true); // Prevent multiple submissions
    try {
      await apiService.submitAnswer(roomId, selectedAnswerId);
      // Feedback: "Answer submitted!" (optional, server will confirm with reveal)
      setActionMessage('Answer submitted!');
      // setTimeout(() => setActionMessage(''), 2000); // Clear message after a bit
    } catch (error) {
      console.error("Error submitting answer:", error);
      setActionMessage(`Failed to submit answer: ${error.message}`);
      setIsAnswerSubmitted(false); // Allow retry if submission failed
    }
  };

  // --- Render Logic ---
  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900 text-white">
        Loading room information...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-900 text-red-400 p-4">
        <h2 className="text-2xl mb-4">Error</h2>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-steam-blue text-white font-semibold py-2 px-4 rounded hover:bg-steam-blue/90"
        >
          Go Home
        </button>
      </div>
    );
  }

  if (!roomDetails) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-900 text-white p-4">
        <p className="mb-4">Room not found or still loading.</p>
        <button
          onClick={fetchRoomDetails}
          className="bg-steam-purple text-white font-semibold py-2 px-4 rounded hover:bg-steam-purple/90"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const isHost = isAuthenticated && user && roomDetails.hostId === user.id;
  const maxTimeForTimer = questionMeta.endTime && questionMeta.startTime ? Math.ceil((new Date(questionMeta.endTime).getTime() - new Date(questionMeta.startTime).getTime())/1000) : 0;


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 flex flex-col">
      {/* Header Section */}
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-steam-blue">
              Room: {roomDetails.name}
            </h1>
            <p className="text-sm text-slate-400">ID: {roomId}</p>
          </div>
          <div className="text-right">
             <p className="text-lg">Status: <strong className="font-semibold text-steam-yellow">{roomDetails.status}</strong></p>
             <p className="text-sm text-slate-400">Quiz State: {roomDetails.roomState}</p>
          </div>
        </div>
        {actionMessage && (
          <p className={`mt-2 text-center py-2 px-3 rounded-md text-sm ${
            actionMessage.startsWith('Error') || actionMessage.startsWith('Failed') ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
          }`}>
            {actionMessage}
          </p>
        )}
      </header>

      {/* Main Content Area: Player List and Quiz Area */}
      <div className="flex flex-col lg:flex-row gap-6 flex-grow">
        {/* Player List / Status Sidebar */}
        <aside className="lg:w-1/4 bg-slate-800 p-4 rounded-lg shadow-xl order-last lg:order-first">
          <h2 className="text-xl font-semibold mb-4 text-steam-purple border-b border-slate-700 pb-2">Players</h2>
          <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
            {roomDetails.players && roomDetails.players.length > 0 ? (
              roomDetails.players.map((p) => (
                <PlayerStatus
                  key={p.id || p.discordUserId} // Ensure key is stable
                  user={{ username: p.username, id: p.discordUserId }} // Adapt based on actual player object structure
                  score={p.score}
                  isCurrentUser={user && p.discordUserId === user.id}
                  // Add other props like isHost if needed: isHost={p.discordUserId === roomDetails.hostId}
                />
              ))
            ) : (
              <p className="text-slate-400">No players yet.</p>
            )}
          </div>
        </aside>

        {/* Quiz Area */}
        <main className="lg:w-3/4 flex-grow flex flex-col items-center justify-center">
          {roomDetails.status === 'waiting' && (
            <div className="text-center p-6 bg-slate-800 rounded-lg shadow-xl">
              <h2 className="text-2xl font-semibold text-steam-yellow mb-4">Waiting for players...</h2>
              <p className="text-slate-300 mb-6">The quiz will begin once the host starts it.</p>
              {isHost && (
                <button
                  onClick={handleStartQuiz}
                  className="bg-steam-blue text-white font-bold py-3 px-8 rounded-lg hover:bg-steam-blue/90 transition duration-150 text-lg shadow-md"
                >
                  Start Quiz
                </button>
              )}
            </div>
          )}

          {roomDetails.status === 'playing' && currentQuestion && (
            <div className="w-full max-w-3xl">
              <div className="flex justify-center mb-6">
                <TimerCircle timeLeft={timeLeft} maxTime={maxTimeForTimer} />
              </div>
              <QuestionCard
                question={currentQuestion}
                currentQuestionIndex={questionMeta.number -1}
                totalQuestions={questionMeta.total}
              />
              <div className="mt-6 space-y-3">
                {currentQuestion.choices.map((choice) => (
                  <AnswerOption
                    key={choice.id}
                    option={choice}
                    isSelected={selectedAnswerId === choice.id}
                    onSelect={() => handleSelectAnswer(choice.id)}
                    isCorrect={roomDetails.roomState === 'answer_revealed' && choice.id === currentQuestion.correctChoiceId}
                    isRevealed={roomDetails.roomState === 'answer_revealed'}
                    // disabled: roomDetails.roomState === 'answer_revealed' || isAnswerSubmitted
                  />
                ))}
              </div>
              {roomDetails.roomState === 'question_displayed' && !isAnswerSubmitted && selectedAnswerId && (
                <button
                  onClick={handleSubmitAnswer}
                  className="mt-8 w-full bg-steam-green (replace with actual green) text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-500/90 transition duration-150 text-lg shadow-md disabled:opacity-50"
                  // disabled={!selectedAnswerId || isAnswerSubmitted}
                >
                  Submit Answer
                </button>
              )}
               {roomDetails.roomState === 'question_displayed' && isAnswerSubmitted && (
                <p className="mt-8 text-center text-steam-yellow">Waiting for other players...</p>
              )}
              {roomDetails.roomState === 'answer_revealed' && currentQuestion.correctChoiceId && (
                <div className="mt-8 p-4 bg-slate-700 rounded-lg text-center">
                  <h3 className="text-xl font-semibold text-steam-yellow mb-2">Answer Revealed!</h3>
                  <p className="text-slate-200">
                    Correct Answer: <strong className="text-green-400">{currentQuestion.choices.find(c => c.id === currentQuestion.correctChoiceId)?.text}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {roomDetails.status === 'finished' && (
             <div className="text-center p-6 bg-slate-800 rounded-lg shadow-xl">
              <h2 className="text-2xl font-semibold text-steam-yellow mb-4">Quiz Finished!</h2>
              <p className="text-slate-300 mb-6">The results are being calculated. Redirecting soon...</p>
              {/* Navigation to results page is handled by quiz_finished event */}
            </div>
          )}

        </main>
      </div>

      {/* Footer Controls */}
      <footer className="mt-auto pt-6 text-center">
        <button
          onClick={handleLeaveRoom}
          disabled={isLeaving}
          className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700 transition duration-150 disabled:opacity-70"
        >
          {isLeaving ? 'Leaving...' : 'Leave Room'}
        </button>
      </footer>
    </div>
  );
};

export default RoomPage;
