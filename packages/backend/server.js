const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const session = require("express-session");
const { v4: uuidv4 } = require('uuid'); // Import uuid
const path = require('path'); // Import path module
const fs = require('fs'); // Import File System module
const rateLimit = require('express-rate-limit'); // Import express-rate-limit

// Load .env file specifically from the current directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

// --- Load Questions Data ---
let allQuestions = [];
try {
  const questionsData = fs.readFileSync(path.resolve(__dirname, 'data/questions.json'), 'utf-8');
  allQuestions = JSON.parse(questionsData);
  console.log(`Successfully loaded ${allQuestions.length} questions from data/questions.json`);
} catch (error) {
  console.error("Error loading questions.json:", error);
  // Consider exiting or using a default empty set if questions are critical
}

// Helper function to get random questions
function getRandomQuestions(sourceArray, count) {
  const shuffled = [...sourceArray].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const ROOM_WAITING_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes for a room to be started
// const MIN_PLAYERS_TO_AVOID_TIMEOUT = 1; // Or some other logic for keep-alive
// console.log("[DEBUG] Attempted to load .env from:", path.resolve(__dirname, '.env')); // Keep for debugging if needed
// console.log("[DEBUG] DISCORD_CLIENT_ID after explicit path load:", process.env.DISCORD_CLIENT_ID);

const app = express();
const port = process.env.PORT || 3001;

// --- In-memory store for active rooms ---
const activeRooms = {};
global.activeRooms = activeRooms; // Make it globally accessible if needed

// --- In-memory store for Global Leaderboard ---
const globalLeaderboard = {}; // Key: discordUserId, Value: LeaderboardEntry
global.globalLeaderboard = globalLeaderboard; // Make it globally accessible if needed


// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // Allow frontend to access
  credentials: true
}));

app.use(express.json()); // To parse JSON request bodies

// --- Rate Limiting Setup ---
// Apply to all requests (more general, less strict)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});
app.use(generalLimiter);

// Stricter limiter for sensitive actions like creating rooms or submitting answers
const actionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 requests per windowMs for these actions
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many actions from this IP, please try again after 5 minutes.',
});

// Apply actionLimiter specifically to certain routes later if needed, or group them.
// For now, generalLimiter applies to all. We'll apply actionLimiter to specific routes.

// Express Session
app.use(session({
  secret: process.env.SESSION_SECRET || "default_session_secret_change_me",
  resave: false,
  saveUninitialized: false, // True: a session will be stored even if not modified or no user logged in. False: recommended
  // store: // Optionally configure a session store for production (e.g., connect-mongo, connect-redis)
  cookie: {
    // secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
    // maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// PassportJS Setup
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  // Serialize user object to store in session (e.g., just the user ID)
  done(null, user); // Storing the whole user object for now, can be optimized
});

passport.deserializeUser((obj, done) => {
  // Deserialize user object from session
  // If you stored only ID, fetch user from DB here
  done(null, obj);
});

// Discord Strategy Configuration
const discordScopes = ['identify', 'email', 'guilds']; // Add 'guilds.join' if needed for bot to add user to server

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL,
  scope: discordScopes
}, (accessToken, refreshToken, profile, done) => {
  // This callback is called after successful authentication
  // `profile` contains user's Discord information
  console.log("Discord Profile Data:", profile);
  // You can save or update user data in your database here
  // For now, just pass the profile to the `done` callback
  return done(null, profile);
}));

// Routes
app.get("/", (req, res) => {
  res.status(200).send("OK from Backend. User: " + (req.user ? req.user.username : "Not logged in"));
});

// Auth Routes
app.get('/auth/discord', passport.authenticate('discord')); // Redirects to Discord for authentication

app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/auth/failure' }), // On failure, redirect to /auth/failure
  (req, res) => {
    // Successful authentication
    // req.user should contain the profile from DiscordStrategy's done callback
    const gameSessionId = uuidv4();
    req.user.gameSessionId = gameSessionId; // Attach gameSessionId to the user object in session

    console.log(`Successfully authenticated with Discord. User: ${req.user.username}, Discord ID: ${req.user.id}, GameSessionID: ${req.user.gameSessionId}`);

    // Store a simple mapping (optional, as info is in session. Could be used for quick lookups or server-side session management if not using express-session's store for everything)
    // For now, this is just for demonstration. In a real app, this might be a DB write.
    // if (!global.activeGameSessions) global.activeGameSessions = {};
    // global.activeGameSessions[gameSessionId] = {
    //   discordUserId: req.user.id,
    //   username: req.user.username,
    //   avatar: req.user.avatar,
    //   discriminator: req.user.discriminator,
    //   profile: req.user // Full profile if needed
    // };
    // console.log("Active Game Sessions (placeholder):", global.activeGameSessions);

    // Redirect to frontend
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  }
);

