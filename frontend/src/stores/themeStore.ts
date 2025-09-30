import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export type Theme = 'light' | 'dark' | 'auto'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('auto')
  const systemDarkMode = ref(false)

  // Check system preference
  const updateSystemTheme = () => {
    systemDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // Computed actual theme
  const isDark = computed(() => {
    if (theme.value === 'auto') {
      return systemDarkMode.value
    }
    return theme.value === 'dark'
  })

  // Apply theme to document
  const applyTheme = () => {
    const htmlElement = document.documentElement
    if (isDark.value) {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }
  }

  // Set theme
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme()
  }

  // Initialize theme
  const initializeTheme = () => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      theme.value = savedTheme
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    updateSystemTheme()
    
    mediaQuery.addEventListener('change', () => {
      updateSystemTheme()
      if (theme.value === 'auto') {
        applyTheme()
      }
    })

    // Apply initial theme
    applyTheme()
  }

  // Toggle between light and dark (skip auto for manual toggle)
  const toggleTheme = () => {
    const newTheme = isDark.value ? 'light' : 'dark'
    setTheme(newTheme)
  }

  // Watch theme changes and apply
  watch([theme, systemDarkMode], applyTheme)

  return {
    theme,
    isDark,
    systemDarkMode,
    setTheme,
    toggleTheme,
    initializeTheme
  }
})
