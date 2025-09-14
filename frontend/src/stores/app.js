import { writable } from 'svelte/store';

// App state
export const currentRound = writable(null);
export const currentHole = writable(1);
export const players = writable([]);
export const rounds = writable([]);
export const isLoading = writable(false);
export const error = writable(null);

// GPS state
export const gpsLocation = writable(null);
export const gpsError = writable(null);
export const gpsDistance = writable(0);
export const gpsTracking = writable(false);

// UI state
export const showModal = writable(false);
export const modalContent = writable(null);
export const activeTab = writable('rounds');

// Shot creation state
export const pendingShot = writable(null);
export const shotStartLocation = writable(null);

// Available colors for players
export const AVAILABLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'
];

// Available clubs
export const AVAILABLE_CLUBS = [
  'Driver', '3-Wood', '5-Wood', 'Hybrid', '4-Iron', '5-Iron', '6-Iron', 
  '7-Iron', '8-Iron', '9-Iron', 'PW', 'SW', 'LW', 'Putter'
];

// Available locations
export const AVAILABLE_LOCATIONS = [
  'tee', 'fairway', 'rough', 'bunker', 'water', 'green', 'off-course'
];

// Available target locations
export const AVAILABLE_TARGET_LOCATIONS = [
  'fairway', 'green', 'rough', 'bunker', 'water', 'off-course'
];

// Location labels for display
export const LOCATION_LABELS = {
  'tee': 'Tee',
  'fairway': 'Fairway',
  'rough': 'Rough',
  'bunker': 'Bunker',
  'water': 'Water',
  'green': 'Green',
  'off-course': 'Off Course',
  'penalty': 'Penalty'
};

// Club labels for display
export const CLUB_LABELS = {
  'Driver': 'Driver',
  '3-Wood': '3-Wood',
  '5-Wood': '5-Wood',
  'Hybrid': 'Hybrid',
  '4-Iron': '4-Iron',
  '5-Iron': '5-Iron',
  '6-Iron': '6-Iron',
  '7-Iron': '7-Iron',
  '8-Iron': '8-Iron',
  '9-Iron': '9-Iron',
  'PW': 'Pitching Wedge',
  'SW': 'Sand Wedge',
  'LW': 'Lob Wedge',
  'Putter': 'Putter',
  'Penalty': 'Penalty Stroke'
};

// Helper functions
export function getPlayerColor(playerId) {
  let color = '#007AFF'; // default
  players.subscribe(p => {
    const player = p.find(pl => pl.id === playerId);
    if (player) color = player.color;
  })();
  return color;
}

export function formatDistance(distance) {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)}km`;
  }
  return `${distance}m`;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
