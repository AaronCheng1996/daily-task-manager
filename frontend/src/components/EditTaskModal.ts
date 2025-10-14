import { reactive, ref, onMounted } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { TaskType } from '@/types'
import type { Task, HabitTask, DailyTask, LongTermTask } from '@/types'

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

  const formatDateTimeLocal = (dateStr: string): string => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const formatDateLocal = (dateStr: string): string => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const populateTodoFields = () => {
    if ('due_at' in props.task && props.task.due_at) {
      form.due_at = formatDateTimeLocal(props.task.due_at)
    }
  }

  const populateHabitFields = () => {
    const habitTask = props.task as HabitTask
    form.habit_type = habitTask.habit_type || 'GOOD'
    form.threshold_count = habitTask.threshold_count || 1
    form.time_range_value = habitTask.time_range_value || 7
    form.time_range_type = habitTask.time_range_type || 'DAYS'
  }

  const populateDailyTaskFields = () => {
    const dailyTask = props.task as DailyTask
    if (dailyTask.started_at) {
      form.started_at = formatDateLocal(dailyTask.started_at)
    }
    form.is_recurring = dailyTask.is_recurring ?? true
    form.recurrence_type = dailyTask.recurrence_type || 'DAILY'
    form.recurrence_interval = dailyTask.recurrence_interval || 1
    form.recurrence_days_of_week = dailyTask.recurrence_days_of_week || []
    form.recurrence_days_of_month = dailyTask.recurrence_days_of_month || []
    form.recurrence_weeks_of_month = dailyTask.recurrence_weeks_of_month || []
  }

  const populateLongTermFields = () => {
    const longTermTask = props.task as LongTermTask
    form.show_progress = longTermTask.show_progress ?? true
    if (longTermTask.target_completion_at) {
      try {
        const date = new Date(longTermTask.target_completion_at)
        if (!isNaN(date.getTime())) {
          form.target_completion_at = formatDateLocal(longTermTask.target_completion_at)
        }
      } catch (e) {
        console.warn('Invalid target_completion_at:', longTermTask.target_completion_at, e)
        form.target_completion_at = ''
      }
    } else {
      form.target_completion_at = ''
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
      populateTodoFields()
    } else if (props.task.task_type === TaskType.HABIT) {
      populateHabitFields()
    } else if (props.task.task_type === TaskType.DAILY_TASK) {
      populateDailyTaskFields()
    } else if (props.task.task_type === TaskType.LONG_TERM) {
      populateLongTermFields()
    }
  }

  const addTodoFieldsToTaskData = (taskData: any) => {
    taskData.due_at = form.due_at ? new Date(form.due_at).toISOString() : undefined
  }

  const addHabitFieldsToTaskData = (taskData: any) => {
    taskData.habit_type = form.habit_type
    taskData.threshold_count = form.threshold_count
    taskData.time_range_value = form.time_range_value
    taskData.time_range_type = form.time_range_type
  }

  const addDailyTaskFieldsToTaskData = (taskData: any) => {
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

  const addLongTermFieldsToTaskData = (taskData: any) => {
    taskData.show_progress = form.show_progress
    if (form.target_completion_at?.trim()) {
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
        addTodoFieldsToTaskData(taskData)
      } else if (form.task_type === TaskType.HABIT) {
        addHabitFieldsToTaskData(taskData)
      } else if (form.task_type === TaskType.DAILY_TASK) {
        addDailyTaskFieldsToTaskData(taskData)
      } else if (form.task_type === TaskType.LONG_TERM) {
        addLongTermFieldsToTaskData(taskData)
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

