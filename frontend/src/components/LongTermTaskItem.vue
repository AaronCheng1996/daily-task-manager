<template>
  <div class="longterm-task-item border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <div class="flex items-center space-x-2">
            <h3 class="font-medium text-gray-900" :class="{ 'line-through text-gray-500': task.is_completed }">
              {{ task.title }}
            </h3>
            <span class="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
              Long-term
            </span>
            <span v-if="task.importance > 1" class="text-xs text-warning-600">
              Priority: {{ task.importance }}
            </span>
            <span v-if="statistics?.isOverdue" class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
              Overdue
            </span>
          </div>
          
          <p v-if="task.description" class="text-sm text-gray-600 mt-1">
            {{ task.description }}
          </p>

          <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <span v-if="task.target_completion_at">
              Target: {{ formatDate(task.target_completion_at) }}
              <span v-if="statistics?.daysToTarget !== undefined" 
                    :class="targetDateClass">
                ({{ getTargetDateText() }})
              </span>
            </span>
            <span v-if="statistics">
              {{ statistics.completedMilestones }}/{{ statistics.totalMilestones }} milestones
            </span>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button
            @click="showMilestones = !showMilestones"
            class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Toggle milestones"
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
            class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.828-2.828z" />
            </svg>
          </button>
          <button
            @click="$emit('delete', task.id)"
            class="p-2 text-gray-400 hover:text-danger-600 transition-colors"
          >
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="task.show_progress && statistics" class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Progress</span>
          <span class="font-medium" :class="progressClass">
            {{ formatProgress(statistics.progress) }}%
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="h-2 rounded-full transition-all duration-300"
            :class="progressBarClass"
            :style="`width: ${statistics.progress}%`"
          ></div>
        </div>
      </div>

      <div v-if="showMilestones" class="space-y-3 border-t border-gray-100 pt-4">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium text-gray-700">Milestones</h4>
          <button
            @click="showAddMilestone = true"
            class="text-xs text-primary-600 hover:text-primary-800 transition-colors"
          >
            + Add Milestone
          </button>
        </div>

        <div v-if="showAddMilestone" class="bg-gray-50 p-3 rounded border">
          <div class="space-y-2">
            <input
              v-model="newMilestone.title"
              placeholder="Milestone title"
              class="w-full text-sm px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              @keyup.enter="createMilestone"
            />
            <textarea
              v-model="newMilestone.description"
              placeholder="Description (optional)"
              class="w-full text-sm px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="2"
            ></textarea>
            <div class="flex space-x-2">
              <button
                @click="createMilestone"
                :disabled="!newMilestone.title.trim() || loadingMilestone"
                class="text-xs px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ loadingMilestone ? 'Adding...' : 'Add' }}
              </button>
              <button
                @click="cancelAddMilestone"
                class="text-xs px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div v-if="milestones.length > 0" class="space-y-2">
          <draggable
            v-model="milestones"
            item-key="id"
            @end="saveMilestonesOrder"
            handle=".task-handle"
          >
            <template #item="{ element }">
              <div 
                :key="element.id"
                class="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <div class="task-handle cursor-move">⠿</div>
                <button
                  @click="toggleMilestone(element.id)"
                  :disabled="loadingMilestone"
                  class="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                  :class="element.is_completed 
                    ? 'bg-purple-500 border-purple-500 text-white' 
                    : 'border-gray-300 hover:border-purple-500'"
                >
                  <svg v-if="element.is_completed" class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>

                <div class="flex-1 min-w-0">
                  <div v-if="editingMilestone?.id === element.id" class="space-y-2">
                    <input
                      v-model="editMilestoneForm.title"
                      class="w-full text-sm px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Milestone title"
                      @keyup.enter="saveEditMilestone"
                    />
                    <textarea
                      v-model="editMilestoneForm.description"
                      class="w-full text-sm px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows="2"
                      placeholder="Description (optional)"
                    ></textarea>
                    <div class="flex space-x-2">
                      <button
                        @click="saveEditMilestone"
                        :disabled="!editMilestoneForm.title.trim() || loadingMilestone"
                        class="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {{ loadingMilestone ? 'Saving...' : 'Save' }}
                      </button>
                      <button
                        @click="cancelEditMilestone"
                        class="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  
                  <div v-else>
                    <h5 class="text-sm font-medium" :class="{ 'line-through text-gray-500': element.is_completed }">
                      {{ element.title }}
                    </h5>
                    <p v-if="element.description" class="text-xs text-gray-600 mt-1">
                      {{ element.description }}
                    </p>
                    <span v-if="element.completion_at" class="text-xs text-gray-400">
                      Completed: {{ formatDate(element.completion_at) }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center space-x-1">
                  <button
                    @click="startEditMilestone(element)"
                    class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit milestone"
                  >
                    <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.828-2.828z" />
                    </svg>
                  </button>
                  <button
                    @click="deleteMilestone(element.id)"
                    class="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete milestone"
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
        
        <div v-else class="text-center py-4 text-gray-500">
          <p class="text-sm">No milestones yet</p>
          <button
            @click="showAddMilestone = true"
            class="text-xs text-primary-600 hover:text-primary-800 mt-1"
          >
            Add your first milestone
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import draggable from "vuedraggable";
import { ref, computed, onMounted } from 'vue'
import { format, parseISO } from 'date-fns'
import type { LongTermTask, LongTermTaskStatistics, Milestone } from '@/types'
import { taskApi } from '@/utils/api'

interface Props {
  task: LongTermTask
}

const props = defineProps<Props>()
const emit = defineEmits<{
  edit: [task: LongTermTask]
  delete: [id: string]
  updated: []
}>()

const statistics = ref<LongTermTaskStatistics | null>(null)
const milestones = ref<Milestone[]>([])
const showMilestones = ref(false)
const showAddMilestone = ref(false)
const loadingMilestone = ref(false)

const newMilestone = ref({
  title: '',
  description: ''
})

const progressClass = computed(() => {
  if (!statistics.value) return 'text-gray-600'
  
  const progress = statistics.value.progress
  if (progress >= 100) return 'text-green-600'
  if (progress >= 75) return 'text-blue-600'
  if (progress >= 50) return 'text-yellow-600'
  return 'text-gray-600'
})

const progressBarClass = computed(() => {
  if (!statistics.value) return 'bg-gray-400'
  
  const progress = statistics.value.progress
  if (progress >= 100) return 'bg-green-500'
  if (progress >= 75) return 'bg-blue-500'
  if (progress >= 50) return 'bg-yellow-500'
  return 'bg-gray-400'
})

const targetDateClass = computed(() => {
  if (!statistics.value) return 'text-gray-500'
  
  const { isOverdue, daysToTarget } = statistics.value
  if (isOverdue) return 'text-red-600'
  if (daysToTarget <= 7) return 'text-yellow-600'
  if (daysToTarget <= 30) return 'text-blue-600'
  return 'text-gray-500'
})

const getTargetDateText = (): string => {
  if (!statistics.value) return ''
  
  const { isOverdue, daysToTarget } = statistics.value
  if (isOverdue) return `${Math.abs(daysToTarget)} days overdue`
  if (daysToTarget === 0) return 'Due today'
  if (daysToTarget === 1) return '1 day left'
  return `${daysToTarget} days left`
}

const loadData = async () => {
  try {
    const [statsResponse, milestonesResponse] = await Promise.all([
      taskApi.getTaskStatistics(props.task.id),
      taskApi.getTaskMilestones(props.task.id)
    ])
    
    statistics.value = statsResponse.stats as LongTermTaskStatistics
    milestones.value = milestonesResponse.milestones
  } catch (error) {
    console.error('Failed to load long-term task data:', error)
  }
}

const createMilestone = async () => {
  if (!newMilestone.value.title.trim()) return
  
  loadingMilestone.value = true
  
  try {
    const response = await taskApi.createMilestone(props.task.id, {
      title: newMilestone.value.title,
      description: newMilestone.value.description || undefined,
      order_index: milestones.value.length
    })
    
    milestones.value.push(response.milestone)
    
    if (statistics.value) {
      statistics.value.totalMilestones = milestones.value.length
      statistics.value.completedMilestones = milestones.value.filter(m => m.is_completed).length
      statistics.value.progress = statistics.value.totalMilestones > 0 
        ? Number(((statistics.value.completedMilestones / statistics.value.totalMilestones) * 100).toFixed(2))
        : 0
    }
    
    newMilestone.value = { title: '', description: '' }
    showAddMilestone.value = false
  } catch (error) {
    console.error('Failed to create milestone:', error)
    alert('Failed to create milestone')
  } finally {
    loadingMilestone.value = false
  }
}

const toggleMilestone = async (milestoneId: string) => {
  loadingMilestone.value = true
  
  try {
    await taskApi.toggleMilestoneCompletion(milestoneId, props.task.id)
    
    const milestone = milestones.value.find(m => m.id === milestoneId)
    if (milestone) {
      milestone.is_completed = !milestone.is_completed
      if (milestone.is_completed) {
        milestone.completion_at = new Date().toISOString()
      } else {
        milestone.completion_at = undefined
      }
    }
    
    if (statistics.value) {
      statistics.value.completedMilestones = milestones.value.filter(m => m.is_completed).length
      statistics.value.progress = statistics.value.totalMilestones > 0 
        ? Number(((statistics.value.completedMilestones / statistics.value.totalMilestones) * 100).toFixed(2))
        : 0
    }
  } catch (error) {
    console.error('Failed to toggle milestone:', error)
    alert('Failed to update milestone')
  } finally {
    loadingMilestone.value = false
  }
}

const deleteMilestone = async (milestoneId: string) => {
  if (!confirm('Are you sure you want to delete this milestone?')) return
  
  loadingMilestone.value = true
  
  try {
    await taskApi.deleteMilestone(milestoneId, props.task.id)
    
    const index = milestones.value.findIndex(m => m.id === milestoneId)
    if (index > -1) {
      milestones.value.splice(index, 1)
    }
    
    if (statistics.value) {
      statistics.value.totalMilestones = milestones.value.length
      statistics.value.completedMilestones = milestones.value.filter(m => m.is_completed).length
      statistics.value.progress = statistics.value.totalMilestones > 0 
        ? Number(((statistics.value.completedMilestones / statistics.value.totalMilestones) * 100).toFixed(2))
        : 0
    }
  } catch (error) {
    console.error('Failed to delete milestone:', error)
    alert('Failed to delete milestone')
  } finally {
    loadingMilestone.value = false
  }
}

const editingMilestone = ref<Milestone | null>(null)
const editMilestoneForm = ref({
  title: '',
  description: ''
})

const startEditMilestone = (milestone: Milestone) => {
  editingMilestone.value = milestone
  editMilestoneForm.value = {
    title: milestone.title,
    description: milestone.description || ''
  }
}

const saveEditMilestone = async () => {
  if (!editingMilestone.value || !editMilestoneForm.value.title.trim()) return
  
  loadingMilestone.value = true
  
  try {
    await taskApi.updateMilestone(props.task.id, editingMilestone.value.id, {
      title: editMilestoneForm.value.title,
      description: editMilestoneForm.value.description || undefined
    })
    
    const milestone = milestones.value.find(m => m.id === editingMilestone.value!.id)
    if (milestone) {
      milestone.title = editMilestoneForm.value.title
      milestone.description = editMilestoneForm.value.description || undefined
    }
    
    editingMilestone.value = null
  } catch (error) {
    console.error('Failed to update milestone:', error)
    alert('Failed to update milestone')
  } finally {
    loadingMilestone.value = false
  }
}

const cancelEditMilestone = () => {
  editingMilestone.value = null
  editMilestoneForm.value = { title: '', description: '' }
}

const cancelAddMilestone = () => {
  newMilestone.value = { title: '', description: '' }
  showAddMilestone.value = false
}

const formatDate = (dateStr: string): string => {
  try {
    return format(parseISO(dateStr), 'MMM dd, yyyy')
  } catch {
    return dateStr
  }
}

const formatProgress = (progress: number): string => {
  return progress.toFixed(2)
}

const saveMilestonesOrder = async () => {
  const reordered = milestones.value.map((m, idx) => ({
    id: m.id,
    order_index: idx,
  }));

  milestones.value.forEach((m, idx) => {
    m.order_index = idx;
  });

  await taskApi.reorderMilestones(props.task.id, reordered);
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.longterm-task-item {
  background: linear-gradient(to right, #faf5ff 0%, #ffffff 100%);
}

.longterm-task-item:hover {
  background: linear-gradient(to right, #f3e8ff 0%, #ffffff 100%);
}
</style>
