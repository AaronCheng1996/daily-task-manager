import { ulid } from 'ulid';
import { Task, TaskType } from '../generated/prisma';
import { ErrorType } from '../utils/messages.enum';
import { prisma } from '../utils/prisma';
import { DailyTaskService } from './dailyTaskService';
import { HabitService } from './habitService';

let lastTaskOrderIndex = 0;

export class TaskService {
  static async getUserTasks(userId: string, filter: object, skip: number, take: number): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      skip,
      take,
      ...filter
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
    let newTask: Task | undefined;
    try {
      newTask = taskData as Task;
      newTask.id = ulid();
    } catch (error) {
      throw new Error(ErrorType.BAD_REQUEST);
    }

    if (lastTaskOrderIndex === 0) {
      lastTaskOrderIndex = await this.getLastTaskOrderIndex(userId);
    }
    lastTaskOrderIndex += 1000;

    try {
      const result = await prisma.task.create({
        data: {
          ...newTask,
          user_id: userId,
          order_index: lastTaskOrderIndex
        }
      });
      return result as Task;
    } catch (error) {
      throw error;
    }    
  }

  static async updateTask(taskId: string, userId: string, updates: Partial<any>): Promise<Task | null> {
    try {
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updates
      });    
      return updatedTask as Task;
    } catch (error) {
      throw error;
    }
  }

  static async deleteTask(taskId: string, userId: string): Promise<boolean> {
    const result = await prisma.task.delete({
      where: {
        id: taskId,
        user_id: userId
      }
    });
    
    return result !== null;
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
        throw new Error(ErrorType.NOT_FOUND);
      }
      
      if (task.task_type === TaskType.HABIT) {
        const habitResult = await HabitService.recordHabitCompletion(taskId);
        return habitResult.task as Task;
      }
      
      if (task.task_type === TaskType.DAILY_TASK) {
        const targetDate = new Date();
        const dailyResult = await DailyTaskService.toggleDailyTaskCompletion(taskId, targetDate);
        return dailyResult.task as Task;
      }
      
      const newCompletedStatus = !task.is_completed;
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

  private static async getLastTaskOrderIndex(userId: string): Promise<number> {
    const task = await prisma.task.findFirst({
        where: { user_id: userId },
        orderBy: { order_index: 'desc' },
        select: { order_index: true }
    });
    return task?.order_index ?? 0;
  }
}
