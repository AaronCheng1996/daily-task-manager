import { ref, computed, onMounted, watch } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { usePreferencesStore, type TaskStatusFilter, type DefaultTaskType } from '@/stores/preferencesStore'
import { TaskType } from '@/types'
import type { Task } from '@/types'
import { taskApi } from '@/utils/api'
import { useI18n } from 'vue-i18n'

export function useTasksView() {
  const taskStore = useTaskStore()
  const preferencesStore = usePreferencesStore()
  const { t } = useI18n()
  const showCreateTask = ref(false)
  const showEditTask = ref(false)
  const editingTask = ref<Task | null>(null)
  const activeFilter = ref<DefaultTaskType>(preferencesStore.getDefaultTaskType())
  const searchKeyword = ref('')
  const taskStatusFilter = ref<TaskStatusFilter>(preferencesStore.getDefaultTaskFilter())

  const filters = computed(() => {
    const getFilteredCount = (taskType: TaskType | null) => {
      let tasks = taskType ? taskStore.tasksByType(taskType) : taskStore.tasks
      
      if (taskStatusFilter.value === 'complete') {
        return tasks.filter(task => task.is_completed).length
      } else if (taskStatusFilter.value === 'incomplete') {
        return tasks.filter(task => !task.is_completed).length
      }
      
      return tasks.length
    }

    return [
      {
        key: 'todo',
        label: t('tasks.todo'),
        count: getFilteredCount(TaskType.TODO)
      },
      {
        key: 'habit',
        label: t('tasks.habits'),
        count: getFilteredCount(TaskType.HABIT)
      },
      {
        key: 'daily',
        label: t('tasks.dailyTasks'),
        count: getFilteredCount(TaskType.DAILY_TASK)
      },
      {
        key: 'longterm',
        label: t('tasks.longterms'),
        count: getFilteredCount(TaskType.LONG_TERM)
      }
    ]
  })

  const filteredTasks = computed(() => {
    let tasks: Task[] = []
    
    switch (activeFilter.value) {
      case 'todo':
        tasks = taskStore.tasksByType(TaskType.TODO)
        break
      case 'habit':
        tasks = taskStore.tasksByType(TaskType.HABIT)
        break
      case 'daily':
        tasks = taskStore.tasksByType(TaskType.DAILY_TASK)
        break
      case 'longterm':
        tasks = taskStore.tasksByType(TaskType.LONG_TERM)
        break
      default:
        tasks = taskStore.sortedTasks
        break
    }

    if (activeFilter.value !== 'habit' && taskStatusFilter.value !== 'all') {
      const isCompleted = taskStatusFilter.value === 'complete'
      tasks = tasks.filter(task => task.is_completed === isCompleted)
    }

    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.trim().toLowerCase()
      tasks = tasks.filter(task => 
        task.title.toLowerCase().includes(keyword) ||
        task.description?.toLowerCase().includes(keyword)
      )
    }

    return tasks
  })

  const localTasks = ref<Task[]>([...filteredTasks.value])

  watch(filteredTasks, (newValue) => {
    localTasks.value = [...newValue]
  })

  const handleToggleTask = async (taskId: string) => {
    try {
      await taskStore.toggleTaskCompletion(taskId)
    } catch (error) {
      console.error('Toggle task failed:', error)
    }
  }

  const handleEditTask = (task: any) => {
    editingTask.value = task
    showEditTask.value = true
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm(t('common.areYouSureYouWantToDeleteThisTask'))) {
      try {
        await taskStore.deleteTask(taskId)
      } catch (error) {
        console.error('Delete task failed:', error)
      }
    }
  }

  const handleTaskCreated = () => {
    showCreateTask.value = false
  }

  const handleTaskUpdated = () => {
    showEditTask.value = false
    editingTask.value = null
    taskStore.fetchTasks()
  }

  const saveTasksOrder = async (event: any) => {
    const { oldIndex, newIndex } = event

    if (oldIndex === newIndex) return

    const tasks = localTasks.value
    const movedTask = tasks[newIndex]

    const prevTask = tasks[newIndex + 1] || null
    const nextTask = tasks[newIndex - 1] || null

    await taskApi.reorderTasks(movedTask.id, prevTask?.order_index ?? null, nextTask?.order_index ?? null)
    taskStore.fetchTasks()
  }

  const sendTaskToTop = async (task: Task) => {
    const tasks = localTasks.value
    
    if (tasks[0]?.id === task.id) {
      return
    }
    
    const topTask = tasks[0]
    
    await taskApi.reorderTasks(task.id, topTask?.order_index ?? null, null)
    taskStore.fetchTasks()
  }

  // Watch for task status filter changes and save to preferences
  watch(taskStatusFilter, (newValue) => {
    preferencesStore.updatePreference('defaultTaskFilter', newValue)
  })

  // Watch for active filter changes and save to preferences
  watch(activeFilter, (newValue) => {
    preferencesStore.updatePreference('defaultTaskType', newValue)
  })

  onMounted(() => {
    preferencesStore.initializePreferences()
    taskStore.fetchTasks()
  })

  return {
    taskStore,
    showCreateTask,
    showEditTask,
    editingTask,
    activeFilter,
    searchKeyword,
    taskStatusFilter,
    filters,
    filteredTasks,
    localTasks,
    handleToggleTask,
    handleEditTask,
    handleDeleteTask,
    handleTaskCreated,
    handleTaskUpdated,
    saveTasksOrder,
    sendTaskToTop
  }
}

