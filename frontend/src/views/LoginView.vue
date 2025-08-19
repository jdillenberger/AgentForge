<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Welcome to AI Agent Configuration Hub</h1>
          <p>Configure and manage your AI agents</p>
        </div>

        <div v-if="error" class="error-message">
          <p>{{ error }}</p>
          <button @click="clearError" class="btn btn-secondary">Dismiss</button>
        </div>

        <div v-if="!authEnabled" class="info-message">
          <p>Authentication is not enabled on this instance.</p>
          <router-link to="/" class="btn btn-primary">Continue to Application</router-link>
        </div>

        <div v-else-if="isLoading" class="loading-message">
          <div class="spinner spinner-lg"></div>
          <p>Preparing login...</p>
        </div>

        <div v-else class="login-actions">
          <button @click="handleLogin" class="btn btn-primary btn-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="login-icon">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Sign in with OIDC
          </button>
          
          <div class="login-help">
            <p>You will be redirected to your organization's login page.</p>
          </div>
        </div>

        <div class="login-footer">
          <p><router-link to="/about">About this application</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const error = ref<string | null>(null)

const isLoading = computed(() => authStore.isLoading)
const authEnabled = computed(() => authStore.isAuthEnabled)

onMounted(async () => {
  // Initialize auth store if not already done
  if (!authStore.appConfig) {
    await authStore.initialize()
  }

  // If user is already authenticated, redirect them
  if (authStore.isAuthenticated) {
    const returnTo = (route.query.returnTo as string) || '/'
    router.push(returnTo)
    return
  }

  // If auth is not enabled, they don't need to be here
  if (!authEnabled.value) {
    router.push('/')
    return
  }
})

async function handleLogin() {
  try {
    error.value = null
    const returnTo = (route.query.returnTo as string) || '/'
    await authStore.login(returnTo)
  } catch (err) {
    console.error('Login error:', err)
    error.value = err instanceof Error ? err.message : 'Login failed'
  }
}

function clearError() {
  error.value = null
  authStore.clearError()
}
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  background: var(--color-white);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: 0.5rem;
}

.login-header p {
  color: var(--color-gray-600);
  font-size: 0.875rem;
}

.error-message {
  background: var(--color-danger-light);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-lg);
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.error-message p {
  color: var(--color-danger);
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.info-message {
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-lg);
  padding: 1rem;
  text-align: center;
}

.info-message p {
  color: var(--color-primary-dark);
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.loading-message {
  text-align: center;
  padding: 2rem 0;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-gray-200);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-message p {
  color: var(--color-gray-600);
  font-size: 0.875rem;
}

.login-actions {
  text-align: center;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-lg);
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition-normal);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-primary.btn-large {
  padding: 1rem 2rem;
  font-size: 1rem;
  width: 100%;
  justify-content: center;
}

.btn-secondary {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color var(--transition-normal);
}

.btn-secondary:hover {
  background: var(--color-gray-200);
}

.login-icon {
  width: 18px;
  height: 18px;
}

.login-help {
  margin-top: 1rem;
}

.login-help p {
  color: var(--color-gray-600);
  font-size: 0.75rem;
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-gray-200);
}

.login-footer a {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.875rem;
}

.login-footer a:hover {
  text-decoration: underline;
}
</style>