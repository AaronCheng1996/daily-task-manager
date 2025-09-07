<template>
  <div class="animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-3 md:space-y-0">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold mb-1">
          <span class="gradient-text">{{ $t('tasks.title') }}</span>
        </h1>
        <p class="text-gray-600 text-sm">Manage and organize all your tasks in one place</p>
      </div>
      <button
        @click="showCreateTask = true"
        class="btn-primary inline-flex items-center"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        {{ $t('tasks.createTask') }}
      </button>
    </div>

    <!-- Filter Tabs -->
    <div class="mb-8">
      <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-white/60 shadow-soft">
        <nav class="flex flex-wrap gap-2">
          <button
            v-for="filter in filters"
            :key="filter.key"
            @click="activeFilter = filter.key"
            class="flex items-center px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 transform hover:scale-105"
            :class="activeFilter === filter.key
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-medium'
              : 'text-gray-600 hover:text-gray-800 hover:bg-white/80'"
          >
            {{ filter.label }}
            <span
              v-if="filter.count > 0"
              class="ml-2 px-2 py-1 rounded-full text-xs font-bold"
              :class="activeFilter === filter.key
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-700'"
            >
              {{ filter.count }}
            </span>
          </button>
        </nav>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="taskStore.loading" class="card-gradient text-center py-16">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
        <svg class="w-8 h-8 text-primary-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      <p class="text-lg text-gray-600">{{ $t('common.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="taskStore.error" class="card-gradient text-center py-16">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
      <p class="text-red-600 mb-6">{{ taskStore.error }}</p>
      <button @click="taskStore.fetchTasks()" class="btn-primary">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Try Again
      </button>
    </div>

    <!-- Tasks List -->
    <div v-else-if="filteredTasks.length > 0" class="space-y-4">
      <template v-for="(task, index) in filteredTasks" :key="task.id">
        <div 
          class="animate-slide-up"
          :style="`animation-delay: ${Math.min(index * 0.1, 1)}s;`"
        >
          <!-- 習慣任務使用專門的組件 -->
          <HabitTaskItem
            v-if="task.task_type === TaskType.HABIT"
            :habit="task as HabitTask"
            @edit="handleEditTask"
            @delete="handleDeleteTask"
            @updated="handleTaskUpdated"
          />
          <!-- 每日任務使用專門的組件 -->
          <DailyTaskItem
            v-else-if="task.task_type === TaskType.DAILY_TASK"
            :task="task as DailyTask"
            @edit="handleEditTask"
            @delete="handleDeleteTask"
            @updated="handleTaskUpdated"
          />
          <!-- 長期任務使用專門的組件 -->
          <LongTermTaskItem
            v-else-if="task.task_type === TaskType.LONG_TERM"
            :task="task as LongTermTask"
            @edit="handleEditTask"
            @delete="handleDeleteTask"
            @updated="handleTaskUpdated"
          />
          <!-- TODO 任務使用通用組件 -->
          <TaskItem
            v-else
            :task="task"
            @toggle="handleToggleTask"
            @edit="handleEditTask"
            @delete="handleDeleteTask"
          />
        </div>
      </template>
    </div>

    <!-- Empty State -->
    <div v-else class="card-gradient text-center py-16">
      <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
        <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 class="text-2xl font-bold text-gray-900 mb-3">No tasks found</h3>
      <p class="text-gray-500 mb-8 max-w-md mx-auto">
        {{ activeFilter === 'all' ? "You haven't created any tasks yet. Get started by creating your first task!" : `No ${filters.find(f => f.key === activeFilter)?.label.toLowerCase()} tasks found. Try a different filter or create a new task.` }}
      </p>
      <button
        @click="showCreateTask = true"
        class="btn-primary inline-flex items-center"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        {{ $t('tasks.createTask') }}
      </button>
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
import { useTaskStore } from '@/stores/taskStore'
import { TaskType } from '@/types'
import type { Task, HabitTask, DailyTask, LongTermTask } from '@/types'
import TaskItem from '@/components/TaskItem.vue'
import HabitTaskItem from '@/components/HabitTaskItem.vue'
import DailyTaskItem from '@/components/DailyTaskItem.vue'
import LongTermTaskItem from '@/components/LongTermTaskItem.vue'
import CreateTaskModal from '@/components/CreateTaskModal.vue'

const taskStore = useTaskStore()
const showCreateTask = ref(false)
const activeFilter = ref('all')

const filters = computed(() => [
  {
    key: 'all',
    label: 'All Tasks',
    count: taskStore.tasks.length
  },
  {
    key: 'todo',
    label: 'Todo',
    count: taskStore.tasksByType(TaskType.TODO).length
  },
  {
    key: 'habit',
    label: 'Habits',
    count: taskStore.tasksByType(TaskType.HABIT).length
  },
  {
    key: 'daily',
    label: 'Daily Tasks',
    count: taskStore.tasksByType(TaskType.DAILY_TASK).length
  },
  {
    key: 'longterm',
    label: 'Long-term',
    count: taskStore.tasksByType(TaskType.LONG_TERM).length
  },
  {
    key: 'completed',
    label: 'Completed',
    count: taskStore.completedTasks.length
  },
  {
    key: 'incomplete',
    label: 'Incomplete',
    count: taskStore.incompleteTasks.length
  }
])

const filteredTasks = computed(() => {
  switch (activeFilter.value) {
    case 'todo':
      return taskStore.tasksByType(TaskType.TODO)
    case 'habit':
      return taskStore.tasksByType(TaskType.HABIT)
    case 'daily':
      return taskStore.tasksByType(TaskType.DAILY_TASK)
    case 'longterm':
      return taskStore.tasksByType(TaskType.LONG_TERM)
    case 'completed':
      return taskStore.completedTasks
    case 'incomplete':
      return taskStore.incompleteTasks
    default:
      return taskStore.tasks
  }
})

const handleToggleTask = async (taskId: string) => {
  try {
    await taskStore.toggleTaskCompletion(taskId)
  } catch (error) {
    console.error('Toggle task failed:', error)
  }
}

const handleEditTask = (task: any) => {
  // TODO: Implement edit functionality
  console.log('Edit task:', task)
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
  // Tasks are automatically updated via the store
}

const handleTaskUpdated = () => {
  // 重新獲取任務列表以更新數據
  taskStore.fetchTasks()
}

onMounted(() => {
  taskStore.fetchTasks()
})
</script>
