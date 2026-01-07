<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const toast = useToast()
const { isAuthenticated } = useAuth()

// Rate type and Euribor period options
type RateType = 'variable' | 'fixed' | 'mixed'
type EuriborPeriod = '3m' | '6m' | '12m'

const rateTypeOptions = [
  { label: 'Taxa Variável', value: 'variable' as RateType },
  { label: 'Taxa Fixa', value: 'fixed' as RateType },
  { label: 'Taxa Mista', value: 'mixed' as RateType }
]

const euriborPeriodOptions = [
  { label: 'Euribor 3 Meses', value: '3m' as EuriborPeriod },
  { label: 'Euribor 6 Meses', value: '6m' as EuriborPeriod },
  { label: 'Euribor 12 Meses', value: '12m' as EuriborPeriod }
]

// Early repayment fee rates (Portuguese law)
const EARLY_REPAYMENT_FEES = {
  variable: 0.005, // 0.5%
  fixed: 0.02, // 2.0%
  mixed: 0.02 // 2.0% during fixed period
}
const STAMP_DUTY_ON_FEE = 0.04 // 4%

// Form schema using Zod
const schema = z.object({
  principal: z.number().positive('O montante deve ser positivo'),
  euribor: z
    .number()
    .min(-1, 'A Euribor não pode ser inferior a -1%')
    .max(20, 'A Euribor não pode ser superior a 20%'),
  spread: z
    .number()
    .min(0, 'O spread não pode ser negativo')
    .max(10, 'O spread não pode ser superior a 10%'),
  termYears: z
    .number()
    .int()
    .min(1, 'O prazo mínimo é 1 ano')
    .max(50, 'O prazo máximo é 50 anos'),
  stampDutyRate: z.number().min(0).max(1),
  insuranceRate: z.number().min(0).max(0.01)
})

type Schema = z.output<typeof schema>

// Fixed period options for mixed rates
const fixedPeriodOptions = [
  { label: '2 Anos', value: 2 },
  { label: '3 Anos', value: 3 },
  { label: '5 Anos', value: 5 },
  { label: '7 Anos', value: 7 },
  { label: '10 Anos', value: 10 },
  { label: '15 Anos', value: 15 }
]

// Form state (values are in percentage)
const state = reactive({
  principal: 150000,
  euribor: 2.5,
  spread: 1.0,
  termYears: 30,
  stampDutyRate: 0.04,
  insuranceRate: 0.0003,
  // New fields for rate intelligence
  rateType: 'variable' as RateType,
  euriborPeriod: '6m' as EuriborPeriod,
  // Mixed rate specific fields
  fixedPeriodYears: 5, // Duration of fixed rate period in years
  fixedRate: 3.5 // Fixed rate during initial period (percentage)
})

// Computed: Show Euribor fields only for variable/mixed rates
const showEuriborFields = computed(() => state.rateType !== 'fixed')

// Computed: Show mixed rate specific fields
const showMixedRateFields = computed(() => state.rateType === 'mixed')

