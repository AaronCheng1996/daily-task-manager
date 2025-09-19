<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">{{ $t('profile.title') }}</h1>
    
    <div class="card">
      <form @submit.prevent="handleUpdateProfile" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ $t('auth.username') }}
            </label>
            <input
              v-model="form.username"
              type="text"
              class="form-input"
              :placeholder="$t('auth.username')"
              maxlength="50"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ $t('auth.email') }}
            </label>
            <input
              v-model="form.email"
              type="email"
              class="form-input"
              :placeholder="$t('auth.email')"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ $t('profile.language') }}
            </label>
            <select v-model="form.preferred_language" class="form-input">
              <option value="en">English</option>
              <option value="zhTW">Traditional Chinese</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ $t('profile.timezone') }}
            </label>
            <select v-model="form.timezone" class="form-input">
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Taipei">Taipei</option>
            </select>
          </div>
        </div>

        <div v-if="userStore.error" class="text-danger-600 text-sm">
          {{ userStore.error }}
        </div>

        <div v-if="successMessage" class="text-success-600 text-sm">
          {{ successMessage }}
        </div>

        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="resetForm"
            class="btn btn-secondary"
          >
            Reset
          </button>
          <button
            type="submit"
            :disabled="userStore.loading"
            class="btn btn-primary"
          >
            {{ userStore.loading ? $t('common.loading') : $t('profile.updateProfile') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const successMessage = ref('')

const form = reactive({
  username: '',
  email: '',
  preferred_language: 'en',
  timezone: 'UTC'
})

const resetForm = () => {
  if (userStore.user) {
    form.username = userStore.user.username
    form.email = userStore.user.email
    form.preferred_language = userStore.user.preferred_language
    form.timezone = userStore.user.timezone
  }
}

const handleUpdateProfile = async () => {
  successMessage.value = ''
  
  try {
    await userStore.updateProfile(form)
    successMessage.value = 'Profile updated successfully!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    // Error is handled by the store
  }
}

onMounted(() => {
  resetForm()
})
</script>
