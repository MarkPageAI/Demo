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
console.log("[DEBUG] Attempted to load .env from:", path.resolve(__dirname, '.env'));
console.log("[DEBUG] DISCORD_CLIENT_ID after explicit path load:", process.env.DISCORD_CLIENT_ID); // DEBUG line

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // Allow frontend to access
  credentials: true
}));
app.use(express.json());

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
        avatar: req.user.avatar,
        email: req.user.email, // if 'email' scope was granted
        guilds: req.user.guilds, // if 'guilds' scope was granted
        gameSessionId: req.user.gameSessionId // Our custom game session ID
      }
    });
  } else {
    res.status(200).json({ loggedIn: false });
  }
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
  ws.send("Hi there, you are connected to the WebSocket server!");

  ws.on("message", (message) => {
    console.log("Received message from client: %s", message);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`Server broadcast: ${message}`);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected from WebSocket");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

module.exports = server;
