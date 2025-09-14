const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0, { originalError: error.message });
  }
}

// Players API
export const playersApi = {
  getAll: () => request('/players'),
  create: (player) => request('/players', {
    method: 'POST',
    body: player,
  }),
  delete: (id) => request(`/players/${id}`, {
    method: 'DELETE',
  }),
  getAvailableColors: () => request('/players/available-colors'),
};

// Rounds API
export const roundsApi = {
  getAll: () => request('/rounds'),
  create: (round) => request('/rounds', {
    method: 'POST',
    body: round,
  }),
  getById: (id) => request(`/rounds/${id}`),
  delete: (id) => request(`/rounds/${id}`, {
    method: 'DELETE',
  }),
  getShots: (roundId, holeId) => request(`/rounds/${roundId}/holes/${holeId}/shots`),
};

// Shots API
export const shotsApi = {
  create: (shot) => request('/shots', {
    method: 'POST',
    body: shot,
  }),
  update: (id, shot) => request(`/shots/${id}`, {
    method: 'PUT',
    body: shot,
  }),
  delete: (id) => request(`/shots/${id}`, {
    method: 'DELETE',
  }),
  createPenalty: (data) => request('/shots/penalty', {
    method: 'POST',
    body: data,
  }),
  getClubs: () => request('/shots/clubs'),
  getLocations: () => request('/shots/locations'),
};

// Statistics API
export const statsApi = {
  getRoundStats: (roundId) => request(`/stats/rounds/${roundId}`),
  getClubStats: (roundId) => request(`/stats/rounds/${roundId}/clubs`),
  getLocationStats: (roundId) => request(`/stats/rounds/${roundId}/locations`),
  getGlobalStats: () => request('/stats/global'),
};

// Health check
export const healthApi = {
  check: () => request('/health'),
};

export { ApiError };
