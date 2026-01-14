import { createAuthClient } from 'better-auth/vue'

let authClient: ReturnType<typeof createAuthClient>

function getClient() {
  if (!authClient) {
    const baseURL = import.meta.client
      ? window.location.origin
      : useRuntimeConfig().public.siteUrl

    authClient = createAuthClient({
      baseURL
    })
  }
  return authClient
}

export const useAuth = () => {
  const client = getClient()
  const session = client.useSession()
  const analytics = useAnalytics()

  const signIn = async (email: string, password: string) => {
    const res = await client.signIn.email({
      email,
      password
    })

    if (res.data?.user) {
      analytics.identify(res.data.user.id, { email: res.data.user.email, name: res.data.user.name })
      analytics.capture('login_success', { method: 'email' })
    } else if (res.error) {
      analytics.capture('login_failed', { method: 'email', error: res.error.message })
    }

    return res
  }

  const signUp = async (email: string, password: string, name: string) => {
    const res = await client.signUp.email({
      email,
      password,
      name
    })

    if (res.data?.user) {
      analytics.identify(res.data.user.id, { email: res.data.user.email, name: res.data.user.name })
      analytics.capture('signup_success', { method: 'email' })
    } else if (res.error) {
      analytics.capture('signup_failed', { method: 'email', error: res.error.message })
    }

    return res
  }

  const signInWithGoogle = async () => {
    analytics.capture('login_attempt', { method: 'google' })
    return client.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard'
    })
  }

  const signOut = async () => {
    analytics.reset()
    return client.signOut()
  }

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    return client.changePassword({
      currentPassword,
      newPassword
    })
  }

  // Change email
  const changeEmail = async (newEmail: string) => {
    return client.changeEmail({
      newEmail
    })
  }

  // Update user profile
  const updateUser = async (data: { name?: string, image?: string }) => {
    return client.updateUser(data)
  }

  // Link social account
  const linkSocial = async (provider: 'google') => {
    return client.linkSocial({
      provider,
      callbackURL: '/settings'
    })
  }

  // List linked accounts
  const listAccounts = async () => {
    return client.listAccounts()
  }

  // Unlink social account
  const unlinkAccount = async (providerId: string) => {
    return client.unlinkAccount({
      providerId
    })
  }

  // Request password reset (sends email)
  const requestPasswordReset = async (email: string) => {
    try {
      const response = await $fetch('/api/auth/request-password-reset', {
        method: 'POST',
        body: {
          email,
          redirectTo: '/reset-password'
        }
      })
      return { data: response, error: null }
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      return { data: null, error: { message: error.data?.message || 'Erro ao enviar email' } }
    }
  }

  // Reset password with token
  const resetPassword = async (newPassword: string, token: string) => {
    return client.resetPassword({
      newPassword,
      token
    })
  }

  const isAuthenticated = computed(() => {
    return !!session.value.data?.user
  })

  const user = computed(() => {
    return session.value.data?.user
  })

  const isLoading = computed(() => {
    return session.value.isPending
  })

  return {
    session,
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    changePassword,
    changeEmail,
    updateUser,
    linkSocial,
    listAccounts,
    unlinkAccount,
    requestPasswordReset,
    resetPassword
  }
}
