import { ref, computed } from 'vue'
import { format, parseISO } from 'date-fns'
import type { DailyTask, DailyTaskStatistics } from '@/types'
import { taskApi } from '@/utils/api'

type EmitFn = {
  (evt: 'edit', task: DailyTask): void
  (evt: 'delete', id: string): void
  (evt: 'updated'): void
}

interface UseDailyTaskItemProps {
  task: DailyTask
}

export function useDailyTaskItem(props: UseDailyTaskItemProps, emit: EmitFn) {
  const loading = ref(false)
  const showStatistics = ref(false)

  const streakClass = computed(() => {
    if (!props.task.stat) return 'text-gray-600'
    
    const streak = props.task.stat.currentStreak
    if (streak >= 7) return 'text-green-600'
    if (streak >= 3) return 'text-blue-600'
    return 'text-gray-600'
  })

  const handleToggleCompletion = async () => {
    loading.value = true
    
    try {
      await taskApi.toggleTaskCompletion(props.task.id)
      await loadStatistics()
      emit('updated')
    } catch (error: any) {
      console.error('Daily task toggle failed:', error)
      
      if (error.response?.data?.error) {
        alert(error.response.data.error)
      } else {
        alert('切換完成狀態失敗，請稍後再試')
      }
    } finally {
      loading.value = false
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await taskApi.getTaskStatistics(props.task.id)
      props.task.stat = response.stats as DailyTaskStatistics
    } catch (error) {
      console.error('Failed to load daily task statistics:', error)
    }
  }

  const getRecurrenceDescription = (): string => {
    const { recurrence_type, recurrence_interval, recurrence_days_of_week, recurrence_days_of_month, recurrence_weeks_of_month } = props.task
    
    switch (recurrence_type) {
      case 'DAILY':
        return 'Every day'
      case 'WEEKLY':
        return 'Every week'
      case 'MONTHLY':
        return 'Every month'
      case 'YEARLY':
        return 'Every year'
      case 'EVERY_X_DAYS':
        return `Every ${recurrence_interval} day(s)`
      case 'EVERY_X_WEEKS':
        return `Every ${recurrence_interval} week(s)`
      case 'EVERY_X_MONTHS':
        return `Every ${recurrence_interval} month(s)`
      case 'WEEKLY_ON_DAYS':
        if (recurrence_days_of_week && recurrence_days_of_week.length > 0) {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          const days = recurrence_days_of_week.map(day => dayNames[day]).join(', ')
          return `Weekly on ${days}`
        }
        return 'Specific weekdays'
      case 'MONTHLY_ON_DAYS':
        if (recurrence_days_of_month && recurrence_days_of_month.length > 0) {
          if (recurrence_days_of_month.includes(-1)) {
            return 'End of month'
          }
          const days = recurrence_days_of_month.join(', ')
          return `${days}th of month`
        }
        return 'Specific days of month'
      case 'WEEK_OF_MONTH_ON_DAYS':
        if (recurrence_days_of_week && recurrence_days_of_week.length > 0) {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          const days = recurrence_days_of_week.map(day => dayNames[day]).join(', ')
          return `Weekly on ${days}`
        }
        if (recurrence_weeks_of_month && recurrence_weeks_of_month.length > 0) {
          const weekNames = ['Last week', '1st week', '2nd week', '3rd week', '4th week']
          const weeks = recurrence_weeks_of_month.map(week => weekNames[week]).join(', ')
          return `Monthly on ${weeks}`
        }
        return 'Specific days of month'
      default:
        return 'Custom schedule'
    }
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
    streakClass,
    handleToggleCompletion,
    getRecurrenceDescription,
    formatDate
  }
}

