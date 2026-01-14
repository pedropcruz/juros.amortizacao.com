<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useSeoMeta({
  title: 'Configurações - Juros'
})

const config = useRuntimeConfig()
const checkoutUrl = config.public.lemonSqueezyCheckoutUrl || '#'
const toast = useToast()
const {
  user,
  changePassword,
  changeEmail,
  updateUser,
  linkSocial,
  listAccounts,
  unlinkAccount,
  requestPasswordReset
} = useAuth()

// State
const isLoadingAccounts = ref(true)
const linkedAccounts = ref<Array<{ providerId: string, accountId: string }>>([])
const hasPassword = ref(false)

// Form states
const profileForm = reactive({
  name: '',
  email: '',
  isLoading: false,
  isEmailLoading: false
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  isLoading: false
})

const resetPasswordLoading = ref(false)

// Load linked accounts
async function loadAccounts() {
  isLoadingAccounts.value = true
  try {
    const result = await listAccounts()
    if (result.data) {
      linkedAccounts.value = result.data
      hasPassword.value = result.data.some((acc: { providerId: string }) => acc.providerId === 'credential')
    }
  } catch (error) {
    console.error('Failed to load accounts:', error)
  } finally {
    isLoadingAccounts.value = false
  }
}

// Initialize
onMounted(() => {
  if (user.value) {
    profileForm.name = user.value.name || ''
    profileForm.email = user.value.email || ''
  }
  loadAccounts()
})

// Watch user changes
watch(user, (newUser) => {
  if (newUser) {
    profileForm.name = newUser.name || ''
    profileForm.email = newUser.email || ''
  }
})

