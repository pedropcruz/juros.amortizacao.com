<script setup lang="ts">
const year = new Date().getFullYear()
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
              © {{ year }} Todos os direitos reservados.
            </p>
          </div>
          <div class="flex items-center gap-6">
            <p class="text-xs text-gray-400">
              Literacia Financeira para todos.
            </p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
