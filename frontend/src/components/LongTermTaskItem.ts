import { ref, computed, nextTick } from 'vue'
import { format, parseISO } from 'date-fns'
import type { LongTermTask, Milestone } from '@/types'
import { taskApi } from '@/utils/api'
import { useTaskStore } from '@/stores/taskStore'

type EmitFn = {
  (evt: 'edit', task: LongTermTask): void
  (evt: 'delete', id: string): void
  (evt: 'updated'): void
}

interface UseLongTermTaskItemProps {
  task: LongTermTask
}

export function useLongTermTaskItem(props: UseLongTermTaskItemProps, emit: EmitFn) {
  const taskStore = useTaskStore()
  
  const showMilestones = ref(false)
  const showAddMilestone = ref(false)
  const loadingMilestone = ref(false)
  const milestoneTitleInput = ref<HTMLInputElement | null>(null)
  const addMilestoneButton = ref<HTMLButtonElement | null>(null)

  const newMilestone = ref({
    title: '',
    description: ''
  })

  const editingMilestone = ref<Milestone | null>(null)
  const editMilestoneForm = ref({
    title: '',
    description: ''
  })

  const progressClass = computed(() => {
    if (!props.task.stat) return 'text-gray-600'
    
    const progress = props.task.stat.progress
    if (progress >= 100) return 'text-green-600'
    if (progress >= 75) return 'text-blue-600'
    if (progress >= 50) return 'text-yellow-600'
    return 'text-gray-600'
  })

  const progressBarClass = computed(() => {
    if (!props.task.stat) return 'bg-gray-400'
    
    const progress = props.task.stat.progress
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-gray-400'
  })

  const targetDateClass = computed(() => {
    if (!props.task.stat) return 'text-gray-500'
    
    const { isOverdue, daysToTarget } = props.task.stat
    if (isOverdue) return 'text-red-600'
    if (daysToTarget <= 7) return 'text-yellow-600'
    if (daysToTarget <= 30) return 'text-blue-600'
    return 'text-gray-500'
  })

  const getTargetDateText = (): string => {
    if (!props.task.stat) return ''
    
    const { isOverdue, daysToTarget } = props.task.stat
    if (isOverdue) return `${Math.abs(daysToTarget)} days overdue`
    if (daysToTarget === 0) return 'Due today'
    if (daysToTarget === 1) return '1 day left'
    return `${daysToTarget} days left`
  }

  const recalculateStatistics = () => {
    if (props.task.stat) {
      props.task.stat.totalMilestones = props.task.milestones?.length || 0
      props.task.stat.completedMilestones = props.task.milestones?.filter(m => m.is_completed).length || 0
      props.task.stat.progress = props.task.stat.totalMilestones > 0 
        ? Number(((props.task.stat.completedMilestones / props.task.stat.totalMilestones) * 100).toFixed(2))
        : 0

      if (props.task.stat.progress >= 100) taskStore.fetchTasks()
    }
  }

  const createMilestone = async () => {
    if (!newMilestone.value.title.trim()) return
    
    loadingMilestone.value = true
    
    try {
      const response = await taskApi.createMilestone(props.task.id, {
        title: newMilestone.value.title,
        description: newMilestone.value.description || undefined,
        order_index: props.task.milestones?.length || 0
      })
      props.task.milestones?.push(response.milestone)
      recalculateStatistics()
      newMilestone.value = { title: '', description: '' }
      showAddMilestone.value = false
    } catch (error) {
      console.error('Failed to create milestone:', error)
      alert('Failed to create milestone')
    } finally {
      loadingMilestone.value = false
    }

    addMilestoneButton.value?.focus()
  }

  const toggleMilestone = async (milestoneId: string) => {
    loadingMilestone.value = true
    
    try {
      await taskApi.toggleMilestoneCompletion(props.task.id, milestoneId)
      
      const milestone = props.task.milestones?.find(m => m.id === milestoneId)
      if (milestone) {
        milestone.is_completed = !milestone.is_completed
        if (milestone.is_completed) {
          milestone.completion_at = new Date().toISOString()
        } else {
          milestone.completion_at = undefined
        }
      }
      recalculateStatistics()
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
      await taskApi.deleteMilestone(props.task.id, milestoneId)
      let index = -1
      if (props.task.milestones) {
        index = props.task.milestones.findIndex(m => m.id === milestoneId)
      }
      if (index > -1) {
        props.task.milestones?.splice(index, 1)
      }
      recalculateStatistics()
    } catch (error) {
      console.error('Failed to delete milestone:', error)
      alert('Failed to delete milestone')
    } finally {
      loadingMilestone.value = false
    }
  }

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
      
      const milestone = props.task.milestones?.find(m => m.id === editingMilestone.value!.id)
      if (milestone) {
        milestone.title = editMilestoneForm.value.title
        milestone.description = editMilestoneForm.value.description || undefined
      }
      
      editingMilestone.value = null
      recalculateStatistics()
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

  const handleAddMilestoneClick = async () => {
    showAddMilestone.value = true
    await nextTick()
    milestoneTitleInput.value?.focus()
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
    try {
      const milestoneOrders = props.task.milestones?.map((milestone, index) => ({
        id: milestone.id,
        order_index: index
      }))
      if (!milestoneOrders) return
      await taskApi.reorderMilestones(props.task.id, milestoneOrders)
    } catch (error) {
      console.error('Failed to reorder milestones:', error)
      alert('Failed to save milestone order. Please refresh the page.')
    }
  }

  return {
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
  }
}

