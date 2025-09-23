<script>
  import { createEventDispatcher } from 'svelte';
  import { link } from 'svelte-spa-router';
  import { roundsApi } from '../lib/api.js';
  import { formatDate } from '../stores/app.js';
  import { error } from '../stores/app.js';

  export let round;

  const dispatch = createEventDispatcher();

  async function deleteRound() {
    if (!confirm(`Are you sure you want to delete this round? This will also delete all shots and statistics.`)) {
      return;
    }

    try {
      await roundsApi.delete(round.id);
      dispatch('deleted');
    } catch (err) {
      console.error('Failed to delete round:', err);
      error.set('Failed to delete round');
    }
  }

  function getCourseTypeLabel(type) {
    return type === 'championship' ? 'Championship' : 'Academic';
  }

  function getCourseTypeColor(type) {
    return type === 'championship' ? 'bg-ios-blue' : 'bg-ios-green';
  }
</script>

<div class="card">
  <div class="flex items-center justify-between">
    <div class="flex-1">
      <!-- Round Info -->
      <div class="flex items-center gap-3 mb-3">
        <h3 class="font-semibold text-ios-gray-900 text-lg">{round.course}</h3>
        <span class="px-2 py-1 rounded-full text-xs font-medium text-white {getCourseTypeColor(round.courseType)}">
          {getCourseTypeLabel(round.courseType)}
        </span>
      </div>

      <!-- Date and Time -->
      <p class="text-ios-gray-600 text-sm mb-3">
        {formatDate(round.createdAt)}
      </p>

    </div>

    <!-- Actions -->
    <div class="flex flex-col items-end gap-2">
      <a
        href="/rounds/{round.id}/holes"
        use:link
        class="btn-primary text-sm px-4 py-2"
      >
        Play Round
      </a>
      
      <button
        on:click={deleteRound}
        class="p-2 text-ios-red hover:bg-ios-red/10 rounded-lg transition-colors"
        title="Delete round"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
</div>
