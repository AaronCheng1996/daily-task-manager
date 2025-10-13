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

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Total Tasks Card -->
      <div class="stat-card-primary animate-slide-up">
        <div class="flex items-center justify-between p-6">
          <div>
            <p class="text-white/80 text-sm font-medium mb-2">Total Tasks</p>
            <p class="text-3xl font-bold text-white">{{ taskStore.tasks.length }}</p>
          </div>
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        <div class="px-6 pb-6">
          <div class="w-full bg-white/20 rounded-full h-2">
            <div 
              class="bg-white rounded-full h-2 transition-all duration-300"
              :style="`width: ${taskStore.tasks.length ? 100 : 0}%`"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- Completed Tasks Card -->
      <div class="stat-card-success animate-slide-up" style="animation-delay: 0.1s;">
        <div class="flex items-center justify-between p-6">
          <div>
            <p class="text-white/80 text-sm font-medium mb-2">Completed</p>
            <p class="text-3xl font-bold text-white">{{ taskStore.completedTasks.length }}</p>
            <p class="text-white/60 text-xs">{{ completionRate }}% completion rate</p>
          </div>
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div class="px-6 pb-6">
          <div class="w-full bg-white/20 rounded-full h-2">
            <div 
              class="bg-white rounded-full h-2 transition-all duration-300"
              :style="`width: ${completionRate}%`"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- Remaining Tasks Card -->
      <div class="stat-card-warning animate-slide-up" style="animation-delay: 0.2s;">
        <div class="flex items-center justify-between p-6">
          <div>
            <p class="text-white/80 text-sm font-medium mb-2">In Progress</p>
            <p class="text-3xl font-bold text-white">{{ taskStore.incompleteTasks.length }}</p>
            <p class="text-white/60 text-xs">{{ taskStore.incompleteTasks.length }} remaining</p>
          </div>
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div class="px-6 pb-6">
          <div class="w-full bg-white/20 rounded-full h-2">
            <div 
              class="bg-white rounded-full h-2 transition-all duration-300"
              :style="`width: ${progressRate}%`"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- Task Types Distribution -->
      <div class="stat-card-info animate-slide-up" style="animation-delay: 0.3s;">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <p class="text-white/80 text-sm font-medium">Task Types</p>
            <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-white/70">Todo</span>
              <span class="text-white font-medium">{{ tasksByType.todo }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-white/70">Habits</span>
              <span class="text-white font-medium">{{ tasksByType.habit }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-white/70">Daily</span>
              <span class="text-white font-medium">{{ tasksByType.daily }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-white/70">Long-term</span>
              <span class="text-white font-medium">{{ tasksByType.longterm }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Quick Actions & Progress Overview -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Progress Overview -->
      <div class="lg:col-span-2 card-gradient animate-slide-up" style="animation-delay: 0.4s;">
        <div class="p-6">
          <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <svg class="w-6 h-6 mr-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Today's Progress
          </h3>
          
          <!-- Overall Progress Bar -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">Overall Completion</span>
              <span class="text-sm font-bold text-primary-600">{{ completionRate }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div 
                class="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500 ease-out"
                :style="`width: ${completionRate}%`"
              ></div>
            </div>
          </div>

          <!-- Task Type Progress -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <p class="text-sm font-medium text-gray-600">Todos</p>
              <p class="text-lg font-bold text-gray-800">{{ tasksByType.todo }}</p>
            </div>
            <div class="text-center">
              <div class="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p class="text-sm font-medium text-gray-600">Habits</p>
              <p class="text-lg font-bold text-gray-800">{{ tasksByType.habit }}</p>
            </div>
            <div class="text-center">
              <div class="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p class="text-sm font-medium text-gray-600">Daily</p>
              <p class="text-lg font-bold text-gray-800">{{ tasksByType.daily }}</p>
            </div>
            <div class="text-center">
              <div class="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-2">
                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p class="text-sm font-medium text-gray-600">Long-term</p>
              <p class="text-lg font-bold text-gray-800">{{ tasksByType.longterm }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card-gradient animate-slide-up" style="animation-delay: 0.5s;">
        <div class="p-6">
          <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <svg class="w-6 h-6 mr-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h3>
          <div class="space-y-3">
            <button
              @click="showCreateTask = true"
              class="w-full flex items-center p-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Task
            </button>
            <RouterLink 
              to="/tasks" 
              class="w-full flex items-center p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              View All Tasks
            </RouterLink>
          </div>

          <!-- Today's Summary -->
          <div class="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 class="font-medium text-gray-800 mb-3">Today's Summary</h4>
            <div class="space-y-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Completed today</span>
                <span class="font-medium text-green-600">{{ taskStore.completedTasks.length }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Remaining</span>
                <span class="font-medium text-orange-600">{{ taskStore.incompleteTasks.length }}</span>
              </div>
              <div v-if="overdueTasks > 0" class="flex items-center justify-between">
                <span class="text-gray-600">Overdue</span>
                <span class="font-medium text-red-600">{{ overdueTasks }}</span>
              </div>
            </div>
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
import { useHomeView } from './HomeView'
import TaskItem from '@/components/TaskItem.vue'
import CreateTaskModal from '@/components/CreateTaskModal.vue'

const {
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
} = useHomeView()
</script>
