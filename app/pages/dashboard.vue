<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const { user } = useAuth()
const toast = useToast()
const router = useRouter()

// Simulation type
interface SimulationSummary {
  monthlyPayment: number
  totalPayment: number
  totalInterest: number
}

interface Simulation {
  id: string
  name: string
  loanAmount: number
  interestRate: number
  euribor: number | null
  spread: number | null
  termMonths: number
  summary: SimulationSummary
  createdAt: string
}

interface EuriborRates {
  rate3m: number
  rate6m: number
  rate12m: number
  date: string
}

// Fetch simulations
const { data: simulations, pending: isLoading, refresh } = useFetch<Simulation[]>('/api/simulations', {
  default: () => []
})

// Fetch simulation limits
interface SimulationLimits {
  isPro: boolean
  totalCreated: number
  limit: number | null
  remaining: number | null
  canCreate: boolean
}

const { data: limits } = useFetch<SimulationLimits>('/api/simulations/limits', {
  default: () => ({ isPro: false, totalCreated: 0, limit: 3, remaining: 3, canCreate: true })
})

// Fetch Euribor rates
const { data: euriborRates, pending: euriborLoading, refresh: refreshEuribor } = useFetch<EuriborRates>('/api/euribor/latest', {
  lazy: true
})

async function updateRates() {
  await $fetch('/api/cron/update-rates')
  await refreshEuribor()
  toast.add({
    title: 'Taxas atualizadas',
    description: 'As taxas Euribor foram atualizadas com sucesso.',
    color: 'success',
    icon: 'i-lucide-refresh-cw'
  })
}

// Comparison feature
const selectedForComparison = ref<Set<string>>(new Set())
const isCompareMode = ref(false)

const canCompare = computed(() => selectedForComparison.value.size >= 2)
const compareCount = computed(() => selectedForComparison.value.size)

function toggleCompareMode() {
  isCompareMode.value = !isCompareMode.value
  if (!isCompareMode.value) {
    selectedForComparison.value.clear()
  }
}

function toggleSelection(id: string) {
  if (selectedForComparison.value.has(id)) {
    selectedForComparison.value.delete(id)
  } else if (selectedForComparison.value.size < 3) {
    selectedForComparison.value.add(id)
  } else {
    toast.add({
      title: 'Limite atingido',
      description: 'Pode comparar no máximo 3 simulações.',
      color: 'warning',
      icon: 'i-lucide-alert-triangle'
    })
  }
  // Force reactivity
  selectedForComparison.value = new Set(selectedForComparison.value)
}

function isSelected(id: string) {
  return selectedForComparison.value.has(id)
}

function goToCompare() {
  if (!canCompare.value) return
  const ids = Array.from(selectedForComparison.value).join(',')
  router.push(`/compare?ids=${ids}`)
}

function clearSelection() {
  selectedForComparison.value.clear()
  selectedForComparison.value = new Set()
}

// Delete simulation
const deletingId = ref<string | null>(null)
const showDeleteModal = ref(false)
const simulationToDelete = ref<Simulation | null>(null)

const { calculateRevisionImpact } = useFinancial()

function getImpact(simulation: Simulation) {
  if (!euriborRates.value || !simulation) return null
  return calculateRevisionImpact(simulation, euriborRates.value)
}

function confirmDelete(simulation: Simulation) {
  simulationToDelete.value = simulation
  showDeleteModal.value = true
}

