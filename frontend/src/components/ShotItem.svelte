<script>
  import { createEventDispatcher } from 'svelte';
  import { LOCATION_LABELS, CLUB_LABELS } from '../stores/app.js';

  export let shot;
  export let canDelete = false;
  export let isPending = false;
  export let currentDistance = 0;

  const dispatch = createEventDispatcher();

  let isDeleting = false;

  function deleteShot() {
    if (isDeleting) return; // Prevent multiple clicks
    if (!shot?.id) return; // Ensure shot has valid ID
    
    if (confirm('Are you sure you want to delete this shot?')) {
      isDeleting = true;
      dispatch('delete', shot.id);
      // Reset after a short delay
      setTimeout(() => {
        isDeleting = false;
      }, 2000); // Increased delay to prevent rapid clicks
    }
  }

  function formatDistance(distance) {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)}km`;
    }
    return `${distance}m`;
  }

  function completeShot() {
    dispatch('complete', shot.id);
  }

  // Debug logging
  $: {
    console.log('ShotItem: rendering shot:', {
      id: shot?.id,
      error: shot?.error,
      result: shot?.result,
      isPenalty: shot?.isPenalty,
      isPending: isPending,
      fullShot: shot
    });
  }
</script>

<div class="shot-item {shot.isPenalty ? 'bg-red-50 border-red-200' : ''}">
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
        <span class="font-medium text-ios-gray-900">{CLUB_LABELS[shot.club] || shot.club}</span>
        <span class="text-ios-gray-500">•</span>
        <span class="text-ios-gray-600">{LOCATION_LABELS[shot.location] || shot.location}</span>
        <span class="text-ios-gray-500">•</span>
        <span class="text-ios-gray-600">
          {#if isPending}
            {formatDistance(currentDistance || shot.distance || 0)}
          {:else}
            {formatDistance(shot.distance || 0)}
          {/if}
        </span>
        {#if !isPending && !shot.isPenalty && shot.error}
          <span class="text-ios-gray-500">•</span>
          <span class="text-ios-red font-medium">{shot.error}</span>
        {/if}
      </div>
      
      {#if isPending}
        <p class="text-sm text-ios-blue font-medium">In progress... (Distance: {shot.distance || 0}m)</p>
      {:else if shot.isPenalty}
        <p class="text-sm text-red-600 font-medium">Penalty shot</p>
      {:else}
        <!-- Show target for all completed non-penalty shots -->
        {#if shot.targetLocation}
          <p class="text-sm text-ios-gray-600">
            Target: {LOCATION_LABELS[shot.targetLocation] || shot.targetLocation}
          </p>
        {/if}
      {/if}
    </div>

    <!-- Status Indicators -->
    <div class="flex items-center gap-2">
      <!-- Success/Fail Indicator (not shown for penalty shots) -->
      {#if !shot.isPenalty}
        <div class="success-indicator {shot.result}"></div>
      {/if}
      
      <!-- Penalty Indicator -->
      {#if shot.isPenalty}
        <div class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
          Penalty
        </div>
      {/if}
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="flex items-center gap-2">
    <!-- Complete Button (for pending shots) -->
    {#if isPending}
      <button
        on:click={completeShot}
        class="flex-shrink-0 p-2 bg-ios-blue text-white rounded-lg hover:bg-ios-blue/90 transition-colors"
        title="Complete shot"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </button>
    {/if}
    
    <!-- Delete Button -->
    {#if canDelete}
      <button
        on:click={deleteShot}
        disabled={isDeleting}
        class="flex-shrink-0 p-2 text-ios-red hover:bg-ios-red/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={isDeleting ? "Deleting..." : "Delete shot"}
      >
        {#if isDeleting}
          <div class="w-4 h-4 border-2 border-ios-red border-t-transparent rounded-full animate-spin"></div>
        {:else}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        {/if}
      </button>
    {/if}
  </div>
</div>
