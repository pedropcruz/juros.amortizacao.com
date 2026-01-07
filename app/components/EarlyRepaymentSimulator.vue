<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { calculateEarlyRepayment } from '~/composables/useLoanCalculator'

interface Props {
  currentBalance: number
  remainingMonths: number
  tan: number
  currentInstallment: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const { $posthog } = useNuxtApp()

// Helper to safely capture PostHog events
function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof $posthog === 'function') {
    $posthog()?.capture(event, properties)
  }
}

// Form schema
const schema = z.object({
  repaymentAmount: z.number().positive('O valor deve ser positivo'),
  rateType: z.enum(['variable', 'fixed']),
  feeExemption: z.boolean(),
  strategy: z.enum(['reduce_installment', 'reduce_term'])
})

type Schema = z.output<typeof schema>

// Form state
const state = reactive<Schema>({
  repaymentAmount: Math.min(10000, props.currentBalance * 0.1),
  rateType: 'variable',
  feeExemption: false,
  strategy: 'reduce_term'
})

// Result state
interface RepaymentResult {
  fee: number
  newBalance: number
  newInstallment?: number
  newTermMonths?: number
  monthlySavings?: number
  monthsReduced?: number
  totalInterestSaved?: number
}

const result = ref<RepaymentResult | null>(null)

// Rate type options
const rateTypeOptions = [
  { label: 'Taxa Variavel (0.5%)', value: 'variable' },
  { label: 'Taxa Fixa (2%)', value: 'fixed' }
]

// Strategy options
const strategyOptions = [
  { label: 'Reduzir Prazo', value: 'reduce_term', description: 'Manter prestacao, pagar menos tempo' },
  { label: 'Reduzir Prestacao', value: 'reduce_installment', description: 'Manter prazo, pagar menos por mes' }
]

// Calculate repayment impact
function onSubmit(_event: FormSubmitEvent<Schema>) {
  const repaymentResult = calculateEarlyRepayment({
    currentBalance: props.currentBalance,
    repaymentAmount: state.repaymentAmount,
    rateType: state.rateType,
    feeExemption: state.feeExemption,
    strategy: state.strategy,
    remainingMonths: props.remainingMonths,
    tan: props.tan,
    currentInstallment: props.currentInstallment
  })

  // Calculate additional metrics
  const finalResult: RepaymentResult = {
    fee: repaymentResult.fee,
    newBalance: repaymentResult.newBalance,
    newInstallment: repaymentResult.newInstallment,
    newTermMonths: repaymentResult.newTermMonths
  }

  if (state.strategy === 'reduce_installment' && repaymentResult.newInstallment) {
    finalResult.monthlySavings = props.currentInstallment - repaymentResult.newInstallment
  }

  if (state.strategy === 'reduce_term' && repaymentResult.newTermMonths) {
    finalResult.monthsReduced = props.remainingMonths - repaymentResult.newTermMonths

    // Estimate interest saved (simplified calculation)
    const oldTotalPayment = props.currentInstallment * props.remainingMonths
    const newTotalPayment = props.currentInstallment * repaymentResult.newTermMonths
    finalResult.totalInterestSaved = oldTotalPayment - newTotalPayment - state.repaymentAmount
  }

  result.value = finalResult

  captureEvent('early_repayment_calculated', {
    repayment_amount: state.repaymentAmount,
    strategy: state.strategy,
    fee_exemption: state.feeExemption,
    rate_type: state.rateType,
    months_reduced: finalResult.monthsReduced || 0,
    monthly_savings: finalResult.monthlySavings || 0,
    total_interest_saved: finalResult.totalInterestSaved || 0
  })
}

// Format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

