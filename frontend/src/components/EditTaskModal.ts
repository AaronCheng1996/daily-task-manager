import { reactive, ref, onMounted } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { TaskType } from '@/types'
import type { Task, HabitTask, DailyTask, LongTermTask, TodoTask } from '@/types'

export const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

type EmitFn = {
  (evt: 'close'): void
  (evt: 'updated'): void
}

interface UseEditTaskModalProps {
  task: Task
}

export function useEditTaskModal(props: UseEditTaskModalProps, emit: EmitFn) {
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

  const populateForm = () => {
    // Populate basic fields
    form.title = props.task.title
    form.description = props.task.description || ''
    form.task_type = props.task.task_type
    form.importance = props.task.importance || 1

    // Populate type-specific fields
    if (props.task.task_type === TaskType.TODO) {
      const todoTask = props.task as TodoTask
      if (todoTask.due_at) {
        const date = new Date(todoTask.due_at)
        // Format for datetime-local input
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        form.due_at = `${year}-${month}-${day}T${hours}:${minutes}`
      }
    } else if (props.task.task_type === TaskType.HABIT) {
      const habitTask = props.task as HabitTask
      form.habit_type = habitTask.habit_type || 'GOOD'
      form.threshold_count = habitTask.threshold_count || 1
      form.time_range_value = habitTask.time_range_value || 7
      form.time_range_type = habitTask.time_range_type || 'DAYS'
    } else if (props.task.task_type === TaskType.DAILY_TASK) {
      const dailyTask = props.task as DailyTask
      if (dailyTask.started_at) {
        const date = new Date(dailyTask.started_at)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        form.started_at = `${year}-${month}-${day}`
      }
      form.is_recurring = dailyTask.is_recurring ?? true
      form.recurrence_type = dailyTask.recurrence_type || 'DAILY'
      form.recurrence_interval = dailyTask.recurrence_interval || 1
      form.recurrence_days_of_week = dailyTask.recurrence_days_of_week || []
      form.recurrence_days_of_month = dailyTask.recurrence_days_of_month || []
      form.recurrence_weeks_of_month = dailyTask.recurrence_weeks_of_month || []
    } else if (props.task.task_type === TaskType.LONG_TERM) {
      const longTermTask = props.task as LongTermTask
      form.show_progress = longTermTask.show_progress ?? true
      if (longTermTask.target_completion_at) {
        try {
          const date = new Date(longTermTask.target_completion_at)
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            form.target_completion_at = `${year}-${month}-${day}`
          }
        } catch (e) {
          console.warn('Invalid target_completion_at:', longTermTask.target_completion_at, e)
          form.target_completion_at = ''
        }
      } else {
        form.target_completion_at = ''
      }
    }
  }

  const handleSubmit = async () => {
    loading.value = true
    error.value = null

    try {
      const taskData: any = {
        title: form.title,
        description: form.description || undefined,
        importance: form.importance
      }

      // Add type-specific fields
      if (form.task_type === TaskType.TODO) {
        if (form.due_at) {
          taskData.due_at = new Date(form.due_at).toISOString()
        } else {
          taskData.due_at = undefined
        }
      }

      if (form.task_type === TaskType.HABIT) {
        taskData.habit_type = form.habit_type
        taskData.threshold_count = form.threshold_count
        taskData.time_range_value = form.time_range_value
        taskData.time_range_type = form.time_range_type
      }

      if (form.task_type === TaskType.DAILY_TASK) {
        if (form.started_at) {
          taskData.started_at = new Date(form.started_at).toISOString()
        }
        taskData.is_recurring = form.is_recurring
        taskData.recurrence_type = form.recurrence_type
        taskData.recurrence_interval = form.recurrence_interval
        taskData.recurrence_days_of_week = form.recurrence_days_of_week
        taskData.recurrence_days_of_month = form.recurrence_days_of_month
        taskData.recurrence_weeks_of_month = form.recurrence_weeks_of_month
      }

      if (form.task_type === TaskType.LONG_TERM) {
        taskData.show_progress = form.show_progress
        if (form.target_completion_at && form.target_completion_at.trim()) {
          try {
            taskData.target_completion_at = new Date(form.target_completion_at).toISOString()
          } catch (e) {
            console.error('Invalid date format:', form.target_completion_at, e)
            taskData.target_completion_at = undefined
          }
        } else {
          taskData.target_completion_at = undefined
        }
      }

      await taskStore.updateTask(props.task.id, taskData)
      emit('updated')
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update task'
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    populateForm()
  })

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

