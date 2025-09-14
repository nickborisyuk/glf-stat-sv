<script>
  import { isLoading } from '../stores/app.js';
  import { fade } from 'svelte/transition';
</script>

{#if $isLoading}
  <div 
    class="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
    transition:fade={{ duration: 200 }}
  >
    <div class="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center gap-4">
      <div class="w-8 h-8 border-2 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
      <p class="text-ios-gray-700 font-medium">Loading...</p>
    </div>
  </div>
{/if}
