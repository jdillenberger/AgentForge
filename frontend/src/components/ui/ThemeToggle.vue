<template>
  <button 
    @click="themeStore.toggleTheme()" 
    class="theme-toggle btn btn-outline"
    :title="themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <Icon :name="themeStore.isDark ? 'sun' : 'moon'" size="sm" class="theme-icon" />
    <span class="theme-text">{{ themeStore.isDark ? 'Light' : 'Dark' }}</span>
  </button>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme.store'
import Icon from './Icon.vue'

const themeStore = useThemeStore()
</script>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-gray-300);
  background: var(--color-white);
  color: var(--color-gray-700);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-normal);
  min-height: auto;
}

.theme-toggle:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-400);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.theme-icon {
  font-size: 1rem;
  line-height: 1;
}

.theme-text {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

@media (max-width: 768px) {
  .theme-text {
    display: none;
  }
  
  .theme-toggle {
    padding: var(--spacing-2);
    min-width: 2.5rem;
    justify-content: center;
  }
}
</style>