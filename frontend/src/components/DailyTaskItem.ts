import { ref, computed } from 'vue'
import { format, parseISO } from 'date-fns'
import type { DailyTask, DailyTaskStatistics } from '@/types'
import { taskApi } from '@/utils/api'
import { useI18n } from 'vue-i18n'

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

  const formatWeeklyOnDays = (days: number[]): string => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const { t } = useI18n()
    const formattedDays = days.map(day => dayNames[day]).join(', ')
    return t('tasks.daily.weeklyOnSpecificDays', { days: formattedDays })
  }

  const formatMonthlyOnDays = (days: number[]): string => {
    const { t } = useI18n()
    if (days.includes(-1)) {
      return t('tasks.daily.lastDayOfMonth')
    }
    return t('tasks.daily.specificWeekDaysOfMonth', { days: days.join(', ') })
  }

  const formatWeekOfMonth = (weeks: number[]): string => {
    const { t } = useI18n()
    const weekNames = ['Last week', '1st week', '2nd week', '3rd week', '4th week']
    const formattedWeeks = weeks.map(week => weekNames[week]).join(', ')
    return t('tasks.daily.monthlyOnSpecificDays', { weeks: formattedWeeks })
  }

  const getRecurrenceDescription = (): string => {
    const { recurrence_type, recurrence_interval, recurrence_days_of_week, recurrence_days_of_month, recurrence_weeks_of_month } = props.task
    const { t } = useI18n()
    
    switch (recurrence_type) {
      case 'DAILY':
        return t('tasks.daily.everyDay')
      case 'WEEKLY':
        return t('tasks.daily.everyWeek')
      case 'MONTHLY':
        return t('tasks.daily.everyMonth')
      case 'YEARLY':
        return t('tasks.daily.everyYear')
      case 'EVERY_X_DAYS':
        return t('tasks.daily.everyXDays', { interval: recurrence_interval })
      case 'EVERY_X_WEEKS':
        return t('tasks.daily.everyXWeeks', { interval: recurrence_interval })
      case 'EVERY_X_MONTHS':
        return t('tasks.daily.everyXMonths', { interval: recurrence_interval })
      case 'WEEKLY_ON_DAYS':
        return recurrence_days_of_week?.length 
          ? formatWeeklyOnDays(recurrence_days_of_week)
          : t('tasks.daily.specificWeekdays')
      case 'MONTHLY_ON_DAYS':
        return recurrence_days_of_month?.length
          ? formatMonthlyOnDays(recurrence_days_of_month)
          : t('tasks.daily.specificDaysOfMonth')
      case 'WEEK_OF_MONTH_ON_DAYS':
        if (recurrence_days_of_week?.length) {
          return formatWeeklyOnDays(recurrence_days_of_week)
        }
        return recurrence_weeks_of_month?.length
          ? formatWeekOfMonth(recurrence_weeks_of_month)
          : t('tasks.daily.specificDaysOfMonth')
      default:
        return t('tasks.daily.customSchedule')
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

