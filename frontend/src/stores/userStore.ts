import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginCredentials, RegisterData, ResetPasswordData } from '@/types'
import { authApi } from '@/utils/api'
import { usePreferencesStore } from './preferencesStore'
import { useThemeStore } from './themeStore'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value && !!token.value)

  const setUser = (userData: User, authToken: string) => {
    user.value = userData
    token.value = authToken
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', authToken)
    
    // Sync user preferences with stores
    const preferencesStore = usePreferencesStore()
    const themeStore = useThemeStore()
    
    if (userData.preference_setting) {
      // Sync theme
      if (userData.preference_setting.theme) {
        themeStore.setTheme(userData.preference_setting.theme)
      }
      
      // Sync task preferences
      preferencesStore.syncFromUserPreferences(userData.preference_setting)
    }
  }

  const clearUser = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  const restoreSession = () => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')
    
    if (storedUser && storedToken) {
      try {
        user.value = JSON.parse(storedUser)
        token.value = storedToken
      } catch (e) {
        console.error('Failed to restore session:', e)
        clearUser()
      }
    }
  }

  const login = async (credentials: LoginCredentials) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await authApi.login(credentials)
      setUser(response.user!, response.token!)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const register = async (data: RegisterData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await authApi.register(data)
      setUser(response.user!, response.token!)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Registration failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    clearUser()
  }

  const updateProfile = async (updates: Partial<User>) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await authApi.updateProfile(updates)
      user.value = response.user!
      localStorage.setItem('user', JSON.stringify(response.user))
      
      // Sync user preferences with stores
      const preferencesStore = usePreferencesStore()
      const themeStore = useThemeStore()
      
      if (response.user?.preference_setting) {
        // Sync theme
        if (response.user.preference_setting.theme) {
          themeStore.setTheme(response.user.preference_setting.theme)
        }
        
        // Sync task preferences
        preferencesStore.syncFromUserPreferences(response.user.preference_setting)
      }
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Profile update failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const resetPassword = async (data: ResetPasswordData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await authApi.resetPassword(data)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Password reset failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    setUser,
    clearUser,
    restoreSession,
    login,
    register,
    logout,
    updateProfile,
    resetPassword
  }
})
