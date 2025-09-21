<script>
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  export let players;
  export let AVAILABLE_CLUBS;
  export let AVAILABLE_LOCATIONS;
  export let getDefaultLocation;

  const dispatch = createEventDispatcher();

  let selectedPlayer = null;
  let selectedClub = '';
  let selectedLocation = '';
  let showClubOptions = false;
  let showLocationOptions = false;

  // Reactive computed value for button state
  $: canStart = selectedPlayer && selectedClub && selectedLocation;

  // Set default location when player is selected
  $: if (selectedPlayer && getDefaultLocation) {
    const defaultLoc = getDefaultLocation(selectedPlayer.id);
    if (defaultLoc && !selectedLocation) {
      selectedLocation = defaultLoc;
    }
  }

  function startShot() {
    if (!selectedPlayer || !selectedClub || !selectedLocation) {
      return;
    }

    dispatch('start-shot', {
      player: selectedPlayer,
      club: selectedClub,
      location: selectedLocation
    });
  }

  function closeModal() {
    dispatch('close');
  }

  function selectPlayer(player) {
    selectedPlayer = player;
  }

  function selectClub(club) {
    selectedClub = club;
    showClubOptions = false;
  }

  function selectLocation(location) {
    selectedLocation = location;
    showLocationOptions = false;
  }

  function canStartShot() {
    return selectedPlayer && selectedClub && selectedLocation;
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
      <!-- Player Selection -->
      <div>
        <label for="player-select" class="block text-sm font-medium text-ios-gray-700 mb-2">
          Select Player
        </label>
        <div class="grid grid-cols-1 gap-2" id="player-select">
          {#each players as player}
            <button
              on:click={() => selectPlayer(player)}
              class="flex items-center gap-3 p-3 rounded-xl border-2 transition-colors
                     {selectedPlayer?.id === player.id 
                       ? 'border-ios-blue bg-ios-blue/10' 
                       : 'border-ios-gray-200 hover:border-ios-gray-300'}"
            >
              <div 
                class="w-6 h-6 rounded-full border border-white shadow-sm"
                style="background-color: {player.color}"
              ></div>
              <span class="font-medium text-ios-gray-900">{player.name}</span>
              {#if selectedPlayer?.id === player.id}
                <svg class="w-5 h-5 ml-auto text-ios-blue" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <!-- Club Selection -->
      <div>
        <label class="block text-sm font-medium text-ios-gray-700 mb-2">
          Select Club
        </label>
        <button
          on:click={() => showClubOptions = !showClubOptions}
          class="w-full flex items-center justify-between p-4 border border-ios-gray-300 rounded-xl hover:border-ios-blue transition-colors"
        >
          <span class="text-ios-gray-700">
            {selectedClub || 'Choose a club'}
          </span>
          <svg 
            class="w-5 h-5 text-ios-gray-400 transition-transform {showClubOptions ? 'rotate-180' : ''}"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {#if showClubOptions}
          <div class="mt-3 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {#each AVAILABLE_CLUBS as club}
              <button
                on:click={() => selectClub(club)}
                class="p-3 rounded-xl border border-ios-gray-200 hover:border-ios-blue hover:bg-ios-blue/5 transition-colors text-left"
              >
                <span class="font-medium text-ios-gray-900">{club}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Location Selection -->
      <div>
        <label class="block text-sm font-medium text-ios-gray-700 mb-2">
          From Where
        </label>
        <button
          on:click={() => showLocationOptions = !showLocationOptions}
          class="w-full flex items-center justify-between p-4 border border-ios-gray-300 rounded-xl hover:border-ios-blue transition-colors"
        >
          <span class="text-ios-gray-700">
            {selectedLocation || 'Choose starting location'}
          </span>
          <svg 
            class="w-5 h-5 text-ios-gray-400 transition-transform {showLocationOptions ? 'rotate-180' : ''}"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {#if showLocationOptions}
          <div class="mt-3 grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
            {#each AVAILABLE_LOCATIONS as location}
              <button
                on:click={() => selectLocation(location)}
                class="p-3 rounded-xl border border-ios-gray-200 hover:border-ios-blue hover:bg-ios-blue/5 transition-colors text-left"
              >
                <span class="font-medium text-ios-gray-900 capitalize">{location}</span>
              </button>
            {/each}
          </div>
        {/if}
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
</div>
