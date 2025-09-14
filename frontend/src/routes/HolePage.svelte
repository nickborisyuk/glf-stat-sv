<script>
  import { onMount } from 'svelte';
  import { link, params } from 'svelte-spa-router';
  import { currentRound, currentHole, error, isLoading } from '../stores/app.js';
  import { roundsApi, shotsApi } from '../lib/api.js';
  import { gpsManager } from '../lib/gps.js';
  import { AVAILABLE_CLUBS, AVAILABLE_LOCATIONS, AVAILABLE_TARGET_LOCATIONS, LOCATION_LABELS, CLUB_LABELS } from '../stores/app.js';
  import { fade, fly } from 'svelte/transition';
  import ShotItem from '../components/ShotItem.svelte';
  import ShotForm from '../components/ShotForm.svelte';
  import CompleteShotModal from '../components/CompleteShotModal.svelte';

  // Get parameters from URL
  $: roundId = $params?.id;
  $: holeId = $params?.holeId;

  let round = null;
  let shots = [];
  let showShotForm = false;
  let showCompleteModal = false;
  let pendingShot = null;
  let shotStartLocation = null;
  let currentDistance = 0;

  // Reactive hole number
  $: holeNumber = holeId ? parseInt(holeId) : null;

  onMount(async () => {
    console.log('HolePage mounted with roundId:', roundId, 'holeId:', holeId);
    await loadData();
    if (holeNumber) {
      currentHole.set(holeNumber);
    }

    // Listen for distance updates
    gpsManager.onDistanceUpdate((distance) => {
      currentDistance = distance;
      if (pendingShot) {
        pendingShot.distance = distance;
      }
    });
  });

  // Debug round data
  $: if (round) {
    console.log('HolePage round data:', {
      round,
      players: round.players,
      playersCount: round.players?.length
    });
  }

  // Reload when parameters change
  $: if ($params && roundId && holeId) {
    loadData();
    const holeNum = parseInt(holeId);
    if (!isNaN(holeNum)) {
      currentHole.set(holeNum);
    }
  }

  async function loadData() {
    try {
      if (!roundId || !holeId) {
        console.log('Round ID or Hole ID not available yet');
        return;
      }

      isLoading.set(true);
      console.log('Loading hole data - Round ID:', roundId, 'Hole ID:', holeId);
      const [roundData, shotsData] = await Promise.all([
        roundsApi.getById(roundId),
        roundsApi.getShots(roundId, holeId)
      ]);
      
      round = roundData;
      shots = shotsData;
      currentRound.set(round);
    } catch (err) {
      console.error('Failed to load hole data:', err);
      error.set(`Failed to load hole data: ${err.message || 'Unknown error'}`);
    } finally {
      isLoading.set(false);
    }
  }

  async function startShot(event) {
    try {
      isLoading.set(true);
      
      const { player, club, location } = event.detail;
      
      if (!roundId || !holeId) {
        console.error('Missing parameters:', { roundId, holeId });
        throw new Error('Round ID or Hole ID is missing');
      }

      if (!player || !player.id) {
        console.error('Missing player data:', { player });
        throw new Error('Player data is missing');
      }

      const shotData = {
        roundId,
        holeNumber: parseInt(holeId),
        playerId: player.id,
        club,
        location,
        targetLocation: 'fairway', // default target
        distance: 0,
        result: 'success', // temporary result until completion
        error: '',
        shotNumber: shots.length + 1
      };
      
      console.log('Creating shot with data:', shotData);
      console.log('Round ID type:', typeof roundId, 'value:', roundId);
      console.log('Hole ID type:', typeof holeId, 'value:', holeId);
      console.log('Player ID type:', typeof player.id, 'value:', player.id);
      console.log('Round data:', round);
      console.log('Round players:', round?.players);
      
      // Create shot with distance 0 immediately
      const newShot = await shotsApi.create(shotData);

      // Add to local shots array
      shots = [...shots, newShot];
      
      // Start GPS tracking for distance measurement
      gpsManager.startTracking().then(success => {
        if (success) {
          // Store the shot ID for later completion
          pendingShot = {
            ...newShot,
            player,
            club,
            location,
            startLocation: shotStartLocation
          };
        } else {
          error.set('Failed to start GPS tracking');
        }
      });
      
      showShotForm = false;
    } catch (err) {
      console.error('Failed to create shot:', err);
      console.error('Error details:', err.response?.data || err.message);
      error.set(`Failed to create shot: ${err.response?.data?.errors?.[0]?.msg || err.message}`);
    } finally {
      isLoading.set(false);
    }
  }

  async function completeShot(shotData) {
    try {
      isLoading.set(true);
      
      // Update existing shot with final data
      const updatedShot = await shotsApi.update(pendingShot.id, {
        distance: shotData.distance,
        targetLocation: shotData.targetLocation,
        result: shotData.result,
        error: shotData.error,
        isPenalty: shotData.isPenalty || false
      });
      
      // Update local shots array
      shots = shots.map(shot => 
        shot.id === pendingShot.id ? updatedShot : shot
      );
      
      // Reset state
      pendingShot = null;
      showCompleteModal = false;
      gpsManager.stopTracking();
    } catch (err) {
      console.error('Failed to update shot:', err);
      error.set('Failed to update shot');
    } finally {
      isLoading.set(false);
    }
  }

  function cancelShot() {
    pendingShot = null;
    showShotForm = false;
    showCompleteModal = false;
    gpsManager.stopTracking();
  }

  function openCompleteModal() {
    if (pendingShot) {
      showCompleteModal = true;
    }
  }

  function getNextShotNumber(playerId) {
    const playerShots = shots.filter(shot => shot.playerId === playerId);
    return playerShots.length + 1;
  }

  function getShotsByPlayer() {
    const shotsByPlayer = {};
    
    shots.forEach(shot => {
      if (!shotsByPlayer[shot.playerId]) {
        shotsByPlayer[shot.playerId] = {
          player: shot.player,
          shots: []
        };
      }
      shotsByPlayer[shot.playerId].shots.push(shot);
    });

    // Sort shots by shot number
    Object.values(shotsByPlayer).forEach(playerData => {
      playerData.shots.sort((a, b) => a.shotNumber - b.shotNumber);
    });

    return Object.values(shotsByPlayer);
  }

  function canDeleteShot(shot) {
    const playerShots = shots.filter(s => s.playerId === shot.playerId);
    const isLastShot = shot.shotNumber === Math.max(...playerShots.map(s => s.shotNumber));
    return isLastShot;
  }

  async function deleteShot(shotId) {
    try {
      await shotsApi.delete(shotId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete shot:', err);
      error.set('Failed to delete shot');
    }
  }

  async function addPenaltyShot(player) {
    try {
      await shotsApi.createPenalty({
        roundId,
        playerId: player.id,
        holeNumber
      });
      await loadData();
    } catch (err) {
      console.error('Failed to add penalty shot:', err);
      error.set('Failed to add penalty shot');
    }
  }
</script>

<svelte:head>
  <title>Hole {holeNumber} - {round?.course || 'Round'}</title>
</svelte:head>

{#if round}
  <div class="min-h-screen bg-ios-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-ios-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-ios-gray-900">Hole {holeNumber}</h1>
          <p class="text-ios-gray-600 text-sm">{round.course}</p>
        </div>
        <a href="/rounds/{roundId}/holes" use:link class="btn-secondary text-sm px-4 py-2">
          Back to Holes
        </a>
      </div>
    </div>

    <!-- Shots List -->
    <div class="p-6">
      {#if shots.length === 0}
        <div class="text-center py-12" transition:fade>
          <div class="w-24 h-24 mx-auto mb-4 bg-ios-gray-200 rounded-full flex items-center justify-center">
            <svg class="w-12 h-12 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-ios-gray-900 mb-2">No Shots Yet</h3>
          <p class="text-ios-gray-600 mb-6">Start tracking shots for this hole</p>
        </div>
      {:else}
        <div class="space-y-6">
          {#each getShotsByPlayer() as playerData}
            <div transition:fly={{ y: 20, duration: 300 }}>
              <div class="flex items-center gap-3 mb-3">
                <div 
                  class="w-6 h-6 rounded-full border border-white shadow-sm"
                  style="background-color: {playerData.player.color}"
                ></div>
                <h3 class="font-semibold text-ios-gray-900">{playerData.player.name}</h3>
                <span class="text-sm text-ios-gray-500">
                  {playerData.shots.length} shot{playerData.shots.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div class="space-y-2">
                {#each playerData.shots as shot}
                  <ShotItem 
                    {shot}
                    {canDeleteShot}
                    on:delete={() => deleteShot(shot.id)}
                  />
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Add Shot Button -->
    <div class="fixed bottom-20 left-6 right-6">
      <button
        on:click={() => showShotForm = true}
        class="w-full btn-primary py-4"
      >
        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Shot
      </button>
    </div>

    <!-- Pending Shot Button -->
    {#if pendingShot}
      <div class="fixed top-20 right-6">
        <button
          on:click={openCompleteModal}
          class="flex items-center gap-3 px-4 py-3 rounded-full shadow-lg text-white font-medium transition-transform hover:scale-105"
          style="background-color: {pendingShot.player.color}"
        >
          <div class="flex flex-col items-center">
            <span class="text-sm font-medium">{pendingShot.player.name}</span>
            <span class="text-xs opacity-90">{pendingShot.club}</span>
          </div>
          <div class="flex flex-col items-center">
            <span class="text-lg font-bold">{Math.round(currentDistance)}m</span>
            <span class="text-xs opacity-90">Complete</span>
          </div>
        </button>
      </div>
    {/if}

    <!-- Shot Form Modal -->
    {#if showShotForm && round?.players}
      <ShotForm 
        players={round.players}
        {AVAILABLE_CLUBS}
        {AVAILABLE_LOCATIONS}
        on:close={() => showShotForm = false}
        on:start-shot={startShot}
      />
    {:else if showShotForm}
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="p-6 text-center">
            <p class="text-ios-gray-600">Loading players...</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Complete Shot Modal -->
    {#if showCompleteModal && pendingShot}
      <CompleteShotModal 
        {pendingShot}
        {AVAILABLE_TARGET_LOCATIONS}
        {LOCATION_LABELS}
        distance={currentDistance}
        on:complete={completeShot}
        on:cancel={cancelShot}
      />
    {/if}
  </div>
{:else}
  <div class="min-h-screen bg-ios-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="w-16 h-16 mx-auto mb-4 bg-ios-gray-200 rounded-full flex items-center justify-center">
        <svg class="w-8 h-8 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-ios-gray-900 mb-2">Loading Hole</h3>
      <p class="text-ios-gray-600">Please wait...</p>
    </div>
  </div>
{/if}
