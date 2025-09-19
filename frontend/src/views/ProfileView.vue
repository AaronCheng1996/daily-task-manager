<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">{{ $t('profile.title') }}</h1>
    
    <div class="card">
      <form @submit.prevent="handleUpdateProfile" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
              {{ $t('auth.username') }}
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              class="form-input"
              :placeholder="$t('auth.username')"
              maxlength="50"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              {{ $t('auth.email') }}
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-input"
              :placeholder="$t('auth.email')"
            />
          </div>

          <div>
            <label for="language" class="block text-sm font-medium text-gray-700 mb-1">
              {{ $t('profile.language') }}
            </label>
            <select id="language" v-model="form.preferred_language" class="form-input">
              <option value="en">English</option>
              <option value="zhTW">Traditional Chinese</option>
            </select>
          </div>

          <div>
            <label for="timezone" class="block text-sm font-medium text-gray-700 mb-1">
              {{ $t('profile.timezone') }}
            </label>
            <select id="timezone" v-model="form.timezone" class="form-input">
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

    <!-- Password Reset Section -->
    <div class="card mt-8">
      <h2 class="text-xl font-semibold mb-6">{{ $t('profile.changePassword') }}</h2>
      
      <form @submit.prevent="handlePasswordReset" class="space-y-6">
        <div>
          <label for="current-password" class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('profile.currentPassword') }}
          </label>
          <input
            id="current-password"
            v-model="passwordForm.currentPassword"
            type="password"
            class="form-input"
            :placeholder="$t('profile.currentPassword')"
            required
          />
        </div>

        <div>
          <label for="new-password" class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('profile.newPassword') }}
          </label>
          <input
            id="new-password"
            v-model="passwordForm.newPassword"
            type="password"
            class="form-input"
            :placeholder="$t('profile.newPassword')"
            minlength="6"
            required
          />
        </div>

        <div>
          <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('profile.confirmNewPassword') }}
          </label>
          <input
            id="confirm-password"
            v-model="passwordForm.confirmPassword"
            type="password"
            class="form-input"
            :placeholder="$t('profile.confirmNewPassword')"
            minlength="6"
            required
          />
        </div>

        <div v-if="passwordError" class="text-danger-600 text-sm">
          {{ passwordError }}
        </div>

        <div v-if="passwordSuccessMessage" class="text-success-600 text-sm">
          {{ passwordSuccessMessage }}
        </div>

        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="resetPasswordForm"
            class="btn btn-secondary"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            type="submit"
            :disabled="passwordLoading || !isPasswordFormValid"
            class="btn btn-primary"
          >
            {{ passwordLoading ? $t('common.loading') : $t('profile.changePassword') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const successMessage = ref('')
const passwordError = ref('')
const passwordSuccessMessage = ref('')
const passwordLoading = ref(false)

const form = reactive({
  username: '',
  email: '',
  preferred_language: 'en',
  timezone: 'UTC'
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const isPasswordFormValid = computed(() => {
  return passwordForm.currentPassword.length >= 6 &&
         passwordForm.newPassword.length >= 6 &&
         passwordForm.newPassword === passwordForm.confirmPassword
})

const resetForm = () => {
  if (userStore.user) {
    form.username = userStore.user.username
    form.email = userStore.user.email
    form.preferred_language = userStore.user.preferred_language
    form.timezone = userStore.user.timezone
  }
}

const resetPasswordForm = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordError.value = ''
  passwordSuccessMessage.value = ''
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
    console.error('Profile update error:', error)
    // Error is handled by the store
  }
}

const handlePasswordReset = async () => {
  passwordError.value = ''
  passwordSuccessMessage.value = ''
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = 'New passwords do not match'
    return
  }

  if (passwordForm.newPassword.length < 6) {
    passwordError.value = 'New password must be at least 6 characters long'
    return
  }

  passwordLoading.value = true
  
  try {
    await userStore.resetPassword({
      oldPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    passwordSuccessMessage.value = 'Password changed successfully!'
    resetPasswordForm()
    setTimeout(() => {
      passwordSuccessMessage.value = ''
    }, 3000)
  } catch (error: any) {
    passwordError.value = error.response?.data?.error || 'Failed to change password'
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  resetForm()
})
</script>
