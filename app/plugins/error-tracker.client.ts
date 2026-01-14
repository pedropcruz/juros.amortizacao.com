export default defineNuxtPlugin((nuxtApp) => {
  const analytics = useAnalytics()

  // Capture Vue errors (component rendering, watchers, lifecycle hooks)
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    analytics.capture('vue_error', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      component: instance?.$options?.name || 'Anonymous',
      info
    })

    // Log to console for dev visibility
    console.error('[Vue Error captured by Analytics]', error, info)
  }

  // Capture generic app errors
  nuxtApp.hook('app:error', (error) => {
    analytics.capture('app_error', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    console.error('[App Error captured by Analytics]', error)
  })
})
