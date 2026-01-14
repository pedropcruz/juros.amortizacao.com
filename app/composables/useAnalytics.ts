export const useAnalytics = () => {
  const { $posthog } = useNuxtApp()

  // Helper seguro para aceder ao posthog (pode ser undefined em server-side ou se desativado)
  const getPosthog = () => {
    if (import.meta.server) return null
    return typeof $posthog === 'function' ? $posthog() : null
  }

  /**
   * Identifica o utilizador após login
   * @param userId ID único do utilizador (Database ID)
   * @param traits Metadados adicionais (email, plano, etc)
   */
  const identify = (userId: string, traits?: Record<string, unknown>) => {
    const ph = getPosthog()
    if (ph) {
      ph.identify(userId, traits)
    }
  }

  /**
   * Limpa a sessão ao fazer logout
   */
  const reset = () => {
    const ph = getPosthog()
    if (ph) {
      ph.reset()
    }
  }

  /**
   * Regista um evento customizado
   * @param eventName Nome do evento (ex: 'simulation_created')
   * @param properties Propriedades do evento
   */
  const capture = (eventName: string, properties?: Record<string, unknown>) => {
    const ph = getPosthog()
    if (ph) {
      ph.capture(eventName, properties)
    }
  }

  /**
   * Regista visualização de página manualmente (se necessário)
   */
  const capturePageView = () => {
    const ph = getPosthog()
    if (ph) {
      ph.capture('$pageview')
    }
  }

  return {
    identify,
    reset,
    capture,
    capturePageView
  }
}
