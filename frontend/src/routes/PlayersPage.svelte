<script>
  import { onMount } from 'svelte';
  import { players, error, isLoading } from '../stores/app.js';
  import { playersApi } from '../lib/api.js';
  import { AVAILABLE_COLORS } from '../stores/app.js';
  import { fade, fly } from 'svelte/transition';
  import PlayerCard from '../components/PlayerCard.svelte';
  import AddPlayerModal from '../components/AddPlayerModal.svelte';

  let showAddModal = false;
  let availableColors = AVAILABLE_COLORS;

  onMount(async () => {
    await loadPlayers();
    loadAvailableColors();
  });

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
    // Use constants instead of API call
    availableColors = AVAILABLE_COLORS;
  }

  async function handlePlayerAdded() {
    showAddModal = false;
    await loadPlayers();
    loadAvailableColors();
  }

  async function handlePlayerDeleted() {
    await loadPlayers();
    loadAvailableColors();
  }
</script>

<svelte:head>
  <title>Players - Golf Stats</title>
</svelte:head>

<div class="min-h-screen bg-ios-gray-50">
  <!-- Header -->
  <div class="bg-white border-b border-ios-gray-200 px-6 py-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-ios-gray-900">Players</h1>
      <button
        on:click={() => showAddModal = true}
        class="btn-primary text-sm px-4 py-2"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Player
      </button>
    </div>
  </div>

  <!-- Players List -->
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
        <p class="text-ios-gray-600 mb-6">Add players to start tracking your golf games</p>
        <button
          on:click={() => showAddModal = true}
          class="btn-primary"
        >
          Add Your First Player
        </button>
      </div>
    {:else}
      <div class="grid gap-4">
        {#each $players as player (player.id)}
          <div transition:fly={{ y: 20, duration: 300 }}>
            <PlayerCard 
              {player} 
              {availableColors}
              on:deleted={handlePlayerDeleted}
            />
          </div>
        {/each}
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
