<script>
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  
  export let stats = [];

  let chartCanvas;
  let chart = null;

  onMount(() => {
    Chart.register(...registerables);
    createChart();
    
    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  });

  function createChart() {
    if (!chartCanvas || stats.length === 0) return;

    const ctx = chartCanvas.getContext('2d');
    
    // Prepare data
    const labels = stats.map(stat => stat.location.charAt(0).toUpperCase() + stat.location.slice(1));
    const successData = stats.map(stat => parseFloat(stat.successRate));
    const totalData = stats.map(stat => stat.totalShots);

    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: totalData,
            backgroundColor: [
              'rgba(52, 199, 89, 0.8)',
              'rgba(0, 122, 255, 0.8)',
              'rgba(255, 149, 0, 0.8)',
              'rgba(255, 59, 48, 0.8)',
              'rgba(175, 82, 222, 0.8)',
              'rgba(255, 45, 146, 0.8)',
              'rgba(90, 200, 250, 0.8)'
            ],
            borderColor: [
              'rgba(52, 199, 89, 1)',
              'rgba(0, 122, 255, 1)',
              'rgba(255, 149, 0, 1)',
              'rgba(255, 59, 48, 1)',
              'rgba(175, 82, 222, 1)',
              'rgba(255, 45, 146, 1)',
              'rgba(90, 200, 250, 1)'
            ],
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Shots by Location',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      }
    });
  }

  $: if (chart && stats.length > 0) {
    chart.data.labels = stats.map(stat => stat.location.charAt(0).toUpperCase() + stat.location.slice(1));
    chart.data.datasets[0].data = stats.map(stat => stat.totalShots);
    chart.update();
  }
</script>

<div class="bg-white rounded-2xl p-4 shadow-sm border border-ios-gray-200">
  <div class="h-64">
    <canvas bind:this={chartCanvas}></canvas>
  </div>
</div>
