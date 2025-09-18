<script>
  import { createEventDispatcher } from 'svelte';
  import { roundsApi } from '../lib/api.js';
  import { error, isLoading } from '../stores/app.js';
  import { fade } from 'svelte/transition';

  export let players;

  const dispatch = createEventDispatcher();

  let course = '';
  let courseType = 'championship';
  let selectedPlayers = [];
  let date = new Date().toISOString().split('T')[0];

  const courseTypes = [
    { value: 'championship', label: 'Championship' },
    { value: 'academic', label: 'Academic' }
  ];

  async function addRound() {
    if (!course.trim()) {
      error.set('Course name is required');
      return;
    }

    if (selectedPlayers.length === 0) {
      error.set('Please select at least one player');
      return;
    }

    try {
      isLoading.set(true);
      await roundsApi.create({
        course: course.trim(),
        courseType,
        date,
        playerIds: selectedPlayers.map(p => p.id)
      });
      
      dispatch('added');
      resetForm();
    } catch (err) {
      console.error('Failed to create round:', err);
      error.set(err.message || 'Failed to create round');
    } finally {
      isLoading.set(false);
    }
  }

  function resetForm() {
    course = '';
    courseType = 'championship';
    selectedPlayers = [];
    date = new Date().toISOString().split('T')[0];
  }

  function closeModal() {
    resetForm();
    dispatch('close');
  }

  function togglePlayer(player) {
    const index = selectedPlayers.findIndex(p => p.id === player.id);
    if (index >= 0) {
      selectedPlayers = selectedPlayers.filter(p => p.id !== player.id);
    } else {
      selectedPlayers = [...selectedPlayers, player];
    }
  }

  function isPlayerSelected(player) {
    return selectedPlayers.some(p => p.id === player.id);
  }
</script>

<div class="modal-overlay" role="dialog" aria-modal="true" on:click={closeModal} on:keydown={(e) => e.key === 'Escape' && closeModal} transition:fade={{ duration: 200 }}>
  <div class="modal-content" on:click|stopPropagation>
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-ios-gray-200">
      <h2 class="text-xl font-bold text-ios-gray-900">Create New Round</h2>
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
    <div class="p-6 space-y-6 max-h-96 overflow-y-auto">
      <!-- Course Name -->
      <div>
        <label for="course-name" class="block text-sm font-medium text-ios-gray-700 mb-2">
          Course Name
        </label>
        <input
          id="course-name"
          type="text"
          bind:value={course}
          placeholder="Enter course name"
          class="input-field"
          maxlength="100"
        />
      </div>

      <!-- Course Type -->
      <div>
        <label class="block text-sm font-medium text-ios-gray-700 mb-2">
          Course Type
        </label>
        <div class="grid grid-cols-2 gap-3">
          {#each courseTypes as type}
            <button
              on:click={() => courseType = type.value}
              class="p-3 rounded-xl border-2 transition-colors
                     {courseType === type.value 
                       ? 'border-ios-blue bg-ios-blue/10 text-ios-blue' 
                       : 'border-ios-gray-300 text-ios-gray-700 hover:border-ios-gray-400'}"
            >
              <span class="font-medium">{type.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Date -->
      <div>
        <label for="round-date" class="block text-sm font-medium text-ios-gray-700 mb-2">
          Date
        </label>
        <input
          id="round-date"
          type="date"
          bind:value={date}
          class="input-field"
        />
      </div>

      <!-- Players Selection -->
      <div>
        <label class="block text-sm font-medium text-ios-gray-700 mb-2">
          Select Players ({selectedPlayers.length} selected)
        </label>
        <div class="space-y-2 max-h-32 overflow-y-auto">
          {#each players as player}
            <button
              on:click={() => togglePlayer(player)}
              class="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors
                     {isPlayerSelected(player) 
                       ? 'border-ios-blue bg-ios-blue/10' 
                       : 'border-ios-gray-200 hover:border-ios-gray-300'}"
            >
              <div 
                class="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                style="background-color: {player.color}"
              ></div>
              <span class="font-medium text-ios-gray-900">{player.name}</span>
              {#if isPlayerSelected(player)}
                <svg class="w-5 h-5 ml-auto text-ios-blue" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Validation Messages -->
    {#if !course.trim() || selectedPlayers.length === 0}
      <div class="px-6 pb-2">
        <div class="bg-ios-orange/10 border border-ios-orange/20 rounded-xl p-3">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-ios-orange flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p class="text-sm text-ios-orange">
              {#if !course.trim()}
                Please enter a course name
              {:else if selectedPlayers.length === 0}
                Please select at least one player
              {/if}
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Actions -->
    <div class="flex gap-3 p-6 border-t border-ios-gray-200">
      <button
        on:click={closeModal}
        class="flex-1 btn-secondary"
      >
        Cancel
      </button>
      <button
        on:click={addRound}
        disabled={!course.trim() || selectedPlayers.length === 0 || $isLoading}
        class="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        title={!course.trim() ? 'Enter course name' : selectedPlayers.length === 0 ? 'Select at least one player' : ''}
      >
        {#if $isLoading}
          <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {:else}
          Create Round
        {/if}
      </button>
    </div>
  </div>
</div>
