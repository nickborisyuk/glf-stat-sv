<script>
  import { link } from 'svelte-spa-router';
  import { activeTab } from '../stores/app.js';

  const tabs = [
    {
      id: 'rounds',
      label: 'Rounds',
      href: '/rounds',
      icon: 'rounds'
    },
    {
      id: 'players',
      label: 'Players',
      href: '/players',
      icon: 'players'
    },
    {
      id: 'stats',
      label: 'Stats',
      href: '/stats',
      icon: 'stats'
    }
  ];

  function getIconPath(icon) {
    switch (icon) {
      case 'rounds':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'players':
        return 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z';
      case 'stats':
        return 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z';
      default:
        return 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4';
    }
  }
</script>

<div class="tab-bar safe-area-inset">
  <div class="flex items-center justify-around px-2 py-2">
    {#each tabs as tab}
      <a 
        href={tab.href}
        use:link
        class="flex flex-col items-center justify-center p-2 rounded-xl transition-colors duration-200
               {$activeTab === tab.id 
                 ? 'text-ios-blue' 
                 : 'text-ios-gray-500 hover:text-ios-gray-700'}"
        on:click={() => activeTab.set(tab.id)}
      >
        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIconPath(tab.icon)} />
        </svg>
        <span class="text-xs font-medium">{tab.label}</span>
      </a>
    {/each}
  </div>
</div>
