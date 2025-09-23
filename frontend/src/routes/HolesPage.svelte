<script>
  import { onMount } from 'svelte';
  import { link, params } from 'svelte-spa-router';
  import { currentRound, error, isLoading, selectedPlayer, players } from '../stores/app.js';
  import { roundsApi, playersApi } from '../lib/api.js';

  let round = null;
  let holes = [];

  // Get roundId from URL parameters
  $: roundId = $params?.id;

  onMount(async () => {
    console.log('HolesPage mounted with roundId:', roundId);
    await loadRound();
    await loadSelectedPlayerFromSession();
  });

  async function loadSelectedPlayerFromSession() {
    const playerId = sessionStorage.getItem('selectedPlayerId');
    if (playerId) {
      // Load players first if not already loaded
      if ($players.length === 0) {
        const playersData = await playersApi.getAll();
        players.set(playersData);
      }
      const player = $players.find(p => p.id === playerId);
      if (player) {
        selectedPlayer.set(player);
      }
    }
  }

  // Reload when roundId changes
  $: if ($params && roundId) {
    loadRound();
  }

  async function loadRound() {
    try {
      if (!roundId) {
        console.log('Round ID not available yet');
        return;
      }

      isLoading.set(true);
      console.log('Loading round with ID:', roundId);
      round = await roundsApi.getById(roundId);
      currentRound.set(round);
      
      // Generate holes array (18 or 9 holes based on course type)
      const holeCount = round.courseType === 'academic' ? 9 : 18;
      holes = Array.from({ length: holeCount }, (_, i) => ({
        number: i + 1,
        hasShots: round.shots ? round.shots.some(shot => shot.holeNumber === i + 1) : false
      }));
    } catch (err) {
      console.error('Failed to load round:', err);
      error.set(`Failed to load round: ${err.message || 'Unknown error'}`);
    } finally {
      isLoading.set(false);
    }
  }

  function getHoleButtonClass(hole) {
    let baseClass = 'hole-button';
    if (hole.hasShots) {
      baseClass += ' has-shots';
    }
    return baseClass;
  }
</script>

<svelte:head>
  <title>Holes - {round?.course || 'Round'}</title>
</svelte:head>

{#if round}
  <div class="min-h-screen bg-ios-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-ios-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div>
            <h1 class="text-xl font-bold text-ios-gray-900">{round.course}</h1>
            <p class="text-ios-gray-600 text-sm">
              {new Date(round.date).toLocaleDateString()} • 
              {round.courseType === 'championship' ? 'Championship' : 'Academic'}
            </p>
          </div>
          {#if $selectedPlayer}
            <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-ios-blue/10 border border-ios-blue/20">
              <div 
                class="w-4 h-4 rounded-full border border-white shadow-sm"
                style="background-color: {$selectedPlayer.color}"
              ></div>
              <span class="text-sm font-medium text-ios-blue">{$selectedPlayer.name}</span>
            </div>
          {/if}
        </div>
        <div class="flex items-center gap-2">
                  <button
                    on:click={() => {
                      sessionStorage.removeItem('selectedPlayerId');
                      window.location.href = '#/';
                    }}
                    class="btn-secondary text-sm px-3 py-2"
                    title="Change Player"
                  >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
          <a href="/rounds" use:link class="btn-secondary text-sm px-4 py-2">
          Back to Rounds
        </a>
      </div>
    </div>


    <!-- Holes Grid -->
    <div class="p-6">
      <h2 class="text-lg font-semibold text-ios-gray-900 mb-4">Select a Hole</h2>
      
      <div class="grid grid-cols-3 gap-4">
        {#each holes as hole}
          <a
            href="/rounds/{roundId}/holes/{hole.number}"
            use:link
            class={getHoleButtonClass(hole)}
          >
            {hole.number}
          </a>
        {/each}
      </div>

      <!-- Legend -->
      <div class="mt-8 flex items-center justify-center gap-6">
        <div class="flex items-center gap-2">
          <div class="hole-button"></div>
          <span class="text-sm text-ios-gray-600">Not started</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="hole-button has-shots"></div>
          <span class="text-sm text-ios-gray-600">In progress</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="hole-button active"></div>
          <span class="text-sm text-ios-gray-600">Current</span>
        </div>
      </div>
    </div>
  </div>
</div>
{:else}
  <div class="min-h-screen bg-ios-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="w-16 h-16 mx-auto mb-4 bg-ios-gray-200 rounded-full flex items-center justify-center">
        <svg class="w-8 h-8 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-ios-gray-900 mb-2">Loading Round</h3>
      <p class="text-ios-gray-600">Please wait...</p>
    </div>
  </div>
{/if}
