import { computed } from 'vue'
import { format } from 'date-fns'
import type { Task, TodoTask } from '@/types'
import { TaskType } from '@/types'

interface UseTaskItemProps {
  task: Task
}

export function useTaskItem(props: UseTaskItemProps) {
  const showDueDate = computed(() => {
    return props.task.task_type === TaskType.TODO && (props.task as TodoTask).due_at
  })

  const dueDateText = computed(() => {
    if (!showDueDate.value) return ''
    
    const todoTask = props.task as TodoTask
    const dueDate = new Date(todoTask.due_at!)
    const now = new Date()
    
    now.setHours(0, 0, 0, 0)
    const dueDateNormalized = new Date(dueDate)
    dueDateNormalized.setHours(0, 0, 0, 0)
    
    const diffTime = dueDateNormalized.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays)
      return overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`
    } else if (diffDays === 0) {
      return 'Due today'
    } else if (diffDays === 1) {
      return 'Due tomorrow'
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`
    } else {
      return `Due ${format(dueDate, 'MMM d')}`
    }
  })

  const taskTypeBadgeClass = computed(() => {
    const baseClasses = 'text-white'
    switch (props.task.task_type) {
      case TaskType.TODO:
        return `${baseClasses} bg-gradient-to-r from-blue-500 to-blue-600`
      case TaskType.HABIT:
        return `${baseClasses} bg-gradient-to-r from-purple-500 to-purple-600`
      case TaskType.DAILY_TASK:
        return `${baseClasses} bg-gradient-to-r from-green-500 to-green-600`
      case TaskType.LONG_TERM:
        return `${baseClasses} bg-gradient-to-r from-orange-500 to-orange-600`
      default:
        return `${baseClasses} bg-gradient-to-r from-gray-500 to-gray-600`
    }
  })

  const taskTypeIconClass = computed(() => {
    return 'text-white'
  })

  const taskTypeIcon = computed(() => {
    switch (props.task.task_type) {
      case TaskType.TODO:
        return 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
      case TaskType.HABIT:
        return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
      case TaskType.DAILY_TASK:
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
      case TaskType.LONG_TERM:
        return 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
      default:
        return 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2'
    }
  })

  const priorityBadgeClass = computed(() => {
    switch (props.task.importance) {
      case 5:
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white'
      case 4:
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
      case 3:
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
      case 2:
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    }
  })

  const dueDateBadgeClass = computed(() => {
    if (!showDueDate.value) return ''
    
    const todoTask = props.task as TodoTask
    const dueDate = new Date(todoTask.due_at!)
    const now = new Date()
    
    now.setHours(0, 0, 0, 0)
    const dueDateNormalized = new Date(dueDate)
    dueDateNormalized.setHours(0, 0, 0, 0)
    
    const diffTime = dueDateNormalized.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0 && !props.task.is_completed) {
      return 'bg-gradient-to-r from-red-500 to-red-600 text-white'
    } else if (diffDays === 0) {
      return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
    } else if (diffDays === 1) {
      return 'bg-gradient-to-r from-green-500 to-green-600 text-white'
    } else if (diffDays <= 7) {
      return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
    } else {
      return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    }
  })

  return {
    showDueDate,
    dueDateText,
    taskTypeBadgeClass,
    taskTypeIconClass,
    taskTypeIcon,
    priorityBadgeClass,
    dueDateBadgeClass
  }
}

