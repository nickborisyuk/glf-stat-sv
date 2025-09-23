import { writable } from 'svelte/store';

// App state
export const currentRound = writable(null);
export const currentHole = writable(1);
export const players = writable([]);
export const rounds = writable([]);
// Create selectedPlayer store with localStorage persistence
const createSelectedPlayerStore = () => {
  const { subscribe, set, update } = writable(null);
  
  // Check if we're in browser environment
  const isBrowser = typeof window !== 'undefined';
  
  return {
    subscribe,
    set: (player) => {
      if (isBrowser) {
        if (player) {
          localStorage.setItem('selectedPlayer', JSON.stringify(player));
        } else {
          localStorage.removeItem('selectedPlayer');
        }
      }
      set(player);
    },
    update,
          // Load from localStorage on initialization
          load: () => {
            if (isBrowser) {
              const stored = localStorage.getItem('selectedPlayer');
              if (stored) {
                try {
                  const player = JSON.parse(stored);
                  set(player);
                } catch (e) {
                  console.error('Failed to parse stored player:', e);
                  localStorage.removeItem('selectedPlayer');
                }
              }
            }
          }
  };
};

export const selectedPlayer = createSelectedPlayerStore();
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

// Available locations (From Where)
export const AVAILABLE_LOCATIONS = [
  'tee', 'left_rough', 'right_rough', 'fairway', 'green', 'bunker', 'left_woods', 'right_woods', 'downgrade', 'fringe'
];

// Available target locations (Where did the ball land)
export const AVAILABLE_TARGET_LOCATIONS = [
  'tee', 'left_rough', 'right_rough', 'fairway', 'green', 'bunker', 'left_woods', 'right_woods', 'downgrade', 'water', 'hole', 'fringe'
];

// Location labels for display
export const LOCATION_LABELS = {
  'tee': 'Ти',
  'left_rough': 'Левый раф',
  'right_rough': 'Правый раф',
  'fairway': 'Fairway',
  'green': 'Грин',
  'bunker': 'Бункер',
  'left_woods': 'Левый лес',
  'right_woods': 'Правый лес',
  'downgrade': 'Доугое',
  'water': 'Вода',
  'hole': 'Лунка',
  'fringe': 'Прегрин',
  'penalty': 'Penalty'
};

// Available error types (What went wrong)
export const AVAILABLE_ERROR_TYPES = [
  'direction', 'slice', 'hook', 'ground', 'top', 'chunk', 'air_shot', 'bounce'
];

// Error type labels for display
export const ERROR_TYPE_LABELS = {
  'direction': 'Направление',
  'slice': 'Слайс',
  'hook': 'Хук',
  'ground': 'Земля',
  'top': 'По верху мяча',
  'chunk': 'Срез',
  'air_shot': 'Эйршот',
  'bounce': 'Отскок/ветка'
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
