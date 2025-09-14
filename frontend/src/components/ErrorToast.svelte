<script>
  import { error } from '../stores/app.js';
  import { fade, fly } from 'svelte/transition';

  let showToast = false;
  let timeoutId = null;

  $: if ($error) {
    showToast = true;
    
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Auto-hide after 5 seconds
    timeoutId = setTimeout(() => {
      showToast = false;
      error.set(null);
    }, 5000);
  }

  function dismissError() {
    showToast = false;
    error.set(null);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
</script>

{#if showToast && $error}
  <div 
    class="fixed top-16 left-4 right-4 z-50"
    transition:fly={{ y: -50, duration: 300 }}
  >
    <div class="bg-ios-red text-white rounded-2xl shadow-lg p-4 flex items-center gap-3">
      <div class="flex-shrink-0">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium">Error</p>
        <p class="text-xs opacity-90 break-words">{$error}</p>
      </div>
      
      <button 
        on:click={dismissError}
        class="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
        aria-label="Dismiss error"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
{/if}
