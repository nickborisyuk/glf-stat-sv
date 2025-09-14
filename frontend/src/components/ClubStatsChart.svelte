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
    const labels = stats.map(stat => stat.club);
    const successData = stats.map(stat => parseFloat(stat.successRate));
    const totalData = stats.map(stat => stat.totalShots);

    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Success Rate (%)',
            data: successData,
            backgroundColor: 'rgba(52, 199, 89, 0.2)',
            borderColor: 'rgba(52, 199, 89, 1)',
            borderWidth: 2,
            yAxisID: 'y'
          },
          {
            label: 'Total Shots',
            data: totalData,
            backgroundColor: 'rgba(0, 122, 255, 0.2)',
            borderColor: 'rgba(0, 122, 255, 1)',
            borderWidth: 2,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Club Performance',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Success Rate (%)'
            },
            min: 0,
            max: 100
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Total Shots'
            },
            grid: {
              drawOnChartArea: false,
            },
            min: 0
          }
        }
      }
    });
  }

  $: if (chart && stats.length > 0) {
    chart.data.labels = stats.map(stat => stat.club);
    chart.data.datasets[0].data = stats.map(stat => parseFloat(stat.successRate));
    chart.data.datasets[1].data = stats.map(stat => stat.totalShots);
    chart.update();
  }
</script>

<div class="bg-white rounded-2xl p-4 shadow-sm border border-ios-gray-200">
  <div class="h-64">
    <canvas bind:this={chartCanvas}></canvas>
  </div>
</div>
