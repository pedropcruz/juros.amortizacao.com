<script setup lang="ts">
import { Line } from 'vue-chartjs'
import type { TooltipItem } from 'chart.js'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface AmortizationRow {
  paymentNumber: number
  remainingBalance: number
}

const props = defineProps<{
  data: AmortizationRow[]
  principal: number
}>()

// Sample data at yearly intervals for readability
const yearlyData = computed(() => {
  // Include first month (full balance) and then every 12 months
  const result = [{ paymentNumber: 0, remainingBalance: props.principal }]
  props.data.forEach((row, index) => {
    if ((index + 1) % 12 === 0 || index === props.data.length - 1) {
      result.push(row)
    }
  })
  return result
})

const chartData = computed(() => ({
  labels: yearlyData.value.map((row) => {
    if (row.paymentNumber === 0) return 'Início'
    return `Ano ${Math.ceil(row.paymentNumber / 12)}`
  }),
  datasets: [
    {
      label: 'Saldo Devedor',
      data: yearlyData.value.map(row => row.remainingBalance),
      borderColor: '#3b82f6', // blue-500
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      pointRadius: 2,
      fill: true,
      tension: 0.4
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        boxWidth: 8
      }
    },
    title: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#1f2937',
      bodyColor: '#1f2937',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 10,
      displayColors: true,
      callbacks: {
        label: (context: TooltipItem<'line'>) => {
          const label = context.dataset.label || ''
          const y = context.parsed.y ?? 0
          const value = new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR'
          }).format(y)
          return `${label}: ${value}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#f3f4f6'
      },
      ticks: {
        callback: (value: number | string) => {
          if (typeof value === 'number') {
            return new Intl.NumberFormat('pt-PT', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0
            }).format(value)
          }
          return value
        }
      }
    }
  }
}
</script>

<template>
  <div class="h-64 w-full">
    <Line
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>