app.get('/auth/failure', (req, res) => {
  res.status(401).send('Failed to authenticate with Discord.');
});

app.get('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.session.destroy((destroyErr) => {
        if (destroyErr) {
            console.error("Error destroying session:", destroyErr);
            return next(destroyErr);
        }
        res.clearCookie('connect.sid'); // Default session cookie name
        console.log("User logged out and session destroyed.");
        res.status(200).send('Successfully logged out.');
    });
  });
});

// Endpoint to check current user status
app.get('/auth/status', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    // req.user should have discord profile and gameSessionId if login was successful
    res.status(200).json({
      loggedIn: true,
      user: {
        id: req.user.id, // Discord User ID
        username: req.user.username,
        discriminator: req.user.discriminator,
        avatar: req.user.avatar, // Discord avatar hash
        // Construct avatar URL: `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`
        email: req.user.email, // if 'email' scope was granted
        guilds: req.user.guilds, // if 'guilds' scope was granted
        gameSessionId: req.user.gameSessionId // Our custom game session ID
      }
    });
  } else {
    res.status(200).json({ loggedIn: false });
  }
});

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized. Please log in.' });
};

// --- Room Management Endpoints ---

// POST /rooms - Create a new room
app.post('/rooms', actionLimiter, ensureAuthenticated, (req, res) => {
  const hostUser = req.user; // User data from Passport session (Discord profile + gameSessionId)
  let { name, isPublic = true, maxPlayers = 8 } = req.body;

  // Validation for room creation
  if (name && (typeof name !== 'string' || name.length > 100)) {
    return res.status(400).json({ message: 'Room name must be a string and less than 100 characters.' });
  }
  if (typeof isPublic !== 'boolean') {
    isPublic = true; // Default if invalid type
  }
  if (maxPlayers !== undefined) {
    const mp = parseInt(maxPlayers, 10);
    if (isNaN(mp) || mp < 2 || mp > 20) {
      return res.status(400).json({ message: 'maxPlayers must be a number between 2 and 20.' });
    }
    maxPlayers = mp;
  } else {
    maxPlayers = 8; // Default if not provided
  }
  
  const roomId = uuidv4();
  const hostPlayer = {
    discordUserId: hostUser.id,
    username: hostUser.username,
    discriminator: hostUser.discriminator,
    avatar: hostUser.avatar, // Store avatar hash, construct URL on frontend or as needed
    score: 0,
    isHost: true,
    gameSessionId: hostUser.gameSessionId // Persist the user's gameSessionId
  };

  const newRoom = {
    id: roomId,
    name: name || `${hostUser.username}'s Quiz Room`,
    isPublic: Boolean(isPublic),
    status: 'waiting', // Initial status
    players: [hostPlayer],
    maxPlayers: parseInt(maxPlayers, 10) || 8,
    hostId: hostUser.id,
    createdAt: Date.now(),

    // Quiz related properties
    questions: getRandomQuestions(allQuestions, 5), // Load 5 random questions for the room
    currentQuestionIndex: -1, // -1 indicates quiz hasn't started
    roomState: 'waiting', // 'waiting', 'countdown', 'question_displayed', 'answer_revealed', 'finished'
    playerAnswers: {}, // Stores answers: playerAnswers[questionId][playerId] = choiceId
                       // Or playerAnswers[questionIndex][playerId] = { choiceId, answerTime }
    quizStartTime: null,
    currentQuestionStartTime: null,
    // gameSettings: {}, // Placeholder for future game settings
  };

  activeRooms[roomId] = newRoom;

  // Set a timeout to automatically delete the room if it's not started
  newRoom.waitingTimeoutId = setTimeout(() => {
    const roomToCheck = activeRooms[roomId];
    if (roomToCheck && roomToCheck.status === 'waiting') {
      delete activeRooms[roomId];
      console.log(`Room ${roomId} ('${roomToCheck.name}') timed out and was deleted due to inactivity.`);
    }
  }, ROOM_WAITING_TIMEOUT_MS);

  console.log(`Room created: ${newRoom.name} (ID: ${roomId}), Host: ${hostUser.username}. Timeout set for ${ROOM_WAITING_TIMEOUT_MS / 60000} minutes.`);
  console.log("Current active rooms:", Object.keys(activeRooms).length);

  res.status(201).json(newRoom);
});