// Format months as years and months
function formatTerm(months: number): string {
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (years === 0) return `${remainingMonths} meses`
  if (remainingMonths === 0) return `${years} anos`
  return `${years} anos e ${remainingMonths} meses`
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">
          Simulador de Amortizacao Antecipada
        </h3>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          size="sm"
          @click="emit('close')"
        />
      </div>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Current Loan Info -->
      <div class="space-y-4">
        <h4 class="font-medium text-gray-700 dark:text-gray-300">
          Situacao Atual
        </h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-gray-500">
              Saldo Devedor
            </p>
            <p class="font-semibold">
              {{ formatCurrency(currentBalance) }}
            </p>
          </div>
          <div>
            <p class="text-gray-500">
              Prazo Restante
            </p>
            <p class="font-semibold">
              {{ formatTerm(remainingMonths) }}
            </p>
          </div>
          <div>
            <p class="text-gray-500">
              Prestacao Atual
            </p>
            <p class="font-semibold">
              {{ formatCurrency(currentInstallment) }}
            </p>
          </div>
          <div>
            <p class="text-gray-500">
              TAN
            </p>
            <p class="font-semibold">
              {{ (tan * 100).toFixed(2) }}%
            </p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Valor a Amortizar"
          name="repaymentAmount"
        >
          <UInput
            v-model.number="state.repaymentAmount"
            type="number"
            :min="100"
            :max="currentBalance"
            :step="100"
          />
        </UFormField>

        <UFormField
          label="Tipo de Taxa"
          name="rateType"
        >
          <USelect
            v-model="state.rateType"
            :items="rateTypeOptions"
            value-key="value"
          />
        </UFormField>

        <UFormField name="feeExemption">
          <UCheckbox
            v-model="state.feeExemption"
            label="Isencao de comissao (medida governamental)"
          />
        </UFormField>

        <UFormField
          label="Estrategia"
          name="strategy"
        >
          <div class="space-y-2">
            <label
              v-for="option in strategyOptions"
              :key="option.value"
              class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200"
              :class="state.strategy === option.value ? 'ring-2 ring-primary-500 border-transparent bg-primary-50 dark:bg-primary-950/50' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'"
            >
              <input
                v-model="state.strategy"
                type="radio"
                :value="option.value"
                class="mt-1 accent-primary-600"
              >
              <div>
                <p
                  class="font-medium"
                  :class="state.strategy === option.value ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-white'"
                >{{ option.label }}</p>
                <p
                  class="text-sm"
                  :class="state.strategy === option.value ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'"
                >{{ option.description }}</p>
              </div>
            </label>
          </div>
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          block
          icon="i-lucide-calculator"
        >
          Simular Amortizacao
        </UButton>
      </UForm>
    </div>

    <!-- Results -->
    <div
      v-if="result"
      class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800"
    >
      <h4 class="font-medium text-gray-700 dark:text-gray-300 mb-4">
        Resultado da Simulacao
      </h4>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <UCard>
          <div class="text-center">
            <p class="text-sm text-gray-500">
              Comissao
            </p>
            <p
              class="text-lg font-bold"
              :class="result.fee === 0 ? 'text-primary-600 dark:text-primary-400' : 'text-orange-600 dark:text-orange-400'"
            >
              {{ formatCurrency(result.fee) }}
            </p>
          </div>
        </UCard>

        <UCard>
          <div class="text-center">
            <p class="text-sm text-gray-500">
              Novo Saldo
            </p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(result.newBalance) }}
            </p>
          </div>
        </UCard>

        <UCard v-if="result.newInstallment">
          <div class="text-center">
            <p class="text-sm text-gray-500">
              Nova Prestacao
            </p>
            <p class="text-lg font-bold text-primary-600 dark:text-primary-400">
              {{ formatCurrency(result.newInstallment) }}
            </p>
            <p
              v-if="result.monthlySavings"
              class="text-xs text-primary-600 dark:text-primary-400"
            >
              -{{ formatCurrency(result.monthlySavings) }}/mes
            </p>
          </div>
        </UCard>

        <UCard v-if="result.newTermMonths">
          <div class="text-center">
            <p class="text-sm text-gray-500">
              Novo Prazo
            </p>
            <p class="text-lg font-bold text-primary-600 dark:text-primary-400">
              {{ formatTerm(result.newTermMonths) }}
            </p>
            <p
              v-if="result.monthsReduced"
              class="text-xs text-primary-600 dark:text-primary-400"
            >
              -{{ result.monthsReduced }} meses
            </p>
          </div>
        </UCard>

        <UCard
          v-if="result.totalInterestSaved"
          class="md:col-span-2"
        >
          <div class="text-center">
            <p class="text-sm text-gray-500">
              Poupanca Estimada em Juros
            </p>
            <p class="text-xl font-bold text-primary-600 dark:text-primary-400">
              {{ formatCurrency(result.totalInterestSaved) }}
            </p>
          </div>
        </UCard>
      </div>

      <UAlert
        v-if="state.strategy === 'reduce_term'"
        color="info"
        variant="subtle"
        class="mt-4"
        icon="i-lucide-info"
        title="Dica Financeira"
        description="Reduzir o prazo e geralmente a opcao mais vantajosa financeiramente, pois diminui o tempo que o capital esta a render juros para o banco."
      />
    </div>
  </UCard>
</template>
