<script setup lang="ts">
useSeoMeta({
  title: 'Calculadora de Taxa de Esforço - Quanto Posso Pedir Emprestado?',
  description: 'Descubra quanto pode pedir de crédito habitação com base no seu rendimento. Calculadora gratuita de taxa de esforço para Portugal.'
})

const income = ref<number | undefined>(undefined)
const otherLoans = ref<number | undefined>(0)
const interestRate = ref<number>(3.5)
const loanTermYears = ref<number>(30)

// Thresholds
const SAFE_RATE = 0.30
const MAX_RATE = 0.35

const results = computed(() => {
  if (!income.value || income.value <= 0) return null

  const monthlyIncome = income.value
  const currentLoans = otherLoans.value || 0

  const currentEffortRate = currentLoans / monthlyIncome

  const maxInstallmentSafe = Math.max(0, monthlyIncome * SAFE_RATE - currentLoans)
  const maxInstallmentMax = Math.max(0, monthlyIncome * MAX_RATE - currentLoans)

  const monthlyRate = interestRate.value / 100 / 12
  const termMonths = loanTermYears.value * 12

  let maxLoanSafe = 0
  let maxLoanMax = 0

  if (monthlyRate > 0) {
    const factor = (1 - Math.pow(1 + monthlyRate, -termMonths)) / monthlyRate
    maxLoanSafe = maxInstallmentSafe * factor
    maxLoanMax = maxInstallmentMax * factor
  }

  return {
    monthlyIncome,
    currentLoans,
    currentEffortRate,
    maxInstallmentSafe,
    maxInstallmentMax,
    maxLoanSafe,
    maxLoanMax
  }
})

