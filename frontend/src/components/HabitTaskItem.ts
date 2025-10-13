import { ref, computed } from 'vue'
import { format, parseISO } from 'date-fns'
import type { HabitTask, HabitStatistics } from '@/types'
import { taskApi } from '@/utils/api'

type EmitFn = {
  (evt: 'edit', habit: HabitTask): void
  (evt: 'delete', id: string): void
  (evt: 'updated'): void
}

interface UseHabitTaskItemProps {
  habit: HabitTask
}

export function useHabitTaskItem(props: UseHabitTaskItemProps, emit: EmitFn) {
  const loading = ref(false)
  const showStatistics = ref(false)

  const habitButtonClass = computed(() => {
    const baseClass = "border-2 hover:scale-105 active:scale-95"
    
    if (props.habit.habit_type === 'BAD') {
      return `${baseClass} border-orange-500 bg-orange-500 text-white hover:bg-orange-600`
    } else {
      return `${baseClass} border-green-500 bg-green-500 text-white hover:bg-green-600`
    }
  })

  const successClass = computed(() => {
    if (!props.habit.stat) return 'text-gray-600'
    return props.habit.stat.isSuccessful ? 'text-green-600' : 'text-gray-600'
  })

  const handleHabitCompletion = async () => {
    loading.value = true
    
    try {
      await taskApi.toggleTaskCompletion(props.habit.id)
      await loadStatistics()
      emit('updated')
    } catch (error: any) {
      console.error('Habit completion failed:', error)
      
      if (error.response?.data?.error === 'Habit completion cannot be undone') {
        alert('習慣完成記錄無法撤銷')
      } else {
        alert('記錄完成失敗，請稍後再試')
      }
    } finally {
      loading.value = false
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await taskApi.getTaskStatistics(props.habit.id)
      props.habit.stat = response.stats as HabitStatistics
    } catch (error) {
      console.error('Failed to load habit statistics:', error)
    }
  }

  const getSuccessMessage = (): string => {
    if (!props.habit.stat) return ''
    
    if (props.habit.habit_type === 'GOOD') {
      return props.habit.stat.isSuccessful ? 'Target achieved!' : 'Keep going!'
    } else {
      return props.habit.stat.isSuccessful ? 'Under control!' : 'Need improvement'
    }
  }

  const formatDaysSinceCompletion = (days: number): string => {
    if (days < 0) return 'Never'
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    return `${days} days ago`
  }

  const formatDate = (dateStr: string): string => {
    try {
      return format(parseISO(dateStr), 'MMM dd')
    } catch {
      return dateStr
    }
  }

  return {
    loading,
    showStatistics,
    habitButtonClass,
    successClass,
    handleHabitCompletion,
    getSuccessMessage,
    formatDaysSinceCompletion,
    formatDate
  }
}

