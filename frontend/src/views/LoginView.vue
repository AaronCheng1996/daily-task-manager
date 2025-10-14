<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="max-w-md w-full card">
      <h2 class="text-2xl font-bold text-center mb-6">{{ $t('auth.login') }}</h2>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label for="usernameOrEmail" class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
            {{ $t('auth.username') }} / {{ $t('auth.email') }}
          </label>
          <input
            id="usernameOrEmail"
            v-model="form.usernameOrEmail"
            type="text"
            class="form-input"
            :placeholder="$t('auth.username') + ' or ' + $t('auth.email')"
            required
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
            {{ $t('auth.password') }}
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            :placeholder="$t('auth.password')"
            required
          />
        </div>

        <div v-if="userStore.error" class="text-danger-600 text-sm">
          {{ userStore.error }}
        </div>

        <button
          type="submit"
          :disabled="userStore.loading"
          class="w-full btn btn-primary"
        >
          {{ userStore.loading ? $t('common.loading') : $t('auth.login') }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <RouterLink to="/register" class="text-primary-600 hover:text-primary-700">
          {{ $t('auth.noAccount') }} {{ $t('auth.register') }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLoginView } from './LoginView'

const {
  userStore,
  form,
  handleLogin
} = useLoginView()
</script>