const healthStatus = computed(() => {
  if (!results.value) return null

  const rate = results.value.currentEffortRate

  if (rate === 0) {
    return {
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
      icon: 'i-lucide-check-circle',
      label: 'Excelente',
      description: 'Sem encargos de crédito atuais'
    }
  } else if (rate <= SAFE_RATE) {
    return {
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
      icon: 'i-lucide-check-circle',
      label: 'Saudável',
      description: 'Taxa de esforço atual dentro do recomendado'
    }
  } else if (rate <= MAX_RATE) {
    return {
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      icon: 'i-lucide-alert-triangle',
      label: 'Atenção',
      description: 'Taxa de esforço no limite - cuidado com novos créditos'
    }
  } else {
    return {
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
      icon: 'i-lucide-alert-circle',
      label: 'Risco',
      description: 'Taxa de esforço elevada - considere reduzir encargos'
    }
  }
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value)
}
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-950 pb-24">
    <!-- Page Header -->
    <div class="relative bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Calculadora de Taxa de Esforço
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Descubra quanto pode pedir de crédito com base no seu rendimento
            </p>
          </div>
          <div class="flex items-center gap-3">
            <UButton
              to="/simulator"
              variant="ghost"
              color="neutral"
              icon="i-lucide-calculator"
            >
              Simulador Completo
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
                  name="i-lucide-wallet"
                  class="w-5 h-5 text-gray-500"
                />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Os Seus Dados
                </h2>
              </div>
            </template>

            <div class="space-y-6">
              <!-- Monthly Income -->
              <UFormField
                label="Rendimento líquido mensal"
                help="Soma dos rendimentos líquidos de todos os titulares"
              >
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
                  <UInput
                    v-model.number="income"
                    type="number"
                    :min="0"
                    :step="100"
                    placeholder="2500"
                    class="pl-6"
                    size="lg"
                  />
                </div>
              </UFormField>

              <!-- Other Loans -->
              <UFormField
                label="Outras prestações mensais"
                help="Crédito automóvel, pessoal, cartões, etc."
              >
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
                  <UInput
                    v-model.number="otherLoans"
                    type="number"
                    :min="0"
                    :step="50"
                    placeholder="0"
                    class="pl-6"
                    size="lg"
                  />
                </div>
              </UFormField>

              <!-- Divider -->
              <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Parâmetros de simulação
                </p>

                <!-- Interest Rate -->
                <UFormField
                  label="Taxa de juro estimada (TAN)"
                  class="mb-4"
                >
                  <UInput
                    v-model.number="interestRate"
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

                <!-- Loan Term -->
                <UFormField label="Prazo do empréstimo">
                  <UInput
                    v-model.number="loanTermYears"
                    type="number"
                    :min="5"
                    :max="40"
                    placeholder="30"
                    icon="i-lucide-calendar"
                  >
                    <template #trailing>
                      <span class="text-gray-500 dark:text-gray-400 text-xs">anos</span>
                    </template>
                  </UInput>
                </UFormField>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Results Section -->
        <div class="lg:col-span-8 space-y-8">
          <!-- Results when we have data -->
          <div
            v-if="results"
            class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <!-- Summary Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <UCard class="relative overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center gap-3 mb-3">
                  <div class="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <UIcon
                      name="i-lucide-wallet"
                      class="w-5 h-5 text-primary-600 dark:text-primary-400"
                    />
                  </div>
                  <span class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Rendimento</span>
                </div>
                <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {{ formatCurrency(results.monthlyIncome) }}
                </p>
              </UCard>

              <UCard class="relative overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center gap-3 mb-3">
                  <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <UIcon
                      name="i-lucide-credit-card"
                      class="w-5 h-5 text-orange-600 dark:text-orange-400"
                    />
                  </div>
                  <span class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Encargos</span>
                </div>
                <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {{ formatCurrency(results.currentLoans) }}
                </p>
              </UCard>

              <UCard class="relative overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center gap-3 mb-3">
                  <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <UIcon
                      name="i-lucide-calendar-clock"
                      class="w-5 h-5 text-green-600 dark:text-green-400"
                    />
                  </div>
                  <span class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Prestação Max</span>
                </div>
                <p class="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ formatCurrency(results.maxInstallmentSafe) }}
                </p>
              </UCard>

              <UCard class="relative overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center gap-3 mb-3">
                  <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <UIcon
                      name="i-lucide-home"
                      class="w-5 h-5 text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <span class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Crédito Max</span>
                </div>
                <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {{ formatCurrency(results.maxLoanSafe) }}
                </p>
              </UCard>
            </div>

            <!-- Health Status -->
            <UCard
              v-if="healthStatus"
              class="ring-1 ring-gray-200 dark:ring-gray-800"
              :class="healthStatus.bg"
            >
              <div class="flex items-start gap-4">
                <div
                  class="p-3 rounded-xl"
                  :class="healthStatus.bg"
                >
                  <UIcon
                    :name="healthStatus.icon"
                    class="w-8 h-8"
                    :class="healthStatus.color"
                  />
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-2">
                    <h3
                      class="text-lg font-semibold"
                      :class="healthStatus.color"
                    >
                      {{ healthStatus.label }}
                    </h3>
                    <span
                      v-if="results.currentLoans > 0"
                      class="text-2xl font-bold"
                      :class="healthStatus.color"
                    >
                      {{ formatPercent(results.currentEffortRate) }}
                    </span>
                  </div>
                  <p class="text-gray-600 dark:text-gray-400">
                    {{ healthStatus.description }}
                  </p>
                </div>
              </div>
            </UCard>

            <!-- Detailed Results -->
            <div class="grid md:grid-cols-2 gap-6">
              <!-- Conservative (30%) -->
              <UCard class="ring-1 ring-green-200 dark:ring-green-800">
                <template #header>
                  <div class="flex items-center gap-2">
                    <UIcon
                      name="i-lucide-shield-check"
                      class="w-5 h-5 text-green-600 dark:text-green-400"
                    />
                    <h3 class="font-semibold text-green-700 dark:text-green-300">
                      Cenário Conservador (30%)
                    </h3>
                  </div>
                </template>
                <div class="space-y-4">
                  <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span class="text-gray-600 dark:text-gray-400">Prestação máxima</span>
                    <span class="text-xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(results.maxInstallmentSafe) }}<span class="text-sm font-normal text-gray-500">/mês</span></span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400">Montante máximo</span>
                    <span class="text-2xl font-bold text-green-600 dark:text-green-400">{{ formatCurrency(results.maxLoanSafe) }}</span>
                  </div>
                </div>
              </UCard>

              <!-- Maximum (35%) -->
              <UCard class="ring-1 ring-yellow-200 dark:ring-yellow-800">
                <template #header>
                  <div class="flex items-center gap-2">
                    <UIcon
                      name="i-lucide-trending-up"
                      class="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                    />
                    <h3 class="font-semibold text-yellow-700 dark:text-yellow-300">
                      Cenário Máximo (35%)
                    </h3>
                  </div>
                </template>
                <div class="space-y-4">
                  <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span class="text-gray-600 dark:text-gray-400">Prestação máxima</span>
                    <span class="text-xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(results.maxInstallmentMax) }}<span class="text-sm font-normal text-gray-500">/mês</span></span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400">Montante máximo</span>
                    <span class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ formatCurrency(results.maxLoanMax) }}</span>
                  </div>
                </div>
              </UCard>
            </div>

            <!-- CTA -->
            <div class="flex flex-col sm:flex-row justify-center items-center gap-4">
              <UButton
                to="/simulator"
                color="primary"
                size="xl"
                icon="i-lucide-calculator"
                class="rounded-full px-8 shadow-lg hover:scale-105 transition-transform"
              >
                Simular Crédito Detalhado
              </UButton>
            </div>

            <!-- Info Box -->
            <UCard class="bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800">
              <div class="flex items-start gap-3">
                <UIcon
                  name="i-lucide-info"
                  class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
                />
                <div class="text-sm text-blue-700 dark:text-blue-300">
                  <p class="font-medium mb-1">
                    O que é a taxa de esforço?
                  </p>
                  <p class="text-blue-600 dark:text-blue-400">
                    É a percentagem do rendimento destinada ao pagamento de créditos.
                    Os bancos portugueses recomendam não ultrapassar 35% para garantir estabilidade financeira.
                  </p>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800"
          >
            <div class="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-full mb-4">
              <UIcon
                name="i-lucide-percent"
                class="w-12 h-12 text-primary-500 dark:text-primary-400"
              />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Pronto para calcular?
            </h3>
            <p class="text-gray-500 text-center max-w-sm">
              Introduza o seu rendimento mensal à esquerda para descobrir quanto pode pedir de crédito habitação.
            </p>
          </div>
        </div>
      </div>

      <!-- Benefits Section -->
      <div class="mt-24 mb-16">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Por que a Taxa de Esforço é Importante?
          </h2>
          <p class="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Conhecer os seus limites financeiros é o primeiro passo para uma compra de casa responsável.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div class="group hover:bg-white dark:hover:bg-gray-900 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
            <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UIcon
                name="i-lucide-shield-check"
                class="w-6 h-6 text-green-600 dark:text-green-400"
              />
            </div>
            <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Aprovação Garantida
            </h3>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
              Bancos aprovam créditos mais facilmente quando a taxa de esforço está abaixo dos 35%. Conheça os seus limites antes de procurar casa.
            </p>
          </div>

          <div class="group hover:bg-white dark:hover:bg-gray-900 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UIcon
                name="i-lucide-trending-up"
                class="w-6 h-6 text-blue-600 dark:text-blue-400"
              />
            </div>
            <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Proteção contra Subidas
            </h3>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
              Se a Euribor subir, a sua prestação aumenta. Manter uma margem de segurança protege-o de surpresas desagradáveis.
            </p>
          </div>

          <div class="group hover:bg-white dark:hover:bg-gray-900 p-6 rounded-2xl transition-all duration-300 hover:shadow-xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UIcon
                name="i-lucide-heart"
                class="w-6 h-6 text-purple-600 dark:text-purple-400"
              />
            </div>
            <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Qualidade de Vida
            </h3>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
              Uma taxa de esforço saudável deixa espaço para poupança, lazer e imprevistos. Não sacrifique o presente pelo futuro.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
