<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { formatRateType, formatEuriborPeriod } = useFinancial()

// Get IDs from query
const ids = computed(() => {
  const idsParam = route.query.ids as string
  return idsParam ? idsParam.split(',').filter(Boolean) : []
})

// Redirect if no IDs
if (ids.value.length < 2) {
  router.push('/dashboard')
}

// Fetch simulations for comparison
interface SimulationSummary {
  monthlyPayment: number
  totalPayment: number
  totalInterest: number
  totalStampDuty: number
  totalInsurance: number
  effectiveRate: number
}

interface Simulation {
  id: string
  name: string
  loanAmount: number
  interestRate: number
  euribor: number | null
  spread: number | null
  termMonths: number
  stampDutyRate: number
  insuranceRate: number
  rateType: 'variable' | 'fixed' | 'mixed'
  euriborPeriod: '3m' | '6m' | '12m' | null
  summary: SimulationSummary
  createdAt: string
}

const { data: simulations, pending: isLoading, error } = await useFetch<Simulation[]>(
  `/api/simulations/compare`,
  {
    query: { ids: ids.value.join(',') }
  }
)

if (error.value) {
  const isProError = error.value.statusCode === 403

  toast.add({
    title: isProError ? 'Funcionalidade Pro' : 'Erro ao carregar',
    description: isProError
      ? 'A comparação de cenários está disponível apenas no plano Pro.'
      : 'Não foi possível carregar as simulações para comparação.',
    color: isProError ? 'primary' : 'error',
    icon: isProError ? 'i-lucide-lock' : 'i-lucide-alert-circle',
    actions: isProError
      ? [{
          label: 'Fazer Upgrade',
          onClick: () => { window.open(useRuntimeConfig().public.lemonSqueezyCheckoutUrl, '_blank') }
        }]
      : undefined
  })
  router.push('/dashboard')
}

// Comparison metrics
const comparisonMetrics = computed(() => {
  if (!simulations.value || simulations.value.length < 2) return null

  const sorted = [...simulations.value].sort(
    (a, b) => a.summary.monthlyPayment - b.summary.monthlyPayment
  )
  const cheapest = sorted[0]!
  const mostExpensive = sorted[sorted.length - 1]!

  // Find best by total interest
  const sortedByInterest = [...simulations.value].sort(
    (a, b) => a.summary.totalInterest - b.summary.totalInterest
  )
  const leastInterest = sortedByInterest[0]!

  // Find best by total payment
  const sortedByTotal = [...simulations.value].sort(
    (a, b) => a.summary.totalPayment - b.summary.totalPayment
  )
  const cheapestTotal = sortedByTotal[0]!

  return {
    cheapestMonthly: cheapest,
    mostExpensiveMonthly: mostExpensive,
    monthlyDifference: mostExpensive.summary.monthlyPayment - cheapest.summary.monthlyPayment,
    leastInterest,
    interestSavings: mostExpensive.summary.totalInterest - leastInterest.summary.totalInterest,
    cheapestTotal,
    totalSavings: mostExpensive.summary.totalPayment - cheapestTotal.summary.totalPayment
  }
})

// Get value class for comparison highlighting
function getValueClass(simulation: Simulation, field: 'monthlyPayment' | 'totalInterest' | 'totalPayment') {
  if (!simulations.value || simulations.value.length < 2) return ''

  const values = simulations.value.map(s => s.summary[field])
  const min = Math.min(...values)
  const max = Math.max(...values)
  const value = simulation.summary[field]

  if (value === min) return 'text-green-600 dark:text-green-400 font-bold'
  if (value === max && simulations.value.length > 2) return 'text-red-600 dark:text-red-400'
  return ''
}

// Format helpers
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

