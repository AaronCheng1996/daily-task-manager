// Enums matching backend
export enum TaskType {
  HABIT = 'HABIT',
  DAILY_TASK = 'DAILY_TASK',
  TODO = 'TODO', 
  LONG_TERM = 'LONG_TERM'
}

export enum HabitType {
  GOOD = 'GOOD',
  BAD = 'BAD'
}

export enum RecurrenceType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  EVERY_X_DAYS = 'EVERY_X_DAYS',
  EVERY_X_WEEKS = 'EVERY_X_WEEKS',
  EVERY_X_MONTHS = 'EVERY_X_MONTHS',
  WEEKLY_ON_DAYS = 'WEEKLY_ON_DAYS',
  MONTHLY_ON_DAYS = 'MONTHLY_ON_DAYS',
  WEEK_OF_MONTH_ON_DAYS = 'WEEK_OF_MONTH_ON_DAYS'
}

export enum TimeRangeType {
  DAYS = 'DAYS',
  WEEKS = 'WEEKS', 
  MONTHS = 'MONTHS'
}

// User types
export interface User {
  id: string
  username: string
  email: string
  preferred_language: string
  timezone: string
  created_at: string
  updated_at: string
}

export interface LoginCredentials {
  usernameOrEmail: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

export interface ResetPasswordData {
  oldPassword: string
  newPassword: string
}

// Task types
export interface TaskBase {
  id: string
  user_id: string
  title: string
  description?: string
  task_type: TaskType
  importance: number
  is_completed: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface HabitTask extends TaskBase {
  task_type: TaskType.HABIT
  habit_type: HabitType
  threshold_count: number
  time_range_value: number
  time_range_type: TimeRangeType
  last_completion_at?: string
  stat?: HabitStatistics
}

export interface DailyTask extends TaskBase {
  task_type: TaskType.DAILY_TASK
  started_at: string
  is_recurring: boolean
  recurrence_type: RecurrenceType
  recurrence_interval?: number
  recurrence_days_of_week?: number[]
  recurrence_days_of_month?: number[]
  recurrence_weeks_of_month?: number[]
  current_consecutive_completed: number
  current_consecutive_missed: number
  max_consecutive_completed: number
  last_reset_at?: string
  stat?: DailyTaskStatistics
}

export interface TodoTask extends TaskBase {
  task_type: TaskType.TODO
  due_at?: string
  is_overdue: boolean
}

export interface LongTermTask extends TaskBase {
  task_type: TaskType.LONG_TERM
  progress: number
  show_progress: boolean
  target_completion_at?: string
  stat?: LongTermTaskStatistics
  milestones?: Milestone[]
}

export type Task = HabitTask | DailyTask | TodoTask | LongTermTask

// Habit Statistics types
export interface HabitStatistics {
  completionCount: number
  completionRate: number
  isSuccessful: boolean
  daysSinceLastCompletion: number
  completionHistory: Array<{ date: string; count: number }>
}

export interface HabitCompletionRecord {
  id: string
  completed_at: string
}

// Daily Task Statistics types
export interface DailyTaskStatistics {
  completionRate: number
  currentStreak: number
  longestStreak: number
  missedStreak: number
  recentHistory: Array<{ date: string; completed: boolean; expected: boolean }>
  nextOccurrence: string
}

// Long Term Task Statistics types
export interface LongTermTaskStatistics {
  totalMilestones: number
  completedMilestones: number
  progress: number
  isOverdue: boolean
  daysToTarget: number
  milestonesByStatus: {
    completed: Milestone[]
    pending: Milestone[]
  }
}

// Milestone types
export interface Milestone {
  id: string
  task_id: string
  title: string
  description?: string
  is_completed: boolean
  completion_at?: string
  order_index: number
  created_at: string
}

// API Response types
export interface ApiResponse<T = any> {
  message?: string
  user?: User
  token?: string
  task?: TaskBase
  tasks?: Task[]
  stats?: HabitStatistics | DailyTaskStatistics | LongTermTaskStatistics
  history?: HabitCompletionRecord[]
  milestone?: Milestone
  milestones?: Milestone[]
  taskProgress?: number
  taskCompleted?: boolean
  data?: T
  error?: string
  details?: any[]
  tasksProcessed?: number
  tasksReset?: number
}
