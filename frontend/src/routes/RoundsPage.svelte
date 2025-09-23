<script>
  import { onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import { rounds, players, error, isLoading, selectedPlayer } from '../stores/app.js';
  import { roundsApi, playersApi } from '../lib/api.js';
  import { formatDate } from '../stores/app.js';
  import { fade, fly } from 'svelte/transition';
  import RoundCard from '../components/RoundCard.svelte';
  import AddRoundModal from '../components/AddRoundModal.svelte';


  let showAddModal = false;
  let filteredRounds = [];

  // Reactive statement to filter rounds by selected player
  $: {
    if ($selectedPlayer && $rounds.length > 0) {
      filteredRounds = $rounds.filter(round => 
        round.players && round.players.some(player => player.id === $selectedPlayer.id)
      );
    } else {
      filteredRounds = [];
    }
  }

  onMount(async () => {
    await loadData();
    await loadSelectedPlayer();
  });

  async function loadSelectedPlayer() {
    const playerId = sessionStorage.getItem('selectedPlayerId');
    if (playerId) {
      // Find player by ID from the loaded players
      const player = $players.find(p => p.id === playerId);
      if (player) {
        selectedPlayer.set(player);
      }
    }
  }

  async function loadData() {
    try {
      isLoading.set(true);
      const [roundsData, playersData] = await Promise.all([
        roundsApi.getAll(),
        playersApi.getAll()
      ]);
      
      rounds.set(roundsData);
      players.set(playersData);
    } catch (err) {
      console.error('Failed to load data:', err);
      error.set('Failed to load rounds data');
    } finally {
      isLoading.set(false);
    }
  }

  async function handleRoundAdded() {
    showAddModal = false;
    await loadData();
  }

  async function handleRoundDeleted() {
    await loadData();
  }

  function getRoundStats(round) {
    const totalPlayers = round.players ? round.players.length : 0;
    return {
      totalPlayers,
      playerNames: round.players ? round.players.map(p => p.name).join(', ') : 'No players'
    };
  }
</script>

<svelte:head>
  <title>Rounds - Golf Stats</title>
</svelte:head>

<div class="min-h-screen bg-ios-gray-50">
  <!-- Header -->
  <div class="bg-white border-b border-ios-gray-200 px-6 py-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold text-ios-gray-900">Rounds</h1>
        {#if $selectedPlayer}
          <button
            on:click={() => {
              sessionStorage.removeItem('selectedPlayerId');
              window.location.href = '#/';
            }}
            class="flex items-center gap-2 px-3 py-1 rounded-full bg-ios-blue/10 border border-ios-blue/20 hover:bg-ios-blue/20 transition-colors"
            title="Change Player"
          >
            <div 
              class="w-4 h-4 rounded-full border border-white shadow-sm"
              style="background-color: {$selectedPlayer.color}"
            ></div>
            <span class="text-sm font-medium text-ios-blue">{$selectedPlayer.name}</span>
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Rounds List -->
  <div class="p-6">
    {#if filteredRounds.length === 0}
      <div class="text-center py-12" transition:fade>
        <div class="w-24 h-24 mx-auto mb-4 bg-ios-gray-200 rounded-full flex items-center justify-center">
          <svg class="w-12 h-12 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-ios-gray-900 mb-2">
          {#if $selectedPlayer}
            No Rounds for {$selectedPlayer.name}
          {:else}
            No Rounds Yet
          {/if}
        </h3>
        <p class="text-ios-gray-600 mb-6">
          {#if $selectedPlayer}
            {$selectedPlayer.name} hasn't played any rounds yet. Create a new round to start tracking.
          {:else}
            Start tracking your golf games by creating a new round
          {/if}
        </p>
        <button
          on:click={() => showAddModal = true}
          class="btn-primary"
        >
          Create First Round
        </button>
      </div>
    {:else}
      <div class="grid gap-4">
        {#each filteredRounds as round (round.id)}
          <div transition:fly={{ y: 20, duration: 300 }}>
            <RoundCard 
              {round} 
              on:deleted={handleRoundDeleted}
            />
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Add Round Button -->
  <div class="fixed bottom-20 left-6 right-6 z-50">
    <button
      on:click={() => showAddModal = true}
      class="w-full btn-primary py-4 flex items-center justify-center gap-2"
    >
      <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      <span class="whitespace-nowrap">New Round</span>
    </button>
  </div>

  <!-- Add Round Modal -->
  {#if showAddModal}
    <AddRoundModal 
      on:close={() => showAddModal = false}
      on:added={handleRoundAdded}
    />
  {/if}
</div>