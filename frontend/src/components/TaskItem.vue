<template>
  <div 
    class="task-card group"
    :class="{ 'task-card-completed': task.is_completed }"
  >
    <div class="flex items-start space-x-4">
      <!-- Completion Toggle -->
      <button
        @click="$emit('toggle', task.id)"
        class="flex-shrink-0 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-200 transform hover:scale-110"
        :class="task.is_completed 
          ? 'bg-gradient-to-r from-success-500 to-emerald-500 border-success-500 text-white shadow-soft' 
          : 'border-gray-300 hover:border-success-500 bg-white hover:bg-success-50'"
      >
        <svg v-if="task.is_completed" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
      
      <!-- Task Content -->
      <div class="flex-1 min-w-0">
        <!-- Task Title -->
        <h3 
          class="font-semibold text-gray-900 mb-1 text-lg leading-tight"
          :class="{ 'line-through text-gray-500': task.is_completed }"
        >
          {{ task.title }}
        </h3>
        
        <!-- Task Description -->
        <p 
          v-if="task.description" 
          class="text-gray-600 mb-3 line-clamp-2"
          :class="{ 'text-gray-400': task.is_completed }"
        >
          {{ task.description }}
        </p>
        
        <!-- Task Meta Information -->
        <div class="flex items-center flex-wrap gap-3">
          <!-- Task Type Badge -->
          <span 
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
            :class="taskTypeBadgeClass"
          >
            <svg class="w-3 h-3 mr-1" :class="taskTypeIconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="taskTypeIcon" />
            </svg>
            {{ $t(`tasks.taskTypes.${task.task_type}`) }}
          </span>
          
          <!-- Priority Badge -->
          <span 
            v-if="task.importance > 1" 
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
            :class="priorityBadgeClass"
          >
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M12 2L8.5 8.5H2l5.27 3.83L5.54 18 12 14.17 18.46 18l-1.73-5.67L22 8.5h-6.5z" clip-rule="evenodd" />
            </svg>
            Priority {{ task.importance }}
          </span>
          
          <!-- Due Date Badge -->
          <span 
            v-if="showDueDate" 
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
            :class="dueDateBadgeClass"
          >
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ dueDateText }}
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          @click="$emit('edit', task)"
          class="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
          title="Edit task"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.828-2.828z" />
          </svg>
        </button>
        <button
          @click="$emit('delete', task.id)"
          class="p-2 text-gray-400 hover:text-danger-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          title="Delete task"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import type { Task, TodoTask } from '@/types'
import { TaskType } from '@/types'

interface Props {
  task: Task
}

const props = defineProps<Props>()

defineEmits<{
  toggle: [id: string]
  edit: [task: Task]  
  delete: [id: string]
}>()

const showDueDate = computed(() => {
  return props.task.task_type === TaskType.TODO && (props.task as TodoTask).due_at
})

const dueDateText = computed(() => {
  if (!showDueDate.value) return ''
  
  const todoTask = props.task as TodoTask
  const dueDate = new Date(todoTask.due_at!)
  const now = new Date()
  
  now.setHours(0, 0, 0, 0)
  const dueDateNormalized = new Date(dueDate)
  dueDateNormalized.setHours(0, 0, 0, 0)
  
  const diffTime = dueDateNormalized.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays)
    return overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`
  } else if (diffDays === 0) {
    return 'Due today'
  } else if (diffDays === 1) {
    return 'Due tomorrow'
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`
  } else {
    return `Due ${format(dueDate, 'MMM d')}`
  }
})

const taskTypeBadgeClass = computed(() => {
  const baseClasses = 'text-white'
  switch (props.task.task_type) {
    case TaskType.TODO:
      return `${baseClasses} bg-gradient-to-r from-blue-500 to-blue-600`
    case TaskType.HABIT:
      return `${baseClasses} bg-gradient-to-r from-purple-500 to-purple-600`
    case TaskType.DAILY_TASK:
      return `${baseClasses} bg-gradient-to-r from-green-500 to-green-600`
    case TaskType.LONG_TERM:
      return `${baseClasses} bg-gradient-to-r from-orange-500 to-orange-600`
    default:
      return `${baseClasses} bg-gradient-to-r from-gray-500 to-gray-600`
  }
})

const taskTypeIconClass = computed(() => {
  return 'text-white'
})

const taskTypeIcon = computed(() => {
  switch (props.task.task_type) {
    case TaskType.TODO:
      return 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
    case TaskType.HABIT:
      return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
    case TaskType.DAILY_TASK:
      return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    case TaskType.LONG_TERM:
      return 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    default:
      return 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2'
  }
})

const priorityBadgeClass = computed(() => {
  switch (props.task.importance) {
    case 5:
      return 'bg-gradient-to-r from-red-500 to-red-600 text-white'
    case 4:
      return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
    case 3:
      return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
    case 2:
      return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
    default:
      return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
  }
})

const dueDateBadgeClass = computed(() => {
  if (!showDueDate.value) return ''
  
  const todoTask = props.task as TodoTask
  const dueDate = new Date(todoTask.due_at!)
  const now = new Date()
  
  now.setHours(0, 0, 0, 0)
  const dueDateNormalized = new Date(dueDate)
  dueDateNormalized.setHours(0, 0, 0, 0)
  
  const diffTime = dueDateNormalized.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0 && !props.task.is_completed) {
    return 'bg-gradient-to-r from-red-500 to-red-600 text-white'
  } else if (diffDays === 0) {
    return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
  } else if (diffDays === 1) {
    return 'bg-gradient-to-r from-green-500 to-green-600 text-white'
  } else if (diffDays <= 7) {
    return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
  } else {
    return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
  }
})
</script>
