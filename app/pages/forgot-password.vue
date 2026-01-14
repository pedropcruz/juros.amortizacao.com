<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Recuperar Password - Juros'
})

const { requestPasswordReset, isAuthenticated } = useAuth()
const router = useRouter()

// Redirect if already authenticated
watch(isAuthenticated, (value) => {
  if (value) {
    router.push('/dashboard')
  }
}, { immediate: true })

const schema = z.object({
  email: z.string().email('Email invalido')
})

type Schema = z.output<typeof schema>

const state = reactive({
  email: ''
})

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isLoading.value = true
  errorMessage.value = null

  try {
    const result = await requestPasswordReset(event.data.email)

    if (result.error) {
      errorMessage.value = 'Ocorreu um erro. Tente novamente.'
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
          Recuperar palavra-passe
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
              name="i-lucide-mail-check"
              class="w-8 h-8 text-success-600 dark:text-success-400"
            />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Email enviado
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Se existir uma conta com este email, recebera instrucoes para redefinir a sua palavra-passe.
          </p>
          <NuxtLink to="/login">
            <UButton
              variant="outline"
              color="neutral"
              size="lg"
            >
              Voltar ao login
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
              Introduza o seu email e enviaremos um link para redefinir a sua palavra-passe.
            </p>

            <UFormField
              label="Email"
              name="email"
            >
              <UInput
                v-model="state.email"
                type="email"
                placeholder="exemplo@email.com"
                icon="i-lucide-mail"
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
              Enviar link de recuperacao
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
