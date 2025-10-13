import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useTaskStore } from '@/stores/taskStore'
import { TaskType } from '@/types'

export function useHomeView() {
  const userStore = useUserStore()
  const taskStore = useTaskStore()
  const showCreateTask = ref(false)

  const recentTasks = computed(() => {
    return taskStore.tasks.slice(0, 5)
  })

  const overdueTasks = computed(() => {
    return taskStore.tasks.filter(task => 
      task.task_type === TaskType.TODO && 
      (task as any).is_overdue
    ).length
  })

  const completionRate = computed(() => {
    if (taskStore.tasks.length === 0) return 0
    return Math.round((taskStore.completedTasks.length / taskStore.tasks.length) * 100)
  })

  const progressRate = computed(() => {
    if (taskStore.tasks.length === 0) return 0
    return Math.round((taskStore.incompleteTasks.length / taskStore.tasks.length) * 100)
  })

  const tasksByType = computed(() => ({
    todo: taskStore.tasksByType(TaskType.TODO).length,
    habit: taskStore.tasksByType(TaskType.HABIT).length,
    daily: taskStore.tasksByType(TaskType.DAILY_TASK).length,
    longterm: taskStore.tasksByType(TaskType.LONG_TERM).length
  }))

  const handleToggleTask = async (taskId: string) => {
    try {
      await taskStore.toggleTaskCompletion(taskId)
    } catch (error) {
      console.error('Toggle task failed:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
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

  onMounted(() => {
    taskStore.fetchTasks()
  })

  return {
    userStore,
    taskStore,
    showCreateTask,
    recentTasks,
    overdueTasks,
    completionRate,
    progressRate,
    tasksByType,
    handleToggleTask,
    handleDeleteTask,
    handleTaskCreated
  }
}

