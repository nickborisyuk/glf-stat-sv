<script>
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { selectedPlayer } from '../stores/app.js';

  export let AVAILABLE_CLUBS;
  export let AVAILABLE_LOCATIONS;
  export let getDefaultLocation;

  const dispatch = createEventDispatcher();

  let selectedClub = '';
  let selectedLocation = '';
  let showClubModal = false;
  let showLocationModal = false;

  // Reactive computed value for button state
  $: canStart = $selectedPlayer && selectedClub && selectedLocation;

  // Set default location when player is selected (only for "From Where" field)
  $: if ($selectedPlayer && getDefaultLocation) {
    const defaultLoc = getDefaultLocation($selectedPlayer.id);
    if (defaultLoc && !selectedLocation) {
      selectedLocation = defaultLoc;
      console.log('ShotForm: set default location to:', defaultLoc, 'for player:', $selectedPlayer.name);
    }
  }

  function startShot() {
    if (!$selectedPlayer || !selectedClub || !selectedLocation) {
      return;
    }

    dispatch('start-shot', {
      player: $selectedPlayer,
      club: selectedClub,
      location: selectedLocation
    });
  }

  function closeModal() {
    dispatch('close');
  }


  function selectClub(club) {
    selectedClub = club;
    showClubModal = false;
  }

  function selectLocation(location) {
    selectedLocation = location;
    showLocationModal = false;
  }

  function canStartShot() {
    return $selectedPlayer && selectedClub && selectedLocation;
  }
</script>

<div 
  class="modal-overlay" 
  role="dialog" 
  aria-modal="true"
  on:click={closeModal}
  on:keydown={(e) => e.key === 'Escape' && closeModal()}
  transition:fade={{ duration: 200 }}
>
  <div class="modal-content" role="document" on:click|stopPropagation>
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-ios-gray-200">
      <h2 class="text-xl font-bold text-ios-gray-900">Start New Shot</h2>
      <button
        on:click={closeModal}
        class="p-2 text-ios-gray-400 hover:text-ios-gray-600 rounded-lg transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Form -->
    <div class="modal-body space-y-6">

      <!-- Club Selection -->
      <div>
        <label class="block text-sm font-medium text-ios-gray-700 mb-2">
          Select Club
        </label>
        <button
          on:click={() => showClubModal = true}
          class="w-full flex items-center justify-between p-4 border border-ios-gray-300 rounded-xl hover:border-ios-blue transition-colors"
        >
          <span class="text-ios-gray-700">
            {selectedClub || 'Choose a club'}
          </span>
          <svg 
            class="w-5 h-5 text-ios-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Location Selection -->
      <div>
        <label class="block text-sm font-medium text-ios-gray-700 mb-2">
          From Where
        </label>
        <button
          on:click={() => showLocationModal = true}
          class="w-full flex items-center justify-between p-4 border border-ios-gray-300 rounded-xl hover:border-ios-blue transition-colors"
        >
          <span class="text-ios-gray-700">
            {selectedLocation || 'Choose starting location'}
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
        on:click={closeModal}
        class="flex-1 btn-secondary"
      >
        Cancel
      </button>
      <button
        on:click={startShot}
        disabled={!canStart}
        class="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Start Shot
      </button>
    </div>
  </div>

  <!-- Club Selection Modal -->
  {#if showClubModal}
    <div 
      class="absolute inset-0 bg-black/50 flex items-center justify-center z-50" 
      transition:fade
      on:click={() => showClubModal = false}
    >
      <div 
        class="w-[95%] h-[95%] bg-white rounded-3xl overflow-hidden" 
        transition:fly={{ y: 300, duration: 300 }}
        on:click|stopPropagation
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-ios-gray-200">
          <h3 class="text-xl font-bold text-ios-gray-900">Select Club</h3>
          <button
            on:click={() => showClubModal = false}
            class="p-2 text-ios-gray-400 hover:text-ios-gray-600 rounded-lg transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Options -->
        <div class="p-6 grid grid-cols-2 gap-3 h-full overflow-y-auto">
          {#each AVAILABLE_CLUBS as club}
            <button
              on:click={() => selectClub(club)}
              class="p-4 rounded-xl border-2 transition-colors text-left
                     {selectedClub === club 
                       ? 'border-ios-blue bg-ios-blue/10 text-ios-blue' 
                       : 'border-ios-gray-200 hover:border-ios-blue hover:bg-ios-blue/5 text-ios-gray-900'}"
            >
              <span class="font-medium text-lg">{club}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- Location Selection Modal -->
  {#if showLocationModal}
    <div 
      class="absolute inset-0 bg-black/50 flex items-center justify-center z-50" 
      transition:fade
      on:click={() => showLocationModal = false}
    >
      <div 
        class="w-[95%] h-[95%] bg-white rounded-3xl overflow-hidden" 
        transition:fly={{ y: 300, duration: 300 }}
        on:click|stopPropagation
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-ios-gray-200">
          <h3 class="text-xl font-bold text-ios-gray-900">From Where</h3>
          <button
            on:click={() => showLocationModal = false}
            class="p-2 text-ios-gray-400 hover:text-ios-gray-600 rounded-lg transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Options -->
        <div class="p-6 space-y-3 h-full overflow-y-auto">
          {#each AVAILABLE_LOCATIONS as location}
            <button
              on:click={() => selectLocation(location)}
              class="w-full p-4 rounded-xl border-2 transition-colors text-left
                     {selectedLocation === location 
                       ? 'border-ios-blue bg-ios-blue/10 text-ios-blue' 
                       : 'border-ios-gray-200 hover:border-ios-blue hover:bg-ios-blue/5 text-ios-gray-900'}"
            >
              <span class="font-medium text-lg capitalize">{location}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
