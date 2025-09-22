<script>
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { CLUB_LABELS } from '../stores/app.js';

  export let player;
  export let stats = null;

  const dispatch = createEventDispatcher();

  function formatNumber(value) {
    return new Intl.NumberFormat().format(value);
  }

  function formatPercentage(value) {
    return `${parseFloat(value).toFixed(1)}%`;
  }

  function formatDistance(distance) {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)}km`;
    }
    return `${distance}m`;
  }

  function viewPlayerStats() {
    dispatch('viewStats', { player });
  }
</script>

<div class="bg-white rounded-2xl p-4 shadow-sm border border-ios-gray-200 hover:shadow-md transition-shadow">
  <div class="flex items-center gap-3 mb-4">
    <div 
      class="w-8 h-8 rounded-full border border-white shadow-sm flex-shrink-0"
      style="background-color: {player.color || '#007AFF'}"
    ></div>
    <div class="flex-1 min-w-0">
      <h3 class="font-semibold text-ios-gray-900 truncate">{player.name}</h3>
      {#if stats}
        <p class="text-sm text-ios-gray-600">
          {formatNumber(stats.overall.totalShots)} shots • {stats.overall.roundsPlayed} rounds
        </p>
      {/if}
    </div>
    <button
      on:click={viewPlayerStats}
      class="flex-shrink-0 p-2 text-ios-blue hover:bg-ios-blue/10 rounded-lg transition-colors"
      title="View detailed statistics"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </button>
  </div>

  {#if stats}
    <div class="space-y-3">
      <!-- Overall Stats -->
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="flex justify-between">
          <span class="text-ios-gray-600">Success Rate:</span>
          <span class="font-medium text-ios-green">{formatPercentage(stats.overall.successRate)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-ios-gray-600">Avg Distance:</span>
          <span class="font-medium">{formatDistance(stats.overall.averageDistance)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-ios-gray-600">Total Distance:</span>
          <span class="font-medium">{formatDistance(stats.overall.totalDistance)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-ios-gray-600">Penalty Shots:</span>
          <span class="font-medium text-ios-orange">{stats.overall.penaltyShots}</span>
        </div>
      </div>

      <!-- Top Clubs -->
      {#if stats.clubStats.length > 0}
        <div>
          <h4 class="text-xs font-medium text-ios-gray-700 mb-2">TOP CLUBS</h4>
          <div class="space-y-1">
            {#each stats.clubStats.slice(0, 3) as club}
              <div class="flex items-center justify-between text-xs">
                <span class="text-ios-gray-600">{CLUB_LABELS[club.club] || club.club}</span>
                <div class="flex items-center gap-2">
                  <span class="text-ios-gray-900">{club.totalShots}</span>
                  <span class="text-ios-green">{formatPercentage(club.successRate)}</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="text-center py-4">
      <div class="w-12 h-12 mx-auto mb-2 bg-ios-gray-100 rounded-full flex items-center justify-center">
        <svg class="w-6 h-6 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p class="text-sm text-ios-gray-500">No statistics yet</p>
    </div>
  {/if}
</div>
