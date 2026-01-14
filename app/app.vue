<script setup>
const colorMode = useColorMode()
const analytics = useAnalytics()

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'pt'
  }
})

const title = 'Simulador de Crédito Habitação'
const description
  = 'Simulador de crédito habitação português com Sistema Francês. Calcule prestações, veja a tabela de amortização e entenda os custos do seu empréstimo.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})

// Track theme preference
watch(() => colorMode.value, (newMode) => {
  analytics.capture('theme_changed', { mode: newMode })
})

// Track initial theme on mount
onMounted(() => {
  // Small delay to ensure color mode is hydrated
  setTimeout(() => {
    analytics.capture('theme_preference_initial', { mode: colorMode.value })
  }, 1000)
})
</script>

<template>
  <NuxtLoadingIndicator />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