// Computed: Early repayment fee calculation
const earlyRepaymentFee = computed(() => {
  const feeRate = EARLY_REPAYMENT_FEES[state.rateType]
  const baseFee = state.principal * feeRate
  const stampDuty = baseFee * STAMP_DUTY_ON_FEE
  const totalFee = baseFee + stampDuty
  const feePercentage = feeRate * (1 + STAMP_DUTY_ON_FEE) * 100

  return {
    baseFee: Math.round(baseFee * 100) / 100,
    stampDuty: Math.round(stampDuty * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    feePercentage: Math.round(feePercentage * 1000) / 1000
  }
})

// Computed TAN
const tan = computed(() => {
  if (state.rateType === 'fixed') {
    // For fixed rate, euribor field holds the full rate
    return state.euribor / 100
  }
  // For variable/mixed, TAN = Euribor + Spread
  return (state.euribor / 100) + (state.spread / 100)
})
const tanPercentage = computed(() => (tan.value * 100).toFixed(3))

// Advanced options visibility
const showAdvanced = ref(false)

// Early repayment simulator visibility
const showEarlyRepayment = ref(false)

// Save simulation modal
const showSaveModal = ref(false)
const simulationName = ref('')
const isSaving = ref(false)

// Results state
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

interface CalculationResult {
  table: AmortizationRow[]
  summary: {
    monthlyPayment: number
    totalPayment: number
    totalInterest: number
    totalStampDuty: number
    totalInsurance: number
    interestToPrincipalRatio: number
    effectiveRate?: number
    // Mixed rate specific fields
    monthlyPaymentAfterFixedPeriod?: number
    fixedPeriodMonths?: number
    paymentIncrease?: number
    paymentIncreasePercent?: number
  }
}

const result = ref<CalculationResult | null>(null)
const tableRows = ref<AmortizationRow[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const resultsSection = ref<HTMLElement | null>(null)
const simulatorSection = ref<HTMLElement | null>(null)
const { $posthog } = useNuxtApp()

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

function openEarlyRepayment() {
  showEarlyRepayment.value = true
  $posthog?.()?.capture('early_repayment_opened')
}

// Save simulation handler
async function saveSimulation() {
  if (!result.value) return

  isSaving.value = true

  try {
    await $fetch('/api/simulations', {
      method: 'POST',
      body: {
        name: simulationName.value || undefined,
        loanAmount: state.principal,
        interestRate: tan.value,
        euribor: showEuriborFields.value ? state.euribor : undefined,
        spread: showEuriborFields.value ? state.spread : undefined,
        termMonths: state.termYears * 12,
        stampDutyRate: state.stampDutyRate,
        insuranceRate: state.insuranceRate,
        // New fields for rate intelligence
        rateType: state.rateType,
        euriborPeriod: showEuriborFields.value ? state.euriborPeriod : undefined,
        amortizationTable: result.value.table,
        summary: {
          ...result.value.summary,
          effectiveRate: result.value.summary.effectiveRate || result.value.summary.interestToPrincipalRatio
        }
      }
    })

    toast.add({
      title: 'Simulação guardada',
      description: 'A sua simulação foi guardada com sucesso.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    showSaveModal.value = false
    simulationName.value = ''

    $posthog?.()?.capture('simulation_saved', {
      principal: state.principal,
      term_years: state.termYears
    })
  } catch (e) {
    toast.add({
      title: 'Erro ao guardar',
      description: 'Não foi possível guardar a simulação. Tente novamente.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    console.error(e)
  } finally {
    isSaving.value = false
  }
}

function openSaveModal() {
  if (!isAuthenticated.value) {
    toast.add({
      title: 'Autenticação necessária',
      description: 'Crie uma conta ou faça login para guardar simulações.',
      color: 'warning',
      icon: 'i-lucide-log-in'
    })
    return
  }
  // Generate default name
  simulationName.value = `${formatCurrency(state.principal)} - ${state.termYears} anos`
  showSaveModal.value = true
}

// Submit handler
async function onSubmit(event: FormSubmitEvent<Schema>) {
  isLoading.value = true
  error.value = null
  tableRows.value = []

  try {
    // Build request body with mixed rate support
    const requestBody: Record<string, unknown> = {
      principal: event.data.principal,
      tan: tan.value,
      termMonths: event.data.termYears * 12,
      stampDutyRate: event.data.stampDutyRate,
      insuranceRate: event.data.insuranceRate,
      rateType: state.rateType
    }

    // Add mixed rate specific params
    if (state.rateType === 'mixed') {
      requestBody.fixedPeriodMonths = state.fixedPeriodYears * 12
      requestBody.fixedRate = state.fixedRate / 100 // Convert to decimal
      requestBody.variableRate = (state.euribor + state.spread) / 100 // Euribor + Spread as decimal
    }

    const response = await $fetch<CalculationResult>('/api/calculate', {
      method: 'POST',
      body: requestBody
    })

    result.value = response
    tableRows.value = response.table

    $posthog?.()?.capture('calculation_performed', {
      principal: event.data.principal,
      term_years: event.data.termYears,
      tan: tan.value,
      rate_type: state.rateType,
      monthly_payment: response.summary.monthlyPayment
    })

    await nextTick()
    resultsSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (e) {
    error.value
      = 'Erro ao calcular a simulação. Por favor, verifique os dados.'
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

// Format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

// Watch for simulator open
watch(showEarlyRepayment, async (val) => {
  if (val) {
    await nextTick()
    simulatorSection.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
})
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-950 pb-24">
    <!-- Page Header -->
    <div class="relative bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Simulador de Crédito Habitação
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Calcule a sua prestação e descubra quanto pode poupar
            </p>
          </div>
          <div class="flex items-center gap-3">
            <UButton
              to="/dashboard"
              variant="ghost"
              color="neutral"
              icon="i-lucide-folder"
            >
              Minhas Simulações
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Form Section -->
        <div class="lg:col-span-4">
          <UCard class="sticky top-24 ring-1 ring-gray-200 dark:ring-gray-800 shadow-lg">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-settings-2"
                  class="w-5 h-5 text-gray-500"
                />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Dados do Empréstimo
                </h2>
              </div>
            </template>

            <UForm
              :schema="schema"
              :state="state"
              class="space-y-6"
              @submit="onSubmit"
            >
              <UFormField
                label="Montante em Dívida"
                name="principal"
                help="Valor total do empréstimo ou capital em dívida atual."
              >
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
                  <UInput
                    v-model.number="state.principal"
                    type="number"
                    :min="1000"
                    :step="1000"
                    placeholder="150000"
                    class="pl-6"
                    size="lg"
                  />
                </div>
              </UFormField>

              <!-- Rate Type Selection -->
              <UFormField
                label="Tipo de Taxa"
                name="rateType"
              >
                <USelectMenu
                  v-model="state.rateType"
                  :items="rateTypeOptions"
                  value-key="value"
                  class="w-full"
                />
              </UFormField>

              <!-- Euribor Period (only for variable/mixed) -->
              <UFormField
                v-if="showEuriborFields"
                label="Período Euribor"
                name="euriborPeriod"
                help="Prazo de revisão da taxa de juro."
              >
                <USelectMenu
                  v-model="state.euriborPeriod"
                  :items="euriborPeriodOptions"
                  value-key="value"
                  class="w-full"
                />
              </UFormField>

              <!-- Euribor and Spread (only for variable/mixed) -->
              <div
                v-if="showEuriborFields"
                class="grid grid-cols-2 gap-4"
              >
                <UFormField
                  label="Euribor"
                  name="euribor"
                >
                  <UInput
                    v-model.number="state.euribor"
                    type="number"
                    :min="-1"
                    :max="20"
                    :step="0.1"
                    placeholder="2.5"
                  >
                    <template #trailing>
                      <span class="text-gray-500 dark:text-gray-400 text-xs">%</span>
                    </template>
                  </UInput>
                </UFormField>

                <UFormField
                  label="Spread"
                  name="spread"
                >
                  <UInput
                    v-model.number="state.spread"
                    type="number"
                    :min="0"
                    :max="10"
                    :step="0.1"
                    placeholder="1.0"
                  >
                    <template #trailing>
                      <span class="text-gray-500 dark:text-gray-400 text-xs">%</span>
                    </template>
                  </UInput>
                </UFormField>
              </div>

              <!-- Fixed Rate Input (only for fixed rates) -->
              <UFormField
                v-if="!showEuriborFields"
                label="Taxa Fixa (TAN)"
                name="fixedRate"
                help="Taxa anual fixa contratada."
              >
                <UInput
                  v-model.number="state.euribor"
                  type="number"
                  :min="0"
                  :max="20"
                  :step="0.1"
                  placeholder="3.5"
                >
                  <template #trailing>
                    <span class="text-gray-500 dark:text-gray-400 text-xs">%</span>
                  </template>
                </UInput>
              </UFormField>

              <!-- Mixed Rate Configuration -->
              <div
                v-if="showMixedRateFields"
                class="space-y-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl ring-1 ring-amber-200 dark:ring-amber-800"
              >
                <div class="flex items-center gap-2 mb-2">
                  <UIcon
                    name="i-lucide-split"
                    class="w-4 h-4 text-amber-600 dark:text-amber-400"
                  />
                  <span class="text-sm font-medium text-amber-900 dark:text-amber-100">Configuracao Taxa Mista</span>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <UFormField
                    label="Periodo Fixo"
                    name="fixedPeriodYears"
                    help="Duracao da taxa fixa inicial"
                  >
                    <USelectMenu
                      v-model="state.fixedPeriodYears"
                      :items="fixedPeriodOptions"
                      value-key="value"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    label="Taxa Fixa Inicial"
                    name="mixedFixedRate"
                  >
                    <UInput
                      v-model.number="state.fixedRate"
                      type="number"
                      :min="0"
                      :max="20"
                      :step="0.1"
                      placeholder="3.5"
                    >
                      <template #trailing>
                        <span class="text-gray-500 dark:text-gray-400 text-xs">%</span>
                      </template>
                    </UInput>
                  </UFormField>
                </div>

                <p class="text-xs text-amber-700 dark:text-amber-300">
                  Apos {{ state.fixedPeriodYears }} anos, passa a taxa variavel: Euribor ({{ state.euribor }}%) + Spread ({{ state.spread }}%) = {{ (state.euribor + state.spread).toFixed(2) }}%
                </p>
              </div>

              <!-- TAN Display -->
              <div class="p-4 bg-primary-50 dark:bg-primary-950/50 rounded-xl ring-1 ring-primary-200 dark:ring-primary-800">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-primary-900 dark:text-primary-100">
                    {{ showMixedRateFields ? 'TAN Inicial (Periodo Fixo)' : 'TAN (Taxa Anual)' }}
                  </span>
                  <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {{ showMixedRateFields ? state.fixedRate.toFixed(3) : tanPercentage }}%
                  </span>
                </div>
                <p
                  v-if="showEuriborFields && !showMixedRateFields"
                  class="text-xs text-primary-600/70 dark:text-primary-400/70 mt-1"
                >
                  Euribor ({{ state.euribor }}%) + Spread ({{ state.spread }}%)
                </p>
                <p
                  v-else-if="showMixedRateFields"
                  class="text-xs text-primary-600/70 dark:text-primary-400/70 mt-1"
                >
                  Taxa fixa durante {{ state.fixedPeriodYears }} anos, depois passa a {{ (state.euribor + state.spread).toFixed(2) }}%
                </p>
                <p
                  v-else
                  class="text-xs text-primary-600/70 dark:text-primary-400/70 mt-1"
                >
                  Taxa Fixa Contratada
                </p>
              </div>

              <!-- Early Repayment Fee Warning -->
              <div class="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg ring-1 ring-orange-200 dark:ring-orange-800">
                <div class="flex items-start gap-2">
                  <UIcon
                    name="i-lucide-alert-triangle"
                    class="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0"
                  />
                  <div class="text-xs">
                    <p class="font-medium text-orange-900 dark:text-orange-100">
                      Custo de Amortização Total
                    </p>
                    <p class="text-orange-700 dark:text-orange-300 mt-0.5">
                      {{ formatCurrency(earlyRepaymentFee.totalFee) }} ({{ earlyRepaymentFee.feePercentage }}%)
                    </p>
                    <p class="text-orange-600/70 dark:text-orange-400/70 mt-1">
                      Taxa {{ state.rateType === 'fixed' ? 'fixa: 2%' : 'variável: 0.5%' }} + IS 4%
                    </p>
                  </div>
                </div>
              </div>

              <UFormField
                label="Prazo (anos)"
                name="termYears"
              >
                <UInput
                  v-model.number="state.termYears"
                  type="number"
                  :min="1"
                  :max="50"
                  placeholder="30"
                  icon="i-lucide-calendar"
                />
              </UFormField>

              <div>
                <UButton
                  variant="soft"
                  size="md"
                  block
                  class="mb-2 justify-between"
                  :icon="showAdvanced ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  trailing-icon
                  @click="showAdvanced = !showAdvanced"
                >
                  Opções Avançadas
                </UButton>

                <div
                  v-if="showAdvanced"
                  class="space-y-4 pt-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <UFormField
                    label="Imposto do Selo"
                    name="stampDutyRate"
                  >
                    <UInput
                      v-model.number="state.stampDutyRate"
                      type="number"
                      :min="0"
                      :max="0.1"
                      :step="0.01"
                    />
                  </UFormField>

                  <UFormField
                    label="Seguro Vida (permilagem)"
                    name="insuranceRate"
                  >
                    <UInput
                      v-model.number="state.insuranceRate"
                      type="number"
                      :min="0"
                      :max="0.01"
                      :step="0.0001"
                    />
                  </UFormField>
                </div>
              </div>

              <UButton
                type="submit"
                color="primary"
                block
                size="xl"
                class="font-bold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-shadow"
                :loading="isLoading"
                icon="i-lucide-calculator"
              >
                Calcular Prestação
              </UButton>
            </UForm>
          </UCard>
        </div>

        <!-- Results Section -->
        <div class="lg:col-span-8 space-y-8">
          <div
            v-if="error"
            class="mb-4"
          >
            <UAlert
              color="error"
              :title="error"
              icon="i-lucide-alert-circle"
              variant="subtle"
            />
          </div>

          <!-- Loading Skeleton -->
          <div
            v-if="isLoading"
            class="space-y-8"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <USkeleton class="h-24" />
              <USkeleton class="h-24" />
              <USkeleton class="h-24" />
              <USkeleton class="h-24" />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <USkeleton class="h-64" />
              <USkeleton class="h-64" />
            </div>
            <USkeleton class="h-96" />
          </div>

          <div
            v-if="!isLoading && result"
            ref="resultsSection"
            class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <!-- Summary Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <UCard class="relative overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <div class="relative z-10">
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
                    {{ formatCurrency(result.summary.monthlyPayment) }}
                  </p>
                </div>
              </UCard>

              <UCard class="relative overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 shadow-sm hover:shadow-md transition-shadow">
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
                  {{ formatCurrency(result.summary.totalPayment) }}
                </p>
              </UCard>

              <UCard class="relative overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 shadow-sm hover:shadow-md transition-shadow">
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
                  {{ formatCurrency(result.summary.totalInterest) }}
                </p>
              </UCard>

              <UCard class="relative overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 shadow-sm hover:shadow-md transition-shadow">
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
                  {{ result.summary.interestToPrincipalRatio.toFixed(1) }}%
                </p>
              </UCard>
            </div>

            <!-- Mixed Rate Payment Change Alert -->
            <UAlert
              v-if="result.summary.monthlyPaymentAfterFixedPeriod"
              color="warning"
              variant="subtle"
              icon="i-lucide-alert-triangle"
              class="ring-1 ring-amber-200 dark:ring-amber-800"
            >
              <template #title>
                <span class="font-semibold">Alteracao de Prestacao Prevista</span>
              </template>
              <template #description>
                <div class="space-y-2">
                  <p>
                    Apos o periodo fixo de <strong>{{ Math.floor((result.summary.fixedPeriodMonths || 0) / 12) }} anos</strong>,
                    a sua prestacao passara de
                    <strong>{{ formatCurrency(result.summary.monthlyPayment) }}</strong>
                    para
                    <strong class="text-amber-700 dark:text-amber-300">{{ formatCurrency(result.summary.monthlyPaymentAfterFixedPeriod) }}</strong>.
                  </p>
                  <div class="flex items-center gap-4 pt-2">
                    <div class="flex items-center gap-2">
                      <UIcon
                        name="i-lucide-trending-up"
                        class="w-4 h-4 text-amber-600"
                      />
                      <span class="text-sm">
                        Aumento: <strong>{{ formatCurrency(result.summary.paymentIncrease || 0) }}</strong>
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <UIcon
                        name="i-lucide-percent"
                        class="w-4 h-4 text-amber-600"
                      />
                      <span class="text-sm">
                        <strong>+{{ result.summary.paymentIncreasePercent?.toFixed(1) }}%</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </template>
            </UAlert>

            <!-- Charts Section -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <AmortizationChart :data="result.table" />
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
                    :data="result.table"
                    :principal="state.principal"
                  />
                </ClientOnly>
              </UCard>
            </div>

            <!-- Amortization Table -->
            <UCard class="overflow-hidden">
              <template #header>
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 class="text-lg font-semibold flex items-center gap-2">
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
                    {{ result.table.length }} meses
                  </span>
                </div>
              </template>

              <div class="overflow-x-auto max-h-[400px] sm:max-h-[600px] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800">
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
                      v-for="row in tableRows"
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

            <!-- Action Bar: Save & Early Repayment -->
            <div
              v-if="!showEarlyRepayment"
              class="flex flex-col sm:flex-row justify-center items-center gap-4"
            >
              <UButton
                color="primary"
                variant="soft"
                size="xl"
                icon="i-lucide-piggy-bank"
                class="rounded-full px-8 shadow-lg hover:scale-105 transition-transform"
                @click="openEarlyRepayment"
              >
                Simular Amortização Antecipada
              </UButton>

              <UButton
                color="neutral"
                variant="outline"
                size="xl"
                icon="i-lucide-save"
                class="rounded-full px-8 hover:scale-105 transition-transform"
                @click="openSaveModal"
              >
                {{ isAuthenticated ? 'Guardar Simulação' : 'Guardar (Login)' }}
              </UButton>
            </div>

            <!-- Early Repayment Simulator -->
            <div
              v-if="showEarlyRepayment"
              ref="simulatorSection"
              class="scroll-mt-24 ring-1 ring-primary-200 dark:ring-primary-800 rounded-xl overflow-hidden shadow-lg"
            >
              <EarlyRepaymentSimulator
                v-if="result"
                :current-balance="result.table[0]?.remainingBalance || state.principal"
                :remaining-months="result.table.length"
                :tan="tan"
                :current-installment="result.summary.monthlyPayment"
                @close="showEarlyRepayment = false"
              />
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="!isLoading && !result"
            class="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800"
          >
            <div class="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-full mb-4">
              <UIcon
                name="i-lucide-calculator"
                class="w-12 h-12 text-primary-500 dark:text-primary-400"
              />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Pronto para simular?
            </h3>
            <p class="text-gray-500 text-center max-w-sm">
              Preencha os dados do empréstimo à esquerda e clique em calcular para obter o seu plano financeiro detalhado.
            </p>
          </div>
        </div>
      </div>

      <!-- Benefits Section -->
      <div class="mt-24 mb-16">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Porquê Amortizar Antecipadamente?
          </h2>
          <p class="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Pequenas ações hoje podem significar grandes poupanças amanhã. Assuma o controlo da sua vida financeira.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div class="group hover:bg-white dark:hover:bg-gray-900 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
            <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UIcon
                name="i-lucide-piggy-bank"
                class="w-6 h-6 text-green-600 dark:text-green-400"
              />
            </div>
            <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Poupe Milhares em Juros
            </h3>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
              Cada euro amortizado é um euro que deixa de pagar juros. O efeito composto pode resultar em poupanças massivas ao longo dos anos.
            </p>
          </div>

          <div class="group hover:bg-white dark:hover:bg-gray-900 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UIcon
                name="i-lucide-calendar-off"
                class="w-6 h-6 text-blue-600 dark:text-blue-400"
              />
            </div>
            <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Reduza Anos de Dívida
            </h3>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
              Ao manter a prestação e reduzir o prazo, pode acabar de pagar a sua casa 5 ou 10 anos mais cedo. Imagine a liberdade.
            </p>
          </div>

          <div class="group hover:bg-white dark:hover:bg-gray-900 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UIcon
                name="i-lucide-shield-check"
                class="w-6 h-6 text-purple-600 dark:text-purple-400"
              />
            </div>
            <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Controle o Seu Futuro
            </h3>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
              Menor dívida significa menor risco. Proteja-se contra subidas da Euribor e ganhe estabilidade financeira.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Simulation Modal -->
    <UModal v-model:open="showSaveModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <UIcon
                  name="i-lucide-save"
                  class="w-5 h-5 text-primary-600 dark:text-primary-400"
                />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Guardar Simulação
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Guarde esta simulação para consultar mais tarde
                </p>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <UFormField
              label="Nome da simulação"
              help="Dê um nome para identificar facilmente esta simulação"
            >
              <UInput
                v-model="simulationName"
                placeholder="Ex: Proposta Banco X, Casa Lisboa..."
                size="lg"
                icon="i-lucide-file-text"
              />
            </UFormField>

            <!-- Summary preview -->
            <div
              v-if="result"
              class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2"
            >
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Montante:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(state.principal) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Prazo:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ state.termYears }} anos</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">TAN:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ tanPercentage }}%</span>
              </div>
              <div class="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <span class="text-gray-500">Prestação:</span>
                <span class="font-bold text-primary-600 dark:text-primary-400">{{ formatCurrency(result.summary.monthlyPayment) }}</span>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                @click="showSaveModal = false"
              >
                Cancelar
              </UButton>
              <UButton
                color="primary"
                icon="i-lucide-save"
                :loading="isSaving"
                @click="saveSimulation"
              >
                Guardar
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
