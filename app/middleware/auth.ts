export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, isLoading } = useAuth()

  // Don't redirect while still loading - the global loading screen handles this
  if (isLoading.value) {
    return
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
