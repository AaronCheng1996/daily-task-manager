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
  MONTHLY_ON_DAYS = 'MONTHLY_ON_DAYS'
}

export enum TimeRangeType {
  DAYS = 'DAYS',
  WEEKS = 'WEEKS',
  MONTHS = 'MONTHS'
}

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  preferred_language: string;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}

export interface TaskBase {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  task_type: TaskType;
  importance: number;
  is_completed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface HabitTask extends TaskBase {
  task_type: TaskType.HABIT;
  habit_type: HabitType;
  threshold_count: number;
  time_range_value: number;
  time_range_type: TimeRangeType;
  last_completion_time?: Date;
}

export interface DailyTask extends TaskBase {
  task_type: TaskType.DAILY_TASK;
  target_date: Date;
  is_recurring: boolean;
  recurrence_type: RecurrenceType;
  recurrence_interval?: number;
  recurrence_day_of_week?: number;
  recurrence_day_of_month?: number;
  current_consecutive_completed: number;
  current_consecutive_missed: number;
  max_consecutive_completed: number;
  last_reset_date?: Date;
}

export interface TodoTask extends TaskBase {
  task_type: TaskType.TODO;
  due_date?: Date;
  is_overdue: boolean;
}

export interface LongTermTask extends TaskBase {
  task_type: TaskType.LONG_TERM;
  progress: number;
  show_progress: boolean;
  target_completion_date?: Date;
}

export type Task = HabitTask | DailyTask | TodoTask | LongTermTask;

export interface TaskNote {
  id: string;
  task_id: string;
  text: string;
  is_completed: boolean;
  order_index: number;
  created_at: Date;
}

export interface Milestone {
  id: string;
  task_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  completion_date?: Date;
  order_index: number;
  created_at: Date;
}

export interface CompletionHistory {
  id: string;
  task_id: string;
  completion_date: Date;
  is_completed: boolean;
  recorded_at: Date;
}

export interface HabitCompletion {
  id: string;
  task_id: string;
  completed_at: Date;
}
