import { API_BASE, API_TIMEOUT, buildApiUrl } from '../config/api.js';
import { cacheBuster } from './cache-buster.js';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const baseUrl = buildApiUrl(endpoint);
  const url = cacheBuster.bustCache(baseUrl);
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
    console.log('🌐 API Request:', { url, config });
    
    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(url, {
      ...config,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
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
    
    if (error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408, { originalError: 'Request took too long' });
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
  update: (id, round) => request(`/rounds/${id}`, {
    method: 'PUT',
    body: round,
  }),
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
  getByRound: (roundId) => request(`/shots/round/${roundId}`),
  getClubs: () => request('/shots/clubs'),
  getLocations: () => request('/shots/locations'),
};

// Statistics API
export const statsApi = {
  getRoundStats: (roundId) => request(`/stats/rounds/${roundId}`),
  getClubStats: (roundId) => request(`/stats/rounds/${roundId}/clubs`),
  getLocationStats: (roundId) => request(`/stats/rounds/${roundId}/locations`),
  getGlobalStats: () => request('/stats/global'),
  getPlayerStats: (playerId) => request(`/stats/players/${playerId}`),
};

// Health check
export const healthApi = {
  check: () => request('/health'),
};

export { ApiError };
