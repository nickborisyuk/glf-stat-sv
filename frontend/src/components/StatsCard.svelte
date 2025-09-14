<script>
  export let title;
  export let value;
  export let icon;
  export let color = 'blue';

  function getIconPath(iconName) {
    switch (iconName) {
      case 'rounds':
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'shots':
        return 'M13 10V3L4 14h7v7l9-11h-7z';
      case 'success':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'fail':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'penalty':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  function getColorClasses(colorName) {
    switch (colorName) {
      case 'blue':
        return {
          bg: 'bg-ios-blue/10',
          text: 'text-ios-blue',
          icon: 'text-ios-blue'
        };
      case 'green':
        return {
          bg: 'bg-ios-green/10',
          text: 'text-ios-green',
          icon: 'text-ios-green'
        };
      case 'red':
        return {
          bg: 'bg-ios-red/10',
          text: 'text-ios-red',
          icon: 'text-ios-red'
        };
      case 'orange':
        return {
          bg: 'bg-ios-orange/10',
          text: 'text-ios-orange',
          icon: 'text-ios-orange'
        };
      default:
        return {
          bg: 'bg-ios-gray-100',
          text: 'text-ios-gray-700',
          icon: 'text-ios-gray-500'
        };
    }
  }

  $: colors = getColorClasses(color);
</script>

<div class="bg-white rounded-2xl p-4 shadow-sm border border-ios-gray-200">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm font-medium text-ios-gray-600">{title}</p>
      <p class="text-2xl font-bold {colors.text}">{value}</p>
    </div>
    <div class="w-12 h-12 {colors.bg} rounded-xl flex items-center justify-center">
      <svg class="w-6 h-6 {colors.icon}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIconPath(icon)} />
      </svg>
    </div>
  </div>
</div>
