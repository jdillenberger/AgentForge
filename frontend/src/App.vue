<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import AuthStatus from './components/ui/AuthStatus.vue'
import ThemeToggle from './components/ui/ThemeToggle.vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()

// Get app title from environment variable
const appTitle = import.meta.env.VITE_APP_TITLE || 'AI Agent Configuration Hub'

onMounted(async () => {
  // Initialize authentication on app start
  await authStore.initialize()
  // Initialize theme
  themeStore.initializeTheme()
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-content">
        <h1>{{ appTitle }}</h1>
        <div class="header-actions">
          <!-- <ThemeToggle /> -->
          <AuthStatus />
        </div>
      </div>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: hidden;
  max-width: 100vw;
  width: 100%;
}

.app-header {
  background: linear-gradient(135deg, var(--color-gray-50) 0%, #f8fafc 100%);
  border-bottom: 1px solid var(--color-gray-300);
  padding: var(--spacing-4) var(--spacing-8);
  margin: 0;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  animation: slideInFromTop 0.5s ease-out;
}

.app-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 50%, #7c3aed 100%);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  animation: slideInFromRight 0.6s ease-out 0.2s both;
}

.app-header h1 {
  margin: 0;
  color: var(--color-gray-900);
  font-family: var(--font-display);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-display-base);
  transition: all var(--transition-normal);
  animation: slideInFromLeft 0.6s ease-out 0.1s both;
  background: linear-gradient(135deg, var(--color-gray-900) 0%, #1e40af 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1:hover {
  transform: translateY(-1px);
}

.app-main {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  max-width: 100%;
  background: var(--color-white);
}
</style>

<style>
/* Global styles to prevent horizontal overflow */
html, body {
  overflow-x: hidden;
  max-width: 100vw;
  width: 100%;
}

* {
  box-sizing: border-box;
}

/* Header animations */
@keyframes slideInFromTop {
  from { 
    opacity: 0; 
    transform: translateY(-20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes slideInFromLeft {
  from { 
    opacity: 0; 
    transform: translateX(-30px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}

@keyframes slideInFromRight {
  from { 
    opacity: 0; 
    transform: translateX(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}
</style>
