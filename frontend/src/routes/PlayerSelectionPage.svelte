<script>
  import { onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import { players, selectedPlayer, error, isLoading } from '../stores/app.js';
  import { playersApi } from '../lib/api.js';
  import { AVAILABLE_COLORS } from '../stores/app.js';
  import { fade, fly } from 'svelte/transition';
  import AddPlayerModal from '../components/AddPlayerModal.svelte';

  let showAddModal = false;
  let availableColors = AVAILABLE_COLORS;

  onMount(async () => {
    await loadPlayers();
    loadAvailableColors();
    loadSelectedPlayerFromSession();
  });

  function loadSelectedPlayerFromSession() {
    const playerId = sessionStorage.getItem('selectedPlayerId');
    if (playerId) {
      const player = $players.find(p => p.id === playerId);
      if (player) {
        selectedPlayer.set(player);
      }
    }
  }

  async function loadPlayers() {
    try {
      isLoading.set(true);
      const playersData = await playersApi.getAll();
      players.set(playersData);
    } catch (err) {
      console.error('Failed to load players:', err);
      error.set('Failed to load players');
    } finally {
      isLoading.set(false);
    }
  }

  function loadAvailableColors() {
    availableColors = AVAILABLE_COLORS;
  }

  async function handlePlayerAdded() {
    showAddModal = false;
    await loadPlayers();
    loadAvailableColors();
    loadSelectedPlayerFromSession();
  }

  function selectPlayer(player) {
    // Save player ID to sessionStorage
    sessionStorage.setItem('selectedPlayerId', player.id);
    // Navigate to rounds page
    window.location.href = '#/rounds';
  }

  function isPlayerSelected(player) {
    return $selectedPlayer?.id === player.id;
  }
</script>

<svelte:head>
  <title>Select Player - Golf Stats</title>
</svelte:head>

<div class="min-h-screen bg-ios-gray-50">
  <!-- Header -->
  <div class="bg-white border-b border-ios-gray-200 px-6 py-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-ios-gray-900">Select Player</h1>
      <button
        on:click={() => showAddModal = true}
        class="btn-primary text-sm px-3 py-2 flex items-center gap-2 whitespace-nowrap"
      >
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span class="whitespace-nowrap">Add Player</span>
      </button>
    </div>
  </div>

  <!-- Content -->
  <div class="p-6">
    {#if $players.length === 0}
      <div class="text-center py-12" transition:fade>
        <div class="w-24 h-24 mx-auto mb-4 bg-ios-gray-200 rounded-full flex items-center justify-center">
          <svg class="w-12 h-12 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-ios-gray-900 mb-2">No Players Yet</h3>
        <p class="text-ios-gray-600 mb-6">Add a player to start tracking your golf statistics</p>
        <button
          on:click={() => showAddModal = true}
          class="btn-primary"
        >
          Add Your First Player
        </button>
      </div>
    {:else}
      <div class="max-w-md mx-auto">
        <div class="text-center mb-8">
          <h2 class="text-xl font-semibold text-ios-gray-900 mb-2">Choose Your Player</h2>
          <p class="text-ios-gray-600">Select the player you want to track statistics for</p>
        </div>
        
        <div class="space-y-4">
          {#each $players as player (player.id)}
            <button
              on:click={() => selectPlayer(player)}
              class="w-full flex items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-200
                     {isPlayerSelected(player) 
                       ? 'border-ios-blue bg-ios-blue/10 shadow-lg' 
                       : 'border-ios-gray-200 hover:border-ios-gray-300 hover:shadow-md'}"
              transition:fly={{ y: 20, duration: 300 }}
            >
              <div 
                class="w-12 h-12 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                style="background-color: {player.color}"
              ></div>
              <div class="flex-1 text-left">
                <h3 class="text-lg font-semibold text-ios-gray-900">{player.name}</h3>
                <p class="text-sm text-ios-gray-600">Click to select this player</p>
              </div>
              {#if isPlayerSelected(player)}
                <svg class="w-6 h-6 text-ios-blue flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              {:else}
                <svg class="w-6 h-6 text-ios-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Add Player Modal -->
  {#if showAddModal}
    <AddPlayerModal 
      {availableColors}
      on:close={() => showAddModal = false}
      on:added={handlePlayerAdded}
    />
  {/if}
</div>
