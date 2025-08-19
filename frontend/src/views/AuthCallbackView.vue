<template>
  <div class="callback-view">
    <div class="callback-container">
      <div class="callback-card">
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <h2>Completing sign in...</h2>
          <p>Please wait while we process your authentication.</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">
            <Icon name="warning" size="lg" aria-label="Error" />
          </div>
          <h2>Sign in failed</h2>
          <p>{{ error }}</p>
          <div class="error-actions">
            <button @click="retryLogin" class="btn-primary">Try Again</button>
            <router-link to="/login" class="btn-secondary">Back to Login</router-link>
          </div>
        </div>

        <div v-else class="success-state">
          <div class="success-icon">✅</div>
          <h2>Sign in successful!</h2>
          <p>Redirecting you to the application...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Icon from '../components/ui/Icon.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    // Handle the OIDC callback
    const returnUrl = await authStore.handleCallback()
    
    // Small delay to show success state
    setTimeout(() => {
      router.push(returnUrl)
    }, 1500)
  } catch (err) {
    console.error('Callback error:', err)
    error.value = err instanceof Error ? err.message : 'Authentication callback failed'
    isLoading.value = false
  }
})

async function retryLogin() {
  try {
    error.value = null
    isLoading.value = true
    await authStore.login()
  } catch (err) {
    console.error('Retry login error:', err)
    error.value = err instanceof Error ? err.message : 'Login retry failed'
    isLoading.value = false
  }
}
</script>

<style scoped>
.callback-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.callback-container {
  width: 100%;
  max-width: 400px;
}

.callback-card {
  background: white;
  border-radius: 12px;
  padding: 3rem 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  text-align: center;
}

.loading-state,
.error-state,
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.success-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
  width: 100%;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
</style>