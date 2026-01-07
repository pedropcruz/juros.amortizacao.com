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

  const signIn = async (email: string, password: string) => {
    return client.signIn.email({
      email,
      password
    })
  }

  const signUp = async (email: string, password: string, name: string) => {
    return client.signUp.email({
      email,
      password,
      name
    })
  }

  const signInWithGoogle = async () => {
    return client.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard'
    })
  }

  const signOut = async () => {
    return client.signOut()
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
    signOut
  }
}