// GET /rooms/:roomId - Get details of a specific room
app.get('/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    return res.status(400).json({ message: 'A valid Room ID must be provided in the URL path.' });
  }

  const room = activeRooms[roomId];

  if (room) {
    res.status(200).json(room);
  } else {
    res.status(404).json({ message: 'Room not found.' });
  }
});

// POST /rooms/:roomId/join - Join an existing room
app.post('/rooms/:roomId/join', actionLimiter, ensureAuthenticated, (req, res) => {
  const { roomId } = req.params;
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    return res.status(400).json({ message: 'A valid Room ID must be provided in the URL path.' });
  }

  const userJoining = req.user; // User data from Passport session

  const room = activeRooms[roomId];

  if (!room) {
    return res.status(404).json({ message: 'Room not found.' });
  }

  if (room.status !== 'waiting') {
    return res.status(403).json({ message: `Cannot join room. Room status is '${room.status}'.` });
  }

  if (room.players.length >= room.maxPlayers) {
    return res.status(403).json({ message: 'Room is full.' });
  }

  // Check if user is already in the room
  const playerAlreadyInRoom = room.players.find(p => p.discordUserId === userJoining.id);
  if (playerAlreadyInRoom) {
    // Optionally, could just return 200 with current room state if user is already in.
    // For now, let's treat it as a "conflict" or an idempotent success.
    console.log(`User ${userJoining.username} already in room ${roomId}.`);
    return res.status(200).json(room); // Or return a 409 Conflict if preferred.
  }

  const newPlayer = {
    discordUserId: userJoining.id,
    username: userJoining.username,
    discriminator: userJoining.discriminator,
    avatar: userJoining.avatar,
    score: 0,
    isHost: false, // New players are not hosts by default
    gameSessionId: userJoining.gameSessionId // Persist user's gameSessionId
  };

  room.players.push(newPlayer);
  console.log(`User ${userJoining.username} joined room ${roomId}. Current players: ${room.players.length}`);

  // Broadcast 'room_updated' event to all subscribed clients in this room
  wss.clients.forEach(clientWs => {
    if (clientWs.readyState === WebSocket.OPEN && clientWs.subscribedRoomId === roomId) {
      try {
        console.log(`Broadcasting room_updated to client in room ${roomId}`);
        clientWs.send(JSON.stringify({
          event: 'room_updated',
          payload: room // Send the entire updated room object
        }));
      } catch (error) {
        console.error(`Failed to send room_updated to client in room ${roomId}:`, error);
      }
    }
  });

  res.status(200).json(room);
});

// POST /rooms/:roomId/leave - Leave a room
app.post('/rooms/:roomId/leave', ensureAuthenticated, (req, res) => { // Should also have actionLimiter? For now, no.
  const { roomId } = req.params;
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    return res.status(400).json({ message: 'A valid Room ID must be provided in the URL path.' });
  }

  const userLeaving = req.user; // User data from Passport session

  const room = activeRooms[roomId];

  if (!room) {
    return res.status(404).json({ message: 'Room not found.' });
  }

  const playerIndex = room.players.findIndex(p => p.discordUserId === userLeaving.id);

  if (playerIndex === -1) {
    return res.status(404).json({ message: 'Player not found in this room.' });
  }

  const playerLeaving = room.players[playerIndex];
  room.players.splice(playerIndex, 1); // Remove player from array
  console.log(`User ${userLeaving.username} left room ${roomId}. Players remaining: ${room.players.length}`);

  // Handle host leaving
  if (playerLeaving.isHost || room.hostId === userLeaving.id) {
    if (room.players.length > 0) {
      // Promote the next player (or first in list) to be the new host
      room.players[0].isHost = true;
      room.hostId = room.players[0].discordUserId;
      console.log(`Host ${userLeaving.username} left. New host is ${room.players[0].username} in room ${roomId}.`);
    } else {
      // No players left, delete the room
      delete activeRooms[roomId];
      console.log(`Room ${roomId} is empty and has been deleted.`);
      // No need to broadcast if room is deleted, clients should handle 404 or specific event if needed
      return res.status(200).json({ message: 'Successfully left room. Room was empty and has been deleted.' });
    }
  }

  // Broadcast 'room_updated' event to all subscribed clients in this room
  wss.clients.forEach(clientWs => {
    if (clientWs.readyState === WebSocket.OPEN && clientWs.subscribedRoomId === roomId) {
      try {
        console.log(`Broadcasting room_updated (player left) to client in room ${roomId}`);
        clientWs.send(JSON.stringify({
          event: 'room_updated',
          payload: room
        }));
      } catch (error) {
        console.error(`Failed to send room_updated (player left) to client in room ${roomId}:`, error);
      }
    }
  });

  res.status(200).json({ message: 'Successfully left room.', room });
});

