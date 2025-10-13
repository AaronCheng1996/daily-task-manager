import { reactive, ref } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { TaskType } from '@/types'

export const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

type EmitFn = {
  (evt: 'close'): void
  (evt: 'created'): void
}

export function useCreateTaskModal(emit: EmitFn) {
  const taskStore = useTaskStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const form = reactive({
    title: '',
    description: '',
    task_type: TaskType.TODO,
    importance: 1,
    // TODO fields
    due_at: '',
    // HABIT fields
    habit_type: 'GOOD',
    threshold_count: 1,
    time_range_value: 7,
    time_range_type: 'DAYS',
    // DAILY_TASK fields
    started_at: '',
    is_recurring: true,
    recurrence_type: 'DAILY',
    recurrence_interval: 1,
    recurrence_days_of_week: [] as number[],
    recurrence_days_of_month: [] as number[],
    recurrence_weeks_of_month: [] as number[],
    // LONG_TERM fields
    show_progress: true,
    target_completion_at: ''
  })

  // Helper methods for handling selections
  const toggleDayOfWeek = (index: number) => {
    const indexInArray = form.recurrence_days_of_week.indexOf(index)
    if (indexInArray > -1) {
      form.recurrence_days_of_week.splice(indexInArray, 1)
    } else {
      form.recurrence_days_of_week.push(index)
    }
  }

  const toggleDayOfMonth = (day: number) => {
    const indexInArray = form.recurrence_days_of_month.indexOf(day)
    if (indexInArray > -1) {
      form.recurrence_days_of_month.splice(indexInArray, 1)
    } else {
      form.recurrence_days_of_month.push(day)
    }
  }

  const toggleWeekOfMonth = (week: number) => {
    const indexInArray = form.recurrence_weeks_of_month.indexOf(week)
    if (indexInArray > -1) {
      form.recurrence_weeks_of_month.splice(indexInArray, 1)
    } else {
      form.recurrence_weeks_of_month.push(week)
    }
  }

  const handleSubmit = async () => {
    loading.value = true
    error.value = null

    try {
      const taskData: any = {
        title: form.title,
        description: form.description || undefined,
        task_type: form.task_type,
        importance: form.importance
      }

      // Add type-specific fields
      if (form.task_type === TaskType.TODO && form.due_at) {
        taskData.due_at = new Date(form.due_at).toISOString()
      }

      if (form.task_type === TaskType.HABIT) {
        taskData.habit_type = form.habit_type
        taskData.threshold_count = form.threshold_count
        taskData.time_range_value = form.time_range_value
        taskData.time_range_type = form.time_range_type
      }

      if (form.task_type === TaskType.DAILY_TASK) {
        taskData.started_at = new Date(form.started_at).toISOString()
        taskData.is_recurring = form.is_recurring
        taskData.recurrence_type = form.recurrence_type
        taskData.recurrence_interval = form.recurrence_interval
        taskData.recurrence_days_of_week = form.recurrence_days_of_week
        taskData.recurrence_days_of_month = form.recurrence_days_of_month
        taskData.recurrence_weeks_of_month = form.recurrence_weeks_of_month
      }

      if (form.task_type === TaskType.LONG_TERM) {
        taskData.show_progress = form.show_progress
        if (form.target_completion_at) {
          taskData.target_completion_at = new Date(form.target_completion_at).toISOString()
        }
      }

      await taskStore.createTask(taskData)
      emit('created')
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create task'
    } finally {
      loading.value = false
    }
  }

  return {
    form,
    loading,
    error,
    weekdays,
    toggleDayOfWeek,
    toggleDayOfMonth,
    toggleWeekOfMonth,
    handleSubmit
  }
}