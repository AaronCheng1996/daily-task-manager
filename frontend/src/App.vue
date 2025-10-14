<template>
  <div id="app" class="min-h-screen relative overflow-hidden">
    <!-- Background with animated gradient -->
    <div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"></div>
    <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-cyan-50/50 dark:via-slate-700/10 dark:to-blue-900/20"></div>
    
    <!-- Animated background shapes -->
    <div class="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/8 to-purple-600/8 dark:from-blue-500/15 dark:to-purple-500/15 rounded-full blur-2xl animate-pulse-soft"></div>
    <div class="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr from-emerald-400/8 to-blue-500/8 dark:from-emerald-500/12 dark:to-blue-400/12 rounded-full blur-2xl animate-pulse-soft" style="animation-delay: 1s;"></div>
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-pink-400/4 to-yellow-400/4 dark:from-pink-500/8 dark:to-yellow-500/8 rounded-full blur-2xl animate-pulse-soft" style="animation-delay: 2s;"></div>
    
    <!-- Content -->
    <div class="relative z-10">
      <NavBar v-if="userStore.isAuthenticated" />
      
      <main class="container mx-auto px-4 py-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import NavBar from '@/components/NavBar.vue'
import { useUserStore } from '@/stores/userStore'
import { useThemeStore } from '@/stores/themeStore'
import { usePreferencesStore } from '@/stores/preferencesStore'

const { locale } = useI18n()
const userStore = useUserStore()
const themeStore = useThemeStore()
const preferencesStore = usePreferencesStore()

onMounted(() => {
  userStore.restoreSession()
  themeStore.initializeTheme()
  preferencesStore.initializePreferences()
  
  // Apply saved language on mount
  if (userStore.user?.preference_setting?.language) {
    locale.value = userStore.user.preference_setting.language
  }
})

// Watch for language changes in user preferences
watch(
  () => userStore.user?.preference_setting?.language,
  (newLanguage) => {
    if (newLanguage) {
      locale.value = newLanguage
    }
  }
)
</script>