// GET /rooms/:roomId/question - Get the current active question for a room
app.get('/rooms/:roomId/question', ensureAuthenticated, (req, res) => { // No actionLimiter needed for GET usually
  const { roomId } = req.params;
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    return res.status(400).json({ message: 'A valid Room ID must be provided in the URL path.' });
  }

  const requestingUser = req.user;

  const room = activeRooms[roomId];

  if (!room) {
    return res.status(404).json({ message: 'Room not found.' });
  }

  // Check if the requesting user is a player in this room
  const isPlayerInRoom = room.players.some(p => p.discordUserId === requestingUser.id);
  if (!isPlayerInRoom) {
    return res.status(403).json({ message: 'You are not a player in this room.' });
  }

  if (room.status !== 'playing' || room.roomState !== 'question_displayed' ||
      room.currentQuestionIndex < 0 || room.currentQuestionIndex >= room.questions.length) {
    return res.status(404).json({ message: 'No active question currently displayed for this room.' });
    // Or, could return a specific state: e.g., { state: room.roomState, message: 'Waiting for next question or quiz to start/end.' }
  }

  const currentQuestionFull = room.questions[room.currentQuestionIndex];

  // Prepare question data for the client (omitting correctChoiceId)
  const questionForClient = {
    id: currentQuestionFull.id,
    text: currentQuestionFull.text,
    choices: currentQuestionFull.choices.map(choice => ({ id: choice.id, text: choice.text })), // Send only id and text for choices
    duration: currentQuestionFull.duration
  };

  const questionEndTime = room.currentQuestionStartTime
    ? room.currentQuestionStartTime + (currentQuestionFull.duration * 1000)
    : null;

  res.status(200).json({
    question: questionForClient,
    questionNumber: room.currentQuestionIndex + 1,
    totalQuestions: room.questions.length,
    questionStartTime: room.currentQuestionStartTime, // Timestamp when the current question was started by the server
    questionEndTime: questionEndTime // Calculated timestamp when the question should end
  });
});

// POST /rooms/:roomId/answer - Submit an answer for the current question
app.post('/rooms/:roomId/answer', actionLimiter, ensureAuthenticated, (req, res) => {
  const { roomId } = req.params;
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    return res.status(400).json({ message: 'A valid Room ID must be provided in the URL path.' });
  }
  const player = req.user; // User object from session
  const { choiceId } = req.body;

  if (!choiceId || typeof choiceId !== 'string' || choiceId.trim() === '') {
    return res.status(400).json({ message: 'choiceId must be a non-empty string.' });
  }

  const room = activeRooms[roomId];

  if (!room) {
    return res.status(404).json({ message: 'Room not found.' });
  }

  const isPlayerInRoom = room.players.some(p => p.discordUserId === player.id);
  if (!isPlayerInRoom) {
    return res.status(403).json({ message: 'You are not a player in this room.' });
  }

  if (room.status !== 'playing' || room.roomState !== 'question_displayed' ||
      room.currentQuestionIndex < 0 || room.currentQuestionIndex >= room.questions.length) {
    return res.status(403).json({ message: 'Not allowed to answer at this time. No active question or quiz not in answering phase.' });
  }

  const currentQuestion = room.questions[room.currentQuestionIndex];
  const currentQuestionId = currentQuestion.id;

  // Initialize answers for this question if not already present
  if (!room.playerAnswers) {
    room.playerAnswers = {};
  }
  if (!room.playerAnswers[currentQuestionId]) {
    room.playerAnswers[currentQuestionId] = {};
  }

  // Check if player has already answered this question
  if (room.playerAnswers[currentQuestionId][player.id]) {
    return res.status(409).json({ message: 'You have already answered this question.' });
  }

  // Record the answer
  // For simplicity, just storing choiceId. Could also store timestamp etc.
  room.playerAnswers[currentQuestionId][player.id] = choiceId;
  console.log(`Player ${player.username} (ID: ${player.id}) in room ${roomId} answered question ${currentQuestionId} with choice ${choiceId}`);

  // Optional: Notify other players that this player has answered (without revealing the answer)
  // This would typically be done via WebSocket if desired.
  // For now, just a server log.

  res.status(200).json({ message: 'Answer received successfully.' });
});

