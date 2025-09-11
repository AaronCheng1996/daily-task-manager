import { ulid } from 'ulid';
import { prisma } from '../utils/prisma';
import { Task } from '../models/task';
import { TaskType } from '../generated/prisma';
import { HabitService } from './habitService';
import { DailyTaskService } from './dailyTaskService';
import { TodoService } from './todoService';

export class TaskService {
  static async getUserTasks(userId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });
    
    return tasks as Task[];
  }

  static async getTaskById(taskId: string, userId: string): Promise<Task | null> {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        user_id: userId
      }
    });
    
    return task as Task | null;
  }

  static async createTask(userId: string, taskData: any): Promise<Task> {
    const taskId = ulid();
    
    const baseData = {
      id: taskId,
      user_id: userId,
      title: taskData.title,
      description: taskData.description || null,
      task_type: taskData.task_type,
      importance: taskData.importance || 1,
      order_index: taskData.order_index || 0
    };
    
    let additionalData: any = {};
    
    switch (taskData.task_type) {
      case TaskType.HABIT:
        additionalData = {
          habit_type: taskData.habit_type,
          threshold_count: taskData.threshold_count,
          time_range_value: taskData.time_range_value,
          time_range_type: taskData.time_range_type
        };
        break;
        
      case TaskType.DAILY_TASK:
        additionalData = {
          started_at: taskData.started_at ? new Date(taskData.started_at) : new Date(),
          is_recurring: taskData.is_recurring !== undefined ? taskData.is_recurring : true,
          recurrence_type: taskData.recurrence_type,
          recurrence_interval: taskData.recurrence_interval,
          recurrence_days_of_week: taskData.recurrence_days_of_week || [],
          recurrence_days_of_month: taskData.recurrence_days_of_month || [],
          recurrence_weeks_of_month: taskData.recurrence_weeks_of_month || []
        };
        break;
        
      case TaskType.TODO:
        additionalData = {
          due_at: taskData.due_at ? new Date(taskData.due_at) : null
        };
        break;
        
      case TaskType.LONG_TERM:
        additionalData = {
          show_progress: taskData.show_progress !== undefined ? taskData.show_progress : true,
          target_completion_at: taskData.target_completion_at ? new Date(taskData.target_completion_at) : null
        };
        break;
    }
    
    const task = await prisma.task.create({
      data: {
        ...baseData,
        ...additionalData
      }
    });
    
    return task as Task;
  }

  static async updateTask(taskId: string, userId: string, updates: Partial<any>): Promise<Task | null> {
    const validUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(validUpdates).length === 0) {
      throw new Error('No valid updates provided');
    }
    
    const processedUpdates: any = {};
    for (const [key, value] of Object.entries(validUpdates)) {
      if (key.includes('date') || key.includes('_date') || key.includes('_at')) {
        processedUpdates[key] = value ? new Date(value as string) : null;
      } else {
        processedUpdates[key] = value;
      }
    }
    
    const task = await prisma.task.updateMany({
      where: {
        id: taskId,
        user_id: userId
      },
      data: processedUpdates
    });
    
    if (task.count === 0) {
      return null;
    }
    
    const updatedTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        user_id: userId
      }
    });
    
    return updatedTask as Task | null;
  }

  static async deleteTask(taskId: string, userId: string): Promise<boolean> {
    const result = await prisma.task.deleteMany({
      where: {
        id: taskId,
        user_id: userId
      }
    });
    
    return result.count > 0;
  }

  static async toggleTaskCompletion(taskId: string, userId: string): Promise<Task | null> {
    return await prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: {
          id: taskId,
          user_id: userId
        }
      });
      
      if (!task) {
        return null;
      }
      
      const newCompletedStatus = !task.is_completed;
      
      if (task.task_type === TaskType.HABIT) {
        if (newCompletedStatus) {
          const habitResult = await HabitService.recordHabitCompletion(taskId, userId);
          return habitResult.task;
        } else {
          throw new Error('Habit completion cannot be undone');
        }
      }
      
      if (task.task_type === TaskType.DAILY_TASK) {
        const targetDate = new Date();
        const dailyResult = await DailyTaskService.toggleDailyTaskCompletion(taskId, userId, targetDate);
        return dailyResult.task;
      }
      
      const updateData: any = {
        is_completed: newCompletedStatus
      };
      
      if (task.task_type === TaskType.TODO && newCompletedStatus) {
        updateData.is_overdue = false;
      }
      
      const updatedTask = await tx.task.update({
        where: {
          id: taskId
        },
        data: updateData
      });
      
      return updatedTask as Task;
    });
  }

  static async updateOverdueTasks(): Promise<void> {
    await TodoService.updateOverdueTasks();
  }
}
