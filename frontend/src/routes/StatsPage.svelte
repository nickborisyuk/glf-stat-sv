<script>
  import { onMount } from 'svelte';
  import { rounds, error, isLoading } from '../stores/app.js';
  import { statsApi, roundsApi } from '../lib/api.js';
  import { fade } from 'svelte/transition';
  import StatsCard from '../components/StatsCard.svelte';
  import ClubStatsChart from '../components/ClubStatsChart.svelte';
  import LocationStatsChart from '../components/LocationStatsChart.svelte';

  let globalStats = null;
  let selectedRound = null;
  let roundStats = null;

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      isLoading.set(true);
      const [roundsData, globalStatsData] = await Promise.all([
        roundsApi.getAll(),
        statsApi.getGlobalStats()
      ]);
      
      rounds.set(roundsData);
      globalStats = globalStatsData;
    } catch (err) {
      console.error('Failed to load stats data:', err);
      error.set('Failed to load statistics');
    } finally {
      isLoading.set(false);
    }
  }

  async function selectRound(round) {
    selectedRound = round;
    try {
      roundStats = await statsApi.getRoundStats(round.id);
    } catch (err) {
      console.error('Failed to load round stats:', err);
      error.set('Failed to load round statistics');
    }
  }

  function formatPercentage(value) {
    return `${parseFloat(value).toFixed(1)}%`;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat().format(value);
  }
</script>

<svelte:head>
  <title>Statistics - Golf Stats</title>
</svelte:head>

<div class="min-h-screen bg-ios-gray-50">
  <!-- Header -->
  <div class="bg-white border-b border-ios-gray-200 px-6 py-4">
    <h1 class="text-2xl font-bold text-ios-gray-900">Statistics</h1>
  </div>

  <div class="p-6 space-y-6">
    <!-- Global Statistics -->
    {#if globalStats}
      <div transition:fade>
        <h2 class="text-lg font-semibold text-ios-gray-900 mb-4">Overall Performance</h2>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <StatsCard
            title="Total Rounds"
            value={formatNumber(globalStats.totalRounds)}
            icon="rounds"
            color="blue"
          />
          <StatsCard
            title="Total Shots"
            value={formatNumber(globalStats.totalShots)}
            icon="shots"
            color="green"
          />
          <StatsCard
            title="Success Rate"
            value={formatPercentage(globalStats.overallSuccessRate)}
            icon="success"
            color="blue"
          />
          <StatsCard
            title="Penalty Shots"
            value={formatNumber(globalStats.totalPenaltyShots)}
            icon="penalty"
            color="orange"
          />
        </div>
      </div>

      <!-- Most Used Clubs -->
      {#if globalStats.mostUsedClubs.length > 0}
        <div transition:fade>
          <h2 class="text-lg font-semibold text-ios-gray-900 mb-4">Most Used Clubs</h2>
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-ios-gray-200">
            <div class="space-y-3">
              {#each globalStats.mostUsedClubs as club}
                <div class="flex items-center justify-between">
                  <span class="font-medium text-ios-gray-900">{club.club}</span>
                  <span class="text-ios-gray-600">{club.count} shots</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Best Performing Clubs -->
      {#if globalStats.bestPerformingClubs.length > 0}
        <div transition:fade>
          <h2 class="text-lg font-semibold text-ios-gray-900 mb-4">Best Performing Clubs</h2>
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-ios-gray-200">
            <div class="space-y-3">
              {#each globalStats.bestPerformingClubs as club}
                <div class="flex items-center justify-between">
                  <div>
                    <span class="font-medium text-ios-gray-900">{club.club}</span>
                    <p class="text-sm text-ios-gray-600">{club.total} shots</p>
                  </div>
                  <span class="font-semibold text-ios-green">{club.successRate}%</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    {/if}

    <!-- Round Selection -->
    {#if $rounds.length > 0}
      <div transition:fade>
        <h2 class="text-lg font-semibold text-ios-gray-900 mb-4">Round Statistics</h2>
        
        <!-- Round Selector -->
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-ios-gray-200 mb-4">
          <label for="round-select" class="block text-sm font-medium text-ios-gray-700 mb-2">Select Round</label>
          <select id="round-select"
            bind:value={selectedRound}
            on:change={() => selectedRound && selectRound(selectedRound)}
            class="input-field"
          >
            <option value={null}>Choose a round...</option>
            {#each $rounds as round}
              <option value={round}>
                {round.course} - {new Date(round.date).toLocaleDateString()}
              </option>
            {/each}
          </select>
        </div>

        <!-- Round Statistics -->
        {#if roundStats}
          <div class="space-y-6">
            <!-- Round Overview -->
            <div class="grid grid-cols-2 gap-4">
              <StatsCard
                title="Total Shots"
                value={formatNumber(roundStats.totalShots)}
                icon="shots"
                color="blue"
              />
              <StatsCard
                title="Success Rate"
                value={formatPercentage(roundStats.totalSuccessfulShots / roundStats.totalShots * 100)}
                icon="success"
                color="green"
              />
              <StatsCard
                title="Failed Shots"
                value={formatNumber(roundStats.totalFailedShots)}
                icon="fail"
                color="red"
              />
              <StatsCard
                title="Penalty Shots"
                value={formatNumber(roundStats.totalPenaltyShots)}
                icon="penalty"
                color="orange"
              />
            </div>

            <!-- Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ClubStatsChart stats={roundStats.clubStats} />
              <LocationStatsChart stats={roundStats.locationStats} />
            </div>

            <!-- Player Statistics -->
            {#if roundStats.playerStats.length > 0}
              <div>
                <h3 class="text-lg font-semibold text-ios-gray-900 mb-4">Player Performance</h3>
                <div class="space-y-4">
                  {#each roundStats.playerStats as player}
                    <div class="bg-white rounded-2xl p-4 shadow-sm border border-ios-gray-200">
                      <div class="flex items-center gap-3 mb-3">
                        <div 
                          class="w-6 h-6 rounded-full border border-white shadow-sm"
                          style="background-color: {player.color || '#007AFF'}"
                        ></div>
                        <h4 class="font-semibold text-ios-gray-900">{player.playerName}</h4>
                      </div>
                      <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span class="text-ios-gray-600">Total Shots:</span>
                          <span class="font-medium ml-2">{player.totalShots}</span>
                        </div>
                        <div>
                          <span class="text-ios-gray-600">Success Rate:</span>
                          <span class="font-medium ml-2 text-ios-green">{player.successRate}%</span>
                        </div>
                        <div>
                          <span class="text-ios-gray-600">Average Distance:</span>
                          <span class="font-medium ml-2">{player.averageDistance}m</span>
                        </div>
                        <div>
                          <span class="text-ios-gray-600">Penalty Shots:</span>
                          <span class="font-medium ml-2 text-ios-orange">{player.penaltyShots}</span>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {:else}
      <div class="text-center py-12" transition:fade>
        <div class="w-24 h-24 mx-auto mb-4 bg-ios-gray-200 rounded-full flex items-center justify-center">
          <svg class="w-12 h-12 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-ios-gray-900 mb-2">No Statistics Yet</h3>
        <p class="text-ios-gray-600">Play some rounds to see your statistics</p>
      </div>
    {/if}
  </div>
</div>
