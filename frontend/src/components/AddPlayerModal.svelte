<script>
  import { createEventDispatcher } from 'svelte';
  import { playersApi } from '../lib/api.js';
  import { error, isLoading } from '../stores/app.js';
  import { fade } from 'svelte/transition';

  export let availableColors;

  const dispatch = createEventDispatcher();

  let name = '';
  let selectedColor = availableColors[0] || '#007AFF';
  let showColors = false;

  $: if (availableColors.length > 0 && !selectedColor) {
    selectedColor = availableColors[0];
  }

  async function addPlayer() {
    if (!name.trim()) {
      error.set('Player name is required');
      return;
    }

    if (!selectedColor) {
      error.set('Please select a color');
      return;
    }

    try {
      isLoading.set(true);
      await playersApi.create({
        name: name.trim(),
        color: selectedColor
      });
      
      dispatch('added');
      resetForm();
    } catch (err) {
      console.error('Failed to create player:', err);
      error.set(err.message || 'Failed to create player');
    } finally {
      isLoading.set(false);
    }
  }

  function resetForm() {
    name = '';
    selectedColor = availableColors[0] || '#007AFF';
    showColors = false;
  }

  function closeModal() {
    resetForm();
    dispatch('close');
  }

  function selectColor(color) {
    selectedColor = color;
    showColors = false;
  }
</script>

<div 
  class="modal-overlay" 
  role="dialog" 
  aria-modal="true"
  on:click={closeModal}
  on:keydown={(e) => e.key === 'Escape' && closeModal()}
  transition:fade={{ duration: 200 }}
>
  <div class="modal-content" role="document" on:click|stopPropagation>
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-ios-gray-200">
      <h2 class="text-xl font-bold text-ios-gray-900">Add New Player</h2>
      <button
        on:click={closeModal}
        class="p-2 text-ios-gray-400 hover:text-ios-gray-600 rounded-lg transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Form -->
    <div class="p-6 space-y-6">
      <!-- Name Input -->
      <div>
        <label for="player-name" class="block text-sm font-medium text-ios-gray-700 mb-2">
          Player Name
        </label>
        <input
          id="player-name"
          type="text"
          bind:value={name}
          placeholder="Enter player name"
          class="input-field"
          maxlength="50"
          on:keydown={(e) => e.key === 'Enter' && addPlayer()}
        />
      </div>

      <!-- Color Selection -->
      <div>
        <label for="color-select" class="block text-sm font-medium text-ios-gray-700 mb-2">
          Player Color
        </label>
        
        <!-- Selected Color Display -->
        <button
          id="color-select"
          on:click={() => showColors = !showColors}
          class="flex items-center gap-3 w-full p-4 border border-ios-gray-300 rounded-xl hover:border-ios-blue transition-colors"
        >
          <div 
            class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
            style="background-color: {selectedColor}"
          ></div>
          <span class="text-ios-gray-700">Choose a color</span>
          <svg 
            class="w-5 h-5 ml-auto text-ios-gray-400 transition-transform {showColors ? 'rotate-180' : ''}"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Color Options -->
        {#if showColors}
          <div class="mt-3 grid grid-cols-3 gap-3">
            {#each availableColors as color}
              <button
                on:click={() => selectColor(color)}
                class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-ios-gray-50 transition-colors
                       {selectedColor === color ? 'bg-ios-blue/10 border-2 border-ios-blue' : 'border border-ios-gray-200'}"
              >
                <div 
                  class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  style="background-color: {color}"
                ></div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 p-6 border-t border-ios-gray-200">
      <button
        on:click={closeModal}
        class="flex-1 btn-secondary"
      >
        Cancel
      </button>
      <button
        on:click={addPlayer}
        disabled={!name.trim() || !selectedColor || $isLoading}
        class="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if $isLoading}
          <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {:else}
          Add Player
        {/if}
      </button>
    </div>
  </div>
</div>
