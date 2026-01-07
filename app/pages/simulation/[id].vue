<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { calculateEarlyRepaymentFee, formatRateType, formatEuriborPeriod, calculateRevisionImpact } = useFinancial()
const { exportSimulationPdf } = usePdfExport()

// PDF export state
const isExporting = ref(false)
const showExportOptions = ref(false)

async function handleExportPdf(includeFullTable = false) {
  if (!simulation.value) return

  isExporting.value = true
  showExportOptions.value = false

  try {
    const filename = exportSimulationPdf(simulation.value, includeFullTable)
    toast.add({
      title: 'PDF exportado',
      description: `Ficheiro "${filename}" guardado com sucesso.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch {
    toast.add({
      title: 'Erro ao exportar',
      description: 'Não foi possível gerar o PDF. Tente novamente.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isExporting.value = false
  }
}

// Fetch Euribor rates for analysis
interface EuriborRates {
  rate3m: number
  rate6m: number
  rate12m: number
  date: string
}

const { data: euriborRates } = await useFetch<EuriborRates>('/api/euribor/latest', {
  lazy: true
})

// Fetch simulation data
interface AmortizationRow {
  paymentNumber: number
  installment: number
  interest: number
  principal: number
  stampDuty: number
  insurance: number
  totalPayment: number
  remainingBalance: number
}

interface SimulationData {
  id: string
  name: string
  loanAmount: number
  interestRate: number
  euribor: number | null
  spread: number | null
  termMonths: number
  stampDutyRate: number
  insuranceRate: number
  rateType?: 'variable' | 'fixed' | 'mixed'
  euriborPeriod?: '3m' | '6m' | '12m'
  amortizationTable: AmortizationRow[]
  summary: {
    monthlyPayment: number
    totalPayment: number
    totalInterest: number
    totalStampDuty: number
    totalInsurance: number
    effectiveRate: number
  }
  createdAt: string
}

const { data: simulation, pending: isLoading, error } = await useFetch<SimulationData>(
  `/api/simulations/${route.params.id}`
)

// Computed early repayment fee
const earlyRepaymentFee = computed(() => {
  if (!simulation.value) return null
  // We use current balance from first row (or loan amount if new) but usually current balance decreases.
  // For "Cost to exit NOW", we should look at remaining balance.
  // But wait, the simulation is static. It shows the plan from start.
  // Ideally, "Cost to exit" depends on WHEN you exit.
  // For now, let's show the cost based on the INITIAL loan amount as a reference,
  // OR the current balance if we had tracking. Since this is a simulation view,
  // let's show the fee for the FULL amount (as if cancelling immediately after contracting)
  // or maybe just explain the rate.
  // Actually, showing it based on loanAmount is a good baseline.

  return calculateEarlyRepaymentFee(
    simulation.value.loanAmount,
    simulation.value.rateType || 'variable'
  )
})

// Computed revision impact
const revisionImpact = computed(() => {
  if (!simulation.value || !euriborRates.value) return null
  return calculateRevisionImpact(simulation.value, euriborRates.value)
})

// Handle not found
if (error.value) {
  toast.add({
    title: 'Simulação não encontrada',
    description: 'A simulação que procura não existe ou foi apagada.',
    color: 'error',
    icon: 'i-lucide-alert-circle'
  })
  router.push('/dashboard')
}

// Table columns
const columns = [
  { key: 'paymentNumber', label: '#' },
  { key: 'installment', label: 'Prestação' },
  { key: 'interest', label: 'Juros' },
  { key: 'principal', label: 'Capital' },
  { key: 'stampDuty', label: 'IS' },
  { key: 'insurance', label: 'Seguro' },
  { key: 'totalPayment', label: 'Total' },
  { key: 'remainingBalance', label: 'Saldo' }
]

// Format helpers
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatTermYears(months: number): string {
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (remainingMonths === 0) {
    return `${years} anos`
  }
  return `${years} anos e ${remainingMonths} meses`
}
</script>

<template>
  <div>
    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="space-y-8"
    >
      <USkeleton class="h-12 w-64 mb-4" />
      <USkeleton class="h-6 w-48 mb-8" />
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <USkeleton
          v-for="i in 4"
          :key="i"
          class="h-24"
        />
      </div>
      <USkeleton class="h-96" />
    </div>

    <!-- Content -->
    <div v-else-if="simulation">
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
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {{ simulation.name || 'Simulação' }}
            </h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">
              Criada em {{ formatDate(simulation.createdAt) }}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <UPopover v-model:open="showExportOptions">
              <UButton
                variant="soft"
                color="neutral"
                icon="i-lucide-download"
                :loading="isExporting"
              >
                Exportar PDF
              </UButton>

              <template #content>
                <div class="p-2 space-y-1 min-w-[200px]">
                  <UButton
                    variant="ghost"
                    color="neutral"
                    block
                    class="justify-start"
                    icon="i-lucide-file-text"
                    @click="handleExportPdf(false)"
                  >
                    Resumo (recomendado)
                  </UButton>
                  <UButton
                    variant="ghost"
                    color="neutral"
                    block
                    class="justify-start"
                    icon="i-lucide-table"
                    @click="handleExportPdf(true)"
                  >
                    Com tabela completa
                  </UButton>
                </div>
              </template>
            </UPopover>

            <UButton
              to="/simulator"
              variant="soft"
              color="primary"
              icon="i-lucide-copy"
            >
              Nova baseada nesta
            </UButton>
          </div>
        </div>
      </div>

      <!-- Loan Parameters -->
      <UCard class="mb-8">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-settings-2"
              class="w-5 h-5 text-gray-400"
            />
            <h2 class="font-semibold text-gray-900 dark:text-white">
              Parâmetros do Empréstimo
            </h2>
          </div>
        </template>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Montante
            </p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(simulation.loanAmount) }}
            </p>
          </div>

          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Prazo
            </p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ formatTermYears(simulation.termMonths) }}
            </p>
          </div>

          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              TAN
            </p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ (simulation.interestRate * 100).toFixed(3) }}%
            </p>
          </div>

          <div v-if="simulation.euribor !== null && simulation.spread !== null">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Euribor + Spread
            </p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ simulation.euribor }}% + {{ simulation.spread }}%
            </p>
          </div>

          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Tipo de Taxa
            </p>
            <div class="flex flex-col">
              <span class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ formatRateType(simulation.rateType) }}
              </span>
              <span
                v-if="simulation.rateType === 'variable' || simulation.rateType === 'mixed'"
                class="text-xs text-gray-500"
              >
                {{ formatEuriborPeriod(simulation.euriborPeriod) }}
              </span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Early Repayment Info -->
      <UCard
        v-if="earlyRepaymentFee"
        class="mb-8 bg-orange-50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/30"
      >
        <div class="flex items-start gap-4">
          <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <UIcon
              name="i-lucide-alert-triangle"
              class="w-6 h-6 text-orange-600 dark:text-orange-400"
            />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
              Custo de Saída Estimado
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Se amortizar ou transferir a totalidade deste crédito hoje, terá de pagar uma comissão de amortização antecipada.
            </p>
            <div class="flex gap-6 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Comissão ({{ earlyRepaymentFee.feePercentage }}%):</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ formatCurrency(earlyRepaymentFee.totalFee) }}</span>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Revision Scenario (If Impact Exists) -->
      <UCard
        v-if="revisionImpact && revisionImpact.impact !== 0"
        class="mb-8 overflow-hidden border-2"
        :class="revisionImpact.type === 'danger' ? 'border-red-100 dark:border-red-900/30' : 'border-green-100 dark:border-green-900/30'"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-radar"
              class="w-5 h-5 text-gray-500"
            />
            <h2 class="font-semibold text-gray-900 dark:text-white">
              Cenário de Revisão (Hoje)
            </h2>
            <UBadge
              :color="revisionImpact.type === 'danger' ? 'error' : 'success'"
              variant="subtle"
              class="ml-auto"
            >
              {{ revisionImpact.label }}
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <!-- Comparison -->
          <div class="space-y-6">
            <div class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div>
                <p class="text-sm text-gray-500 mb-1">
                  Prestação Atual
                </p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ formatCurrency(revisionImpact.oldPayment ?? 0) }}
                </p>
              </div>
              <UIcon
                name="i-lucide-arrow-right"
                class="w-6 h-6 text-gray-400"
              />
              <div class="text-right">
                <p class="text-sm text-gray-500 mb-1">
                  Nova Prestação
                </p>
                <p
                  class="text-xl font-bold"
                  :class="revisionImpact.type === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'"
                >
                  {{ formatCurrency(revisionImpact.newPayment ?? 0) }}
                </p>
              </div>
            </div>

            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-500">Diferença mensal:</span>
              <span
                class="font-bold text-lg"
                :class="revisionImpact.type === 'danger' ? 'text-red-600' : 'text-green-600'"
              >
                {{ revisionImpact.impact > 0 ? '+' : '' }}{{ formatCurrency(revisionImpact.impact) }}
              </span>
            </div>
          </div>

          <!-- Explanation -->
          <div class="text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p class="mb-2">
              <strong class="text-gray-900 dark:text-white">Análise de Mercado:</strong>
            </p>
            <p class="mb-3 leading-relaxed">
              Com a Euribor {{ formatEuriborPeriod(simulation.euriborPeriod) }} atual, a sua prestação sofreria este ajuste se a revisão fosse hoje.
            </p>
            <UButton
              to="/simulator"
              variant="soft"
              block
              :color="revisionImpact.type === 'danger' ? 'error' : 'success'"
              icon="i-lucide-calculator"
            >
              Simular este cenário
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <UCard class="ring-1 ring-gray-200 dark:ring-gray-800">
          <div class="flex items-center gap-3 mb-3">
            <div class="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <UIcon
                name="i-lucide-calendar-clock"
                class="w-5 h-5 text-primary-600 dark:text-primary-400"
              />
            </div>
            <span class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Mensal</span>
          </div>
          <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ formatCurrency(simulation.summary.monthlyPayment) }}
          </p>
        </UCard>

        <UCard class="ring-1 ring-gray-200 dark:ring-gray-800">
          <div class="flex items-center gap-3 mb-3">
            <div class="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <UIcon
                name="i-lucide-coins"
                class="w-5 h-5 text-gray-600 dark:text-gray-400"
              />
            </div>
            <span class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total</span>
          </div>
          <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ formatCurrency(simulation.summary.totalPayment) }}
          </p>
        </UCard>

        <UCard class="ring-1 ring-gray-200 dark:ring-gray-800">
          <div class="flex items-center gap-3 mb-3">
            <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <UIcon
                name="i-lucide-trending-up"
                class="w-5 h-5 text-orange-600 dark:text-orange-400"
              />
            </div>
            <span class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Juros</span>
          </div>
          <p class="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
            {{ formatCurrency(simulation.summary.totalInterest) }}
          </p>
        </UCard>

        <UCard class="ring-1 ring-gray-200 dark:ring-gray-800">
          <div class="flex items-center gap-3 mb-3">
            <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UIcon
                name="i-lucide-receipt"
                class="w-5 h-5 text-blue-600 dark:text-blue-400"
              />
            </div>
            <span class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Custo</span>
          </div>
          <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ simulation.summary.effectiveRate.toFixed(1) }}%
          </p>
        </UCard>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-bar-chart-3"
                class="w-5 h-5 text-gray-400"
              />
              <h3 class="font-semibold text-gray-900 dark:text-white">
                Composição da Prestação
              </h3>
            </div>
          </template>
          <ClientOnly>
            <AmortizationChart :data="simulation.amortizationTable" />
          </ClientOnly>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-line-chart"
                class="w-5 h-5 text-gray-400"
              />
              <h3 class="font-semibold text-gray-900 dark:text-white">
                Evolução da Dívida
              </h3>
            </div>
          </template>
          <ClientOnly>
            <BalanceChart
              :data="simulation.amortizationTable"
              :principal="simulation.loanAmount"
            />
          </ClientOnly>
        </UCard>
      </div>

      <!-- Amortization Table -->
      <UCard>
        <template #header>
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 class="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                <UIcon
                  name="i-lucide-table-2"
                  class="w-5 h-5 text-primary-500"
                />
                Tabela de Amortização
              </h2>
              <p class="text-sm text-gray-500 mt-1">
                Detalhe mensal de todos os pagamentos
              </p>
            </div>
            <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
              {{ simulation.amortizationTable.length }} meses
            </span>
          </div>
        </template>

        <div class="overflow-x-auto max-h-[500px] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead class="bg-gray-50/90 dark:bg-gray-800/90 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th
                  v-for="column in columns"
                  :key="column.key"
                  scope="col"
                  class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {{ column.label }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
              <tr
                v-for="row in simulation.amortizationTable"
                :key="row.paymentNumber"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {{ row.paymentNumber }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {{ formatCurrency(row.installment) }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {{ formatCurrency(row.interest) }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {{ formatCurrency(row.principal) }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {{ formatCurrency(row.stampDuty) }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {{ formatCurrency(row.insurance) }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {{ formatCurrency(row.totalPayment) }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {{ formatCurrency(row.remainingBalance) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>
  </div>
</template>
