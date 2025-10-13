<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="max-w-md w-full card">
      <h2 class="text-2xl font-bold text-center mb-6">{{ $t('auth.register') }}</h2>
      
      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('auth.username') }}
          </label>
          <input
            v-model="form.username"
            type="text"
            class="form-input"
            :placeholder="$t('auth.username')"
            required
            minlength="3"
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
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('auth.password') }}
          </label>
          <input
            v-model="form.password"
            type="password"
            class="form-input"
            :placeholder="$t('auth.password')"
            required
            minlength="6"
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
          {{ userStore.loading ? $t('common.loading') : $t('auth.register') }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <RouterLink to="/login" class="text-primary-600 hover:text-primary-700">
          {{ $t('auth.alreadyHaveAccount') }} {{ $t('auth.login') }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRegisterView } from './RegisterView'

const {
  userStore,
  form,
  handleRegister
} = useRegisterView()
</script>
