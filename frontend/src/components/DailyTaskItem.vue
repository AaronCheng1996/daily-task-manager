<template>
  <div class="daily-task-item task-item border border-gray-200 dark:border-slate-700 rounded-lg p-4 dark:bg-slate-800">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <button
          @click="handleToggleCompletion"
          :disabled="loading"
          class="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
          :class="task.is_completed 
            ? 'bg-success-500 border-success-500 text-white' 
            : 'border-gray-300 hover:border-success-500 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-success-500'"
        >
          <svg v-if="task.is_completed" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <span v-else-if="loading" class="text-xs">...</span>
        </button>
        
        <div class="flex-1">
          <div class="flex items-center space-x-2">
            <h3 class="font-medium task-item-content text-gray-900 dark:text-gray-100" :class="{ 'line-through text-gray-500 dark:text-gray-400': task.is_completed }">
              {{ task.title }}
            </h3>
            <span class="task-item-badge text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-1 rounded-full">
              {{ $t('tasks.taskTypes.DAILY_TASK') }}
            </span>
            <span v-if="task.importance > 1" class="text-xs text-warning-600 dark:text-warning-400">
              {{ $t('tasks.priority') }}: {{ task.importance }}
            </span>
          </div>
          
          <p v-if="task.description" class="text-sm task-item-meta text-gray-600 dark:text-gray-400 mt-1">
            {{ task.description }}
          </p>

          <div class="flex items-center space-x-4 mt-2 text-xs task-item-meta text-gray-500 dark:text-gray-400">
            <span>{{ getRecurrenceDescription() }}</span>
            <span v-if="task.stat?.nextOccurrence">
              {{ $t('tasks.daily.next') }}: {{ formatDate(task.stat.nextOccurrence) }}
            </span>
          </div>
          
          <div v-if="task.stat" class="mt-2 space-y-1">
            <div class="flex items-center space-x-4 text-sm">
              <span class="task-item-meta text-gray-600 dark:text-gray-400">
                {{ $t('tasks.habit.rate') }}: <span class="font-medium text-blue-600 dark:text-blue-400">{{ task.stat.completionRate }}%</span>
              </span>
              <span class="task-item-meta text-gray-600 dark:text-gray-400">
                {{ $t('tasks.habit.streak') }}: <span class="font-medium" :class="streakClass">{{ task.stat.currentStreak }}</span>
              </span>
              <span class="text-gray-600">
                {{ $t('tasks.habit.best') }}: <span class="font-medium text-green-600">{{ task.stat.longestStreak }}</span>
              </span>
              <span v-if="task.stat.missedStreak > 0" class="text-gray-600">
                {{ $t('tasks.habit.missed') }}: <span class="font-medium text-red-500">{{ task.stat.missedStreak }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <button
          @click="showStatistics = !showStatistics"
          class="p-2 text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-400 dark:hover:text-gray-600"
          :title="$t('tasks.habit.viewStatistics')"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
        </button>
        <button
          @click="$emit('edit', task)"
          class="p-2 text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-400 dark:hover:text-gray-600"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.828-2.828z" />
          </svg>
        </button>
        <button
          @click="$emit('delete', task.id)"
          class="p-2 text-gray-400 hover:text-danger-600 transition-colors dark:text-gray-400 dark:hover:text-danger-600"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="showStatistics && task.stat" class="mt-4 pt-4 border-t border-gray-100">
      <h4 class="text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">{{ $t('tasks.daily.recentHistory') }} (30 {{ $t('tasks.days') }})</h4>
      
      <div class="grid grid-cols-7 gap-1 text-xs">
        <div 
          v-for="record in task.stat.recentHistory.slice(-21)" 
          :key="record.date"
          :title="`${formatDate(record.date)}: ${record.completed ? $t('tasks.completed') : $t('tasks.daily.notCompleted')}`"
          class="w-6 h-6 rounded-sm border flex items-center justify-center cursor-help"
          :class="{
            'bg-green-200 border-green-300': record.completed && record.expected,
            'bg-gray-100 border-gray-200': !record.completed && record.expected,
            'bg-gray-50 border-gray-100': !record.expected
          }"
        >
          <div 
            v-if="record.completed" 
            class="w-2 h-2 rounded-full"
            :class="record.expected ? 'bg-green-600' : 'bg-gray-400'"
          ></div>
        </div>
      </div>
      
      <div class="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{{ task.stat.recentHistory.filter(r => r.completed).length }} {{ $t('tasks.completed') }}</span>
        <span>{{ task.stat.recentHistory.length }} {{ $t('tasks.daily.expected') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDailyTaskItem } from './DailyTaskItem'
import type { DailyTask } from '@/types'

interface Props {
  task: DailyTask
}

const props = defineProps<Props>()
const emit = defineEmits<{
  edit: [task: DailyTask]
  delete: [id: string]
  updated: []
}>()

const {
  loading,
  showStatistics,
  streakClass,
  handleToggleCompletion,
  getRecurrenceDescription,
  formatDate
} = useDailyTaskItem(props, emit)
</script>

<style scoped>
.daily-task-item {
  background: linear-gradient(to right, #f0f9ff 0%, #ffffff 100%);
}

.dark .daily-task-item {
  background: linear-gradient(to right, #1e293b 0%, #334155 100%);
}

.daily-task-item:hover {
  background: linear-gradient(to right, #e0f2fe 0%, #ffffff 100%);
}

.dark .daily-task-item:hover {
  background: linear-gradient(to right, #0f172a 0%, #1e293b 100%);
}
</style>
