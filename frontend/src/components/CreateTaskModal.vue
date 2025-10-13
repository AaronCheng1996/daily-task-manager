<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto dark:bg-slate-800">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold">{{ $t('tasks.createTask') }}</h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg class="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Habit Type
              </label>
              <select v-model="form.habit_type" class="form-input">
                <option value="GOOD">Good Habit</option>
                <option value="BAD">Bad Habit</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

          <div v-if="error" class="text-danger-600 text-sm dark:text-danger-400">
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
import { useCreateTaskModal } from './CreateTaskModal'
import ToggleSwitch from './ToggleSwitch.vue'

const emit = defineEmits<{
  close: []
  created: []
}>()

const {
  form,
  loading,
  error,
  weekdays,
  toggleDayOfWeek,
  toggleDayOfMonth,
  toggleWeekOfMonth,
  handleSubmit
} = useCreateTaskModal(emit)
</script>
