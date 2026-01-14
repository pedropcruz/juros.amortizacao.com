// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/test-utils',
    ...(process.env.NUXT_PUBLIC_POSTHOG_PUBLIC_KEY ? ['@posthog/nuxt'] : [])
  ],

  devtools: {
    enabled: process.env.NODE_ENV === 'development'
  },

  app: {
    head: {
      title: 'Juros - Simulador de Crédito Habitação',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,100..900;1,100..900&display=swap' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      lemonSqueezyCheckoutUrl: process.env.NUXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL || ''
    }
  },

  // Disable SSR for authenticated routes to avoid hydration issues
  routeRules: {
    '/dashboard': { ssr: false },
    '/settings': { ssr: false },
    '/compare': { ssr: false },
    '/simulation/**': { ssr: false }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        semi: false,
        quotes: 'single',
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  // @ts-expect-error PostHog module type definition mismatch
  posthog: {
    disabled: process.env.NODE_ENV === 'development' || !process.env.NUXT_PUBLIC_POSTHOG_PUBLIC_KEY,
    publicKey: process.env.NUXT_PUBLIC_POSTHOG_PUBLIC_KEY || 'phc_dummy_key_for_build', // Fallback to avoid build crash
    host: process.env.NUXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    clientConfig: {
      autocapture: true,
      capture_pageview: true,
      session_recording: {
        maskAllInputs: true,
        maskInputOptions: {
          password: true
        }
      }
    }
  }
})