// --- Game Logic Functions ---
const POINTS_PER_CORRECT_ANSWER = 10; // Define points for a correct answer

// Function to handle the end of a question (timer expired or all answered)
handleQuestionEnd = (roomId) => {
  const room = activeRooms[roomId];
  if (!room || room.status !== 'playing' || room.roomState !== 'question_displayed') {
    console.warn(`[handleQuestionEnd] Room ${roomId} not found, not playing, or not in question_displayed state. Current state: ${room ? room.roomState : 'N/A'}. Aborting.`);
    return;
  }

  console.log(`[handleQuestionEnd] Processing end of question ${room.currentQuestionIndex + 1} for room ${roomId}`);
  room.roomState = 'answer_revealed';

  const endedQuestion = room.questions[room.currentQuestionIndex];
  const correctChoiceId = endedQuestion.correctChoiceId;
  const playerAnswersForQuestion = room.playerAnswers[endedQuestion.id] || {};

  let scoreUpdates = [];

  room.players.forEach(player => {
    const playerAnswer = playerAnswersForQuestion[player.discordUserId];
    let scoreChange = 0;
    if (playerAnswer && playerAnswer === correctChoiceId) {
      scoreChange = POINTS_PER_CORRECT_ANSWER;
      player.score += scoreChange;
    }
    if (scoreChange > 0) { // Only include if score changed
        scoreUpdates.push({
            discordUserId: player.discordUserId,
            newScore: player.score,
            scoreChange: scoreChange
        });
    }
  });

  console.log(`[handleQuestionEnd] Scores updated for room ${roomId}. Correct choice was ${correctChoiceId}.`);

  const answerRevealPayload = {
    roomId: roomId,
    questionId: endedQuestion.id,
    correctChoiceId: correctChoiceId,
    // Send all player info, including updated scores
    players: room.players.map(p => ({
        discordUserId: p.discordUserId,
        username: p.username,
        score: p.score,
        avatar: p.avatar,
        // Optionally, include what this player answered
        answeredChoiceId: playerAnswersForQuestion[p.discordUserId] || null
    })),
    // Individual score updates can also be sent if frontend prefers delta, but full player list is often easier.
    // scoreUpdates: scoreUpdates
  };

  // Broadcast 'answer_reveal' to all subscribed clients
  wss.clients.forEach(clientWs => {
    if (clientWs.readyState === WebSocket.OPEN && clientWs.subscribedRoomId === roomId) {
      try {
        clientWs.send(JSON.stringify({ event: 'answer_reveal', payload: answerRevealPayload }));
      } catch (error) {
        console.error(`Failed to send answer_reveal to client in room ${roomId}:`, error);
      }
    }
  });
  console.log(`[handleQuestionEnd] answer_reveal broadcasted for room ${roomId}`);

  // Wait for a few seconds before proceeding to the next question or finishing
  setTimeout(() => proceedToNextStep(roomId), 5000); // 5 seconds delay
};

