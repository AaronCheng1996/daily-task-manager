<template>
  <div class="longterm-task-item border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-sm transition-shadow dark:bg-slate-800">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <div class="flex items-center space-x-2">
            <h3 class="font-medium text-gray-900 dark:text-gray-100" :class="{ 'line-through text-gray-500 dark:text-gray-400': task.is_completed }">
              {{ task.title }}
            </h3>
            <span class="text-xs bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-1 rounded-full">
              {{ $t('tasks.taskTypes.LONG_TERM') }}
            </span>
            <span v-if="task.importance > 1" class="text-xs text-warning-600">
              {{ $t('tasks.priority') }}: {{ task.importance }}
            </span>
            <span v-if="task.stat?.isOverdue" class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
              {{ $t('tasks.overdue') }}
            </span>
          </div>
          
          <p v-if="task.description" class="text-sm text-secondary mt-1">
            {{ task.description }}
          </p>

          <div class="flex items-center space-x-4 mt-2 text-xs text-muted">
            <span v-if="task.target_completion_at">
              {{ $t('tasks.longterm.target') }}: {{ formatDate(task.target_completion_at) }}
              <span v-if="task.stat?.daysToTarget !== undefined" 
                    :class="targetDateClass">
                ({{ getTargetDateText() }})
              </span>
            </span>
            <span v-if="task.stat">
              {{ task.stat.completedMilestones }}/{{ task.stat.totalMilestones }} {{ $t('tasks.longterm.milestones') }}
            </span>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button
            @click="showMilestones = !showMilestones"
            class="icon-btn-default"
            :title="$t('tasks.longterm.toggleMilestones')"
          >
            <svg 
              class="w-4 h-4 transition-transform" 
              :class="{ 'rotate-180': showMilestones }"
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          <button
            @click="$emit('edit', task)"
            class="icon-btn-default"
          >
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.828-2.828z" />
            </svg>
          </button>
          <button
            @click="$emit('delete', task.id)"
            class="icon-btn-danger"
          >
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="task.show_progress && task.stat" class="space-y-2">
        <div class="flex justify-between text-sm dark:text-gray-400">
          <span class="text-secondary">{{ $t('tasks.longterm.progress') }}</span>
          <span class="font-medium" :class="progressClass">
            {{ formatProgress(task.stat.progress) }}%
          </span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
          <div 
            class="h-2 rounded-full transition-all duration-300"
            :class="progressBarClass"
            :style="`width: ${task.stat.progress}%`"
          ></div>
        </div>
      </div>

      <div v-if="showMilestones" class="space-y-3 border-t border-gray-100 dark:border-slate-700 pt-4">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-400">{{ $t('tasks.longterm.milestones') }}</h4>
          <button
            ref="addMilestoneButton"
            @click="handleAddMilestoneClick"
            class="text-xs text-primary-600 hover:text-primary-800 transition-colors dark:text-primary-400 dark:hover:text-primary-600"
          >
            + {{ $t('tasks.longterm.addMilestone') }}
          </button>
        </div>

        <div v-if="showAddMilestone" class="bg-gray-50 p-3 rounded border dark:bg-slate-800">
          <div class="space-y-2">
            <input
              ref="milestoneTitleInput"
              v-model="newMilestone.title"
              :placeholder="$t('tasks.longterm.milestoneTitle')"
              class="w-full text-sm px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800"
              @keyup.enter="createMilestone"
            />
            <textarea
              v-model="newMilestone.description"
              :placeholder="$t('tasks.description') + ' (' + $t('common.optional') + ')'"
              class="w-full text-sm px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800"
              rows="2"
            ></textarea>
            <div class="flex space-x-2">
              <button
                @click="createMilestone"
                :disabled="!newMilestone.title.trim() || loadingMilestone"
                class="text-xs px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary-600 dark:hover:bg-primary-700"
              >
                {{ loadingMilestone ? $t('common.loading') : $t('tasks.longterm.addMilestone') }}
              </button>
              <button
                @click="cancelAddMilestone"
                class="text-xs px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700"
              >
                {{ $t('common.cancel') }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="props.task.milestones && props.task.milestones.length > 0" class="space-y-2">
          <draggable
            v-model="props.task.milestones"
            @end="saveMilestonesOrder"
            handle=".task-handle"
            item-key="id"
          >
            <template #item="{ element }">
              <div 
                v-if="element && element.id"
                :id="element.id"
                :data-order-index="element.order_index"
                class="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors dark:bg-slate-800"
              >
                <div class="task-handle cursor-move">⠿</div>
                <button
                  @click="toggleMilestone(element.id)"
                  :disabled="loadingMilestone"
                  class="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                  :class="element.is_completed 
                    ? 'bg-purple-500 border-purple-500 text-white' 
                    : 'border-gray-300 hover:border-purple-500 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-purple-500'"
                >
                  <svg v-if="element.is_completed" class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>

                <div class="flex-1 min-w-0">
                  <div v-if="editingMilestone?.id === element.id" class="space-y-2">
                    <input
                      v-model="editMilestoneForm.title"
                      class="w-full text-sm px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800"
                      :placeholder="$t('tasks.longterm.milestoneTitle')"
                      @keyup.enter="saveEditMilestone"
                    />
                    <textarea
                      v-model="editMilestoneForm.description"
                      class="w-full text-sm px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800"
                      rows="2"
                      :placeholder="$t('tasks.description') + ' (' + $t('common.optional') + ')'"
                    ></textarea>
                    <div class="flex space-x-2">
                      <button
                        @click="saveEditMilestone"
                        :disabled="!editMilestoneForm.title.trim() || loadingMilestone"
                        class="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-700"
                      >
                        {{ loadingMilestone ? $t('common.loading') : $t('common.save') }}
                      </button>
                      <button
                        @click="cancelEditMilestone"
                        class="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700"
                      >
                        {{ $t('common.cancel') }}
                      </button>
                    </div>
                  </div>
                  
                  <div v-else>
                    <h5 class="text-sm font-medium" :class="{ 'line-through text-gray-500 dark:text-gray-400': element.is_completed }">
                      {{ element.title }}
                    </h5>
                    <p v-if="element.description" class="text-xs text-secondary mt-1">
                      {{ element.description }}
                    </p>
                    <span v-if="element.completion_at" class="text-xs text-gray-400 dark:text-gray-400">
                      {{ $t('tasks.completed') }}: {{ formatDate(element.completion_at) }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center space-x-1">
                  <button
                    @click="startEditMilestone(element)"
                    class="p-1 icon-btn-default"
                    :title="$t('tasks.longterm.editMilestone')"
                  >
                    <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.828-2.828z" />
                    </svg>
                  </button>
                  <button
                    @click="deleteMilestone(element.id)"
                    class="p-1 text-gray-400 hover:text-red-600 transition-colors dark:text-gray-400 dark:hover:text-red-600"
                    :title="$t('tasks.longterm.deleteMilestone')"
                  >
                    <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </template>
          </draggable>
        </div>
        
        <div v-else class="text-center py-4 text-muted">
          <p class="text-sm">{{ $t('tasks.longterm.noMilestonesYet') }}</p>
          <button
            @click="handleAddMilestoneClick"
            class="text-xs text-primary-600 hover:text-primary-800 mt-1 dark:text-primary-400 dark:hover:text-primary-600"
          >
            {{ $t('tasks.longterm.addMilestone') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import draggable from "vuedraggable";
import { useLongTermTaskItem } from './LongTermTaskItem'
import type { LongTermTask } from '@/types'

interface Props {
  task: LongTermTask
}

const props = defineProps<Props>()
const emit = defineEmits<{
  edit: [task: LongTermTask]
  delete: [id: string]
  updated: []
}>()

const {
  showMilestones,
  showAddMilestone,
  loadingMilestone,
  milestoneTitleInput,
  addMilestoneButton,
  newMilestone,
  editingMilestone,
  editMilestoneForm,
  progressClass,
  progressBarClass,
  targetDateClass,
  getTargetDateText,
  createMilestone,
  toggleMilestone,
  deleteMilestone,
  startEditMilestone,
  saveEditMilestone,
  cancelEditMilestone,
  cancelAddMilestone,
  handleAddMilestoneClick,
  formatDate,
  formatProgress,
  saveMilestonesOrder
} = useLongTermTaskItem(props, emit)
</script>

<style scoped>
.longterm-task-item {
  background: linear-gradient(to right, #faf5ff 0%, #ffffff 100%);
}

.dark .longterm-task-item {
  background: linear-gradient(to right, #1e293b 0%, #334155 100%);
}

.longterm-task-item:hover {
  background: linear-gradient(to right, #f3e8ff 0%, #ffffff 100%);
}

.dark .longterm-task-item:hover {
  background: linear-gradient(to right, #0f172a 0%, #1e293b 100%);
}
</style>