// Update profile name
async function handleUpdateName() {
  if (!profileForm.name.trim()) return

  profileForm.isLoading = true
  try {
    const result = await updateUser({ name: profileForm.name })
    if (result.error) {
      throw new Error(result.error.message)
    }

    // Send notification email
    await $fetch('/api/profile/notify-change', {
      method: 'POST',
      body: { changeType: 'name', newValue: profileForm.name }
    }).catch(() => {}) // Don't fail if notification fails

    toast.add({
      title: 'Nome atualizado',
      description: 'O seu nome foi atualizado. Enviámos um email de confirmação.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch {
    toast.add({
      title: 'Erro ao atualizar',
      description: 'Não foi possível atualizar o nome.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    profileForm.isLoading = false
  }
}

// Change email
async function handleChangeEmail() {
  if (!profileForm.email || !profileForm.email.includes('@')) {
    toast.add({
      title: 'Email inválido',
      description: 'Introduza um email válido.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  // Check if email changed
  if (profileForm.email === user.value?.email) {
    toast.add({
      title: 'Mesmo email',
      description: 'O email introduzido é igual ao atual.',
      color: 'warning',
      icon: 'i-lucide-alert-triangle'
    })
    return
  }

  profileForm.isEmailLoading = true
  try {
    const result = await changeEmail(profileForm.email)
    if (result.error) {
      throw new Error(result.error.message)
    }
    toast.add({
      title: 'Email de verificação enviado',
      description: 'Verifique a sua caixa de entrada para confirmar o novo email.',
      color: 'success',
      icon: 'i-lucide-mail'
    })
  } catch {
    toast.add({
      title: 'Erro ao alterar',
      description: 'Não foi possível alterar o email.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    profileForm.isEmailLoading = false
  }
}

// Change password
async function handleChangePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.add({
      title: 'Palavras-passe não coincidem',
      description: 'A nova palavra-passe e a confirmação devem ser iguais.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  if (passwordForm.newPassword.length < 8) {
    toast.add({
      title: 'Palavra-passe muito curta',
      description: 'A palavra-passe deve ter pelo menos 8 caracteres.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  passwordForm.isLoading = true
  try {
    const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
    if (result.error) {
      throw new Error(result.error.message)
    }

    // Send notification email
    await $fetch('/api/profile/notify-change', {
      method: 'POST',
      body: { changeType: 'password' }
    }).catch(() => {}) // Don't fail if notification fails

    toast.add({
      title: 'Palavra-passe alterada',
      description: 'A sua palavra-passe foi alterada. Enviámos um email de confirmação.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch {
    toast.add({
      title: 'Erro ao alterar',
      description: 'Palavra-passe atual incorreta ou erro no servidor.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    passwordForm.isLoading = false
  }
}

// Request password reset email
async function handleRequestPasswordReset() {
  if (!user.value?.email) return

  resetPasswordLoading.value = true
  try {
    const result = await requestPasswordReset(user.value.email)
    if (result.error) {
      throw new Error(result.error.message)
    }
    toast.add({
      title: 'Email enviado',
      description: 'Verifique a sua caixa de entrada para definir uma palavra-passe.',
      color: 'success',
      icon: 'i-lucide-mail'
    })
  } catch {
    toast.add({
      title: 'Erro ao enviar',
      description: 'Não foi possível enviar o email de recuperação.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    resetPasswordLoading.value = false
  }
}

// Link Google account
async function handleLinkGoogle() {
  try {
    await linkSocial('google')
  } catch {
    toast.add({
      title: 'Erro ao ligar',
      description: 'Não foi possível ligar a conta Google.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Unlink account
async function handleUnlinkAccount(providerId: string) {
  if (linkedAccounts.value.length <= 1) {
    toast.add({
      title: 'Não é possível remover',
      description: 'Precisa de ter pelo menos um método de autenticação.',
      color: 'warning',
      icon: 'i-lucide-alert-triangle'
    })
    return
  }

  try {
    const result = await unlinkAccount(providerId)
    if (result.error) {
      throw new Error(result.error.message)
    }
    toast.add({
      title: 'Conta desligada',
      description: 'A conta foi desligada com sucesso.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    await loadAccounts()
  } catch {
    toast.add({
      title: 'Erro ao desligar',
      description: 'Não foi possível desligar a conta.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

function isProviderLinked(providerId: string) {
  return linkedAccounts.value.some(acc => acc.providerId === providerId)
}

// Billing info for Pro users
interface BillingInfo {
  isPro: boolean
  order: {
    id: string
    status: string
    date: string
    amount: number | null
    receiptUrl: string | null
  } | null
}

const { data: billing, pending: billingLoading } = useFetch<BillingInfo>('/api/billing', {
  default: () => ({ isPro: false, order: null })
})

// Computed property to check if user is Pro, prioritizing fresh billing data
const isPro = computed(() => {
  if (billing.value?.isPro) return true
  // WIP: user should have the flag as well
  return false
})

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function formatCurrency(value: number | null): string {
  if (value === null) return '-'
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
        Configurações
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Gerir a sua conta e preferências
      </p>
    </div>

    <div class="grid lg:grid-cols-2 gap-8">
      <!-- Left Column -->
      <div class="space-y-8">
        <!-- Profile Section -->
        <UCard class="ring-1 ring-gray-200 dark:ring-gray-800">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-user"
                class="w-5 h-5 text-gray-500"
              />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Perfil
              </h2>
            </div>
          </template>

          <div class="space-y-6">
            <!-- Name -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome
              </label>
              <div class="flex gap-3">
                <UInput
                  v-model="profileForm.name"
                  placeholder="O seu nome"
                  icon="i-lucide-user"
                  class="flex-1"
                />
                <UButton
                  :loading="profileForm.isLoading"
                  :disabled="!profileForm.name.trim() || profileForm.name === user?.name"
                  @click="handleUpdateName"
                >
                  Guardar
                </UButton>
              </div>
            </div>

            <!-- Email -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div class="flex gap-3">
                <UInput
                  v-model="profileForm.email"
                  type="email"
                  placeholder="email@exemplo.com"
                  icon="i-lucide-mail"
                  class="flex-1"
                />
                <UButton
                  :loading="profileForm.isEmailLoading"
                  :disabled="!profileForm.email || profileForm.email === user?.email"
                  @click="handleChangeEmail"
                >
                  Alterar
                </UButton>
              </div>
              <p class="text-xs text-gray-500">
                Será enviado um email de verificação para o novo endereço.
              </p>
            </div>
          </div>
        </UCard>

        <!-- Password Section -->
        <UCard class="ring-1 ring-gray-200 dark:ring-gray-800">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-lock"
                class="w-5 h-5 text-gray-500"
              />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ hasPassword ? 'Alterar Palavra-passe' : 'Definir Palavra-passe' }}
              </h2>
            </div>
          </template>

          <!-- Change password (has existing password) -->
          <div
            v-if="hasPassword"
            class="space-y-4"
          >
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Palavra-passe atual
              </label>
              <UInput
                v-model="passwordForm.currentPassword"
                class="w-full"
                type="password"
                placeholder="••••••••"
                icon="i-lucide-lock"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nova palavra-passe
              </label>
              <UInput
                v-model="passwordForm.newPassword"
                class="w-full"
                type="password"
                placeholder="••••••••"
                icon="i-lucide-lock"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmar nova palavra-passe
              </label>
              <UInput
                v-model="passwordForm.confirmPassword"
                class="w-full"
                type="password"
                placeholder="••••••••"
                icon="i-lucide-lock"
              />
            </div>

            <UButton
              :loading="passwordForm.isLoading"
              :disabled="!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword"
              @click="handleChangePassword"
            >
              Alterar palavra-passe
            </UButton>
          </div>

          <!-- Set password (social-only user) -->
          <div
            v-else
            class="space-y-4"
          >
            <UAlert
              color="info"
              variant="subtle"
              icon="i-lucide-info"
            >
              <template #description>
                Registou-se com uma conta social. Clique abaixo para receber um email e definir uma palavra-passe.
              </template>
            </UAlert>

            <UButton
              :loading="resetPasswordLoading"
              icon="i-lucide-mail"
              @click="handleRequestPasswordReset"
            >
              Enviar email para definir palavra-passe
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Right Column -->
      <div class="space-y-8">
        <!-- Linked Accounts Section -->
        <UCard class="ring-1 ring-gray-200 dark:ring-gray-800">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-link"
                class="w-5 h-5 text-gray-500"
              />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Contas Ligadas
              </h2>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Ligue contas sociais para facilitar o login.
            </p>

            <!-- Loading state -->
            <div
              v-if="isLoadingAccounts"
              class="flex items-center gap-2 py-4"
            >
              <USkeleton class="h-16 w-full" />
            </div>

            <!-- Google Account -->
            <div
              v-else
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 bg-white dark:bg-gray-700 rounded-lg">
                  <UIcon
                    name="i-simple-icons-google"
                    class="w-5 h-5 text-gray-700 dark:text-gray-300"
                  />
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    Google
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ isProviderLinked('google') ? 'Conta ligada' : 'Não ligada' }}
                  </p>
                </div>
              </div>

              <UButton
                v-if="isProviderLinked('google')"
                variant="ghost"
                color="error"
                size="sm"
                icon="i-lucide-unlink"
                :disabled="linkedAccounts.length <= 1"
                @click="handleUnlinkAccount('google')"
              >
                Desligar
              </UButton>
              <UButton
                v-else
                variant="soft"
                size="sm"
                icon="i-lucide-link"
                @click="handleLinkGoogle"
              >
                Ligar
              </UButton>
            </div>

            <p
              v-if="linkedAccounts.length <= 1 && !isLoadingAccounts"
              class="text-xs text-gray-500"
            >
              Precisa de ter pelo menos um método de autenticação ativo.
            </p>
          </div>
        </UCard>

        <!-- Pro Status -->
        <UCard
          v-if="user"
          class="ring-1"
          :class="isPro ? 'ring-primary-200 dark:ring-primary-800 bg-primary-50 dark:bg-primary-900/20' : 'ring-gray-200 dark:ring-gray-800'"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-crown"
                class="w-5 h-5"
                :class="isPro ? 'text-primary-500' : 'text-gray-500'"
              />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Plano
              </h2>
            </div>
          </template>

          <!-- Free Plan -->
          <div
            v-if="!isPro"
            class="flex items-center justify-between"
          >
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                Plano Gratuito
              </p>
              <p class="text-sm text-gray-500">
                Até 3 simulações guardadas
              </p>
            </div>

            <UButton
              :to="checkoutUrl"
              target="_blank"
              color="primary"
              icon="i-lucide-sparkles"
            >
              Fazer upgrade
            </UButton>
          </div>

          <!-- Pro Plan -->
          <div
            v-else
            class="space-y-4"
          >
            <!-- Pro Badge -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <UIcon
                    name="i-lucide-crown"
                    class="w-5 h-5 text-primary-600 dark:text-primary-400"
                  />
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">
                    Pro Vitalício
                  </p>
                  <p class="text-sm text-gray-500">
                    Acesso completo a todas as funcionalidades
                  </p>
                </div>
              </div>
              <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-full">
                <UIcon
                  name="i-lucide-check"
                  class="w-3.5 h-3.5"
                />
                Ativo
              </span>
            </div>

            <USeparator />

            <!-- Billing Details -->
            <div v-if="billingLoading">
              <USkeleton class="h-16 w-full" />
            </div>
            <div
              v-else-if="billing?.order"
              class="space-y-3"
            >
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Detalhes da Compra
              </h3>

              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-gray-500 dark:text-gray-400">
                    Data
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ formatDate(billing.order.date) }}
                  </p>
                </div>
                <div>
                  <p class="text-gray-500 dark:text-gray-400">
                    Valor
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ formatCurrency(billing.order.amount) }}
                  </p>
                </div>
              </div>

              <!-- Receipt Link -->
              <div
                v-if="billing.order.receiptUrl"
                class="pt-2"
              >
                <UButton
                  :to="billing.order.receiptUrl"
                  target="_blank"
                  variant="soft"
                  color="neutral"
                  size="sm"
                  icon="i-lucide-receipt"
                >
                  Ver Fatura
                </UButton>
              </div>
            </div>
            <div
              v-else
              class="text-sm text-gray-500 dark:text-gray-400"
            >
              <p>Informações de faturação não disponíveis.</p>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
