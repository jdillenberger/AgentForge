import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/auth/callback',
      name: 'authCallback',
      component: () => import('../views/AuthCallbackView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: { requiresAuth: false }
    },
  ],
})

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Initialize auth store if not already done
  if (!authStore.appConfig) {
    try {
      await authStore.initialize()
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      // Continue anyway, as the app should still work if auth fails to initialize
    }
  }

  const requiresAuth = to.meta.requiresAuth !== false // Default to requiring auth
  const isAuthEnabled = authStore.isAuthEnabled
  const isAuthenticated = authStore.isAuthenticated

  // If auth is not enabled, allow all routes
  if (!isAuthEnabled) {
    next()
    return
  }

  // If route requires auth and user is not authenticated
  if (requiresAuth && !isAuthenticated) {
    // Check if user might be authenticated but store is stale
    try {
      const authStatus = await authStore.checkAuthStatus()
      if (authStatus) {
        // User is authenticated, continue
        next()
        return
      }
    } catch (error) {
      console.error('Auth status check failed:', error)
    }

    // Redirect to login with return URL
    next({
      name: 'login',
      query: { returnTo: to.fullPath }
    })
    return
  }

  // If user is authenticated and trying to access login page
  if (isAuthenticated && to.name === 'login') {
    // Redirect to home or return URL
    const returnTo = to.query.returnTo as string || '/'
    next(returnTo)
    return
  }

  // All other cases, allow navigation
  next()
})

export default router
