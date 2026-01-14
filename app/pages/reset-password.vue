<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Redefinir Password - Juros'
})

const { resetPassword } = useAuth()
const route = useRoute()

// Get token from URL
const token = computed(() => route.query.token as string | undefined)
const error = computed(() => route.query.error as string | undefined)

const schema = z.object({
  password: z.string().min(8, 'A password deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'A password deve ter pelo menos 8 caracteres')
}).refine(data => data.password === data.confirmPassword, {
  message: 'As passwords nao coincidem',
  path: ['confirmPassword']
})

type Schema = z.output<typeof schema>

const state = reactive({
  password: '',
  confirmPassword: ''
})

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref(false)

// Check for invalid token error from URL
onMounted(() => {
  if (error.value === 'INVALID_TOKEN') {
    errorMessage.value = 'O link de recuperacao expirou ou e invalido. Por favor, solicite um novo.'
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!token.value) {
    errorMessage.value = 'Token de recuperacao em falta.'
    return
  }

  isLoading.value = true
  errorMessage.value = null

  try {
    const result = await resetPassword(event.data.password, token.value)

    if (result.error) {
      errorMessage.value = 'Nao foi possivel redefinir a password. O link pode ter expirado.'
      return
    }

    successMessage.value = true
  } catch {
    errorMessage.value = 'Ocorreu um erro. Tente novamente.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2"
        >
          <div class="bg-primary-500/10 p-2 rounded-lg">
            <UIcon
              name="i-lucide-landmark"
              class="w-8 h-8 text-primary-600 dark:text-primary-400"
            />
          </div>
          <span class="font-bold text-2xl text-gray-900 dark:text-white">Juros</span>
        </NuxtLink>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Redefinir palavra-passe
        </p>
      </div>

      <UCard class="shadow-xl">
        <!-- Success State -->
        <div
          v-if="successMessage"
          class="text-center py-4"
        >
          <div class="mx-auto w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mb-4">
            <UIcon
              name="i-lucide-check-circle"
              class="w-8 h-8 text-success-600 dark:text-success-400"
            />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Password redefinida
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            A sua palavra-passe foi alterada com sucesso. Ja pode iniciar sessao com a nova password.
          </p>
          <NuxtLink to="/login">
            <UButton
              size="lg"
              class="font-semibold"
            >
              Iniciar sessao
            </UButton>
          </NuxtLink>
        </div>

        <!-- Invalid Token State -->
        <div
          v-else-if="error === 'INVALID_TOKEN' || !token"
          class="text-center py-4"
        >
          <div class="mx-auto w-16 h-16 bg-error-100 dark:bg-error-900/30 rounded-full flex items-center justify-center mb-4">
            <UIcon
              name="i-lucide-alert-circle"
              class="w-8 h-8 text-error-600 dark:text-error-400"
            />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Link invalido
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            O link de recuperacao expirou ou e invalido. Por favor, solicite um novo link.
          </p>
          <NuxtLink to="/forgot-password">
            <UButton
              size="lg"
              class="font-semibold"
            >
              Solicitar novo link
            </UButton>
          </NuxtLink>
        </div>

        <!-- Form State -->
        <template v-else>
          <UForm
            :schema="schema"
            :state="state"
            class="space-y-6"
            @submit="onSubmit"
          >
            <UAlert
              v-if="errorMessage"
              color="error"
              :title="errorMessage"
              icon="i-lucide-alert-circle"
              variant="subtle"
              class="mb-4"
            />

            <p class="text-sm text-gray-600 dark:text-gray-400">
              Introduza a sua nova palavra-passe.
            </p>

            <UFormField
              label="Nova password"
              name="password"
            >
              <UInput
                v-model="state.password"
                type="password"
                placeholder="••••••••"
                icon="i-lucide-lock"
                size="lg"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Confirmar password"
              name="confirmPassword"
            >
              <UInput
                v-model="state.confirmPassword"
                type="password"
                placeholder="••••••••"
                icon="i-lucide-lock"
                size="lg"
                class="w-full"
              />
            </UFormField>

            <UButton
              type="submit"
              block
              size="lg"
              :loading="isLoading"
              class="font-semibold"
            >
              Redefinir password
            </UButton>
          </UForm>

          <p class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Lembrou-se da password?
            <NuxtLink
              to="/login"
              class="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              Iniciar sessao
            </NuxtLink>
          </p>
        </template>
      </UCard>
    </div>
  </div>
</template>
