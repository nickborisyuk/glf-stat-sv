<script>
  import { fade, fly } from 'svelte/transition';
  import { CLUB_LABELS } from '../stores/app.js';

  export let player = null;
  export let stats = null;

  let activeTab = 'overview';

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

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  $: hasStats = stats && stats.overall.totalShots > 0;
</script>

{#if player && stats}
  <div class="bg-white rounded-2xl shadow-sm border border-ios-gray-200">
    <!-- Header -->
    <div class="flex items-center gap-3 p-6 border-b border-ios-gray-200">
      <div 
        class="w-12 h-12 rounded-full border border-white shadow-sm flex-shrink-0"
        style="background-color: {player.color || '#007AFF'}"
      ></div>
      <div class="flex-1 min-w-0">
        <h2 class="text-xl font-bold text-ios-gray-900">{player.name}</h2>
        <p class="text-sm text-ios-gray-600">
          {formatNumber(stats.overall.totalShots)} shots • {stats.overall.roundsPlayed} rounds
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-ios-gray-200">
      <button
        class="flex-1 px-6 py-3 text-sm font-medium transition-colors {activeTab === 'overview' ? 'text-ios-blue border-b-2 border-ios-blue bg-ios-blue/5' : 'text-ios-gray-600 hover:text-ios-gray-900'}"
        on:click={() => activeTab = 'overview'}
      >
        Overview
      </button>
      <button
        class="flex-1 px-6 py-3 text-sm font-medium transition-colors {activeTab === 'clubs' ? 'text-ios-blue border-b-2 border-ios-blue bg-ios-blue/5' : 'text-ios-gray-600 hover:text-ios-gray-900'}"
        on:click={() => activeTab = 'clubs'}
      >
        Clubs
      </button>
      <button
        class="flex-1 px-6 py-3 text-sm font-medium transition-colors {activeTab === 'recent' ? 'text-ios-blue border-b-2 border-ios-blue bg-ios-blue/5' : 'text-ios-gray-600 hover:text-ios-gray-900'}"
        on:click={() => activeTab = 'recent'}
      >
        Recent
      </button>
    </div>

    <!-- Content -->
    <div class="p-6">
      {#if activeTab === 'overview'}
        <!-- Overview Tab -->
        <div class="space-y-6">
          <!-- Overall Stats Grid -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="text-center p-4 bg-ios-blue/5 rounded-xl">
              <div class="text-2xl font-bold text-ios-blue">{formatNumber(stats.overall.totalShots)}</div>
              <div class="text-sm text-ios-gray-600">Total Shots</div>
            </div>
            <div class="text-center p-4 bg-ios-green/5 rounded-xl">
              <div class="text-2xl font-bold text-ios-green">{formatPercentage(stats.overall.successRate)}</div>
              <div class="text-sm text-ios-gray-600">Success Rate</div>
            </div>
            <div class="text-center p-4 bg-ios-orange/5 rounded-xl">
              <div class="text-2xl font-bold text-ios-orange">{formatDistance(stats.overall.averageDistance)}</div>
              <div class="text-sm text-ios-gray-600">Avg Distance</div>
            </div>
            <div class="text-center p-4 bg-ios-purple/5 rounded-xl">
              <div class="text-2xl font-bold text-ios-purple">{formatNumber(stats.overall.roundsPlayed)}</div>
              <div class="text-sm text-ios-gray-600">Rounds Played</div>
            </div>
          </div>

          <!-- Detailed Stats -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="space-y-4">
              <h3 class="font-semibold text-ios-gray-900">Shot Breakdown</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-ios-gray-600">Successful Shots</span>
                  <div class="flex items-center gap-2">
                    <div class="w-16 bg-ios-gray-200 rounded-full h-2">
                      <div class="bg-ios-green h-2 rounded-full" style="width: {(stats.overall.successfulShots / stats.overall.totalShots) * 100}%"></div>
                    </div>
                    <span class="font-medium text-ios-green">{formatNumber(stats.overall.successfulShots)}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-ios-gray-600">Failed Shots</span>
                  <div class="flex items-center gap-2">
                    <div class="w-16 bg-ios-gray-200 rounded-full h-2">
                      <div class="bg-ios-red h-2 rounded-full" style="width: {(stats.overall.failedShots / stats.overall.totalShots) * 100}%"></div>
                    </div>
                    <span class="font-medium text-ios-red">{formatNumber(stats.overall.failedShots)}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-ios-gray-600">Penalty Shots</span>
                  <div class="flex items-center gap-2">
                    <div class="w-16 bg-ios-gray-200 rounded-full h-2">
                      <div class="bg-ios-orange h-2 rounded-full" style="width: {(stats.overall.penaltyShots / stats.overall.totalShots) * 100}%"></div>
                    </div>
                    <span class="font-medium text-ios-orange">{formatNumber(stats.overall.penaltyShots)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="font-semibold text-ios-gray-900">Distance Stats</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-ios-gray-600">Total Distance</span>
                  <span class="font-medium">{formatDistance(stats.overall.totalDistance)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-ios-gray-600">Average Distance</span>
                  <span class="font-medium">{formatDistance(stats.overall.averageDistance)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-ios-gray-600">Shots per Round</span>
                  <span class="font-medium">{stats.overall.roundsPlayed > 0 ? Math.round(stats.overall.totalShots / stats.overall.roundsPlayed) : 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {:else if activeTab === 'clubs'}
        <!-- Clubs Tab -->
        <div class="space-y-4">
          <h3 class="font-semibold text-ios-gray-900">Club Performance</h3>
          
          {#if stats.clubStats.length > 0}
            <div class="space-y-3">
              {#each stats.clubStats as club}
                <div class="border border-ios-gray-200 rounded-xl p-4" transition:fly={{ y: 20, duration: 300 }}>
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="font-medium text-ios-gray-900">{CLUB_LABELS[club.club] || club.club}</h4>
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-ios-gray-600">{club.totalShots} shots</span>
                      <span class="px-2 py-1 bg-ios-green/10 text-ios-green text-xs rounded-full font-medium">
                        {formatPercentage(club.successRate)}
                      </span>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span class="text-ios-gray-600">Successful:</span>
                      <span class="font-medium ml-1 text-ios-green">{club.successfulShots}</span>
                    </div>
                    <div>
                      <span class="text-ios-gray-600">Failed:</span>
                      <span class="font-medium ml-1 text-ios-red">{club.failedShots}</span>
                    </div>
                    <div>
                      <span class="text-ios-gray-600">Avg Distance:</span>
                      <span class="font-medium ml-1">{formatDistance(club.averageDistance)}</span>
                    </div>
                    <div>
                      <span class="text-ios-gray-600">Max Distance:</span>
                      <span class="font-medium ml-1">{formatDistance(club.maxDistance)}</span>
                    </div>
                  </div>

                  <!-- Progress bars -->
                  <div class="mt-3 space-y-2">
                    <div class="flex items-center justify-between text-xs">
                      <span>Success Rate</span>
                      <span>{formatPercentage(club.successRate)}</span>
                    </div>
                    <div class="w-full bg-ios-gray-200 rounded-full h-2">
                      <div class="bg-ios-green h-2 rounded-full transition-all duration-500" style="width: {club.successRate}%"></div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-center py-8">
              <div class="w-16 h-16 mx-auto mb-4 bg-ios-gray-100 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p class="text-ios-gray-500">No club statistics available</p>
            </div>
          {/if}
        </div>

      {:else if activeTab === 'recent'}
        <!-- Recent Performance Tab -->
        <div class="space-y-4">
          <h3 class="font-semibold text-ios-gray-900">Recent Performance</h3>
          
          {#if stats.recentPerformance.length > 0}
            <div class="space-y-3">
              {#each stats.recentPerformance as round}
                <div class="border border-ios-gray-200 rounded-xl p-4" transition:fly={{ y: 20, duration: 300 }}>
                  <div class="flex items-center justify-between mb-3">
                    <div>
                      <h4 class="font-medium text-ios-gray-900">{round.course}</h4>
                      <p class="text-sm text-ios-gray-600">{formatDate(round.date)}</p>
                    </div>
                    <div class="text-right">
                      <div class="text-lg font-bold text-ios-blue">{formatPercentage(round.successRate)}</div>
                      <div class="text-xs text-ios-gray-600">{round.totalShots} shots</div>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-ios-gray-600">Successful:</span>
                      <span class="font-medium ml-1 text-ios-green">{round.successfulShots}</span>
                    </div>
                    <div>
                      <span class="text-ios-gray-600">Failed:</span>
                      <span class="font-medium ml-1 text-ios-red">{round.totalShots - round.successfulShots}</span>
                    </div>
                    <div class="col-span-2">
                      <span class="text-ios-gray-600">Avg Distance:</span>
                      <span class="font-medium ml-1">{formatDistance(round.averageDistance)}</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-center py-8">
              <div class="w-16 h-16 mx-auto mb-4 bg-ios-gray-100 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-ios-gray-500">No recent performance data</p>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="bg-white rounded-2xl p-8 shadow-sm border border-ios-gray-200 text-center">
    <div class="w-16 h-16 mx-auto mb-4 bg-ios-gray-100 rounded-full flex items-center justify-center">
      <svg class="w-8 h-8 text-ios-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
    <h3 class="text-lg font-semibold text-ios-gray-900 mb-2">No Player Selected</h3>
    <p class="text-ios-gray-600">Select a player to view detailed statistics</p>
  </div>
{/if}
