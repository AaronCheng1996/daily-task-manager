<template>
  <div class="max-w-2xl mx-auto">
    <div class="card">
      <form @submit.prevent="handleUpdateProfile" class="space-y-6">
        <h2 class="text-xl font-semibold mb-6">{{ $t('profile.title') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label for="language" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('profile.language') }}
            </label>
            <select id="language" v-model="form.language" class="form-input">
              <option value="en">🇺🇸 English</option>
              <option value="zhTW">🇹🇼 繁體中文</option>
            </select>
          </div>

          <div>
            <label for="timezone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('profile.timezone') }}
            </label>
            <select id="timezone" v-model="form.timezone" class="form-input">
              <option value="UTC">{{ $t('profile.utc') }}</option>
              <option value="America/New_York">{{ $t('profile.easternTime') }}</option>
              <option value="America/Los_Angeles">{{ $t('profile.pacificTime') }}</option>
              <option value="Europe/London">{{ $t('profile.london') }}</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Taipei">{{ $t('profile.taipei') }}</option>
            </select>
          </div>
        </div>

        <h2 class="text-xl font-semibold mb-6 mt-8">{{ $t('profile.preferences') }}</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="theme" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('profile.theme') }}
            </label>
            <select id="theme" v-model="form.theme" class="form-input">
              <option value="auto">🌓 {{ $t('profile.auto') }} ({{ $t('profile.system') }})</option>
              <option value="light">☀️ {{ $t('profile.light') }}</option>
              <option value="dark">🌙 {{ $t('profile.dark') }}</option>
            </select>
          </div>

          <div>
            <label for="defaultTaskFilter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('profile.defaultTaskFilter') }}
            </label>
            <select id="defaultTaskFilter" v-model="form.defaultTaskFilter" class="form-input">
              <option value="incomplete">{{ $t('profile.incompleteOnly') }}</option>
              <option value="complete">{{ $t('profile.completeOnly') }}</option>
              <option value="all">{{ $t('profile.allTasks') }}</option>
            </select>
          </div>
          
          <div>
            <label for="defaultTaskType" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('profile.defaultTaskType') }}
            </label>
            <select id="defaultTaskType" v-model="form.defaultTaskType" class="form-input">
              <option value="todo">{{ $t('profile.todo') }}</option>
              <option value="habit">{{ $t('profile.habits') }}</option>
              <option value="daily">{{ $t('profile.dailyTasks') }}</option>
              <option value="longterm">{{ $t('profile.longterm') }}</option>
            </select>
          </div>
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div v-if="userStore.error" class="text-danger-600 text-sm">
              {{ userStore.error }}
            </div>
            <div v-if="successMessage" class="text-success-600 text-sm">
              {{ successMessage }}
            </div>
          </div>
          
          <div class="flex space-x-3 ml-4">
            <button
              type="button"
              @click="resetForm"
              class="btn btn-secondary"
            >
              {{ $t('common.reset') }}
            </button>
            <button
              type="submit"
              :disabled="userStore.loading"
              class="btn btn-primary"
            >
              {{ userStore.loading ? $t('common.loading') : $t('common.update') }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Password Reset Section -->
    <div class="card mt-8">
      <h2 class="text-xl font-semibold mb-6">{{ $t('profile.changePassword') }}</h2>
      
      <form @submit.prevent="handlePasswordReset" class="space-y-6">
        <div>
          <label for="current-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
          <label for="new-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
          <label for="confirm-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div v-if="passwordError" class="text-danger-600 text-sm">
              {{ passwordError }}
            </div>
            <div v-if="passwordSuccessMessage" class="text-success-600 text-sm">
              {{ passwordSuccessMessage }}
            </div>
          </div>

          <div class="flex space-x-3 ml-4">
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
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProfileView } from './ProfileView'

const {
  userStore,
  form,
  passwordForm,
  successMessage,
  passwordError,
  passwordSuccessMessage,
  passwordLoading,
  isPasswordFormValid,
  resetForm,
  resetPasswordForm,
  handleUpdateProfile,
  handlePasswordReset
} = useProfileView()
</script>
