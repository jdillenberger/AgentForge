import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  // Check for saved theme preference or default to system preference
  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      isDark.value = savedTheme === 'dark'
    } else {
      // Default to system preference
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()
  }

  const toggleTheme = () => {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  const setTheme = (theme: 'light' | 'dark') => {
    isDark.value = theme === 'dark'
    localStorage.setItem('theme', theme)
    applyTheme()
  }

  const applyTheme = () => {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const currentTheme = computed(() => isDark.value ? 'dark' : 'light')

  return {
    isDark,
    currentTheme,
    initializeTheme,
    toggleTheme,
    setTheme
  }
})