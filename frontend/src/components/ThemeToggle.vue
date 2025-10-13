<template>
  <div class="theme-toggle">
    <!-- Quick toggle button -->
    <button
      @click="themeStore.toggleTheme()"
      class="theme-toggle-btn"
      :class="{ 'dark': themeStore.isDark }"
      :title="themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <!-- Background slider -->
      <div class="toggle-bg"></div>
      
      <!-- Slider circle with icons -->
      <div class="toggle-slider">
        <!-- Sun icon (light mode) -->
        <svg 
          v-show="!themeStore.isDark"
          class="toggle-icon sun-icon" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
        </svg>
        
        <!-- Moon icon (dark mode) -->
        <svg 
          v-show="themeStore.isDark"
          class="toggle-icon moon-icon" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </div>
    </button>

    <!-- Theme selector dropdown (optional advanced mode) -->
    <div v-if="showAdvanced" class="theme-selector">
      <select 
        v-model="themeStore.theme" 
        @change="onThemeChange"
        class="theme-select"
      >
        <option value="auto">🌗 Auto</option>
        <option value="light">☀️ Light</option>
        <option value="dark">🌙 Dark</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/themeStore'
import type { Theme } from '@/stores/themeStore'

interface Props {
  showAdvanced?: boolean
}

withDefaults(defineProps<Props>(), {
  showAdvanced: false
})

const themeStore = useThemeStore()

const onThemeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  themeStore.setTheme(target.value as Theme)
}
</script>
