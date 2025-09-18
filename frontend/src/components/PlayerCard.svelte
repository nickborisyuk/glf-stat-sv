<script>
  import { createEventDispatcher } from 'svelte';
  import { playersApi } from '../lib/api.js';
  import { error } from '../stores/app.js';

  export let player;
  export const availableColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  const dispatch = createEventDispatcher();

  async function deletePlayer() {
    if (!confirm(`Are you sure you want to delete ${player.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await playersApi.delete(player.id);
      dispatch('deleted');
    } catch (err) {
      console.error('Failed to delete player:', err);
      error.set('Failed to delete player');
    }
  }
</script>

<div class="card">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <!-- Player Color Indicator -->
      <div 
        class="player-color-indicator"
        style="background-color: {player.color}"
      ></div>
      
      <!-- Player Info -->
      <div>
        <h3 class="font-semibold text-ios-gray-900 text-lg">{player.name}</h3>
        <p class="text-ios-gray-600 text-sm">
          Added {new Date(player.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2">
      <button
        on:click={deletePlayer}
        class="p-2 text-ios-red hover:bg-ios-red/10 rounded-lg transition-colors"
        title="Delete player"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
</div>
