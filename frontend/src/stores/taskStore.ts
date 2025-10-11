import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, TaskType } from '@/types'
import { taskApi } from '@/utils/api'

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const sortedTasks = computed(() => {
    return tasks.value.sort((a, b) => b.order_index - a.order_index)
  })

  const tasksByType = computed(() => {
    return (type: TaskType) => sortedTasks.value.filter(task => task.task_type === type)
  })

  const completedTasks = computed(() => {
    return sortedTasks.value.filter(task => task.is_completed)
  })

  const incompleteTasks = computed(() => {
    return sortedTasks.value.filter(task => !task.is_completed)
  })

  const fetchTasks = async (force = false) => {
    if (loading.value && !force) {
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      const response = await taskApi.getTasks()
      tasks.value = response.tasks || []
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch tasks'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createTask = async (taskData: any) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await taskApi.createTask(taskData)
      tasks.value.push(response.task! as Task)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create task'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    error.value = null
    
    try {
      const response = await taskApi.updateTask(taskId, updates)
      const index = tasks.value.findIndex(task => task.id === taskId)
      if (index !== -1) {
        tasks.value[index] = response.task! as Task
      }
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update task'
      throw err
    }
  }

  const deleteTask = async (taskId: string) => {
    loading.value = true
    error.value = null
    
    try {
      await taskApi.deleteTask(taskId)
      tasks.value = tasks.value.filter(task => task.id !== taskId)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete task'
      throw err
    } finally {
      loading.value = false
    }
  }

  const toggleTaskCompletion = async (taskId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await taskApi.toggleTaskCompletion(taskId)
      const index = tasks.value.findIndex(task => task.id === taskId)
      if (index !== -1) {
        tasks.value[index] = response.task! as Task
      }
      return response
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to toggle task completion'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    tasks,
    loading,
    error,
    sortedTasks,
    tasksByType,
    completedTasks,
    incompleteTasks,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion
  }
})
