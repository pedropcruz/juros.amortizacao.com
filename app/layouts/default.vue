<script setup lang="ts">
const year = new Date().getFullYear()
const { isAuthenticated } = useAuth()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 font-sans">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <NuxtLink
            to="/"
            class="flex items-center gap-2 group"
          >
            <div class="bg-primary-500/10 p-2 rounded-lg group-hover:bg-primary-500/20 transition-colors">
              <UIcon
                name="i-lucide-landmark"
                class="w-6 h-6 text-primary-600 dark:text-primary-400"
              />
            </div>
            <span class="font-bold text-xl text-gray-900 dark:text-white tracking-tight">Juros</span>
          </NuxtLink>

          <!-- Navigation -->
          <nav class="hidden md:flex items-center gap-1">
            <UButton
              v-if="isAuthenticated"
              to="/dashboard"
              variant="ghost"
              color="neutral"
              size="sm"
            >
              Dashboard
            </UButton>
            <UButton
              to="/simulator"
              variant="ghost"
              color="neutral"
              size="sm"
            >
              Simulador
            </UButton>
            <UButton
              to="/taxa-esforco"
              variant="ghost"
              color="neutral"
              size="sm"
            >
              Taxa de Esforço
            </UButton>
          </nav>

          <div class="flex items-center gap-3">
            <UColorModeButton />
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-landmark"
              class="w-5 h-5 text-gray-400"
            />
            <p class="text-sm text-gray-500 dark:text-gray-400">
              © {{ year }} Juros. Todos os direitos reservados.
            </p>
          </div>

          <div class="flex items-center gap-6">
            <NuxtLink
              to="/terms"
              class="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Termos
            </NuxtLink>
            <NuxtLink
              to="/privacy"
              class="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Privacidade
            </NuxtLink>
            <p class="text-xs text-gray-400 hidden sm:block border-l border-gray-200 dark:border-gray-800 pl-6">
              Literacia Financeira para todos.
            </p>
          </div>
        </div>

        <div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 text-center space-y-2">
          <p>
            <strong>Contacto:</strong> <a
              href="mailto:suporte@juros.amortizacao.com"
              class="hover:text-primary-500 transition-colors"
            >suporte@juros.amortizacao.com</a>
          </p>
          <p class="max-w-3xl mx-auto">
            <strong>Isenção de Responsabilidade:</strong> O Juros é uma ferramenta de simulação e literacia financeira.
            Os resultados apresentados são estimativas e não constituem aconselhamento financeiro, jurídico ou fiscal.
            Recomendamos sempre a consulta de profissionais qualificados antes de tomar decisões financeiras.
          </p>
        </div>
      </div>
    </footer>

    <!-- Feedback Widget -->
    <FeedbackWidget />
  </div>
</template>
