<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold">{{ $t('tasks.createTask') }}</h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ $t('tasks.taskTitle') }}
            </label>
            <input
              v-model="form.title"
              type="text"
              class="form-input"
              :placeholder="$t('tasks.taskTitle')"
              required
              maxlength="255"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ $t('tasks.description') }}
            </label>
            <textarea
              v-model="form.description"
              class="form-input"
              rows="3"
              :placeholder="$t('tasks.description')"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Task Type
            </label>
            <select v-model="form.task_type" class="form-input">
              <option value="TODO">{{ $t('tasks.taskTypes.TODO') }}</option>
              <option value="HABIT">{{ $t('tasks.taskTypes.HABIT') }}</option>
              <option value="DAILY_TASK">{{ $t('tasks.taskTypes.DAILY_TASK') }}</option>
              <option value="LONG_TERM">{{ $t('tasks.taskTypes.LONG_TERM') }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ $t('tasks.importance') }} (1-5)
            </label>
            <input
              v-model.number="form.importance"
              type="number"
              min="1"
              max="5"
              class="form-input"
            />
          </div>

          <!-- TODO specific fields -->
          <div v-if="form.task_type === 'TODO'">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ $t('tasks.dueDate') }} (Optional)
            </label>
            <input
              v-model="form.due_at"
              type="datetime-local"
              class="form-input"
            />
          </div>

          <!-- DAILY_TASK specific fields -->
          <div v-if="form.task_type === 'DAILY_TASK'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Target Date
              </label>
              <input
                v-model="form.started_at"
                type="date"
                class="form-input"
                required
              />
            </div>
            <div>
              <ToggleSwitch
                v-model="form.is_recurring"
                label="Recurring Task"
              />
            </div>
            <div v-if="form.is_recurring">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Recurrence Type
              </label>
              <select v-model="form.recurrence_type" class="form-input">
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="EVERY_X_DAYS">Every X Days</option>
                <option value="EVERY_X_WEEKS">Every X Weeks</option>
                <option value="EVERY_X_MONTHS">Every X Months</option>
                <option value="WEEKLY_ON_DAYS">Weekly on Specific Days</option>
                <option value="MONTHLY_ON_DAYS">Monthly on Specific Days</option>
                <option value="WEEK_OF_MONTH_ON_DAYS">Specific Week Days of Month</option>
              </select>
            </div>
            <div v-if="form.is_recurring && ['EVERY_X_DAYS', 'EVERY_X_WEEKS', 'EVERY_X_MONTHS'].includes(form.recurrence_type)">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Interval
              </label>
              <input
                v-model.number="form.recurrence_interval"
                type="number"
                min="1"
                class="form-input"
                placeholder="e.g., 2 for every 2 days"
              />
            </div>
            
            <!-- Weekday selection for WEEKLY_ON_DAYS and WEEK_OF_MONTH_ON_DAYS -->
            <div v-if="form.is_recurring && ['WEEKLY_ON_DAYS', 'WEEK_OF_MONTH_ON_DAYS'].includes(form.recurrence_type)">
              <div class="section-header">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="section-title">{{ $t('tasks.recurrence.selectDaysOfWeek') }}</span>
              </div>
              <div class="day-selector p-4">
                <div class="grid grid-cols-7 gap-2">
                  <div 
                    v-for="(day, index) in weekdays" 
                    :key="index" 
                    class="day-item"
                    :class="{ selected: form.recurrence_days_of_week.includes(index) }"
                    @click="toggleDayOfWeek(index)"
                  >
                    <div class="day-label">{{ day }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Day of month selection for MONTHLY_ON_DAYS -->
            <div v-if="form.is_recurring && form.recurrence_type === 'MONTHLY_ON_DAYS'">
              <div class="section-header">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span class="section-title">{{ $t('tasks.recurrence.selectDaysOfMonth') }}</span>
              </div>
              <div class="day-selector p-4 mb-4">
                <div class="grid grid-cols-8 gap-1">
                  <div 
                    v-for="day in 31" 
                    :key="day" 
                    class="day-item"
                    :class="{ selected: form.recurrence_days_of_month.includes(day) }"
                    @click="toggleDayOfMonth(day)"
                  >
                    <div class="day-number">{{ day }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Week of month selection for WEEK_OF_MONTH_ON_DAYS -->
            <div v-if="form.is_recurring && form.recurrence_type === 'WEEK_OF_MONTH_ON_DAYS'">
              <div class="section-header">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span class="section-title">{{ $t('tasks.recurrence.selectWeeksOfMonth') }}</span>
              </div>
              <div class="week-selector p-4">
                <div class="grid grid-cols-4 gap-3">
                  <div 
                    v-for="week in 4" 
                    :key="week" 
                    class="week-item"
                    :class="{ selected: form.recurrence_weeks_of_month.includes(week) }"
                    @click="toggleWeekOfMonth(week)"
                  >
                    <div class="week-number">{{ week }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- LONG_TERM specific fields -->
          <div v-if="form.task_type === 'LONG_TERM'" class="space-y-4">
            <div>
              <ToggleSwitch
                v-model="form.show_progress"
                label="Show Progress Bar"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Target Completion Date (Optional)
              </label>
              <input
                v-model="form.target_completion_at"
                type="date"
                class="form-input"
              />
            </div>
          </div>

          <!-- HABIT specific fields -->
          <div v-if="form.task_type === 'HABIT'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Habit Type
              </label>
              <select v-model="form.habit_type" class="form-input">
                <option value="GOOD">Good Habit</option>
                <option value="BAD">Bad Habit</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Target Count
              </label>
              <input
                v-model.number="form.threshold_count"
                type="number"
                min="1"
                class="form-input"
                placeholder="Target number of times"
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Time Range
                </label>
                <input
                  v-model.number="form.time_range_value"
                  type="number"
                  min="1"
                  class="form-input"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Period
                </label>
                <select v-model="form.time_range_type" class="form-input">
                  <option value="DAYS">Days</option>
                  <option value="WEEKS">Weeks</option>
                  <option value="MONTHS">Months</option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="error" class="text-danger-600 text-sm">
            {{ error }}
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="$emit('close')"
              class="btn btn-secondary"
            >
              {{ $t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="btn btn-primary"
            >
              {{ loading ? $t('common.loading') : $t('common.create') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { TaskType } from '@/types'
import ToggleSwitch from './ToggleSwitch.vue'

const taskStore = useTaskStore()
const loading = ref(false)
const error = ref<string | null>(null)

const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

// Helper methods for handling selections
const toggleDayOfWeek = (index: number) => {
  const indexInArray = form.recurrence_days_of_week.indexOf(index)
  if (indexInArray > -1) {
    form.recurrence_days_of_week.splice(indexInArray, 1)
  } else {
    form.recurrence_days_of_week.push(index)
  }
}

const toggleDayOfMonth = (day: number) => {
  const indexInArray = form.recurrence_days_of_month.indexOf(day)
  if (indexInArray > -1) {
    form.recurrence_days_of_month.splice(indexInArray, 1)
  } else {
    form.recurrence_days_of_month.push(day)
  }
}

const toggleWeekOfMonth = (week: number) => {
  const indexInArray = form.recurrence_weeks_of_month.indexOf(week)
  if (indexInArray > -1) {
    form.recurrence_weeks_of_month.splice(indexInArray, 1)
  } else {
    form.recurrence_weeks_of_month.push(week)
  }
}


const form = reactive({
  title: '',
  description: '',
  task_type: TaskType.TODO,
  importance: 1,
  // TODO fields
  due_at: '',
  // HABIT fields
  habit_type: 'GOOD',
  threshold_count: 1,
  time_range_value: 7,
  time_range_type: 'DAYS',
  // DAILY_TASK fields
  started_at: '',
  is_recurring: true,
  recurrence_type: 'DAILY',
  recurrence_interval: 1,
  recurrence_days_of_week: [] as number[],
  recurrence_days_of_month: [] as number[],
  recurrence_weeks_of_month: [] as number[],
  // LONG_TERM fields
  show_progress: true,
  target_completion_at: ''
})

const emit = defineEmits<{
  close: []
  created: []
}>()

const handleSubmit = async () => {
  loading.value = true
  error.value = null

  try {
    const taskData: any = {
      title: form.title,
      description: form.description || undefined,
      task_type: form.task_type,
      importance: form.importance
    }

    // Add type-specific fields
    if (form.task_type === TaskType.TODO && form.due_at) {
      taskData.due_at = new Date(form.due_at).toISOString()
    }

    if (form.task_type === TaskType.HABIT) {
      taskData.habit_type = form.habit_type
      taskData.threshold_count = form.threshold_count
      taskData.time_range_value = form.time_range_value
      taskData.time_range_type = form.time_range_type
    }

    if (form.task_type === TaskType.DAILY_TASK) {
      taskData.started_at = new Date(form.started_at).toISOString()
      taskData.is_recurring = form.is_recurring
      taskData.recurrence_type = form.recurrence_type
      taskData.recurrence_interval = form.recurrence_interval
      taskData.recurrence_days_of_week = form.recurrence_days_of_week
      taskData.recurrence_days_of_month = form.recurrence_days_of_month
      taskData.recurrence_weeks_of_month = form.recurrence_weeks_of_month
    }

    if (form.task_type === TaskType.LONG_TERM) {
      taskData.show_progress = form.show_progress
      if (form.target_completion_at) {
        taskData.target_completion_at = new Date(form.target_completion_at).toISOString()
      }
    }

    await taskStore.createTask(taskData)
    emit('created')
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to create task'
  } finally {
    loading.value = false
  }
}
</script>
