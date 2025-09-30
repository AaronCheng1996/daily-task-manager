<template>
  <nav class="nav-glass sticky top-0 z-50">
    <div class="container mx-auto px-6">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-8">
          <RouterLink to="/" class="text-xl font-bold gradient-text flex items-center space-x-2">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-purple-600 flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <span>Daily Tasks</span>
          </RouterLink>
          
          <div class="hidden md:flex space-x-1">
            <!-- <RouterLink
              to="/"
              class="nav-link"
              active-class="nav-link-active"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m0 0V11a1 1 0 011-1h2a1 1 0 011 1v10m0 0h3a1 1 0 001-1V10M5 10L12 3l7 7" />
              </svg>
              {{ $t('navigation.home') }}
            </RouterLink> -->
            <RouterLink
              to="/tasks"
              class="nav-link"
              active-class="nav-link-active"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {{ $t('navigation.tasks') }}
            </RouterLink>
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <RouterLink
            to="/profile"
            class="nav-link"
            active-class="nav-link-active"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="text-gray-700 font-medium hidden sm:block dark:text-gray-200">{{ userStore.user?.username }}</span>
          </RouterLink>
          
          <button
            @click="handleLogout"
            class="nav-link text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span class="hidden md:inline">{{ $t('auth.logout') }}</span>
          </button>
        </div>
      </div>
    </div>
    
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const userStore = useUserStore()

const handleLogout = async () => {
  await userStore.logout()
  router.push('/login')
}
</script>
