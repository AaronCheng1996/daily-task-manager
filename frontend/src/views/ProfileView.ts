import { reactive, ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useThemeStore } from '@/stores/themeStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { useI18n } from 'vue-i18n'

export function useProfileView() {
  const userStore = useUserStore()
  const themeStore = useThemeStore()
  const preferencesStore = usePreferencesStore()
  const { t } = useI18n()
  const successMessage = ref('')
  const passwordError = ref('')
  const passwordSuccessMessage = ref('')
  const passwordLoading = ref(false)

  const form = reactive({
    username: '',
    email: '',
    language: 'en',
    timezone: 'UTC',
    theme: 'auto' as 'light' | 'dark' | 'auto',
    defaultTaskFilter: 'incomplete' as 'incomplete' | 'complete' | 'all',
    defaultTaskType: 'todo' as 'todo' | 'habit' | 'daily' | 'longterm' | 'all'
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
      const prefs = userStore.user.preference_setting || {}
      form.username = userStore.user.username
      form.email = userStore.user.email
      form.language = prefs.language || 'en'
      form.timezone = prefs.timezone || 'UTC'
      form.theme = prefs.theme || themeStore.theme || 'auto'
      form.defaultTaskFilter = prefs.defaultTaskFilter || preferencesStore.preferences.defaultTaskFilter || 'incomplete'
      form.defaultTaskType = prefs.defaultTaskType || preferencesStore.preferences.defaultTaskType || 'todo'
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
      await userStore.updateProfile({
        username: form.username,
        email: form.email,
        preference_setting: {
          language: form.language,
          timezone: form.timezone,
          theme: form.theme,
          defaultTaskFilter: form.defaultTaskFilter,
          defaultTaskType: form.defaultTaskType
        }
      })
      
      // userStore.updateProfile now handles syncing with themeStore and preferencesStore
      
      successMessage.value = t('common.updatedSuccessfully')
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } catch (error) {
      console.error('Update error:', error)
      // Error is handled by the store
    }
  }

  const handlePasswordReset = async () => {
    passwordError.value = ''
    passwordSuccessMessage.value = ''
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      passwordError.value = t('common.newPasswordsDoNotMatch')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      passwordError.value = t('common.newPasswordMustBeAtLeast6CharactersLong')
      return
    }

    passwordLoading.value = true
    
    try {
      await userStore.resetPassword({
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      passwordSuccessMessage.value = t('common.passwordChangedSuccessfully')
      resetPasswordForm()
      setTimeout(() => {
        passwordSuccessMessage.value = ''
      }, 3000)
    } catch (error: any) {
        passwordError.value = error.response?.data?.error || t('common.failedToChangePassword')
    } finally {
      passwordLoading.value = false
    }
  }

  onMounted(() => {
    resetForm()
    preferencesStore.initializePreferences()
  })

  return {
    userStore,
    themeStore,
    preferencesStore,
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
  }
}

