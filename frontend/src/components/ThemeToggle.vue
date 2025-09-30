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

<style scoped>
.theme-toggle {
  @apply flex items-center space-x-3;
}

.theme-toggle-btn {
  @apply relative flex items-center;
  @apply w-14 h-7 rounded-full;
  @apply transition-all duration-300 ease-in-out;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  @apply dark:focus:ring-primary-400 dark:focus:ring-offset-slate-800;
  @apply cursor-pointer;
}

.toggle-bg {
  @apply absolute inset-0 rounded-full;
  @apply transition-all duration-300 ease-in-out;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  @apply shadow-inner;
}

.theme-toggle-btn.dark .toggle-bg {
  background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
}

.toggle-slider {
  @apply absolute top-0.5 left-0.5;
  @apply w-6 h-6 bg-white rounded-full;
  @apply shadow-lg transition-all duration-300 ease-in-out;
  @apply flex items-center justify-center;
  @apply transform translate-x-0;
}

.theme-toggle-btn.dark .toggle-slider {
  @apply translate-x-7 bg-slate-800;
}

.toggle-icon {
  @apply w-3.5 h-3.5 transition-all duration-300;
}

.sun-icon {
  @apply text-amber-500;
}

.moon-icon {
  @apply text-blue-400;
}

.theme-selector {
  @apply relative;
}

.theme-select {
  @apply bg-white/80 backdrop-blur-sm border border-white/60;
  @apply rounded-xl px-3 py-2 text-sm font-medium;
  @apply transition-all duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500;
  @apply dark:bg-slate-800/80 dark:border-slate-600/60 dark:text-gray-200;
  @apply dark:focus:ring-primary-400 dark:focus:border-primary-400;
  @apply cursor-pointer;
}

.theme-select:hover {
  @apply bg-white border-white/80;
  @apply dark:bg-slate-800 dark:border-slate-600/80;
}

/* Additional animations */
.theme-toggle-btn:hover .toggle-bg {
  @apply shadow-md;
  @apply scale-105;
}

.theme-toggle-btn:active .toggle-slider {
  @apply scale-95;
}

/* Smooth icon transitions */
.theme-toggle .toggle-icon {
  @apply opacity-100 scale-100;
  transition: opacity 200ms ease-in-out, transform 200ms ease-in-out;
}

.theme-toggle .sun-icon {
  animation: rotate-in 300ms ease-out;
}

.theme-toggle .moon-icon {
  animation: fade-in 300ms ease-out;
}

@keyframes rotate-in {
  from {
    opacity: 0;
    transform: rotate(-90deg) scale(0.8);
  }
  to {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
