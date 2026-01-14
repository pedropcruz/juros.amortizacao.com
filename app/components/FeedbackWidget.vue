<script setup lang="ts">
const isOpen = ref(false)
const isSubmitting = ref(false)
const isSubmitted = ref(false)
const analytics = useAnalytics()

const form = reactive({
  type: 'feature' as 'bug' | 'feature' | 'other',
  message: '',
  email: ''
})

const feedbackTypes = [
  { value: 'feature', label: 'Sugestão', icon: 'i-lucide-lightbulb' },
  { value: 'bug', label: 'Problema', icon: 'i-lucide-bug' },
  { value: 'other', label: 'Outro', icon: 'i-lucide-message-circle' }
]

async function submitFeedback() {
  if (!form.message.trim()) return

  isSubmitting.value = true

  try {
    await $fetch('/api/feedback', {
      method: 'POST',
      body: {
        type: form.type,
        message: form.message,
        email: form.email || undefined
      }
    })

    analytics.capture('feedback_submitted', {
      type: form.type,
      has_email: !!form.email
    })

    isSubmitted.value = true

    // Reset after 3 seconds
    setTimeout(() => {
      isOpen.value = false
      isSubmitted.value = false
      form.message = ''
      form.email = ''
      form.type = 'feature'
    }, 2500)
  } catch (error) {
    analytics.capture('feedback_error', { error: String(error) })
    console.error('Failed to submit feedback:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Track widget open
watch(isOpen, (val) => {
  if (val) {
    analytics.capture('feedback_widget_opened')
  }
})
</script>

<template>
  <!-- Floating Button -->
  <UButton
    class="fixed bottom-6 right-6 z-50 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
    title="Dar Feedback"
    @click="isOpen = true"
  >
    <UIcon
      name="i-lucide-message-square-plus"
      class="w-6 h-6"
    />
  </UButton>

  <!-- Modal -->
  <UModal v-model:open="isOpen">
    <template #content>
      <div class="p-6">
        <!-- Success State -->
        <div
          v-if="isSubmitted"
          class="text-center py-8"
        >
          <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <UIcon
              name="i-lucide-check"
              class="w-8 h-8 text-green-600 dark:text-green-400"
            />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Obrigado pelo feedback!
          </h3>
          <p class="text-gray-500 dark:text-gray-400">
            A tua opinião ajuda-nos a melhorar.
          </p>
        </div>

        <!-- Form State -->
        <template v-else>
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
              Dar Feedback
            </h2>
            <button
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              @click="isOpen = false"
            >
              <UIcon
                name="i-lucide-x"
                class="w-5 h-5"
              />
            </button>
          </div>

          <form
            class="space-y-4"
            @submit.prevent="submitFeedback"
          >
            <!-- Type Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de feedback
              </label>
              <div class="flex gap-2">
                <button
                  v-for="feedbackType in feedbackTypes"
                  :key="feedbackType.value"
                  type="button"
                  class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm"
                  :class="form.type === feedbackType.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'"
                  @click="form.type = feedbackType.value as 'bug' | 'feature' | 'other'"
                >
                  <UIcon
                    :name="feedbackType.icon"
                    class="w-4 h-4"
                  />
                  {{ feedbackType.label }}
                </button>
              </div>
            </div>

            <!-- Message -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mensagem <span class="text-red-500">*</span>
              </label>
              <UTextarea
                v-model="form.message"
                class="w-full"
                placeholder="Descreve a tua sugestão ou problema..."
                :rows="4"
                required
              />
            </div>

            <!-- Email (optional) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email <span class="text-gray-400 font-normal">(opcional, para resposta)</span>
              </label>
              <UInput
                v-model="form.email"
                class="w-full"
                type="email"
                placeholder="email@exemplo.com"
              />
            </div>

            <!-- Submit Button -->
            <UButton
              type="submit"
              block
              size="lg"
              :loading="isSubmitting"
              :disabled="!form.message.trim()"
            >
              Enviar Feedback
            </UButton>
          </form>
        </template>
      </div>
    </template>
  </UModal>
</template>
