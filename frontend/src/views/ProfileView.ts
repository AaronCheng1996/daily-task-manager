import { reactive, ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useThemeStore } from '@/stores/themeStore'
import { usePreferencesStore } from '@/stores/preferencesStore'

export function useProfileView() {
  const userStore = useUserStore()
  const themeStore = useThemeStore()
  const preferencesStore = usePreferencesStore()
  
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
      successMessage.value = 'Updated successfully!'
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

