<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { gpsDistance, gpsError } from '../stores/app.js';
  import { fade, fly } from 'svelte/transition';
  import * as gpsManager from '../lib/gps.js';

  export let pendingShot;
  export let AVAILABLE_TARGET_LOCATIONS;
  export let LOCATION_LABELS;
  export let AVAILABLE_ERROR_TYPES;
  export let ERROR_TYPE_LABELS;
  export let distance = 0;
  export let allShots = []; // All shots for this hole to determine last non-penalty location

  const dispatch = createEventDispatcher();

  let targetLocation = '';
  let result = 'success';
  let error = '';
  let errorType = '';
  let showTargetModal = false;
  let showErrorTypeModal = false;
  let isDistanceManuallySet = false;

  // No default target location - user must select

  onMount(() => {
    // Initialize distance from GPS if not provided
    if (!distance) {
      distance = Math.round($gpsDistance);
    }
    
    // Check if there's a next shot and set targetLocation accordingly
    setTargetLocationFromNextShot();
  });

  // Reactive statement to update distance from GPS if not manually set
  $: {
    if (!isDistanceManuallySet && $gpsDistance > 0) {
      distance = Math.round($gpsDistance);
    }
  }

  function getDisplayLocation() {
    // For both penalty and regular shots, find the last completed non-penalty shot's target location
    // This ensures we never show "penalty" as the starting location
    const completedNonPenaltyShots = allShots.filter(shot => 
      shot.id !== pendingShot.id && 
      !shot.isPenalty && 
      shot.targetLocation && 
      shot.result
    );
    
    if (completedNonPenaltyShots.length > 0) {
      // Sort by shot number and get the latest
      const latestShot = completedNonPenaltyShots.sort((a, b) => b.shotNumber - a.shotNumber)[0];
      return latestShot.targetLocation;
    }
    
    // Fallback to tee if no completed non-penalty shots
    return 'tee';
  }

  function setTargetLocationFromNextShot() {
    // Find the next shot for the same player
    const nextShot = allShots.find(shot => 
      shot.playerId === pendingShot.playerId &&
      shot.shotNumber === pendingShot.shotNumber + 1 &&
      shot.location // Next shot must have a location (meaning it's been created)
    );
    
    if (nextShot && nextShot.location) {
      // Set targetLocation to the location of the next shot
      targetLocation = nextShot.location;
      console.log('CompleteShotModal: Auto-set targetLocation from next shot:', nextShot.location);
    }
  }

  function restartGpsForNextShot() {
    // Find the next shot for the same player
    const nextShot = allShots.find(shot => 
      shot.playerId === pendingShot.playerId &&
      shot.shotNumber === pendingShot.shotNumber + 1 &&
      shot.location // Next shot must have a location (meaning it's been created)
    );
    
    if (nextShot) {
      // Restart GPS tracking for the next shot from current position
      gpsManager.startShotTracking(nextShot.id);
      console.log('CompleteShotModal: Restarted GPS tracking for next shot:', nextShot.id);
    }
  }

  function completeShot() {
    if (!pendingShot.isPenalty && !targetLocation) {
      console.error('CompleteShotModal: targetLocation is required for non-penalty shots');
      return;
    }

    const shotData = {
      targetLocation: pendingShot.isPenalty ? 'penalty' : targetLocation,
      result,
      error: errorType ? (ERROR_TYPE_LABELS[errorType] || errorType) : null, // Save error for both successful and failed shots
      distance: parseInt(distance) || 0,
      isPenalty: pendingShot.isPenalty
    };

    console.log('CompleteShotModal: dispatching complete with data:', shotData);
    console.log('CompleteShotModal: error value:', error);
    console.log('CompleteShotModal: errorType value:', errorType);
    
    // Restart GPS tracking for next shot if it exists
    restartGpsForNextShot();
    
    dispatch('complete', shotData);
  }

  function cancelShot() {
    dispatch('cancel');
  }

  function selectTargetLocation(location) {
    targetLocation = location;
    showTargetModal = false;
  }

  function selectErrorType(errorTypeValue) {
    errorType = errorTypeValue;
    error = ERROR_TYPE_LABELS[errorTypeValue] || errorTypeValue;
    showErrorTypeModal = false;
  }

  function toggleResult() {
    result = result === 'success' ? 'fail' : 'success';
    // Don't clear error when switching result - error can be set for any shot
  }

  // Reactive computed value for button state
  $: canComplete = pendingShot.isPenalty || targetLocation;

  function canCompleteShot() {
    return canComplete;
  }

  function formatDistance(dist) {
    if (dist >= 1000) {
      return `${(dist / 1000).toFixed(1)}km`;
    }
    return `${dist}m`;
  }
