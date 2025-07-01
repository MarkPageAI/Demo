const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const session = require("express-session");
const { v4: uuidv4 } = require('uuid'); // Import uuid
const path = require('path'); // Import path module

// Load .env file specifically from the current directory
dotenv.config({ path: path.resolve(__dirname, '.env') });
// console.log("[DEBUG] Attempted to load .env from:", path.resolve(__dirname, '.env')); // Keep for debugging if needed
// console.log("[DEBUG] DISCORD_CLIENT_ID after explicit path load:", process.env.DISCORD_CLIENT_ID);

const app = express();
const port = process.env.PORT || 3001;

// --- In-memory store for active rooms ---
// In a production app, this would be a database (e.g., Redis, PostgreSQL)
const activeRooms = {};
global.activeRooms = activeRooms; // Make it globally accessible for now if needed by other modules (e.g. WebSocket handler if separated)

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // Allow frontend to access
  credentials: true
}));
app.use(express.json()); // To parse JSON request bodies

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
app.post('/rooms', ensureAuthenticated, (req, res) => {
  const hostUser = req.user; // User data from Passport session (Discord profile + gameSessionId)
  const { name, isPublic = true, maxPlayers = 8 } = req.body;

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
    // gameSettings: {}, // Placeholder for future game settings
    // questions: [],    // Placeholder for questions
  };

  activeRooms[roomId] = newRoom;
  console.log(`Room created: ${newRoom.name} (ID: ${roomId}), Host: ${hostUser.username}`);
  console.log("Current active rooms:", Object.keys(activeRooms).length);

  res.status(201).json(newRoom);
});

// GET /rooms/:roomId - Get details of a specific room
app.get('/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = activeRooms[roomId];

  if (room) {
    res.status(200).json(room);
  } else {
    res.status(404).json({ message: 'Room not found.' });
  }
});

// POST /rooms/:roomId/join - Join an existing room
app.post('/rooms/:roomId/join', ensureAuthenticated, (req, res) => {
  const { roomId } = req.params;
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
app.post('/rooms/:roomId/leave', ensureAuthenticated, (req, res) => {
  const { roomId } = req.params;
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

      if (message.action === 'subscribe_room' && message.payload && message.payload.roomId) {
        const roomIdToSubscribe = message.payload.roomId;
        // Check if room exists (optional, but good practice)
        if (activeRooms[roomIdToSubscribe]) {
          ws.subscribedRoomId = roomIdToSubscribe; // Tag the WebSocket connection with the roomId
          console.log(`WebSocket client subscribed to room: ${roomIdToSubscribe}`);
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
    console.log("Client disconnected from WebSocket");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

module.exports = server;