async function deleteSimulation() {
  if (!simulationToDelete.value) return

  deletingId.value = simulationToDelete.value.id

  try {
    await ($fetch as typeof globalThis.fetch)(`/api/simulations/${simulationToDelete.value.id}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Simulação apagada',
      description: 'A simulação foi apagada com sucesso.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    // Remove from selection if it was selected
    selectedForComparison.value.delete(simulationToDelete.value.id)

    await refresh()
  } catch {
    toast.add({
      title: 'Erro ao apagar',
      description: 'Não foi possível apagar a simulação.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    deletingId.value = null
    showDeleteModal.value = false
    simulationToDelete.value = null
  }
}

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
    month: 'short',
    year: 'numeric'
  })
}

function formatTermYears(months: number): string {
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (remainingMonths === 0) {
    return `${years} anos`
  }
  return `${years}a ${remainingMonths}m`
}
</script>

<template>
  <main>
    <div>
      <!-- Welcome Section -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Bem-vindo, {{ user?.name || 'Utilizador' }}!
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Gerencie as suas simulações de crédito habitação
        </p>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UCard
          class="transition-shadow"
          :class="limits?.canCreate ? 'hover:shadow-lg cursor-pointer group' : 'opacity-75'"
        >
          <NuxtLink
            :to="limits?.canCreate ? '/simulator' : undefined"
            class="block"
            :class="{ 'pointer-events-none': !limits?.canCreate }"
          >
            <div class="flex items-center gap-4">
              <div
                class="p-3 rounded-xl transition-transform"
                :class="limits?.canCreate
                  ? 'bg-primary-100 dark:bg-primary-900/30 group-hover:scale-110'
                  : 'bg-gray-100 dark:bg-gray-800'"
              >
                <UIcon
                  :name="limits?.canCreate ? 'i-lucide-calculator' : 'i-lucide-lock'"
                  class="w-6 h-6"
                  :class="limits?.canCreate
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400'"
                />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  Nova Simulação
                </h3>
                <p
                  v-if="limits?.canCreate"
                  class="text-sm text-gray-500 dark:text-gray-400"
                >
                  Calcule a sua prestação
                </p>
                <p
                  v-else
                  class="text-sm text-orange-600 dark:text-orange-400"
                >
                  Limite atingido ({{ limits?.totalCreated }}/{{ limits?.limit }})
                </p>
              </div>
            </div>
          </NuxtLink>
        </UCard>

        <UCard class="hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <UIcon
                name="i-lucide-folder"
                class="w-6 h-6 text-green-600 dark:text-green-400"
              />
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white">
                Simulações Guardadas
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ simulations?.length || 0 }} {{ simulations?.length === 1 ? 'simulação' : 'simulações' }}
              </p>
              <!-- Show limit info for free users -->
              <div
                v-if="!limits?.isPro && limits?.limit"
                class="mt-2 flex items-center gap-2"
              >
                <div class="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="limits.remaining === 0 ? 'bg-red-500' : limits.remaining === 1 ? 'bg-orange-500' : 'bg-primary-500'"
                    :style="{ width: `${((limits.totalCreated) / limits.limit) * 100}%` }"
                  />
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {{ limits.totalCreated }}/{{ limits.limit }} criadas
                </span>
              </div>
              <span
                v-if="limits?.isPro"
                class="inline-flex items-center gap-1 mt-1 text-xs text-primary-600 dark:text-primary-400 font-medium"
              >
                <UIcon
                  name="i-lucide-infinity"
                  class="w-3 h-3"
                />
                Ilimitado
              </span>
            </div>
          </div>
        </UCard>

        <UCard class="hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <UIcon
                name="i-lucide-trending-up"
                class="w-6 h-6 text-orange-600 dark:text-orange-400"
              />
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-gray-900 dark:text-white">
                    Taxas Euribor Hoje
                  </h3>
                  <span
                    v-if="euriborRates"
                    class="text-xs text-gray-400"
                  >
                    {{ new Date(euriborRates.date).toLocaleDateString('pt-PT') }}
                  </span>
                </div>
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  icon="i-lucide-refresh-cw"
                  :loading="euriborLoading"
                  @click="updateRates"
                />
              </div>
              <div
                v-if="euriborRates"
                class="text-sm font-medium text-gray-900 dark:text-white mt-1"
              >
                <div class="flex gap-3">
                  <span class="flex flex-col">
                    <span class="text-xs text-gray-500">3M</span>
                    <span>{{ euriborRates.rate3m }}%</span>
                  </span>
                  <span class="flex flex-col">
                    <span class="text-xs text-gray-500">6M</span>
                    <span>{{ euriborRates.rate6m }}%</span>
                  </span>
                  <span class="flex flex-col">
                    <span class="text-xs text-gray-500">12M</span>
                    <span>{{ euriborRates.rate12m }}%</span>
                  </span>
                </div>
              </div>
              <div
                v-else
                class="text-sm text-gray-500"
              >
                <span v-if="euriborLoading">A carregar...</span>
                <span v-else>Indisponível</span>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Simulations List -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              As Minhas Simulações
            </h2>
            <div class="flex items-center gap-2">
              <UButton
                v-if="simulations && simulations.length >= 2"
                :variant="isCompareMode ? 'solid' : 'soft'"
                :color="isCompareMode ? 'primary' : 'neutral'"
                icon="i-lucide-git-compare"
                size="sm"
                @click="toggleCompareMode"
              >
                {{ isCompareMode ? 'Cancelar' : 'Comparar' }}
              </UButton>
              <UButton
                :to="limits?.canCreate ? '/simulator' : undefined"
                icon="i-lucide-plus"
                size="sm"
                :disabled="!limits?.canCreate"
              >
                Nova
              </UButton>
            </div>
          </div>
        </template>

        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="space-y-4"
        >
          <USkeleton
            v-for="i in 3"
            :key="i"
            class="h-24"
          />
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!simulations || simulations.length === 0"
          class="py-12 text-center"
        >
          <div class="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <UIcon
              name="i-lucide-file-text"
              class="w-8 h-8 text-gray-400"
            />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhuma simulação guardada
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Comece por criar uma simulação para ver os detalhes do seu crédito habitação.
          </p>
          <UButton
            :to="limits?.canCreate ? '/simulator' : undefined"
            icon="i-lucide-calculator"
            :disabled="!limits?.canCreate"
          >
            Criar Primeira Simulação
          </UButton>
        </div>

        <!-- Simulations List -->
        <div
          v-else
          class="divide-y divide-gray-200 dark:divide-gray-800"
        >
          <div
            v-for="simulation in simulations"
            :key="simulation.id"
            class="py-4 first:pt-0 last:pb-0"
            :class="{ 'bg-primary-50 dark:bg-primary-900/10 -mx-4 px-4 rounded-lg': isSelected(simulation.id) }"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <!-- Checkbox for comparison mode -->
              <div
                v-if="isCompareMode"
                class="flex items-center"
              >
                <UCheckbox
                  :model-value="isSelected(simulation.id)"
                  @update:model-value="toggleSelection(simulation.id)"
                />
              </div>

              <!-- Simulation Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                    {{ simulation.name || 'Simulação sem nome' }}
                  </h3>
                  <div
                    v-if="getImpact(simulation)"
                    class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="getImpact(simulation)?.type === 'danger' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : getImpact(simulation)?.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'"
                  >
                    <UIcon
                      :name="getImpact(simulation)?.type === 'danger' ? 'i-lucide-trending-up'
                        : getImpact(simulation)?.type === 'success' ? 'i-lucide-trending-down'
                          : 'i-lucide-shield-check'"
                      class="w-3 h-3"
                    />
                    <span v-if="getImpact(simulation)?.impact !== 0">
                      {{ (getImpact(simulation)?.impact ?? 0) > 0 ? '+' : '' }}{{ formatCurrency(getImpact(simulation)?.impact ?? 0) }}
                    </span>
                    <span v-else>
                      {{ getImpact(simulation)?.label }}
                    </span>
                  </div>
                  <span class="text-xs text-gray-400 whitespace-nowrap">
                    {{ formatDate(simulation.createdAt) }}
                  </span>
                </div>

                <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <div class="flex items-center gap-1.5">
                    <UIcon
                      name="i-lucide-banknote"
                      class="w-4 h-4 text-gray-400"
                    />
                    <span class="text-gray-600 dark:text-gray-300">{{ formatCurrency(simulation.loanAmount) }}</span>
                  </div>

                  <div class="flex items-center gap-1.5">
                    <UIcon
                      name="i-lucide-calendar"
                      class="w-4 h-4 text-gray-400"
                    />
                    <span class="text-gray-600 dark:text-gray-300">{{ formatTermYears(simulation.termMonths) }}</span>
                  </div>

                  <div class="flex items-center gap-1.5">
                    <UIcon
                      name="i-lucide-percent"
                      class="w-4 h-4 text-gray-400"
                    />
                    <span class="text-gray-600 dark:text-gray-300">{{ (simulation.interestRate * 100).toFixed(2) }}% TAN</span>
                  </div>

                  <div class="flex items-center gap-1.5">
                    <UIcon
                      name="i-lucide-wallet"
                      class="w-4 h-4 text-primary-500"
                    />
                    <span class="font-medium text-primary-600 dark:text-primary-400">
                      {{ formatCurrency(simulation.summary.monthlyPayment) }}/mês
                    </span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 sm:ml-4">
                <UButton
                  v-if="isCompareMode"
                  :variant="isSelected(simulation.id) ? 'solid' : 'soft'"
                  :color="isSelected(simulation.id) ? 'primary' : 'neutral'"
                  size="sm"
                  :icon="isSelected(simulation.id) ? 'i-lucide-check' : 'i-lucide-plus'"
                  @click="toggleSelection(simulation.id)"
                >
                  {{ isSelected(simulation.id) ? 'Selecionada' : 'Selecionar' }}
                </UButton>
                <template v-else>
                  <UButton
                    :to="`/simulation/${simulation.id}`"
                    variant="soft"
                    size="sm"
                    icon="i-lucide-eye"
                  >
                    Ver
                  </UButton>
                  <UButton
                    color="error"
                    variant="ghost"
                    size="sm"
                    icon="i-lucide-trash-2"
                    :loading="deletingId === simulation.id"
                    @click="confirmDelete(simulation)"
                  />
                </template>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Floating Comparison Bar -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="isCompareMode && compareCount > 0"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span class="text-lg font-bold text-primary-600 dark:text-primary-400">{{ compareCount }}</span>
            </div>
            <div class="text-sm">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ compareCount === 1 ? 'simulação selecionada' : 'simulações selecionadas' }}
              </p>
              <p class="text-gray-500 text-xs">
                {{ compareCount < 2 ? 'Selecione mais 1 para comparar' : compareCount === 3 ? 'Máximo atingido' : 'Pode selecionar mais 1' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              icon="i-lucide-x"
              @click="clearSelection"
            >
              Limpar
            </UButton>
            <UButton
              :disabled="!canCompare"
              icon="i-lucide-git-compare"
              size="sm"
              @click="goToCompare"
            >
              Comparar
            </UButton>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <UIcon
                  name="i-lucide-trash-2"
                  class="w-5 h-5 text-red-600 dark:text-red-400"
                />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Apagar Simulação
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Esta ação não pode ser revertida
                </p>
              </div>
            </div>
          </template>

          <p class="text-gray-600 dark:text-gray-300">
            Tem a certeza que deseja apagar a simulação
            <strong class="text-gray-900 dark:text-white">"{{ simulationToDelete?.name }}"</strong>?
          </p>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                @click="showDeleteModal = false"
              >
                Cancelar
              </UButton>
              <UButton
                color="error"
                icon="i-lucide-trash-2"
                :loading="!!deletingId"
                @click="deleteSimulation"
              >
                Apagar
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </main>
</template>
