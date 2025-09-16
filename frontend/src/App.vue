<template>
  <div id="app" class="min-h-screen relative overflow-hidden">
    <!-- Background with animated gradient -->
    <div class="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
    <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-cyan-50/50"></div>
    
    <!-- Animated background shapes -->
    <div class="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/8 to-purple-600/8 rounded-full blur-2xl animate-pulse-soft"></div>
    <div class="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr from-emerald-400/8 to-blue-500/8 rounded-full blur-2xl animate-pulse-soft" style="animation-delay: 1s;"></div>
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-pink-400/4 to-yellow-400/4 rounded-full blur-2xl animate-pulse-soft" style="animation-delay: 2s;"></div>
    
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
import { onMounted } from 'vue'
import NavBar from '@/components/NavBar.vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

onMounted(() => {
  userStore.restoreSession()
})
</script>
