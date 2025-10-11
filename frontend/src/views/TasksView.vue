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

    <!-- Search and Filter Section -->
    <div class="mb-8 space-y-4">
      <!-- Search Bar -->
      <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/60 shadow-soft dark:bg-slate-800/80 dark:border-slate-700/60">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="Search tasks by title or description..."
            class="w-full pl-10 pr-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          />
          <button
            v-if="searchKeyword"
            @click="searchKeyword = ''"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-2 border border-white/60 dark:border-slate-700/60 shadow-soft">
        <nav class="flex flex-wrap justify-between items-center gap-2">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="filter in filters"
              :key="filter.key"
              @click="activeFilter = filter.key as DefaultTaskType"
              class="flex items-center px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 transform hover:scale-105"
              :class="activeFilter === filter.key
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-medium'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/80 dark:hover:bg-slate-700/80'"
            >
              {{ filter.label }}
              <span
                v-if="filter.count > 0"
                class="ml-2 px-2 py-1 rounded-full text-xs font-bold"
                :class="activeFilter === filter.key
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'"
              >
                {{ filter.count }}
              </span>
            </button>
          </div>
          <TaskStatusDropdown
            v-if="activeFilter != 'habit'"
            v-model="taskStatusFilter"
          />
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
      <p class="text-lg text-gray-600 dark:text-gray-400">{{ $t('common.loading') }}</p>
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
    <div v-else-if="localTasks.length > 0">
      <draggable
        v-model="localTasks"
        item-key="id"
        @end="saveTasksOrder"
        class="space-y-4"
        handle=".task-handle"
      >
        <template #item="{ element, index }">
          <div
            :id="element.id"
            :data-order-index="element.order_index"
            class="animate-slide-up flex items-center gap-3"
            :style="`animation-delay: ${Math.min(index * 0.1, 1)}s;`"
          >
            <div class="flex flex-col items-center gap-1 flex-shrink-0">
              <button
                @click="sendTaskToTop(element)"
                :title="'Send to top'"
                class="text-gray-400 hover:text-primary-600 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
              <div class="task-handle cursor-move flex items-center">⠿</div>
            </div>
            <div class="flex-1">
              <HabitTaskItem
                v-if="element.task_type === TaskType.HABIT"
                :habit="element as HabitTask"
                @edit="handleEditTask"
                @delete="handleDeleteTask"
                @updated="handleTaskUpdated"
              />
              <DailyTaskItem
                v-else-if="element.task_type === TaskType.DAILY_TASK"
                :task="element as DailyTask"
                @edit="handleEditTask"
                @delete="handleDeleteTask"
                @updated="handleTaskUpdated"
              />
              <LongTermTaskItem
                v-else-if="element.task_type === TaskType.LONG_TERM"
                :task="element as LongTermTask"
                @edit="handleEditTask"
                @delete="handleDeleteTask"
                @updated="handleTaskUpdated"
              />
              <TaskItem
                v-else
                :task="element"
                @toggle="handleToggleTask"
                @edit="handleEditTask"
                @delete="handleDeleteTask"
              />
            </div>
          </div>
        </template>
      </draggable>
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
        <span v-if="searchKeyword.trim()">
          No tasks match your search "{{ searchKeyword }}". Try adjusting your search terms or create a new task.
        </span>
        <span v-else-if="activeFilter === 'all'">
          You haven't created any tasks yet. Get started by creating your first task!
        </span>
        <span v-else>
          No {{ filters.find(f => f.key === activeFilter)?.label.toLowerCase() }} tasks found. Try a different filter or create a new task.
        </span>
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

    <!-- Edit Task Modal -->
    <EditTaskModal
      v-if="showEditTask && editingTask"
      :task="editingTask"
      @close="showEditTask = false; editingTask = null"
      @updated="handleTaskUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import draggable from "vuedraggable";
import { ref, computed, onMounted, watch } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { usePreferencesStore, type TaskStatusFilter, type DefaultTaskType } from '@/stores/preferencesStore'
import { TaskType } from '@/types'
import type { Task, HabitTask, DailyTask, LongTermTask } from '@/types'
import TaskItem from '@/components/TaskItem.vue'
import HabitTaskItem from '@/components/HabitTaskItem.vue'
import DailyTaskItem from '@/components/DailyTaskItem.vue'
import LongTermTaskItem from '@/components/LongTermTaskItem.vue'
import CreateTaskModal from '@/components/CreateTaskModal.vue'
import EditTaskModal from '@/components/EditTaskModal.vue'
import TaskStatusDropdown from '@/components/TaskStatusDropdown.vue'
import { taskApi } from '@/utils/api'

const taskStore = useTaskStore()
const preferencesStore = usePreferencesStore()
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
      label: 'Todo',
      count: getFilteredCount(TaskType.TODO)
    },
    {
      key: 'habit',
      label: 'Habits',
      count: getFilteredCount(TaskType.HABIT)
    },
    {
      key: 'daily',
      label: 'Daily Tasks',
      count: getFilteredCount(TaskType.DAILY_TASK)
    },
    {
      key: 'longterm',
      label: 'Long-term',
      count: getFilteredCount(TaskType.LONG_TERM)
    },
    {
      key: 'all',
      label: 'All Tasks',
      count: getFilteredCount(null)
    },
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
      (task.description && task.description.toLowerCase().includes(keyword))
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

const handleTaskUpdated = () => {
  showEditTask.value = false
  editingTask.value = null
  taskStore.fetchTasks()
}

// Removed unused function - handleTaskRefresh

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
</script>
