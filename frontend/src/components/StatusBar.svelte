<script>
  import { onMount } from 'svelte';
  import { gpsTracking, gpsDistance, gpsError } from '../stores/app.js';

  let currentTime = '';
  let batteryLevel = 100;
  let signalStrength = 4;

  onMount(() => {
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    // Get battery info if available
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        batteryLevel = Math.round(battery.level * 100);
        battery.addEventListener('levelchange', () => {
          batteryLevel = Math.round(battery.level * 100);
        });
      });
    }

    return () => clearInterval(interval);
  });

  function updateTime() {
    const now = new Date();
    currentTime = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    });
  }
</script>

<div class="status-bar">
  <div class="flex items-center justify-between w-full px-4">
    <!-- Left side - GPS info -->
    <div class="flex items-center gap-2 text-sm">
      {#if $gpsTracking}
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 bg-ios-green rounded-full animate-pulse"></div>
          <span class="text-ios-green font-medium">{$gpsDistance}m</span>
        </div>
      {:else if $gpsError}
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 bg-ios-red rounded-full"></div>
          <span class="text-ios-red text-xs">GPS Error</span>
        </div>
      {:else}
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 bg-ios-gray-400 rounded-full"></div>
          <span class="text-ios-gray-600 text-xs">No GPS</span>
        </div>
      {/if}
    </div>

    <!-- Center - Time -->
    <div class="text-ios-gray-900 font-semibold text-sm">
      {currentTime}
    </div>

    <!-- Right side - Battery and Signal -->
    <div class="flex items-center gap-2 text-sm">
      <!-- Signal strength -->
      <div class="flex items-center gap-1">
        {#each Array(signalStrength) as _, i}
          <div class="w-1 h-{i + 1} bg-ios-gray-900 rounded-sm"></div>
        {/each}
      </div>

      <!-- Battery -->
      <div class="flex items-center gap-1">
        <div class="relative w-6 h-3 border border-ios-gray-900 rounded-sm">
          <div 
            class="absolute top-0 left-0 h-full bg-ios-gray-900 rounded-sm"
            style="width: {batteryLevel}%"
          ></div>
        </div>
        <div class="w-0.5 h-2 bg-ios-gray-900 rounded-r-sm"></div>
      </div>
    </div>
  </div>
</div>
