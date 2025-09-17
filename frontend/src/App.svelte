<script>
  import { onMount } from 'svelte';
  import Router from 'svelte-spa-router';
  import { activeTab, isLoading, error } from './stores/app.js';
  import { playersApi, roundsApi } from './lib/api.js';
import TabBar from './components/TabBar.svelte';
import ErrorToast from './components/ErrorToast.svelte';
import LoadingSpinner from './components/LoadingSpinner.svelte';

  // Import route components
  import PlayersPage from './routes/PlayersPage.svelte';
  import RoundsPage from './routes/RoundsPage.svelte';
  import HolesPage from './routes/HolesPage.svelte';
  import HolePage from './routes/HolePage.svelte';
  import StatsPage from './routes/StatsPage.svelte';

  // Define routes
  const routes = {
    '/': RoundsPage,
    '/players': PlayersPage,
    '/rounds': RoundsPage,
    '/rounds/:id/holes': HolesPage,
    '/rounds/:id/holes/:holeId': HolePage,
    '/stats': StatsPage,
  };

  let mounted = false;

  onMount(async () => {
    mounted = true;
    await loadInitialData();
  });

  async function loadInitialData() {
    isLoading.set(true);
    try {
      // Load players and rounds in parallel
      const [playersData, roundsData] = await Promise.all([
        playersApi.getAll(),
        roundsApi.getAll()
      ]);
      
      // Update stores
      import('./stores/app.js').then(({ players, rounds }) => {
        players.set(playersData);
        rounds.set(roundsData);
      });
    } catch (err) {
      console.error('Failed to load initial data:', err);
      error.set('Failed to load data. Please refresh the page.');
    } finally {
      isLoading.set(false);
    }
  }
</script>

<svelte:head>
  <title>Golf Stats Tracker</title>
  <meta name="description" content="Track your golf game statistics" />
</svelte:head>

{#if mounted}
  <div class="min-h-screen bg-ios-gray-50">
    <!-- Main Content -->
    <main class="pb-20">
      <Router {routes} />
    </main>
    
    <!-- Tab Bar -->
    <TabBar />
    
    <!-- Error Toast -->
    <ErrorToast />
    
    <!-- Loading Spinner -->
    <LoadingSpinner />
  </div>
{:else}
  <!-- Initial Loading Screen -->
  <div class="min-h-screen bg-ios-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="w-16 h-16 mx-auto mb-4 bg-ios-blue rounded-2xl flex items-center justify-center">
        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-ios-gray-900 mb-2">Golf Stats</h1>
      <p class="text-ios-gray-600">Loading your game data...</p>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f9f9f9;
  }

  :global(*) {
    box-sizing: border-box;
  }

  :global(.router-view) {
    min-height: calc(100vh - 88px);
  }
</style>
