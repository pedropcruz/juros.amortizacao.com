<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

const { signUp, signInWithGoogle, isAuthenticated } = useAuth()
const router = useRouter()

// Redirect if already authenticated
watch(isAuthenticated, (value) => {
  if (value) {
    router.push('/dashboard')
  }
}, { immediate: true })

const schema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'A password deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'As passwords não coincidem',
  path: ['confirmPassword']
})

type Schema = z.output<typeof schema>

const state = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isLoading.value = true
  errorMessage.value = null

  try {
    const result = await signUp(event.data.email, event.data.password, event.data.name)

    if (result.error) {
      if (result.error.message?.includes('already exists')) {
        errorMessage.value = 'Este email já está registado'
      } else {
        errorMessage.value = 'Erro ao criar conta. Tente novamente.'
      }
      return
    }

    router.push('/dashboard')
  } catch {
    errorMessage.value = 'Ocorreu um erro. Tente novamente.'
  } finally {
    isLoading.value = false
  }
}

async function handleGoogleSignIn() {
  isLoading.value = true
  errorMessage.value = null

  try {
    await signInWithGoogle()
  } catch {
    errorMessage.value = 'Erro ao iniciar sessão com Google'
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
          Crie a sua conta gratuita
        </p>
      </div>

      <UCard class="shadow-xl">
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-5"
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

          <UFormField
            label="Nome"
            name="name"
          >
            <UInput
              v-model="state.name"
              type="text"
              placeholder="O seu nome"
              icon="i-lucide-user"
              size="lg"
              class="w-full"
            />
          </UFormField>

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

          <UFormField
            label="Password"
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
            label="Confirmar Password"
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
            Criar Conta
          </UButton>
        </UForm>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white dark:bg-gray-900 text-gray-500">ou continue com</span>
          </div>
        </div>

        <UButton
          block
          size="lg"
          color="neutral"
          variant="outline"
          icon="i-simple-icons-google"
          :loading="isLoading"
          @click="handleGoogleSignIn"
        >
          Google
        </UButton>

        <p class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Já tem conta?
          <NuxtLink
            to="/login"
            class="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            Iniciar sessão
          </NuxtLink>
        </p>
      </UCard>

      <p class="mt-6 text-center text-xs text-gray-500 dark:text-gray-500">
        Ao criar conta, concorda com os nossos
        <NuxtLink
          to="/terms"
          class="underline hover:text-gray-700 dark:hover:text-gray-300"
        >
          Termos de Serviço
        </NuxtLink>
        e
        <NuxtLink
          to="/privacy"
          class="underline hover:text-gray-700 dark:hover:text-gray-300"
        >
          Política de Privacidade
        </NuxtLink>.
      </p>
    </div>
  </div>
</template>