// Function to proceed to the next question or finish the quiz
const proceedToNextStep = (roomId) => {
  const room = activeRooms[roomId];
  if (!room || room.status !== 'playing' || room.roomState !== 'answer_revealed') {
    console.warn(`[proceedToNextStep] Room ${roomId} not found or not in correct state. Aborting.`);
    return;
  }

  room.currentQuestionIndex++;

  if (room.currentQuestionIndex < room.questions.length) {
    // --- Start Next Question ---
    room.roomState = 'question_displayed';
    room.currentQuestionStartTime = Date.now();

    const nextQuestionFull = room.questions[room.currentQuestionIndex];
    const questionForClient = {
      id: nextQuestionFull.id,
      text: nextQuestionFull.text,
      choices: nextQuestionFull.choices.map(choice => ({ id: choice.id, text: choice.text })),
      duration: nextQuestionFull.duration
    };
    const questionEndTime = room.currentQuestionStartTime + (nextQuestionFull.duration * 1000);

    const newQuestionPayload = {
      roomId: roomId,
      question: questionForClient,
      questionNumber: room.currentQuestionIndex + 1,
      totalQuestions: room.questions.length,
      questionStartTime: room.currentQuestionStartTime,
      questionEndTime: questionEndTime,
      players: room.players.map(p => ({ discordUserId: p.discordUserId, username: p.username, score: p.score, avatar: p.avatar }))
    };

    wss.clients.forEach(clientWs => {
      if (clientWs.readyState === WebSocket.OPEN && clientWs.subscribedRoomId === roomId) {
        clientWs.send(JSON.stringify({ event: 'new_question', payload: newQuestionPayload }));
      }
    });
    console.log(`[proceedToNextStep] Next question (${room.currentQuestionIndex + 1}) sent for room ${roomId}. Timer set for ${nextQuestionFull.duration}s.`);
    setTimeout(() => handleQuestionEnd(roomId), nextQuestionFull.duration * 1000);

  } else {
    // --- Finish Quiz ---
    room.status = 'finished';
    room.roomState = 'finished';
    console.log(`[proceedToNextStep] Quiz finished for room ${roomId}.`);

    const quizFinishedPayload = {
      roomId: roomId,
      players: room.players.sort((a, b) => b.score - a.score), // Sorted by score descending
      quizEndTime: Date.now()
    };

    wss.clients.forEach(clientWs => {
      if (clientWs.readyState === WebSocket.OPEN && clientWs.subscribedRoomId === roomId) {
        clientWs.send(JSON.stringify({ event: 'quiz_finished', payload: quizFinishedPayload }));
      }
    });
    // Optionally, clean up room.playerAnswers or other temporary quiz data here
    // delete room.playerAnswers;
    // delete room.currentQuestionStartTime;
    // delete room.currentQuestionIndex; // Or set to -1

    // --- Update Global Leaderboard ---
    console.log(`[GlobalLeaderboard] Updating global leaderboard after quiz in room ${roomId}`);
    room.players.forEach(playerInRoom => {
      const { discordUserId, username, discriminator, avatar, score } = playerInRoom;
      if (globalLeaderboard[discordUserId]) {
        globalLeaderboard[discordUserId].totalScore += score;
        globalLeaderboard[discordUserId].gamesPlayed++;
        globalLeaderboard[discordUserId].lastPlayedTimestamp = quizFinishedPayload.quizEndTime; // Use consistent end time
        // Update user details in case they changed
        globalLeaderboard[discordUserId].username = username;
        globalLeaderboard[discordUserId].discriminator = discriminator;
        globalLeaderboard[discordUserId].avatar = avatar;
        console.log(`[GlobalLeaderboard] Updated existing player: ${username} (${discordUserId}), New Total Score: ${globalLeaderboard[discordUserId].totalScore}`);
      } else {
        globalLeaderboard[discordUserId] = {
          discordUserId: discordUserId,
          username: username,
          discriminator: discriminator,
          avatar: avatar,
          totalScore: score,
          gamesPlayed: 1,
          lastPlayedTimestamp: quizFinishedPayload.quizEndTime // Use consistent end time
        };
        console.log(`[GlobalLeaderboard] Added new player: ${username} (${discordUserId}), Score: ${score}`);
      }
    });
    // console.log("[GlobalLeaderboard] Current state:", JSON.stringify(globalLeaderboard, null, 2)); // For detailed debugging
  }
};

// --- Leaderboard Endpoint ---
// GET /leaderboard - Get global leaderboard
app.get('/leaderboard', (req, res) => {
  // Convert globalLeaderboard object to an array
  const leaderboardArray = Object.values(globalLeaderboard);

  // Sort the array:
  // 1. By totalScore descending
  // 2. By gamesPlayed ascending (fewer games for same score is better)
  // 3. By lastPlayedTimestamp descending (more recent for same score & gamesPlayed is better)
  leaderboardArray.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    if (a.gamesPlayed !== b.gamesPlayed) {
      return a.gamesPlayed - b.gamesPlayed;
    }
    return b.lastPlayedTimestamp - a.lastPlayedTimestamp;
  });

  // Handle limit query parameter
  let limit = parseInt(req.query.limit, 10);
  if (isNaN(limit) || limit <= 0) {
    limit = 100; // Default limit if not specified or invalid
  }

  const limitedLeaderboard = leaderboardArray.slice(0, limit);

  console.log(`[Leaderboard] Requested global leaderboard. Returning top ${limitedLeaderboard.length} players.`);
  res.status(200).json(limitedLeaderboard);
});

