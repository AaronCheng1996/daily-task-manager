<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold">Edit Task</h2>
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
            <select v-model="form.task_type" class="form-input" disabled>
              <option value="TODO">{{ $t('tasks.taskTypes.TODO') }}</option>
              <option value="HABIT">{{ $t('tasks.taskTypes.HABIT') }}</option>
              <option value="DAILY_TASK">{{ $t('tasks.taskTypes.DAILY_TASK') }}</option>
              <option value="LONG_TERM">{{ $t('tasks.taskTypes.LONG_TERM') }}</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Task type cannot be changed after creation</p>
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
              />
            </div>
            <div>
              <label class="flex items-center space-x-2">
                <input
                  v-model="form.is_recurring"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="text-sm font-medium text-gray-700">Recurring Task</span>
              </label>
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
          </div>

          <!-- LONG_TERM specific fields -->
          <div v-if="form.task_type === 'LONG_TERM'" class="space-y-4">
            <div>
              <label class="flex items-center space-x-2">
                <input
                  v-model="form.show_progress"
                  type="checkbox"
                  class="form-checkbox"
                />
                <span class="text-sm font-medium text-gray-700">Show Progress Bar</span>
              </label>
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
              {{ loading ? $t('common.loading') : 'Update Task' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { TaskType } from '@/types'
import type { Task, HabitTask, DailyTask, LongTermTask, TodoTask } from '@/types'

interface Props {
  task: Task
}

const props = defineProps<Props>()
const taskStore = useTaskStore()
const loading = ref(false)
const error = ref<string | null>(null)

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
  // LONG_TERM fields
  show_progress: true,
  target_completion_at: ''
})

const emit = defineEmits<{
  close: []
  updated: []
}>()

const populateForm = () => {
  // Populate basic fields
  form.title = props.task.title
  form.description = props.task.description || ''
  form.task_type = props.task.task_type
  form.importance = props.task.importance || 1

  // Populate type-specific fields
  if (props.task.task_type === TaskType.TODO) {
    const todoTask = props.task as TodoTask
    if (todoTask.due_at) {
      const date = new Date(todoTask.due_at)
      // Format for datetime-local input
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      form.due_at = `${year}-${month}-${day}T${hours}:${minutes}`
    }
  } else if (props.task.task_type === TaskType.HABIT) {
    const habitTask = props.task as HabitTask
    form.habit_type = habitTask.habit_type || 'GOOD'
    form.threshold_count = habitTask.threshold_count || 1
    form.time_range_value = habitTask.time_range_value || 7
    form.time_range_type = habitTask.time_range_type || 'DAYS'
  } else if (props.task.task_type === TaskType.DAILY_TASK) {
    const dailyTask = props.task as DailyTask
    if (dailyTask.started_at) {
      const date = new Date(dailyTask.started_at)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      form.started_at = `${year}-${month}-${day}`
    }
    form.is_recurring = dailyTask.is_recurring ?? true
    form.recurrence_type = dailyTask.recurrence_type || 'DAILY'
    form.recurrence_interval = dailyTask.recurrence_interval || 1
  } else if (props.task.task_type === TaskType.LONG_TERM) {
    const longTermTask = props.task as LongTermTask
    form.show_progress = longTermTask.show_progress ?? true
    if (longTermTask.target_completion_at) {
      try {
        const date = new Date(longTermTask.target_completion_at)
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          form.target_completion_at = `${year}-${month}-${day}`
        }
      } catch (e) {
        console.warn('Invalid target_completion_at:', longTermTask.target_completion_at, e)
        form.target_completion_at = ''
      }
    } else {
      form.target_completion_at = ''
    }
  }
}

const handleSubmit = async () => {
  loading.value = true
  error.value = null

  try {
    const taskData: any = {
      title: form.title,
      description: form.description || undefined,
      importance: form.importance
    }

    // Add type-specific fields
    if (form.task_type === TaskType.TODO) {
      if (form.due_at) {
        taskData.due_at = new Date(form.due_at).toISOString()
      } else {
        taskData.due_at = null
      }
    }

    if (form.task_type === TaskType.HABIT) {
      taskData.habit_type = form.habit_type
      taskData.threshold_count = form.threshold_count
      taskData.time_range_value = form.time_range_value
      taskData.time_range_type = form.time_range_type
    }

    if (form.task_type === TaskType.DAILY_TASK) {
      if (form.started_at) {
        taskData.started_at = new Date(form.started_at).toISOString()
      }
      taskData.is_recurring = form.is_recurring
      taskData.recurrence_type = form.recurrence_type
      taskData.recurrence_interval = form.recurrence_interval
    }

    if (form.task_type === TaskType.LONG_TERM) {
      taskData.show_progress = form.show_progress
      if (form.target_completion_at && form.target_completion_at.trim()) {
        try {
          taskData.target_completion_at = new Date(form.target_completion_at).toISOString()
        } catch (e) {
          console.error('Invalid date format:', form.target_completion_at, e)
          taskData.target_completion_at = null
        }
      } else {
        taskData.target_completion_at = null
      }
    }

    await taskStore.updateTask(props.task.id, taskData)
    emit('updated')
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to update task'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  populateForm()
})
</script>
