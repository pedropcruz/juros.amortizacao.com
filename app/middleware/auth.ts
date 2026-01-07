export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, isLoading } = useAuth()

  // Wait for auth to initialize
  if (isLoading.value) {
    // Give it a moment to check session
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated.value) {
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    })
  }
})
