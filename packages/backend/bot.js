// Import necessary discord.js classes
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config(); // Load .env file variables

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN is not defined in your .env file. The bot cannot start.");
  // process.exit(1); // Don't exit here, server.js might want to continue without bot for OAuth
}

// Create a new Client instance
// discord.js v14 requires specifying intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,             // Required for basic guild information and events
    GatewayIntentBits.GuildMessages,      // Required to receive messages in guilds
    GatewayIntentBits.MessageContent,     // Required to read message content (needs to be enabled in Developer Portal for bots over 100 servers)
    GatewayIntentBits.GuildMembers,       // Required to access guild member information (privileged intent, enable in Developer Portal)
    // Add other intents as needed for your bot's functionality
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember], // Optional: for caching partial structures
});

// When the client is ready, run this code (only once)
client.once('ready', c => {
  console.log(`Discord Bot Logged in as ${c.user.tag}!`);
  console.log(`Bot is on ${c.guilds.cache.size} servers.`);
  // You can set bot's activity here
  c.user.setPresence({
    activities: [{ name: 'Quiz Games | !quizhelp', type: 'PLAYING' }], // Example activity
    status: 'online', // online, idle, dnd, invisible
  });
});

// Listen for messages
client.on('messageCreate', async message => {
  // Ignore messages from other bots and messages that don't start with the prefix
  if (message.author.bot) return;

  // Simple ping command
  if (message.content.toLowerCase() === '!ping') {
    try {
      await message.reply('Pong!');
      console.log(`Responded to !ping from ${message.author.tag} in ${message.guild ? message.guild.name : 'DM'}`);
    } catch (error) {
      console.error("Error replying to !ping:", error);
    }
  }

  // Placeholder for !quizhelp or other commands
  if (message.content.toLowerCase() === '!quizhelp') {
    try {
      await message.reply('Hello! I am the Quiz Bot. Commands: !ping, !startquiz (soon!).');
    } catch (error) {
      console.error("Error replying to !quizhelp:", error);
    }
  }
});


// Login to Discord with your client's token
const startBot = () => {
  if (!BOT_TOKEN) {
    console.warn("BOT_TOKEN is missing. Discord Bot will not be started.");
    return;
  }
  client.login(BOT_TOKEN)
    .then(() => {
      console.log("Discord Bot login successful.");
    })
    .catch(error => {
      console.error('Failed to log in Discord Bot:', error);
      // Consider specific error handling, e.g., for invalid token
      if (error.code === 'TokenInvalid') {
        console.error("Invalid BOT_TOKEN. Please check your .env file and Discord Developer Portal.");
      }
    });
};

module.exports = { startBot, client }; // Export client if needed elsewhere, e.g. for activity invites
