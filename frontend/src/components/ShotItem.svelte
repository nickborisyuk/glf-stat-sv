<script>
  import { createEventDispatcher } from 'svelte';
  import { LOCATION_LABELS, CLUB_LABELS } from '../stores/app.js';

  export let shot;
  export let canDelete = false;
  export let isPending = false;

  const dispatch = createEventDispatcher();

  function deleteShot() {
    if (confirm('Are you sure you want to delete this shot?')) {
      dispatch('delete', shot.id);
    }
  }

  function formatDistance(distance) {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)}km`;
    }
    return `${distance}m`;
  }
</script>

<div class="shot-item">
  <div class="flex items-center gap-3 flex-1">
    <!-- Shot Number -->
    <div 
      class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-white shadow-sm"
      style="background-color: {shot.player?.color || '#6b7280'}"
    >
      <span class="text-sm font-semibold text-white">{shot.shotNumber}</span>
    </div>

    <!-- Shot Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <span class="font-medium text-ios-gray-900">{shot.player?.name || 'Unknown Player'}</span>
        <span class="text-ios-gray-500">•</span>
        <span class="font-medium text-ios-gray-900">{CLUB_LABELS[shot.club] || shot.club}</span>
        <span class="text-ios-gray-500">•</span>
        <span class="text-ios-gray-600">{LOCATION_LABELS[shot.location] || shot.location}</span>
        {#if shot.distance > 0}
          <span class="text-ios-gray-500">•</span>
          <span class="text-ios-gray-600">{formatDistance(shot.distance)}</span>
        {/if}
      </div>
      
      {#if isPending}
        <p class="text-sm text-ios-blue font-medium">In progress... (Distance: {shot.distance || 0}m)</p>
      {:else if shot.result === 'fail' && shot.error}
        <p class="text-sm text-ios-red">{shot.error}</p>
      {:else if shot.targetLocation}
        <p class="text-sm text-ios-gray-600">
          Target: {LOCATION_LABELS[shot.targetLocation] || shot.targetLocation}
        </p>
      {/if}
    </div>

    <!-- Status Indicators -->
    <div class="flex items-center gap-2">
      <!-- Success/Fail Indicator -->
      <div class="success-indicator {shot.result}"></div>
      
      <!-- Penalty Indicator -->
      {#if shot.isPenalty}
        <div class="px-2 py-1 bg-ios-orange/20 text-ios-orange rounded-full text-xs font-medium">
          Penalty
        </div>
      {/if}
    </div>
  </div>

  <!-- Delete Button -->
  {#if canDelete}
    <button
      on:click={deleteShot}
      class="flex-shrink-0 p-2 text-ios-red hover:bg-ios-red/10 rounded-lg transition-colors"
      title="Delete shot"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  {/if}
</div>
