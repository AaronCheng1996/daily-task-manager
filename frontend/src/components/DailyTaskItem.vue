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
              Daily
            </span>
            <span v-if="task.importance > 1" class="text-xs text-warning-600 dark:text-warning-400">
              Priority: {{ task.importance }}
            </span>
          </div>
          
          <p v-if="task.description" class="text-sm task-item-meta text-gray-600 dark:text-gray-400 mt-1">
            {{ task.description }}
          </p>

          <div class="flex items-center space-x-4 mt-2 text-xs task-item-meta text-gray-500 dark:text-gray-400">
            <span>{{ getRecurrenceDescription() }}</span>
            <span v-if="task.stat?.nextOccurrence">
              Next: {{ formatDate(task.stat.nextOccurrence) }}
            </span>
          </div>
          
          <div v-if="task.stat" class="mt-2 space-y-1">
            <div class="flex items-center space-x-4 text-sm">
              <span class="task-item-meta text-gray-600 dark:text-gray-400">
                Rate: <span class="font-medium text-blue-600 dark:text-blue-400">{{ task.stat.completionRate }}%</span>
              </span>
              <span class="task-item-meta text-gray-600 dark:text-gray-400">
                Streak: <span class="font-medium" :class="streakClass">{{ task.stat.currentStreak }}</span>
              </span>
              <span class="text-gray-600">
                Best: <span class="font-medium text-green-600">{{ task.stat.longestStreak }}</span>
              </span>
              <span v-if="task.stat.missedStreak > 0" class="text-gray-600">
                Missed: <span class="font-medium text-red-500">{{ task.stat.missedStreak }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <button
          @click="showStatistics = !showStatistics"
          class="p-2 text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-400 dark:hover:text-gray-600"
          title="View statistics"
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
      <h4 class="text-sm font-medium text-gray-700 mb-2 dark:text-gray-400">Recent History (30 days)</h4>
      
      <div class="grid grid-cols-7 gap-1 text-xs">
        <div 
          v-for="record in task.stat.recentHistory.slice(-21)" 
          :key="record.date"
          :title="`${formatDate(record.date)}: ${record.completed ? 'Completed' : 'Not completed'}`"
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
        <span>{{ task.stat.recentHistory.filter(r => r.completed).length }} completed</span>
        <span>{{ task.stat.recentHistory.length }} expected</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format, parseISO } from 'date-fns'
import type { DailyTask, DailyTaskStatistics } from '@/types'
import { taskApi } from '@/utils/api'

interface Props {
  task: DailyTask
}

const props = defineProps<Props>()
const emit = defineEmits<{
  edit: [task: DailyTask]
  delete: [id: string]
  updated: []
}>()

const loading = ref(false)
const showStatistics = ref(false)

const streakClass = computed(() => {
  if (!props.task.stat) return 'text-gray-600'
  
  const streak = props.task.stat.currentStreak
  if (streak >= 7) return 'text-green-600'
  if (streak >= 3) return 'text-blue-600'
  return 'text-gray-600'
})

const handleToggleCompletion = async () => {
  loading.value = true
  
  try {
    await taskApi.toggleTaskCompletion(props.task.id)
    await loadStatistics()
    emit('updated')
  } catch (error: any) {
    console.error('Daily task toggle failed:', error)
    
    if (error.response?.data?.error) {
      alert(error.response.data.error)
    } else {
      alert('切換完成狀態失敗，請稍後再試')
    }
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const response = await taskApi.getTaskStatistics(props.task.id)
    props.task.stat = response.stats as DailyTaskStatistics
  } catch (error) {
    console.error('Failed to load daily task statistics:', error)
  }
}

const getRecurrenceDescription = (): string => {
  const { recurrence_type, recurrence_interval, recurrence_days_of_week, recurrence_days_of_month, recurrence_weeks_of_month } = props.task
  
  switch (recurrence_type) {
    case 'DAILY':
      return 'Every day'
    case 'WEEKLY':
      return 'Every week'
    case 'MONTHLY':
      return 'Every month'
    case 'YEARLY':
      return 'Every year'
    case 'EVERY_X_DAYS':
      return `Every ${recurrence_interval} day(s)`
    case 'EVERY_X_WEEKS':
      return `Every ${recurrence_interval} week(s)`
    case 'EVERY_X_MONTHS':
      return `Every ${recurrence_interval} month(s)`
    case 'WEEKLY_ON_DAYS':
      if (recurrence_days_of_week && recurrence_days_of_week.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const days = recurrence_days_of_week.map(day => dayNames[day]).join(', ')
        return `Weekly on ${days}`
      }
      return 'Specific weekdays'
    case 'MONTHLY_ON_DAYS':
      if (recurrence_days_of_month && recurrence_days_of_month.length > 0) {
        if (recurrence_days_of_month.includes(-1)) {
          return 'End of month'
        }
        const days = recurrence_days_of_month.join(', ')
        return `${days}th of month`
      }
      return 'Specific days of month'
    case 'WEEK_OF_MONTH_ON_DAYS':
      if (recurrence_days_of_week && recurrence_days_of_week.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const days = recurrence_days_of_week.map(day => dayNames[day]).join(', ')
        return `Weekly on ${days}`
      }
      if (recurrence_weeks_of_month && recurrence_weeks_of_month.length > 0) {
        const weekNames = ['Last week', '1st week', '2nd week', '3rd week', '4th week']
        const weeks = recurrence_weeks_of_month.map(week => weekNames[week]).join(', ')
        return `Monthly on ${weeks}`
      }
      return 'Specific days of month'
    default:
      return 'Custom schedule'
  }
}

const formatDate = (dateStr: string): string => {
  try {
    return format(parseISO(dateStr), 'MMM dd')
  } catch {
    return dateStr
  }
}
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
