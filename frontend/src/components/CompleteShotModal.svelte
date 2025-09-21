<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { gpsDistance, gpsError } from '../stores/app.js';
  import { fade } from 'svelte/transition';

  export let pendingShot;
  export let AVAILABLE_TARGET_LOCATIONS;
  export let LOCATION_LABELS;
  export let AVAILABLE_ERROR_TYPES;
  export let ERROR_TYPE_LABELS;
  export let distance = 0;

  const dispatch = createEventDispatcher();

  let targetLocation = '';
  let result = 'success';
  let error = '';
  let errorType = '';
  let isPenalty = false;
  let showTargetOptions = false;
  let showErrorTypeOptions = false;

  // No default target location - user must select

  onMount(() => {
    // Initialize distance from GPS if not provided
    if (!distance) {
      distance = $gpsDistance;
    }
  });

  function completeShot() {
    if (!targetLocation) {
      console.error('CompleteShotModal: targetLocation is required');
      return;
    }

    const shotData = {
      targetLocation,
      result,
      error: result === 'fail' ? error : null,
      distance: parseInt(distance) || 0,
      isPenalty: Boolean(isPenalty)
    };

    console.log('CompleteShotModal: dispatching complete with data:', shotData);
    dispatch('complete', shotData);
  }

  function cancelShot() {
    dispatch('cancel');
  }

  function selectTargetLocation(location) {
    targetLocation = location;
    showTargetOptions = false;
  }

  function selectErrorType(errorTypeValue) {
    errorType = errorTypeValue;
    error = ERROR_TYPE_LABELS[errorTypeValue] || errorTypeValue;
    showErrorTypeOptions = false;
  }

  function toggleResult() {
    result = result === 'success' ? 'fail' : 'success';
    if (result === 'success') {
      error = '';
      errorType = '';
    }
  }

  // Reactive computed value for button state
  $: canComplete = targetLocation && (result === 'success' || (result === 'fail' && errorType.trim()));

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
          {pendingShot.player.name} • {pendingShot.club} • {pendingShot.location}
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
        <span class="text-2xl font-bold text-ios-blue">{formatDistance($gpsDistance)}</span>
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
        />
        <p class="text-xs text-ios-gray-500 mt-1">
          GPS measured: {formatDistance($gpsDistance)}
        </p>
      </div>

      <!-- Target Location -->
      <div>
        <label class="block text-sm font-medium text-ios-gray-700 mb-2">
          Where did the ball land?
        </label>
        <button
          on:click={() => showTargetOptions = !showTargetOptions}
          class="w-full flex items-center justify-between p-4 border border-ios-gray-300 rounded-xl hover:border-ios-blue transition-colors"
        >
          <span class="text-ios-gray-700">
            {targetLocation || 'Select target location'}
          </span>
          <svg 
            class="w-5 h-5 text-ios-gray-400 transition-transform {showTargetOptions ? 'rotate-180' : ''}"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {#if showTargetOptions}
          <div class="mt-3 grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
            {#each AVAILABLE_TARGET_LOCATIONS as location}
              <button
                on:click={() => selectTargetLocation(location)}
                class="p-3 rounded-xl border border-ios-gray-200 hover:border-ios-blue hover:bg-ios-blue/5 transition-colors text-left"
              >
                <span class="font-medium text-ios-gray-900 capitalize">
                  {LOCATION_LABELS[location] || location}
                </span>
              </button>
            {/each}
          </div>
        {/if}
      </div>

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

      <!-- Error Type (if failed) -->
      {#if result === 'fail'}
        <div>
          <label for="error-type" class="block text-sm font-medium text-ios-gray-700 mb-2">
            What went wrong?
          </label>
          <button
            id="error-type"
            on:click={() => showErrorTypeOptions = !showErrorTypeOptions}
            class="w-full flex items-center justify-between p-4 border border-ios-gray-300 rounded-xl hover:border-ios-blue transition-colors"
          >
            <span class="text-ios-gray-700">
              {errorType ? ERROR_TYPE_LABELS[errorType] : 'Select error type'}
            </span>
            <svg 
              class="w-5 h-5 text-ios-gray-400 transition-transform {showErrorTypeOptions ? 'rotate-180' : ''}"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {#if showErrorTypeOptions}
            <div class="mt-3 grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {#each AVAILABLE_ERROR_TYPES as errorTypeValue}
                <button
                  on:click={() => selectErrorType(errorTypeValue)}
                  class="p-3 rounded-xl border border-ios-gray-200 hover:border-ios-blue hover:bg-ios-blue/5 transition-colors text-left"
                >
                  <span class="font-medium text-ios-gray-900">
                    {ERROR_TYPE_LABELS[errorTypeValue] || errorTypeValue}
                  </span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Penalty Shot -->
      <div class="flex items-center gap-3">
        <input
          id="penalty"
          type="checkbox"
          bind:checked={isPenalty}
          class="w-5 h-5 text-ios-blue border-ios-gray-300 rounded focus:ring-ios-blue"
        />
        <label for="penalty" class="text-sm font-medium text-ios-gray-700">
          This is a penalty shot
        </label>
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
</div>