function formatTermYears(months: number): string {
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (remainingMonths === 0) {
    return `${years} anos`
  }
  return `${years}a ${remainingMonths}m`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Comparison rows configuration
const comparisonRows = [
  { key: 'loanAmount', label: 'Montante', format: formatCurrency, icon: 'i-lucide-banknote' },
  { key: 'termMonths', label: 'Prazo', format: formatTermYears, icon: 'i-lucide-calendar' },
  { key: 'interestRate', label: 'TAN', format: (v: number) => `${(v * 100).toFixed(3)}%`, icon: 'i-lucide-percent' },
  { key: 'rateType', label: 'Tipo de Taxa', format: formatRateType, icon: 'i-lucide-settings' },
  { key: 'euriborPeriod', label: 'Revisão', format: (v: string | null) => v ? formatEuriborPeriod(v) : '-', icon: 'i-lucide-refresh-cw' }
]

const resultRows = [
  { key: 'monthlyPayment' as const, label: 'Prestação Mensal', highlight: true, icon: 'i-lucide-wallet', format: null },
  { key: 'totalPayment' as const, label: 'Total a Pagar', highlight: true, icon: 'i-lucide-coins', format: null },
  { key: 'totalInterest' as const, label: 'Total de Juros', highlight: true, icon: 'i-lucide-trending-up', format: null },
  { key: 'totalStampDuty' as const, label: 'Imposto do Selo', highlight: false, icon: 'i-lucide-receipt', format: null },
  { key: 'totalInsurance' as const, label: 'Seguros', highlight: false, icon: 'i-lucide-shield', format: null },
  { key: 'effectiveRate' as const, label: 'Custo Efetivo', highlight: false, icon: 'i-lucide-percent', format: (v: number) => `${v.toFixed(2)}%` }
]

// Helper to get summary value
function getSummaryValue(sim: Simulation, key: keyof SimulationSummary): number {
  return sim.summary[key]
}

// Helper to get simulation param value
function getSimulationValue(sim: Simulation, key: string): unknown {
  return (sim as unknown as Record<string, unknown>)[key]
}
</script>

<template>
  <div>
    <!-- Breadcrumb -->
    <div class="mb-6">
      <UButton
        to="/dashboard"
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-left"
        size="sm"
      >
        Voltar ao Dashboard
      </UButton>
    </div>

    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
        <UIcon
          name="i-lucide-git-compare"
          class="w-8 h-8 text-primary-500"
        />
        Comparar Simulações
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        Compare até 3 simulações lado a lado
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="space-y-6"
    >
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-48"
        />
      </div>
      <USkeleton class="h-96" />
    </div>

    <!-- Comparison Content -->
    <div v-else-if="simulations && simulations.length >= 2">
      <!-- Quick Summary Cards -->
      <div
        v-if="comparisonMetrics"
        class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <!-- Cheapest Monthly -->
        <UCard class="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
          <div class="flex items-start gap-3">
            <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UIcon
                name="i-lucide-trophy"
                class="w-5 h-5 text-green-600 dark:text-green-400"
              />
            </div>
            <div>
              <p class="text-sm text-green-700 dark:text-green-300 font-medium">
                Prestação Mais Baixa
              </p>
              <p class="text-lg font-bold text-green-800 dark:text-green-200">
                {{ comparisonMetrics.cheapestMonthly?.name || 'Sem nome' }}
              </p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {{ formatCurrency(comparisonMetrics.cheapestMonthly?.summary.monthlyPayment ?? 0) }}
              </p>
              <p class="text-xs text-green-600 dark:text-green-400 mt-1">
                Poupa {{ formatCurrency(comparisonMetrics.monthlyDifference) }}/mês vs a mais cara
              </p>
            </div>
          </div>
        </UCard>

        <!-- Least Interest -->
        <UCard class="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <div class="flex items-start gap-3">
            <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UIcon
                name="i-lucide-piggy-bank"
                class="w-5 h-5 text-blue-600 dark:text-blue-400"
              />
            </div>
            <div>
              <p class="text-sm text-blue-700 dark:text-blue-300 font-medium">
                Menos Juros
              </p>
              <p class="text-lg font-bold text-blue-800 dark:text-blue-200">
                {{ comparisonMetrics.leastInterest?.name || 'Sem nome' }}
              </p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {{ formatCurrency(comparisonMetrics.leastInterest?.summary.totalInterest ?? 0) }}
              </p>
              <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Poupa {{ formatCurrency(comparisonMetrics.interestSavings) }} em juros
              </p>
            </div>
          </div>
        </UCard>

        <!-- Total Savings -->
        <UCard class="bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800">
          <div class="flex items-start gap-3">
            <div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <UIcon
                name="i-lucide-wallet"
                class="w-5 h-5 text-purple-600 dark:text-purple-400"
              />
            </div>
            <div>
              <p class="text-sm text-purple-700 dark:text-purple-300 font-medium">
                Menor Custo Total
              </p>
              <p class="text-lg font-bold text-purple-800 dark:text-purple-200">
                {{ comparisonMetrics.cheapestTotal?.name || 'Sem nome' }}
              </p>
              <p class="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {{ formatCurrency(comparisonMetrics.cheapestTotal?.summary.totalPayment ?? 0) }}
              </p>
              <p class="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Poupa {{ formatCurrency(comparisonMetrics.totalSavings) }} no total
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Comparison Table -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-table-2"
              class="w-5 h-5 text-gray-400"
            />
            <h2 class="font-semibold text-gray-900 dark:text-white">
              Comparação Detalhada
            </h2>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="min-w-full">
            <!-- Header with simulation names -->
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="py-4 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400 w-48">
                  Parâmetro
                </th>
                <th
                  v-for="sim in simulations"
                  :key="sim.id"
                  class="py-4 px-4 text-center"
                >
                  <div class="flex flex-col items-center gap-1">
                    <span class="font-semibold text-gray-900 dark:text-white">
                      {{ sim.name || 'Sem nome' }}
                    </span>
                    <span class="text-xs text-gray-400">
                      {{ formatDate(sim.createdAt) }}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <!-- Parameters Section -->
              <tr class="bg-gray-50 dark:bg-gray-800/50">
                <td
                  :colspan="simulations.length + 1"
                  class="py-2 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Parâmetros do Empréstimo
                </td>
              </tr>

              <tr
                v-for="row in comparisonRows"
                :key="row.key"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/30"
              >
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <UIcon
                      :name="row.icon"
                      class="w-4 h-4 text-gray-400"
                    />
                    <span class="text-sm text-gray-600 dark:text-gray-300">{{ row.label }}</span>
                  </div>
                </td>
                <td
                  v-for="sim in simulations"
                  :key="sim.id"
                  class="py-3 px-4 text-center text-sm font-medium text-gray-900 dark:text-white"
                >
                  {{ row.format(getSimulationValue(sim, row.key) as never) }}
                </td>
              </tr>

              <!-- Results Section -->
              <tr class="bg-gray-50 dark:bg-gray-800/50">
                <td
                  :colspan="simulations.length + 1"
                  class="py-2 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Resultados
                </td>
              </tr>

              <tr
                v-for="row in resultRows"
                :key="row.key"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/30"
                :class="{ 'bg-primary-50/50 dark:bg-primary-900/10': row.highlight }"
              >
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <UIcon
                      :name="row.icon"
                      class="w-4 h-4 text-gray-400"
                    />
                    <span
                      class="text-sm"
                      :class="row.highlight ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'"
                    >
                      {{ row.label }}
                    </span>
                  </div>
                </td>
                <td
                  v-for="sim in simulations"
                  :key="sim.id"
                  class="py-3 px-4 text-center"
                  :class="[
                    row.highlight ? 'text-base' : 'text-sm',
                    row.highlight ? getValueClass(sim, row.key as 'monthlyPayment' | 'totalInterest' | 'totalPayment') : 'text-gray-700 dark:text-gray-300'
                  ]"
                >
                  {{ row.format ? row.format(getSummaryValue(sim, row.key)) : formatCurrency(getSummaryValue(sim, row.key)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <!-- Actions -->
      <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <UButton
          to="/simulator"
          variant="soft"
          icon="i-lucide-plus"
          size="lg"
        >
          Criar Nova Simulação
        </UButton>
        <UButton
          to="/dashboard"
          variant="ghost"
          color="neutral"
          icon="i-lucide-arrow-left"
          size="lg"
        >
          Voltar ao Dashboard
        </UButton>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else
      class="py-12 text-center"
    >
      <div class="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <UIcon
          name="i-lucide-alert-circle"
          class="w-8 h-8 text-gray-400"
        />
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Não foi possível carregar a comparação
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        Volte ao dashboard e selecione as simulações novamente.
      </p>
      <UButton
        to="/dashboard"
        icon="i-lucide-arrow-left"
      >
        Voltar ao Dashboard
      </UButton>
    </div>
  </div>
</template>
