<script setup lang="ts">
const { user, signOut } = useAuth()
const router = useRouter()

async function handleSignOut() {
  await signOut()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-4">
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
            <nav class="hidden md:flex items-center gap-1 ml-6">
              <UButton
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
            </nav>
          </div>

          <div class="flex items-center gap-4">
            <UColorModeButton />
            <div class="flex items-center gap-3">
              <span class="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                {{ user?.email }}
              </span>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-log-out"
                @click="handleSignOut"
              >
                <span class="hidden sm:inline">Sair</span>
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>
