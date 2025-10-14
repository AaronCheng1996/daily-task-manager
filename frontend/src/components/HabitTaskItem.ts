import { ref, computed } from 'vue'
import { format, parseISO } from 'date-fns'
import type { HabitTask, HabitStatistics } from '@/types'
import { taskApi } from '@/utils/api'
import { useI18n } from 'vue-i18n'

type EmitFn = {
  (evt: 'edit', habit: HabitTask): void
  (evt: 'delete', id: string): void
  (evt: 'updated'): void
}

interface UseHabitTaskItemProps {
  habit: HabitTask
}

export function useHabitTaskItem(props: UseHabitTaskItemProps, emit: EmitFn) {
  const { t } = useI18n()
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
        alert(t('tasks.habit.habitCompletionCannotBeUndone'))
      } else {
        alert(t('tasks.habit.habitCompletionFailed'))
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
      return props.habit.stat.isSuccessful ? t('tasks.habit.targetAchieved') : t('tasks.habit.keepGoing')
    } else {
      return props.habit.stat.isSuccessful ? t('tasks.habit.underControl') : t('tasks.habit.needImprovement')
    }
  }

  const formatDaysSinceCompletion = (days: number): string => {
    if (days < 0) return t('tasks.habit.never')
    if (days === 0) return t('tasks.habit.today')
    if (days === 1) return t('tasks.habit.oneDayAgo')
    return `${days} ${t('tasks.habit.daysAgo')}`
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