// POST /rooms/:roomId/start - Start the quiz in a room (host only)
app.post('/rooms/:roomId/start', actionLimiter, ensureAuthenticated, (req, res) => {
  const { roomId } = req.params;
  if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
    return res.status(400).json({ message: 'A valid Room ID must be provided in the URL path.' });
  }
  const requestingUser = req.user;

  const room = activeRooms[roomId];

  if (!room) {
    return res.status(404).json({ message: 'Room not found.' });
  }

  if (room.hostId !== requestingUser.id) {
    return res.status(403).json({ message: 'Only the host can start the quiz.' });
  }

  if (room.status !== 'waiting' || room.roomState !== 'waiting') {
    return res.status(409).json({ message: `Quiz cannot be started. Room status: ${room.status}, Quiz state: ${room.roomState}` });
  }

  if (!room.questions || room.questions.length === 0) {
    return res.status(400).json({ message: 'No questions loaded for this room. Cannot start quiz.' });
  }

  // Clear the waiting timeout since the game is starting
  if (room.waitingTimeoutId) {
    clearTimeout(room.waitingTimeoutId);
    delete room.waitingTimeoutId;
    console.log(`Cleared waiting timeout for room ${roomId} as quiz is starting.`);
  }

  // Initialize/Reset quiz state for the room
  room.status = 'playing';
  room.roomState = 'question_displayed';
  room.currentQuestionIndex = 0;
  room.quizStartTime = Date.now();
  room.currentQuestionStartTime = Date.now();
  room.playerAnswers = {}; // Reset answers for a new quiz session
  // Reset player scores if starting a new game in an existing room context (optional, depends on game flow)
  room.players.forEach(p => p.score = 0);


  const currentQuestionFull = room.questions[room.currentQuestionIndex];
  const questionForClient = {
    id: currentQuestionFull.id,
    text: currentQuestionFull.text,
    choices: currentQuestionFull.choices.map(choice => ({ id: choice.id, text: choice.text })),
    duration: currentQuestionFull.duration
  };
  const questionEndTime = room.currentQuestionStartTime + (currentQuestionFull.duration * 1000);

  const newQuestionPayload = {
    roomId: roomId,
    question: questionForClient,
    questionNumber: room.currentQuestionIndex + 1,
    totalQuestions: room.questions.length,
    questionStartTime: room.currentQuestionStartTime,
    questionEndTime: questionEndTime,
    // Also send updated player scores (all zero at start)
    players: room.players.map(p => ({ discordUserId: p.discordUserId, username: p.username, score: p.score, avatar: p.avatar }))
  };

  // Broadcast 'new_question' to all subscribed clients in this room
  wss.clients.forEach(clientWs => {
    if (clientWs.readyState === WebSocket.OPEN && clientWs.subscribedRoomId === roomId) {
      try {
        clientWs.send(JSON.stringify({ event: 'new_question', payload: newQuestionPayload }));
      } catch (error) {
        console.error(`Failed to send new_question to client in room ${roomId}:`, error);
      }
    }
  });
  console.log(`Quiz started in room ${roomId}. First question sent. Timer set for ${currentQuestionFull.duration}s.`);

  // Set a timer for the current question's duration
  // Ensure handleQuestionEnd is defined or this will cause an error at runtime
  if (typeof handleQuestionEnd === 'function') {
    setTimeout(() => handleQuestionEnd(roomId), currentQuestionFull.duration * 1000);
  } else {
    console.error(`[CRITICAL] handleQuestionEnd function is not defined! Timer for question end in room ${roomId} cannot be set.`);
  }


  res.status(200).json({ message: 'Quiz started successfully.', question: newQuestionPayload });
});

const server = http.createServer(app); // Use app for HTTP server

