import type { TaskType, HabitType, TimeRangeType, RecurrenceType } from '../generated/prisma';

export interface TaskData {
  task_type: TaskType;
  title: string;
  description: string | null;
  importance: number;
  order_index: number;
}

export interface HabitTaskData extends TaskData {
  habit_type: HabitType;
  threshold_count: number;
  time_range_value: number;
  time_range_type: TimeRangeType;
}

export interface DailyTaskData extends TaskData {
  started_at: Date | null;
  is_recurring: boolean;
  recurrence_type: RecurrenceType | null;
  recurrence_interval: number | null;
  recurrence_days_of_week: number[];
  recurrence_days_of_month: number[];
  recurrence_weeks_of_month: number[];
}

export interface TodoTaskData extends TaskData {
  due_at: Date | null;
}

export interface LongTermTaskData extends TaskData {
  show_progress: boolean;
  target_completion_at: Date | null;
}

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