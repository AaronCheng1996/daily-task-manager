<template>
  <div class="animate-fade-in">
    <!-- Hero Section -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl md:text-4xl font-bold mb-3">
        <span class="text-gray-800">Welcome back, </span>
        <span class="gradient-text">{{ userStore.user?.username }}!</span>
      </h1>
      <p class="text-lg text-gray-600 mb-6">{{ $t('navigation.dashboard') }}</p>
      
      <!-- Quick Action Buttons -->
      <div class="flex flex-wrap justify-center gap-3 mb-6">
        <button
          @click="showCreateTask = true"
          class="btn-primary inline-flex items-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {{ $t('tasks.createTask') }}
        </button>
        <RouterLink to="/tasks" class="btn-secondary inline-flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          {{ $t('tasks.title') }}
        </RouterLink>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <!-- Total Tasks Card -->
      <div class="stat-card-primary animate-slide-up">
        <div class="flex flex-col items-center space-y-3">
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div class="text-center">
            <p class="text-2xl md:text-3xl font-bold text-white mb-1">{{ taskStore.tasks.length }}</p>
            <p class="text-white/80 text-sm font-medium">Total Tasks</p>
          </div>
        </div>
      </div>
      
      <!-- Completed Tasks Card -->
      <div class="stat-card-success animate-slide-up" style="animation-delay: 0.1s;">
        <div class="flex flex-col items-center space-y-3">
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="text-center">
            <p class="text-2xl md:text-3xl font-bold text-white mb-1">{{ taskStore.completedTasks.length }}</p>
            <p class="text-white/80 text-sm font-medium">Completed</p>
          </div>
        </div>
      </div>
      
      <!-- Remaining Tasks Card -->
      <div class="stat-card-warning animate-slide-up" style="animation-delay: 0.2s;">
        <div class="flex flex-col items-center space-y-3">
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="text-center">
            <p class="text-2xl md:text-3xl font-bold text-white mb-1">{{ taskStore.incompleteTasks.length }}</p>
            <p class="text-white/80 text-sm font-medium">Remaining</p>
          </div>
        </div>
      </div>
      
      <!-- Overdue Tasks Card -->
      <div class="stat-card-danger animate-slide-up" style="animation-delay: 0.3s;">
        <div class="flex flex-col items-center space-y-3">
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="text-center">
            <p class="text-2xl md:text-3xl font-bold text-white mb-1">{{ overdueTasks }}</p>
            <p class="text-white/80 text-sm font-medium">Overdue</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Tasks -->
    <div class="card-gradient animate-slide-up" style="animation-delay: 0.4s;">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-800 flex items-center">
          <svg class="w-7 h-7 mr-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Tasks
        </h2>
        <RouterLink to="/tasks" class="text-primary-600 hover:text-primary-700 font-medium flex items-center">
          View All
          <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </RouterLink>
      </div>
      
      <div v-if="taskStore.tasks.length === 0" class="text-center py-12">
        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
        <p class="text-gray-500 mb-6">{{ $t('tasks.noTasks') }}</p>
        <button
          @click="showCreateTask = true"
          class="btn-primary inline-flex items-center"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create your first task
        </button>
      </div>
      
      <div v-else class="space-y-4">
        <div
          v-for="(task, index) in recentTasks"
          :key="task.id"
          class="animate-slide-up"
          :style="`animation-delay: ${0.1 * (index + 1)}s;`"
        >
          <TaskItem
            :task="task"
            @toggle="handleToggleTask"
            @delete="handleDeleteTask"
          />
        </div>
        
        <div v-if="taskStore.tasks.length > 5" class="pt-4 border-t border-gray-200">
          <RouterLink
            to="/tasks"
            class="w-full btn-secondary text-center block"
          >
            View {{ taskStore.tasks.length - 5 }} more tasks
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Create Task Modal -->
    <CreateTaskModal
      v-if="showCreateTask"
      @close="showCreateTask = false"
      @created="handleTaskCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useTaskStore } from '@/stores/taskStore'
import { TaskType } from '@/types'
import TaskItem from '@/components/TaskItem.vue'
import CreateTaskModal from '@/components/CreateTaskModal.vue'

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
  taskStore.fetchTasks()
}

onMounted(() => {
  taskStore.fetchTasks()
})
</script>