server.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
  console.log(`Discord Client ID: ${process.env.DISCORD_CLIENT_ID ? 'Loaded' : 'NOT FOUND'}`);
  console.log(`Frontend URL for redirect: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`Bot Token: ${process.env.BOT_TOKEN ? 'Loaded' : 'NOT FOUND'}`);

  // Start Discord Bot
  startDiscordBot();
});

// Import and start Discord Bot
const { startBot: startDiscordBot } = require('./bot');


// WebSocket integration (Task 1.4) - Keep this part
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server }); // Attach WebSocket server to the same HTTP server

console.log("WebSocket server created, waiting for connections...");

wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket");
  
  // ws.send("Hi there, you are connected to the WebSocket server!"); // Initial generic message can be removed or kept

  ws.on("message", (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage);
      console.log("Received WebSocket message:", message);

      if (message.action === 'subscribe_room' && message.payload && message.payload.roomId && message.payload.discordUserId) {
        const { roomId: roomIdToSubscribe, discordUserId, username: clientUsername } = message.payload;

        const roomExists = activeRooms[roomIdToSubscribe];
        // Basic validation: does the user (from payload) actually exist in the room's player list?
        // This is a weak validation if discordUserId can be spoofed by a malicious client.
        // A stronger validation would involve a token sent via WebSocket, mapped to a server-side session.
        const playerInRoom = roomExists ? roomExists.players.find(p => p.discordUserId === discordUserId) : null;

        if (roomExists && playerInRoom) {
          ws.subscribedRoomId = roomIdToSubscribe;
          ws.discordUserId = discordUserId; // Store discordUserId on the ws connection
          ws.clientUsername = clientUsername || discordUserId; // Store username for logging
          console.log(`WebSocket client ${ws.clientUsername} (ID: ${ws.discordUserId}) subscribed to room: ${roomIdToSubscribe}`);

          // Send current room state to the newly subscribed client
          ws.send(JSON.stringify({
            event: 'room_updated',
            payload: activeRooms[roomIdToSubscribe]
          }));
        } else {
          console.warn(`Attempt to subscribe to non-existent room: ${roomIdToSubscribe}`);
          ws.send(JSON.stringify({ event: 'error', payload: { message: 'Room not found.' } }));
        }
      } else if (message.action === 'unsubscribe_room') {
        if (ws.subscribedRoomId) {
          console.log(`WebSocket client unsubscribed from room: ${ws.subscribedRoomId}`);
          delete ws.subscribedRoomId;
        }
      }
      // Add other WebSocket message handlers here if needed
      // Example: General broadcast, kept for testing if needed
      // else {
      //   wss.clients.forEach((client) => {
      //     if (client.readyState === WebSocket.OPEN) {
      //       client.send(`Server broadcast: ${rawMessage}`);
      //     }
      //   });
      // }

    } catch (error) {
      console.error("Failed to parse WebSocket message or handle it:", error);
      ws.send(JSON.stringify({ event: 'error', payload: { message: 'Invalid message format.' } }));
    }
  });

  ws.on("close", () => {
    const { subscribedRoomId, discordUserId, clientUsername } = ws;
    console.log(`WebSocket client ${clientUsername || 'Unknown'} (ID: ${discordUserId || 'N/A'}) disconnected.`);

    if (subscribedRoomId && discordUserId) {
      const room = activeRooms[subscribedRoomId];
      if (room) {
        const playerIndex = room.players.findIndex(p => p.discordUserId === discordUserId);

        if (playerIndex !== -1) {
          const playerLeaving = room.players[playerIndex];
          room.players.splice(playerIndex, 1);
          console.log(`Player ${playerLeaving.username} (ID: ${discordUserId}) removed from room ${subscribedRoomId} due to WebSocket disconnect. Players remaining: ${room.players.length}`);

          let roomWasDeleted = false;
          // Handle host leaving
          if (playerLeaving.isHost || room.hostId === discordUserId) {
            if (room.players.length > 0) {
              room.players[0].isHost = true;
              room.hostId = room.players[0].discordUserId;
              console.log(`Host ${playerLeaving.username} left room ${subscribedRoomId} via disconnect. New host is ${room.players[0].username}.`);
            } else {
              delete activeRooms[subscribedRoomId];
              roomWasDeleted = true;
              console.log(`Room ${subscribedRoomId} was empty after host disconnect and has been deleted.`);
            }
          }

          // Broadcast 'room_updated' only if the room still exists
          if (!roomWasDeleted) {
            wss.clients.forEach(clientWs => {
              if (clientWs.readyState === WebSocket.OPEN && clientWs.subscribedRoomId === subscribedRoomId) {
                try {
                  clientWs.send(JSON.stringify({
                    event: 'room_updated',
                    payload: room
                  }));
                } catch (error) {
                  console.error(`Failed to send room_updated (player disconnected) to client in room ${subscribedRoomId}:`, error);
                }
              }
            });
            console.log(`Broadcasted room_updated for room ${subscribedRoomId} after player disconnect.`);
          }
        } else {
          console.log(`Player with ID ${discordUserId} not found in room ${subscribedRoomId} upon disconnect, no removal needed.`);
        }
      } else {
        console.log(`Room ${subscribedRoomId} not found in activeRooms upon player disconnect.`);
      }
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

module.exports = server;
