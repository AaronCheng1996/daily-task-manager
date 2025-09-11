import type { Task as TaskBase } from '../generated/prisma';
import type { HabitType, RecurrenceType, TimeRangeType } from '../generated/prisma';

export type HabitTask = TaskBase & {
  task_type: 'HABIT';
  habit_type: HabitType;
  threshold_count: number;
  time_range_value: number;
  time_range_type: TimeRangeType;
  last_completion_time?: Date | null;
};

export type DailyTask = TaskBase & {
  task_type: 'DAILY_TASK';
  started_at: Date | null;
  is_recurring: boolean;
  recurrence_type: RecurrenceType | null;
  recurrence_interval: number | null;
  recurrence_days_of_week: number[];
  recurrence_days_of_month: number[];
  recurrence_weeks_of_month: number[];
  current_consecutive_completed: number;
  current_consecutive_missed: number;
  max_consecutive_completed: number;
  last_reset_at: Date | null;
};

export type TodoTask = TaskBase & {
  task_type: 'TODO';
  due_at: Date | null;
  is_overdue: boolean;
};

export type LongTermTask = TaskBase & {
  task_type: 'LONG_TERM';
  progress: number;
  show_progress: boolean;
  target_completion_at: Date | null;
};

export type Task = HabitTask | DailyTask | TodoTask | LongTermTask;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}