import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type TaskStatusFilter = 'all' | 'complete' | 'incomplete'
export type Language = 'en' | 'zhTW' | 'auto'
export type DefaultTaskType = 'todo' | 'habit' | 'daily' | 'longterm' | 'all'

export interface UserPreferences {
  // Task preferences
  defaultTaskFilter: TaskStatusFilter
  defaultTaskType: DefaultTaskType
  
  // Display preferences
  language: Language
  compactMode: boolean
  showTaskCounts: boolean
  
  // Behavior preferences
  autoFocus: boolean
  confirmDelete: boolean
  enableNotifications: boolean
}

const defaultPreferences: UserPreferences = {
  defaultTaskFilter: 'incomplete',
  defaultTaskType: 'todo',
  language: 'auto',
  compactMode: false,
  showTaskCounts: true,
  autoFocus: true,
  confirmDelete: true,
  enableNotifications: true
}

export const usePreferencesStore = defineStore('preferences', () => {
  const preferences = ref<UserPreferences>({ ...defaultPreferences })
  const loading = ref(false)

  // Load preferences from localStorage
  const loadPreferences = () => {
    try {
      const stored = localStorage.getItem('userPreferences')
      if (stored) {
        const parsedPreferences = JSON.parse(stored)
        // Merge with defaults to ensure all properties exist
        preferences.value = { ...defaultPreferences, ...parsedPreferences }
      }
    } catch (error) {
      console.error('Failed to load preferences from localStorage:', error)
      preferences.value = { ...defaultPreferences }
    }
  }

  // Save preferences to localStorage
  const savePreferences = () => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences.value))
    } catch (error) {
      console.error('Failed to save preferences to localStorage:', error)
    }
  }

  // Update specific preference
  const updatePreference = <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    preferences.value[key] = value
    savePreferences()
  }

  // Bulk update preferences
  const updatePreferences = (updates: Partial<UserPreferences>) => {
    preferences.value = { ...preferences.value, ...updates }
    savePreferences()
  }

  // Reset to defaults
  const resetPreferences = () => {
    preferences.value = { ...defaultPreferences }
    savePreferences()
  }

  // Getters for commonly used preferences
  const getDefaultTaskFilter = () => preferences.value.defaultTaskFilter
  const getDefaultTaskType = () => preferences.value.defaultTaskType
  const getLanguage = () => preferences.value.language
  const getCompactMode = () => preferences.value.compactMode
  const getAutoFocus = () => preferences.value.autoFocus
  const getConfirmDelete = () => preferences.value.confirmDelete

  // Initialize preferences
  const initializePreferences = () => {
    loadPreferences()
    
    // Watch for changes and auto-save
    watch(preferences, savePreferences, { deep: true })
  }

  // Future: Sync preferences with backend
  const syncWithBackend = async () => {
    loading.value = true
    try {
      // Backend sync will be implemented when user preferences API is ready
      // const response = await userApi.updatePreferences(preferences.value)
      // preferences.value = response.preferences
      console.log('Backend sync not implemented yet')
    } catch (error) {
      console.error('Failed to sync preferences with backend:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    preferences,
    loading,
    
    // Actions
    loadPreferences,
    savePreferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
    initializePreferences,
    syncWithBackend,
    
    // Getters
    getDefaultTaskFilter,
    getDefaultTaskType,
    getLanguage,
    getCompactMode,
    getAutoFocus,
    getConfirmDelete
  }
})