</script>

<div class="modal-overlay" role="dialog" aria-modal="true" on:click={cancelShot} on:keydown={(e) => e.key === 'Escape' && cancelShot} transition:fade={{ duration: 200 }}>
  <div class="modal-content" on:click|stopPropagation>
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-ios-gray-200">
      <div>
        <h2 class="text-xl font-bold text-ios-gray-900">Complete Shot</h2>
        <p class="text-ios-gray-600 text-sm mt-1">
          {pendingShot.player.name} • {pendingShot.club} • {LOCATION_LABELS[getDisplayLocation()] || getDisplayLocation()}
        </p>
      </div>
      <button
        on:click={cancelShot}
        class="p-2 text-ios-gray-400 hover:text-ios-gray-600 rounded-lg transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- GPS Distance Display -->
    <div class="px-6 py-4 bg-ios-blue/10 border-b border-ios-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-ios-blue rounded-full animate-pulse"></div>
          <span class="text-sm font-medium text-ios-blue">GPS Distance</span>
        </div>
        <span class="text-2xl font-bold text-ios-blue">{formatDistance(Math.round($gpsDistance))}</span>
      </div>
      {#if $gpsError}
        <p class="text-xs text-ios-red mt-1">GPS Error: {$gpsError}</p>
      {/if}
    </div>

    <!-- Form -->
    <div class="modal-body space-y-6">
      <!-- Distance -->
      <div>
        <label for="distance" class="block text-sm font-medium text-ios-gray-700 mb-2">
          Distance (meters)
        </label>
        <input
          id="distance"
          type="number"
          bind:value={distance}
          min="0"
          class="input-field"
          placeholder="Enter distance"
          on:input={() => isDistanceManuallySet = true}
        />
        <p class="text-xs text-ios-gray-500 mt-1">
          GPS measured: {formatDistance(Math.round($gpsDistance))}
        </p>
      </div>

      <!-- Target Location (not shown for penalty shots) -->
      {#if !pendingShot.isPenalty}
        <div>
          <label class="block text-sm font-medium text-ios-gray-700 mb-2">
            Where did the ball land?
          </label>
          <button
            on:click={() => showTargetModal = true}
            class="w-full flex items-center justify-between p-4 border border-ios-gray-300 rounded-xl hover:border-ios-blue transition-colors"
          >
            <span class="text-ios-gray-700">
              {targetLocation ? LOCATION_LABELS[targetLocation] || targetLocation : 'Select target location'}
            </span>
            <svg 
              class="w-5 h-5 text-ios-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      {/if}

      <!-- Result -->
      <div>
        <label class="block text-sm font-medium text-ios-gray-700 mb-2">
          Shot Result
        </label>
        <div class="grid grid-cols-2 gap-3">
          <button
            on:click={() => result = 'success'}
            class="p-4 rounded-xl border-2 transition-colors
                   {result === 'success' 
                     ? 'border-ios-green bg-ios-green/10 text-ios-green' 
                     : 'border-ios-gray-300 text-ios-gray-700 hover:border-ios-gray-400'}"
          >
            <div class="flex flex-col items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-ios-green/20 flex items-center justify-center">
                <svg class="w-5 h-5 text-ios-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
              <span class="font-medium">Success</span>
            </div>
          </button>
          
          <button
            on:click={() => result = 'fail'}
            class="p-4 rounded-xl border-2 transition-colors
                   {result === 'fail' 
                     ? 'border-ios-red bg-ios-red/10 text-ios-red' 
                     : 'border-ios-gray-300 text-ios-gray-700 hover:border-ios-gray-400'}"
          >
            <div class="flex flex-col items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-ios-red/20 flex items-center justify-center">
                <svg class="w-5 h-5 text-ios-red" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </div>
              <span class="font-medium">Failed</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Error Type (optional for any shot) -->
      <div>
        <label for="error-type" class="block text-sm font-medium text-ios-gray-700 mb-2">
          Shot Error (optional)
        </label>
        <button
          id="error-type"
          on:click={() => showErrorTypeModal = true}
          class="w-full flex items-center justify-between p-4 border border-ios-gray-300 rounded-xl hover:border-ios-blue transition-colors"
        >
          <span class="text-ios-gray-700">
            {errorType ? ERROR_TYPE_LABELS[errorType] : 'No error'}
          </span>
          <svg 
            class="w-5 h-5 text-ios-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

    </div>

    <!-- Actions -->
    <div class="modal-actions flex gap-3">
      <button
        on:click={cancelShot}
        class="flex-1 btn-secondary"
      >
        Cancel
      </button>
      <button
        on:click={completeShot}
        disabled={!canComplete}
        class="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Complete Shot
      </button>
    </div>
  </div>

  <!-- Target Location Selection Modal -->
  {#if showTargetModal}
    <div 
      class="absolute inset-0 bg-black/50 flex items-center justify-center z-50" 
      transition:fade
      on:click={() => showTargetModal = false}
    >
      <div 
        class="w-[95%] h-[95%] bg-white rounded-3xl overflow-hidden" 
        transition:fly={{ y: 300, duration: 300 }}
        on:click|stopPropagation
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-ios-gray-200">
          <h3 class="text-xl font-bold text-ios-gray-900">Where did the ball land?</h3>
          <button
            on:click={() => showTargetModal = false}
            class="p-2 text-ios-gray-400 hover:text-ios-gray-600 rounded-lg transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Options -->
        <div class="p-6 space-y-3 h-full overflow-y-auto">
          {#each AVAILABLE_TARGET_LOCATIONS as location}
            <button
              on:click={() => selectTargetLocation(location)}
              class="w-full p-4 rounded-xl border-2 transition-colors text-left
                     {targetLocation === location 
                       ? 'border-ios-blue bg-ios-blue/10 text-ios-blue' 
                       : 'border-ios-gray-200 hover:border-ios-blue hover:bg-ios-blue/5 text-ios-gray-900'}"
            >
              <span class="font-medium text-lg">
                {LOCATION_LABELS[location] || location}
              </span>
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- Error Type Selection Modal -->
  {#if showErrorTypeModal}
    <div 
      class="absolute inset-0 bg-black/50 flex items-center justify-center z-50" 
      transition:fade
      on:click={() => showErrorTypeModal = false}
    >
      <div 
        class="w-[95%] h-[95%] bg-white rounded-3xl overflow-hidden" 
        transition:fly={{ y: 300, duration: 300 }}
        on:click|stopPropagation
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-ios-gray-200">
          <h3 class="text-xl font-bold text-ios-gray-900">Shot Error (optional)</h3>
          <button
            on:click={() => showErrorTypeModal = false}
            class="p-2 text-ios-gray-400 hover:text-ios-gray-600 rounded-lg transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Options -->
        <div class="p-6 space-y-3 h-full overflow-y-auto">
          <button
            on:click={() => {
              errorType = '';
              error = '';
              showErrorTypeModal = false;
            }}
            class="w-full p-4 rounded-xl border-2 transition-colors text-left
                   {!errorType 
                     ? 'border-ios-blue bg-ios-blue/10 text-ios-blue' 
                     : 'border-ios-gray-200 hover:border-ios-blue hover:bg-ios-blue/5 text-ios-gray-900'}"
          >
            <span class="font-medium text-lg">No error</span>
          </button>
          {#each AVAILABLE_ERROR_TYPES as errorTypeValue}
            <button
              on:click={() => selectErrorType(errorTypeValue)}
              class="w-full p-4 rounded-xl border-2 transition-colors text-left
                     {errorType === errorTypeValue 
                       ? 'border-ios-blue bg-ios-blue/10 text-ios-blue' 
                       : 'border-ios-gray-200 hover:border-ios-blue hover:bg-ios-blue/5 text-ios-gray-900'}"
            >
              <span class="font-medium text-lg">
                {ERROR_TYPE_LABELS[errorTypeValue] || errorTypeValue}
              </span>
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
