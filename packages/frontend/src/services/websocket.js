import apiService from './api'; // To get base URL

let socket = null;
let messageListeners = []; // Array of callback functions

const getWebSocketURL = () => {
  const baseUrl = apiService.getBaseUrl(); // http://localhost:3001
  // Convert http/https to ws/wss
  const wsUrl = baseUrl.replace(/^(http)(s?:\/\/)/, 'ws$2');
  return wsUrl;
};

const connect = (roomId) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log('WebSocket already connected.');
    // If already connected, but for a different room, or to ensure subscription
    // It might be better to close existing and open new, or handle room subscription messages
    // For now, let's assume one connection, and room subscription is handled by sending messages
    // If the socket is open, we might still need to send a subscribe message if roomId changed
    // This simple version doesn't handle re-subscribing to a different room on an existing connection well.
    // A more robust solution would manage subscriptions explicitly.
    return;
  }

  const WS_URL = getWebSocketURL();
  console.log(`Connecting to WebSocket: ${WS_URL} for room ${roomId || 'general'}`);
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log('WebSocket connection established.');
    // Automatically subscribe to a room if roomId is provided on connect
    // This is a design choice; alternatively, subscription is a separate step.
    if (roomId) {
      // This initial subscription is now handled by RoomPage.jsx useEffect
      // sendMessage({ action: 'subscribe_room', payload: { roomId } });
    }
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('WebSocket message received:', message);
      // Notify all registered listeners
      messageListeners.forEach(listener => listener(message));
    } catch (error) {
      console.error('Error parsing WebSocket message or in listener:', error);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = (event) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
    socket = null; // Clear the socket instance
    // Optionally, implement reconnection logic here
  };
};

const disconnect = () => {
  if (socket) {
    console.log('Disconnecting WebSocket.');
    socket.close();
    socket = null;
  }
  messageListeners = []; // Clear listeners on disconnect
};

const sendMessage = (message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(message));
      console.log('WebSocket message sent:', message);
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  } else {
    console.error('WebSocket is not connected or not open. Message not sent:', message);
  }
};

// Functions to add/remove listeners for WebSocket messages
const addMessageListener = (callback) => {
  if (typeof callback === 'function' && !messageListeners.includes(callback)) {
    messageListeners.push(callback);
  }
};

const removeMessageListener = (callback) => {
  messageListeners = messageListeners.filter(listener => listener !== callback);
};

const getSocket = () => socket; // Expose socket instance if needed, e.g. for readyState check

const websocketService = {
  connect,
  disconnect,
  sendMessage,
  addMessageListener,
  removeMessageListener,
  getSocket,
};

export default websocketService;
