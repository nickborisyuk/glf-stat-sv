<script>
  import { onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import { rounds, players, error, isLoading } from '../stores/app.js';
  import { roundsApi, playersApi } from '../lib/api.js';
  import { formatDate } from '../stores/app.js';
  import { fade, fly } from 'svelte/transition';
  import RoundCard from '../components/RoundCard.svelte';
  import AddRoundModal from '../components/AddRoundModal.svelte';

  let showAddModal = false;

  onMount(async () => {
    await loadData();
  });

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
      <h1 class="text-2xl font-bold text-ios-gray-900">Rounds</h1>
      <button
        on:click={() => showAddModal = true}
        class="btn-primary text-sm px-4 py-2 flex items-center gap-2 whitespace-nowrap"
        disabled={$players.length === 0}
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span class="whitespace-nowrap">New Round</span>
      </button>
    </div>
  </div>

  <!-- Rounds List -->
  <div class="p-6">
    {#if $players.length === 0}
      <div class="text-center py-12" transition:fade>
        <div class="w-24 h-24 mx-auto mb-4 bg-ios-gray-200 rounded-full flex items-center justify-center">
          <svg class="w-12 h-12 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-ios-gray-900 mb-2">No Players Available</h3>
        <p class="text-ios-gray-600 mb-6">You need to add players before creating rounds</p>
        <a href="/players" use:link class="btn-primary">
          Add Players First
        </a>
      </div>
    {:else if $rounds.length === 0}
      <div class="text-center py-12" transition:fade>
        <div class="w-24 h-24 mx-auto mb-4 bg-ios-gray-200 rounded-full flex items-center justify-center">
          <svg class="w-12 h-12 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-ios-gray-900 mb-2">No Rounds Yet</h3>
        <p class="text-ios-gray-600 mb-6">Start tracking your golf games by creating a new round</p>
        <button
          on:click={() => showAddModal = true}
          class="btn-primary"
        >
          Create First Round
        </button>
      </div>
    {:else}
      <div class="grid gap-4">
        {#each $rounds as round (round.id)}
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

  <!-- Add Round Modal -->
  {#if showAddModal && $players.length > 0}
    <AddRoundModal 
      players={$players}
      on:close={() => showAddModal = false}
      on:added={handleRoundAdded}
    />
  {/if}
</div>
