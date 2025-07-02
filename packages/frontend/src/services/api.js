const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Helper function for API requests
const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;

  // Ensure credentials 'include' is set for all requests to handle HttpOnly session cookies
  const fetchOptions = {
    ...options,
    credentials: 'include', // Important for sending/receiving cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      // Try to parse error message from backend if available
      let errorData;
      try {
        errorData = await response.json();
      } catch (_e) { // Renamed e to _e
        // Not a JSON error response
        errorData = { message: response.statusText };
      }
      console.error(`API Error ${response.status}: ${endpoint}`, errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    // Handle cases where response might be empty (e.g., 204 No Content)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json();
    }
    return response.text(); // Or handle as blob, etc., if needed, or just return response itself
  } catch (error) {
    console.error(`Network or other error for ${endpoint}:`, error);
    throw error; // Re-throw to be caught by calling function
  }
};

// --- Auth Service ---
const authService = {
  // loginWithDiscord: () => { // This is a redirect, so handled by window.location.href
  //   window.location.href = `${BASE_URL}/auth/discord`;
  // },
  checkAuthStatus: () => request('/auth/status'),
  logout: () => request('/auth/logout', { method: 'GET' }), // Or POST if preferred by backend
};

// --- Room Service ---
const roomService = {
  createRoom: (roomData) => request('/rooms', { method: 'POST', body: JSON.stringify(roomData) }),
  getRoomDetails: (roomId) => request(`/rooms/${roomId}`),
  joinRoom: (roomId) => request(`/rooms/${roomId}/join`, { method: 'POST' }),
  leaveRoom: (roomId) => request(`/rooms/${roomId}/leave`, { method: 'POST' }),
  startQuiz: (roomId) => request(`/rooms/${roomId}/start`, { method: 'POST' }),
  getCurrentQuestion: (roomId) => request(`/rooms/${roomId}/question`),
  submitAnswer: (roomId, choiceId) => request(`/rooms/${roomId}/answer`, { method: 'POST', body: JSON.stringify({ choiceId }) }),
};

// --- Leaderboard Service ---
const leaderboardService = {
  getGlobalLeaderboard: (limit = 100) => request(`/leaderboard?limit=${limit}`),
};


const apiService = {
  ...authService,
  ...roomService,
  ...leaderboardService,
  // Utility to get base URL if needed by other parts (e.g. WebSocket connection)
  getBaseUrl: () => BASE_URL,
};

export default apiService;
