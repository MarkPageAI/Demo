import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import websocketService from '../services/websocket';
import PlayerList from '../components/PlayerList';
import QuestionDisplay from '../components/QuestionDisplay'; // For Task 6.3
// import InGameLeaderboard from '../components/InGameLeaderboard'; // For Task 6.3, might be part of PlayerList

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
                // Send user identifiers for backend to associate ws connection with a user
                discordUserId: user.id, // from AuthContext
                username: user.username // for logging or if needed by backend immediately
              }
            });
        } else {
            console.warn("WebSocket not open or user not available when attempting to subscribe. Subscription might fail or be delayed.");
            // Could implement a retry or queue for subscription message
        }
    }, 500); // wait a bit for connection

    return () => {
      // No specific unsubscribe message needed if server handles disconnects for subscriptions
      // websocketService.sendMessage({ action: 'unsubscribe_room', payload: { roomId } }); // Optional
      websocketService.removeMessageListener(handleWebSocketMessage);
      websocketService.disconnect(); // Disconnect on component unmount
      clearTimeout(wsSubTimeout);
    };
  }, [roomId, fetchRoomDetails, handleWebSocketMessage, navigate]);


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
    if (!currentQuestion) return;
    try {
        await apiService.submitAnswer(roomId, choiceId);
        // UI might give some feedback like "Answer submitted!"
        // The actual result comes via 'answer_reveal' event
        console.log(`Answer ${choiceId} submitted for question ${currentQuestion.id}`);
        // Disable further answers for this question on UI (handled in QuestionDisplay)
    } catch (error) {
        console.error("Error submitting answer:", error);
        alert(`Failed to submit answer: ${error.message}`);
    }
  };


  if (authLoading || isLoading) {
    return <div>Loading room information...</div>;
  }

  if (error) {
    return <div style={{color: 'red'}}>Error: {error} <button onClick={() => navigate('/')}>Go Home</button></div>;
  }

  if (!roomDetails) {
    return <div>Room not found or still loading. <button onClick={fetchRoomDetails}>Retry Load</button></div>;
  }

  const isHost = isAuthenticated && user && roomDetails.hostId === user.id;

  return (
    <div>
      <h2>Room: {roomDetails.name} <span style={{fontSize: '0.8em', color: 'gray'}}>(ID: {roomId})</span></h2>
      <p>Status: <strong>{roomDetails.status}</strong> | Quiz State: <strong>{roomDetails.roomState}</strong></p>
      {actionMessage && <p style={{ color: actionMessage.startsWith('Error') ? 'red' : 'green' }}>{actionMessage}</p>}

      <PlayerList players={roomDetails.players} hostId={roomDetails.hostId} />

      {isHost && roomDetails.status === 'waiting' && roomDetails.roomState === 'waiting' && (
        <button onClick={handleStartQuiz} style={{ marginTop: '1rem', padding: '10px', background: 'limegreen', color: 'white' }}>
          Start Quiz
        </button>
      )}

      <button
        onClick={handleLeaveRoom}
        disabled={isLeaving}
        style={{ marginTop: '1rem', marginLeft: isHost && roomDetails.status === 'waiting' ? '10px' : '0', padding: '10px', background: 'orangered', color: 'white' }}
      >
        {isLeaving ? 'Leaving...' : 'Leave Room'}
      </button>

      {/* Quiz Area - Task 6.3 */}
      {roomDetails.status === 'playing' && currentQuestion && (
        <div style={{marginTop: '2rem', border: '1px solid blue', padding: '1rem'}}>
          <h3>Question {questionMeta.number} of {questionMeta.total}</h3>
          <QuestionDisplay
            question={currentQuestion}
            onSubmitAnswer={handleSubmitAnswer}
            questionStartTime={questionMeta.startTime}
            questionEndTime={questionMeta.endTime}
            roomState={roomDetails.roomState} // To know if it's 'question_displayed' or 'answer_revealed'
          />
        </div>
      )}
      {roomDetails.roomState === 'answer_revealed' && currentQuestion && currentQuestion.serverAnswers && (
          <div style={{marginTop: '1rem', background: '#e0e0e0', padding: '1rem'}}>
              <h4>Answer Revealed!</h4>
              <p>Correct Answer was: {currentQuestion.choices.find(c => c.id === currentQuestion.correctChoiceId)?.text}</p>
              {/* PlayerList already shows updated scores */}
          </div>
      )}

      {/* Placeholder for InGameLeaderboard if different from PlayerList */}
      {/* {roomDetails.status === 'playing' && <InGameLeaderboard players={roomDetails.players} />} */}

    </div>
  );
};

export default RoomPage;
