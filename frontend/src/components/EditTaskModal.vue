<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto dark:bg-slate-800">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold">Edit Task</h2>
          <button
            @click="$emit('close')"
            class="icon-btn-default"
          >
            <svg class="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="title" class="form-label">
              {{ $t('tasks.taskTitle') }}
            </label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              class="form-input"
              :placeholder="$t('tasks.taskTitle')"
              required
              maxlength="255"
            />
          </div>

          <div>
            <label for="description" class="form-label">
              {{ $t('tasks.description') }}
            </label>
            <textarea
              id="description"
              v-model="form.description"
              class="form-input"
              rows="3"
              :placeholder="$t('tasks.description')"
            ></textarea>
          </div>

          <div>
            <label for="task_type" class="form-label">
              {{ $t('tasks.taskType') }}
            </label>
            <select id="task_type" v-model="form.task_type" class="form-input" disabled>
              <option value="TODO">{{ $t('tasks.taskTypes.TODO') }}</option>
              <option value="HABIT">{{ $t('tasks.taskTypes.HABIT') }}</option>
              <option value="DAILY_TASK">{{ $t('tasks.taskTypes.DAILY_TASK') }}</option>
              <option value="LONG_TERM">{{ $t('tasks.taskTypes.LONG_TERM') }}</option>
            </select>
            <p class="form-hint">{{ $t('tasks.taskTypeCannotBeChanged') }}</p>
          </div>

          <div>
            <label for="importance" class="form-label">
              {{ $t('tasks.importance') }} (1-5)
            </label>
            <input
              id="importance"
              v-model.number="form.importance"
              type="number"
              min="1"
              max="5"
              class="form-input"
            />
          </div>

          <div v-if="form.task_type === 'TODO'">
            <label for="due_at" class="form-label">
              {{ $t('tasks.dueDate') }} {{ $t('common.optional') }}
            </label>
            <input
              id="due_at"
              v-model="form.due_at"
              type="datetime-local"
              class="form-input"
            />
          </div>

          <!-- HABIT specific fields -->
          <div v-if="form.task_type === 'HABIT'" class="space-y-4">
            <div>
              <label for="habit_type" class="form-label">
                {{ $t('tasks.habit.habitType') }}
              </label>
              <select id="habit_type" v-model="form.habit_type" class="form-input">
                <option value="GOOD">{{ $t('tasks.habit.goodHabit') }}</option>
                <option value="BAD">{{ $t('tasks.habit.badHabit') }}</option>
              </select>
            </div>
            <div>
              <label for="threshold_count" class="form-label">
                {{ $t('tasks.habit.targetCount') }}
              </label>
              <input
                id="threshold_count"
                v-model.number="form.threshold_count"
                type="number"
                min="1"
                class="form-input"
                :placeholder="$t('tasks.habit.targetCountPlaceholder')"
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label for="time_range_value" class="form-label">
                  {{ $t('tasks.habit.timeRange') }}
                </label>
                <input
                  id="time_range_value"
                  v-model.number="form.time_range_value"
                  type="number"
                  min="1"
                  class="form-input"
                />
              </div>
              <div>
                <label for="time_range_type" class="form-label">
                  {{ $t('tasks.habit.period') }}
                </label>
                <select id="time_range_type" v-model="form.time_range_type" class="form-input">
                  <option value="DAYS">{{ $t('tasks.days') }}</option>
                  <option value="WEEKS">{{ $t('tasks.weeks') }}</option>
                  <option value="MONTHS">{{ $t('tasks.months') }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- DAILY_TASK specific fields -->
          <div v-if="form.task_type === 'DAILY_TASK'" class="space-y-4">
            <div>
              <label for="started_at" class="form-label">
                {{ $t('tasks.targetDate') }}
              </label>
              <input
                id="started_at"
                v-model="form.started_at"
                type="date"
                class="form-input"
              />
            </div>
            <div>
              <ToggleSwitch
                v-model="form.is_recurring"
                :label="$t('tasks.daily.recurringTask')"
              />
            </div>
            <div v-if="form.is_recurring">
              <label for="recurrence_type" class="form-label">
                {{ $t('tasks.daily.recurrenceType') }}
              </label>
              <select id="recurrence_type" v-model="form.recurrence_type" class="form-input">
                <option value="DAILY">{{ $t('tasks.daily') }}</option>
                <option value="WEEKLY">{{ $t('tasks.weekly') }}</option>
                <option value="MONTHLY">{{ $t('tasks.monthly') }}</option>
                <option value="YEARLY">{{ $t('tasks.yearly') }}</option>
                <option value="EVERY_X_DAYS">{{ $t('tasks.everyXDays') }}</option>
                <option value="EVERY_X_WEEKS">{{ $t('tasks.everyXWeeks') }}</option>
                <option value="EVERY_X_MONTHS">{{ $t('tasks.everyXMonths') }}</option>
                <option value="WEEKLY_ON_DAYS">{{ $t('tasks.weeklyOnSpecificDays') }}</option>
                <option value="MONTHLY_ON_DAYS">{{ $t('tasks.monthlyOnSpecificDays') }}</option>
                <option value="WEEK_OF_MONTH_ON_DAYS">{{ $t('tasks.specificWeekDaysOfMonth') }}</option>
              </select>
            </div>
            <div v-if="form.is_recurring && ['EVERY_X_DAYS', 'EVERY_X_WEEKS', 'EVERY_X_MONTHS'].includes(form.recurrence_type)">
              <label for="recurrence_interval" class="form-label">
                {{ $t('tasks.daily.interval') }}
              </label>
              <input
                id="recurrence_interval"
                v-model.number="form.recurrence_interval"
                type="number"
                min="1"
                class="form-input"
                :placeholder="$t('tasks.daily.intervalPlaceholder')"
              />
            </div>
            
            <!-- Weekday selection for WEEKLY_ON_DAYS and WEEK_OF_MONTH_ON_DAYS -->
            <div v-if="form.is_recurring && ['WEEKLY_ON_DAYS', 'WEEK_OF_MONTH_ON_DAYS'].includes(form.recurrence_type)">
              <div class="section-header">
                <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="section-title">{{ $t('tasks.selectDaysOfWeek') }}</span>
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
                    <div class="day-number">{{ index + 1 }}</div>
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
                <span class="section-title">{{ $t('tasks.selectDaysOfMonth') }}</span>
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
                <span class="section-title">{{ $t('tasks.selectWeeksOfMonth') }}</span>
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
                :label="$t('tasks.daily.showProgressBar')"
              />
            </div>
            <div>
              <label for="target_completion_at" class="form-label">
                {{ $t('tasks.daily.targetCompletionDate') }} {{ $t('common.optional') }}
              </label>
              <input
                v-model="form.target_completion_at"
                type="date"
                class="form-input"
              />
            </div>
          </div>

          <div v-if="error" class="form-error">
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
              {{ loading ? $t('common.loading') : $t('tasks.updateTask') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditTaskModal } from './EditTaskModal'
import type { Task } from '@/types'
import ToggleSwitch from './ToggleSwitch.vue'

interface Props {
  task: Task
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  updated: []
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
} = useEditTaskModal(props, emit)
</script>
