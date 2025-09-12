import { ulid } from 'ulid';
import { prisma } from '../utils/prisma';
import { TaskType } from '../generated/prisma';
import { HabitService } from './habitService';
import { DailyTaskService } from './dailyTaskService';
import { TodoService } from './todoService';
import { HabitTaskData, DailyTaskData, TodoTaskData, LongTermTaskData, TaskData } from '../models/task';

let lastTaskOrderIndex = 0;

export class TaskService {
  static async getUserTasks(userId: string): Promise<TaskData[]> {
    const tasks = await prisma.task.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });
    
    return tasks as TaskData[];
  }

  static async getTaskById(taskId: string, userId: string): Promise<TaskData | null> {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        user_id: userId
      }
    });
    
    return task as TaskData | null;
  }

  static async createTask(userId: string, taskData: any): Promise<TaskData> {
    const taskType = taskData.task_type;
    if (!taskType) {
      throw new Error('Task type is required');
    }

    let newTask: TaskData | undefined;
    switch (taskType) {
      case TaskType.HABIT:
        newTask = taskData as HabitTaskData;
        break;
      case TaskType.DAILY_TASK:
        newTask = taskData as DailyTaskData;
        break;
      case TaskType.TODO:
        newTask = taskData as TodoTaskData;
            break;
      case TaskType.LONG_TERM:
        newTask = taskData as LongTermTaskData;
        break;
    }

    if (newTask === undefined) {
      throw new Error('Invalid task data');
    }

    if (lastTaskOrderIndex === 0) {
      lastTaskOrderIndex = await this.getLastTaskOrderIndex(userId);
    }
    lastTaskOrderIndex += 1000;

    const result = await prisma.task.create({
      data: {
        id: ulid(),
        ...newTask,
        user_id: userId,
        order_index: lastTaskOrderIndex
      }
    });
    
    return result as TaskData;
  }

  static async updateTask(taskId: string, userId: string, updates: Partial<any>): Promise<TaskData | null> {
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
    
    return updatedTask as TaskData | null;
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

  static async toggleTaskCompletion(taskId: string, userId: string): Promise<TaskData | null> {
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
          return habitResult.task as TaskData;
        } else {
          throw new Error('Habit completion cannot be undone');
        }
      }
      
      if (task.task_type === TaskType.DAILY_TASK) {
        const targetDate = new Date();
        const dailyResult = await DailyTaskService.toggleDailyTaskCompletion(taskId, userId, targetDate);
        return dailyResult.task as TaskData;
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
      
      return updatedTask as TaskData;
    });
  }

  static async updateOverdueTasks(): Promise<void> {
    await TodoService.updateOverdueTasks();
  }

  private static async getLastTaskOrderIndex(userId: string): Promise<number> {
    const result = await prisma.task.findFirst({
        where: { user_id: userId },
        orderBy: { order_index: 'desc' },
        select: { order_index: true }
    });
    return result?.order_index ?? 0;
  }
}
