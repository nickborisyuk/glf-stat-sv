<script>
  import { onMount } from 'svelte';
  import { link, params } from 'svelte-spa-router';
  import { currentRound, currentHole, error, isLoading } from '../stores/app.js';
  import { roundsApi, shotsApi } from '../lib/api.js';
  import { gpsManager } from '../lib/gps.js';
  import { AVAILABLE_CLUBS, AVAILABLE_LOCATIONS, AVAILABLE_TARGET_LOCATIONS, LOCATION_LABELS, CLUB_LABELS, AVAILABLE_ERROR_TYPES, ERROR_TYPE_LABELS } from '../stores/app.js';
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
  let pendingShots = [];
  let currentPendingShot = null;
  let sortedShots = [];
  
  // Reactive sorted shots - this will automatically update when shots changes
  $: shots.length, sortedShots = getShotsSortedByTime();
  let shotStartLocation = null;
  let currentDistance = 0;
  let distanceUpdateTrigger = 0; // For reactive updates

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
      // Update individual shot distances
      pendingShots = pendingShots.map(shot => ({
        ...shot,
        distance: gpsManager.getShotDistance(shot.id) || distance
      }));
      // Trigger reactive update
      distanceUpdateTrigger++;
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
      
      // Merge API data with local shots to preserve any locally added shots
      const apiShotIds = new Set(shotsData.map(s => s.id));
      const localShotsNotInAPI = shots.filter(s => !apiShotIds.has(s.id));
      
      shots = [...shotsData, ...localShotsNotInAPI];
      currentRound.set(round);
      
      // Find incomplete shots and add them to pending shots
      // A shot is incomplete if it has distance 0 and no targetLocation or result
      const incompleteShots = shots.filter(shot => 
        shot.distance === 0 && (!shot.targetLocation || !shot.result)
      );
      
      // Convert incomplete shots to pending shots format
      pendingShots = incompleteShots.map(shot => ({
        ...shot,
        player: shot.player || round.players?.find(p => p.id === shot.playerId),
        distance: shot.distance || 0
      }));

      // Start GPS tracking and individual tracking for incomplete shots
      if (pendingShots.length > 0) {
        gpsManager.startTracking().then(success => {
          if (success) {
            // Start individual tracking for each incomplete shot
            pendingShots.forEach(shot => {
              gpsManager.startShotTracking(shot.id);
            });
          }
        });
      }
      
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
        distance: 0,
        shotNumber: getNextShotNumber(player.id)
      };
      
      console.log('Creating shot with data:', shotData);
      console.log('API_BASE:', window.location.origin + '/api' || 'unknown');
      
      // Validate shot data
      if (!shotData.roundId || !shotData.playerId || !shotData.club || !shotData.location) {
        throw new Error('Missing required shot data');
      }
      
      if (!shotData.holeNumber || shotData.holeNumber < 1) {
        throw new Error('Invalid hole number');
      }
      
      if (!shotData.shotNumber || shotData.shotNumber < 1) {
        throw new Error('Invalid shot number');
      }
      
      // Create shot with distance 0 immediately
      const newShot = await shotsApi.create(shotData);
      
      // Add to local shots array immediately
      shots = [...shots, newShot];

      // Create pending shot object
      const newPendingShot = {
        ...newShot,
        player,
        club,
        location,
        startLocation: shotStartLocation
      };

      // Add to pending shots array immediately
      pendingShots = [...pendingShots, newPendingShot];

      // Start GPS tracking for distance measurement (global)
      gpsManager.startTracking().then(success => {
        if (!success) {
          error.set('Failed to start GPS tracking');
        } else {
          // Start individual tracking for this shot
          gpsManager.startShotTracking(newShot.id);
        }
      });
      
      showShotForm = false;
    } catch (err) {
      console.error('Failed to create shot:', err);
      console.error('Error details:', err.response?.data || err.message);
      console.error('Event detail that failed:', event.detail);
      console.error('Round data:', round);
      console.error('Player data:', event.detail?.player);
      if (err.data) {
        console.error('Server error details:', err.data);
        if (err.data.errors && Array.isArray(err.data.errors)) {
          console.error('Server errors array:', err.data.errors);
          err.data.errors.forEach((error, index) => {
            console.error(`Error ${index + 1}:`, error);
          });
        }
      }
      error.set(`Failed to create shot: ${err.response?.data?.errors?.[0]?.msg || err.message}`);
    } finally {
      isLoading.set(false);
    }
  }

  async function completeShot(shotId, shotData) {
    try {
      isLoading.set(true);
      
      // Validate required fields
      if (!shotData.targetLocation) {
        throw new Error('Target location is required');
      }
      
      const updateData = {
        distance: parseInt(shotData.distance) || 0,
        targetLocation: shotData.targetLocation,
        result: shotData.result,
        isPenalty: Boolean(shotData.isPenalty)
      };
      
      // Only add error field if there's an actual error
      if (shotData.error) {
        updateData.error = shotData.error;
      }
      
      // Update existing shot with final data
      const updatedShot = await shotsApi.update(shotId, updateData);
      
      // Update local shots array
      shots = shots.map(shot => 
        shot.id === shotId ? updatedShot : shot
      );
      
      // Remove from pending shots (if it was there)
      pendingShots = pendingShots.filter(shot => shot.id !== shotId);
      
      // Stop individual tracking for this shot
      gpsManager.stopShotTracking(shotId);
      
      // Stop GPS tracking if no more pending shots
      if (pendingShots.length === 0) {
        gpsManager.stopTracking();
      }
      
      showCompleteModal = false;
      currentPendingShot = null;
    } catch (err) {
      console.error('Failed to update shot:', err);
      console.error('Error details:', err);
      console.error('Shot ID:', shotId);
      console.error('Shot data:', shotData);
      if (err.data) {
        console.error('Server error details:', err.data);
      }
      error.set(`Failed to update shot: ${err.message}`);
    } finally {
      isLoading.set(false);
    }
  }

  function cancelShot(shotId) {
    if (shotId) {
      // Cancel specific shot
      pendingShots = pendingShots.filter(shot => shot.id !== shotId);
      // Stop individual tracking for this shot
      gpsManager.stopShotTracking(shotId);
    } else {
      // Cancel all pending shots
      pendingShots.forEach(shot => {
        gpsManager.stopShotTracking(shot.id);
      });
      pendingShots = [];
    }
    
    showShotForm = false;
    showCompleteModal = false;
    
    // Stop GPS tracking if no more pending shots
    if (pendingShots.length === 0) {
      gpsManager.stopTracking();
    }
  }

  function openCompleteModal(pendingShot) {
    if (pendingShot) {
      currentPendingShot = pendingShot;
      showCompleteModal = true;
    }
  }

  function getNextShotNumber(playerId) {
    const playerShots = shots.filter(shot => shot.playerId === playerId);
    if (playerShots.length === 0) {
      return 1;
    }
    const maxShotNumber = Math.max(...playerShots.map(shot => shot.shotNumber));
    return maxShotNumber + 1;
  }

  function getDefaultLocation(playerId) {
    const playerShots = shots.filter(shot => shot.playerId === playerId);
    console.log('getDefaultLocation for player:', playerId, 'shots count:', playerShots.length);
    
    if (playerShots.length === 0) {
      console.log('First shot for player, defaulting to tee');
      return 'tee'; // First shot always starts from tee
    }
    
    // Find the most recent completed shot for this player
    const completedShots = playerShots.filter(shot => shot.targetLocation && shot.result);
    console.log('Completed shots for player:', completedShots.length);
    
    if (completedShots.length === 0) {
      console.log('No completed shots, defaulting to tee');
      return 'tee'; // No completed shots, start from tee
    }
    
    // Sort by shot number and get the latest
    const latestShot = completedShots.sort((a, b) => b.shotNumber - a.shotNumber)[0];
    console.log('Latest shot target location:', latestShot.targetLocation);
    return latestShot.targetLocation;
  }

  function getShotsSortedByTime() {
    try {
      // Use shots array which already includes all shots (completed and incomplete)
      if (!shots || shots.length === 0) {
        return [];
      }
      
      // Sort shots by creation time (newest first)
      return [...shots].sort((a, b) => {
        // If shots have createdAt field, use it
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        // Fallback to shot number (higher number = newer)
        return b.shotNumber - a.shotNumber;
      });
    } catch (error) {
      console.error('Error in getShotsSortedByTime:', error);
      return [];
    }
  }

  function canDeleteShot(shot) {
    const playerShots = shots.filter(s => s.playerId === shot.playerId);
    const isLastShot = shot.shotNumber === Math.max(...playerShots.map(s => s.shotNumber));
    return isLastShot;
  }

  function isPendingShot(shot) {
    // A shot is pending if it has distance 0 and no targetLocation or result
    return shot.distance === 0 && (!shot.targetLocation || !shot.result);
  }

  async function deleteShot(shotId) {
    try {
      isLoading.set(true);
      await shotsApi.delete(shotId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete shot:', err);
      error.set(`Failed to delete shot: ${err.message}`);
    } finally {
      isLoading.set(false);
    }
  }

  async function addPenaltyShot(player) {
    try {
      isLoading.set(true);
      await shotsApi.createPenalty({
        roundId,
        playerId: player.id,
        holeNumber
      });
      await loadData();
    } catch (err) {
      console.error('Failed to add penalty shot:', err);
      error.set('Failed to add penalty shot');
    } finally {
      isLoading.set(false);
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
        <div class="space-y-2">
          {#each sortedShots as shot}
            <div transition:fly={{ y: 20, duration: 300 }}>
              <ShotItem 
                {shot}
                canDelete={canDeleteShot(shot)}
                isPending={isPendingShot(shot)}
                on:delete={() => deleteShot(shot.id)}
              />
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Add Shot Button -->
    <div class="fixed bottom-20 left-6 right-6 z-50">
      <button
        on:click={() => showShotForm = true}
        class="w-full btn-primary py-4 flex items-center justify-center gap-2"
      >
        <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span class="whitespace-nowrap">Add Shot</span>
      </button>
    </div>

    <!-- Floating Complete Buttons for Pending Shots -->
    {#if pendingShots.length > 0}
      <div class="fixed top-20 right-6 space-y-3 z-50">
        {#each pendingShots as pendingShot}
          <button
            on:click={() => openCompleteModal(pendingShot)}
            class="flex items-center gap-3 px-4 py-3 rounded-full shadow-lg text-white font-medium transition-transform hover:scale-105"
            style="background-color: {pendingShot.player.color}"
          >
            <div class="flex flex-col items-center">
              <span class="text-sm font-medium">{pendingShot.player.name}</span>
              <span class="text-xs opacity-90">{pendingShot.club}</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="text-lg font-bold">{Math.round(pendingShot.distance || gpsManager.getShotDistance(pendingShot.id) || 0)}m</span>
              <span class="text-xs opacity-90">Complete</span>
            </div>
          </button>
        {/each}
      </div>
    {/if}

    <!-- Shot Form Modal -->
    {#if showShotForm && round?.players}
      <ShotForm 
        players={round.players}
        {AVAILABLE_CLUBS}
        {AVAILABLE_LOCATIONS}
        {getDefaultLocation}
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
    {#if showCompleteModal && currentPendingShot}
      <CompleteShotModal 
        pendingShot={currentPendingShot}
        {AVAILABLE_TARGET_LOCATIONS}
        {LOCATION_LABELS}
        {AVAILABLE_ERROR_TYPES}
        {ERROR_TYPE_LABELS}
        distance={currentPendingShot.distance || gpsManager.getShotDistance(currentPendingShot.id) || 0}
        on:complete={(event) => completeShot(currentPendingShot.id, event.detail)}
        on:cancel={() => cancelShot(currentPendingShot.id)}
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
