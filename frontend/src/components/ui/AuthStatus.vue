<template>
  <div class="auth-status">
    <!-- Authentication not enabled -->
    <div v-if="!isAuthEnabled" class="auth-disabled">
      <span class="status-text">Authentication disabled</span>
    </div>

    <!-- Loading state -->
    <div v-else-if="isLoading" class="auth-loading">
      <div class="spinner-sm"></div>
      <span class="status-text">Loading...</span>
    </div>

    <!-- Authenticated user -->
    <div v-else-if="isAuthenticated" class="auth-authenticated">
      <div class="user-info">
        <div class="user-avatar">
          {{ userInitials }}
        </div>
        <div class="user-details">
          <span class="user-name">{{ userDisplayName }}</span>
          <span v-if="userEmail" class="user-email">{{ userEmail }}</span>
        </div>
      </div>
      
      <div class="auth-actions">
        <button @click="handleLogout" class="btn btn-secondary btn-sm" :disabled="isLoading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 0 1 2 2v2h-2V4H5v16h9v-2h2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9z"/>
          </svg>
          Sign out
        </button>
      </div>
    </div>

    <!-- Not authenticated -->
    <div v-else class="auth-unauthenticated">
      <router-link to="/login" class="btn btn-primary btn-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10,17V14H3V10H10V7L15,12L10,17M10,2H19A2,2 0 0,1 21,4V20A2,2 0 0,1 19,22H10A2,2 0 0,1 8,20V18H10V20H19V4H10V6H8V4A2,2 0 0,1 10,2Z"/>
        </svg>
        Sign in
      </router-link>
    </div>

    <!-- Error display -->
    <div v-if="error" class="auth-error">
      <div class="error-content">
        <span class="error-text">{{ error }}</span>
        <button @click="clearError" class="error-dismiss">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const isAuthEnabled = computed(() => authStore.isAuthEnabled)
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isLoading = computed(() => authStore.isLoading)
const user = computed(() => authStore.user)
const userDisplayName = computed(() => authStore.userDisplayName)
const userEmail = computed(() => authStore.userEmail)
const error = computed(() => authStore.error)

const userInitials = computed(() => {
  if (!user.value) return '?'
  
  const name = user.value.name || user.value.preferred_username || user.value.email || user.value.sub
  const parts = name.split(' ')
  
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  } else {
    return name.substring(0, 2).toUpperCase()
  }
})

async function handleLogout() {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (err) {
    console.error('Logout failed:', err)
  }
}

function clearError() {
  authStore.clearError()
}
</script>

<style scoped>
.auth-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.auth-disabled {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-text {
  font-size: 0.875rem;
  color: var(--color-gray-600);
}

.auth-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-gray-200);
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.auth-authenticated {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-900);
}

.user-email {
  font-size: 0.75rem;
  color: var(--color-gray-600);
}

.auth-actions {
  display: flex;
  align-items: center;
}

.auth-unauthenticated {
  display: flex;
  align-items: center;
}

.auth-error {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 50;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-danger-light);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.error-text {
  font-size: 0.875rem;
  color: var(--color-danger);
}

.error-dismiss {
  background: none;
  border: none;
  color: var(--color-danger);
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  padding: 0;
  margin: 0;
}

.error-dismiss:hover {
  opacity: 0.7;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .user-details {
    display: none;
  }
  
  .auth-status {
    gap: 0.5rem;
  }
}
</style>