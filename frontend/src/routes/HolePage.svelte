<script>
  import { onMount } from 'svelte';
  import { link, params } from 'svelte-spa-router';
  import { currentRound, currentHole, error, isLoading, selectedPlayer, players } from '../stores/app.js';
  import { roundsApi, shotsApi, playersApi } from '../lib/api.js';
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

  onMount(async () => {
    console.log('HolePage mounted with roundId:', roundId, 'holeId:', holeId);
    await loadData();
    await loadSelectedPlayerFromSession();
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
      
      // Use shots data directly from API
      shots = shotsData;
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

      // Check if player is part of this round, if not add them
      if (round && player && !round.players?.some(p => p.id === player.id)) {
        console.log('Player not in round, adding player to round...');
        const updatedRound = {
          ...round,
          players: [...(round.players || []), player]
        };
        await roundsApi.update(round.id, updatedRound);
        round = updatedRound;
        console.log('Player added to round successfully');
      }
      
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

  async function addPenaltyShot() {
    try {
      isLoading.set(true);
      
      if (!$selectedPlayer) {
        error.set('No player selected');
        return;
      }

      if (!round || !holeNumber) {
        error.set('Round or hole information missing');
        return;
      }

      // Check if player is part of this round, if not add them
      if (!round.players?.some(p => p.id === $selectedPlayer.id)) {
        console.log('Player not in round, adding player to round...');
        const updatedRound = {
          ...round,
          players: [...(round.players || []), $selectedPlayer]
        };
        await roundsApi.update(round.id, updatedRound);
        round = updatedRound;
        console.log('Player added to round successfully');
      }

      // Use the dedicated penalty shot API
      const penaltyShotData = {
        roundId: round.id,
        playerId: $selectedPlayer.id,
        holeNumber: holeNumber
      };

      console.log('Creating penalty shot with data:', penaltyShotData);
      
      const newShot = await shotsApi.createPenalty(penaltyShotData);
      console.log('Penalty shot created successfully:', newShot);
      
      // Reload data to get updated shots
      await loadData();
      
    } catch (err) {
      console.error('Failed to create penalty shot:', err);
      error.set(`Failed to create penalty shot: ${err.response?.data?.errors?.[0]?.msg || err.message}`);
    } finally {
      isLoading.set(false);
    }
  }

  async function completeShot(shotId, shotData) {
    try {
      isLoading.set(true);
      
      console.log('HolePage: completeShot called with shotId:', shotId, 'shotData:', shotData);
      
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
      
      // Add error field if there's an actual error (including empty string for "no error")
      if (shotData.error !== null && shotData.error !== undefined) {
        updateData.error = shotData.error;
      }
      
      // Update existing shot with final data
      const updatedShot = await shotsApi.update(shotId, updateData);
      
      console.log('HolePage: updatedShot from server:', updatedShot);
      console.log('HolePage: updateData sent to server:', updateData);
      
      // Update local shots array
      shots = shots.map(shot => {
        if (shot.id === shotId) {
          // If server didn't save the error but we sent it, preserve it locally
          if (shotData.error && !updatedShot.error) {
            console.log('HolePage: Server returned error as null, preserving local error:', shotData.error);
            return { ...updatedShot, error: shotData.error };
          }
          return updatedShot;
        }
        return shot;
      });
      
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
    
    // Find the most recent completed non-penalty shot for this player
    const completedNonPenaltyShots = playerShots.filter(shot => 
      shot.targetLocation && 
      shot.result && 
      !shot.isPenalty
    );
    console.log('Completed non-penalty shots for player:', completedNonPenaltyShots.length);
    
    if (completedNonPenaltyShots.length === 0) {
      console.log('No completed non-penalty shots, defaulting to tee');
      return 'tee'; // No completed non-penalty shots, start from tee
    }
    
    // Sort by shot number and get the latest
    const latestShot = completedNonPenaltyShots.sort((a, b) => b.shotNumber - a.shotNumber)[0];
    console.log('Latest non-penalty shot target location:', latestShot.targetLocation);
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
      console.log('Attempting to delete shot with ID:', shotId);
      await shotsApi.delete(shotId);
      console.log('Shot deleted successfully, reloading data...');
      await loadData();
      console.log('Data reloaded after successful deletion');
    } catch (err) {
      console.error('Failed to delete shot:', err);
      console.error('Shot ID:', shotId);
      console.error('Error details:', err.data);
      
      if (err.status === 404) {
        // Shot not found - likely already deleted, just reload data silently
        console.log('Shot not found, reloading data...');
        await loadData();
        console.log('Data reloaded after 404 error');
        // Don't show error to user as this is likely a sync issue
      } else {
        error.set(`Failed to delete shot: ${err.message}`);
      }
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
        <div class="flex items-center gap-3">
          <div>
            <h1 class="text-xl font-bold text-ios-gray-900">Hole {holeNumber}</h1>
            <p class="text-ios-gray-600 text-sm">{round.course}</p>
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
          <a href="/rounds/{roundId}/holes" use:link class="btn-secondary text-sm px-4 py-2">
            Back to Holes
          </a>
        </div>
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
                currentDistance={isPendingShot(shot) ? Math.round(gpsManager.getShotDistance(shot.id) || 0) : 0}
                on:delete={() => deleteShot(shot.id)}
                on:complete={() => openCompleteModal(shot)}
              />
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Add Shot Buttons -->
    <div class="fixed bottom-20 left-6 right-6 z-50">
      <div class="flex gap-3">
        <button
          on:click={() => showShotForm = true}
          class="flex-1 btn-primary py-4 flex items-center justify-center gap-2"
        >
          <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span class="whitespace-nowrap">Add Shot</span>
        </button>
        
        <button
          on:click={addPenaltyShot}
          class="flex-1 btn-secondary py-4 flex items-center justify-center gap-2"
        >
          <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="whitespace-nowrap">Penalty Shot</span>
        </button>
      </div>
    </div>


    <!-- Shot Form Modal -->
    {#if showShotForm}
      <ShotForm 
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
        allShots={shots}
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
