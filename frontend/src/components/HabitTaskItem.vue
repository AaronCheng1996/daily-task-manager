<template>
  <div class="habit-task-item task-item border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-sm dark:hover:shadow-slate-900/20 transition-shadow">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <button
          @click="handleHabitCompletion"
          :disabled="loading"
          class="flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all"
          :class="habitButtonClass"
        >
          {{ loading ? '...' : '+1' }}
        </button>
        
        <div class="flex-1">
          <div class="flex items-center space-x-2">
            <h3 class="font-medium task-item-content text-gray-900 dark:text-gray-100">{{ habit.title }}</h3>
            <span 
              class="text-xs px-2 py-1 rounded-full"
              :class="habit.habit_type === 'GOOD' ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300'"
            >
              {{ habit.habit_type === 'GOOD' ? 'Good Habit' : 'Bad Habit' }}
            </span>
          </div>
          
          <p v-if="habit.description" class="text-sm task-item-meta text-gray-600 dark:text-gray-400 mt-1">
            {{ habit.description }}
          </p>
          
          <div v-if="habit.stat" class="mt-2 space-y-1">
            <div class="flex items-center space-x-4 text-sm">
              <span class="task-item-meta text-gray-600 dark:text-gray-400">
                Progress: 
                <span class="font-medium" :class="successClass">
                  {{ habit.stat.completionCount }} / {{ habit.threshold_count }}
                </span>
                <span class="text-xs text-gray-400 dark:text-gray-500 ml-1">
                  ({{ habit.stat.completionRate }}%)
                </span>
              </span>
              <span v-if="habit.stat.daysSinceLastCompletion >= 0" class="text-gray-600">
                Last: {{ formatDaysSinceCompletion(habit.stat.daysSinceLastCompletion) }}
              </span>
            </div>
            
            <div class="flex items-center space-x-2">
              <div class="flex items-center space-x-1">
                <div 
                  class="w-2 h-2 rounded-full"
                  :class="habit.stat.isSuccessful ? 'bg-green-500' : 'bg-gray-300'"
                ></div>
                <span class="text-xs" :class="habit.stat.isSuccessful ? 'text-green-600' : 'text-gray-500'">
                  {{ getSuccessMessage() }}
                </span>
              </div>
              <span class="text-xs text-gray-400">
                in {{ habit.time_range_value }} {{ habit.time_range_type.toLowerCase() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <button
          @click="showStatistics = !showStatistics"
          class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="View statistics"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
        </button>
        <button
          @click="$emit('edit', habit)"
          class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.828-2.828z" />
          </svg>
        </button>
        <button
          @click="$emit('delete', habit.id)"
          class="p-2 text-gray-400 hover:text-danger-600 transition-colors"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="showStatistics && habit.stat" class="mt-4 pt-4 border-t border-gray-100">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
      
      <div v-if="habit.stat.completionHistory.length > 0" class="space-y-1">
        <div 
          v-for="record in habit.stat.completionHistory.slice(0, 7)" 
          :key="record.date"
          class="flex justify-between text-xs text-gray-600"
        >
          <span>{{ formatDate(record.date) }}</span>
          <span class="font-medium">{{ record.count }} time(s)</span>
        </div>
      </div>
      <div v-else class="text-xs text-gray-400 italic">
        No recent completions
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format, parseISO } from 'date-fns'
import type { HabitTask, HabitStatistics } from '@/types'
import { taskApi } from '@/utils/api'

interface Props {
  habit: HabitTask
}

const props = defineProps<Props>()
const emit = defineEmits<{
  edit: [habit: HabitTask]
  delete: [id: string]
  updated: []
}>()

const loading = ref(false)
const showStatistics = ref(false)

const habitButtonClass = computed(() => {
  const baseClass = "border-2 hover:scale-105 active:scale-95"
  
  if (props.habit.habit_type === 'BAD') {
    return `${baseClass} border-orange-500 bg-orange-500 text-white hover:bg-orange-600`
  } else {
    return `${baseClass} border-green-500 bg-green-500 text-white hover:bg-green-600`
  }
})

const successClass = computed(() => {
  if (!props.habit.stat) return 'text-gray-600'
  return props.habit.stat.isSuccessful ? 'text-green-600' : 'text-gray-600'
})

const handleHabitCompletion = async () => {
  loading.value = true
  
  try {
    await taskApi.toggleTaskCompletion(props.habit.id)
    await loadStatistics()
    emit('updated')
  } catch (error: any) {
    console.error('Habit completion failed:', error)
    
    if (error.response?.data?.error === 'Habit completion cannot be undone') {
      alert('習慣完成記錄無法撤銷')
    } else {
      alert('記錄完成失敗，請稍後再試')
    }
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const response = await taskApi.getTaskStatistics(props.habit.id)
    props.habit.stat = response.stats as HabitStatistics
  } catch (error) {
    console.error('Failed to load habit statistics:', error)
  }
}

const getSuccessMessage = (): string => {
  if (!props.habit.stat) return ''
  
  if (props.habit.habit_type === 'GOOD') {
    return props.habit.stat.isSuccessful ? 'Target achieved!' : 'Keep going!'
  } else {
    return props.habit.stat.isSuccessful ? 'Under control!' : 'Need improvement'
  }
}

const formatDaysSinceCompletion = (days: number): string => {
  if (days < 0) return 'Never'
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
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
.habit-task-item {
  background: linear-gradient(to right, #f8fafc 0%, #ffffff 100%);
}

.dark .habit-task-item {
  background: linear-gradient(to right, #1e293b 0%, #334155 100%);
}

.habit-task-item:hover {
  background: linear-gradient(to right, #f1f5f9 0%, #ffffff 100%);
}

.dark .habit-task-item:hover {
  background: linear-gradient(to right, #0f172a 0%, #1e293b 100%);
}
</style>
