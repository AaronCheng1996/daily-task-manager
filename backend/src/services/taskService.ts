import { ulid } from 'ulid';
import { Task, TaskType } from '../generated/prisma';
import { ErrorType } from '../utils/messages.enum';
import { prisma } from '../utils/prisma';
import { DailyTaskService } from './dailyTaskService';
import { HabitService } from './habitService';
import { MilestoneService } from './milestoneService';
import logger from '../utils/logger';

let lastTaskOrderIndex = 0;

export class TaskService {
  static async getUserTasks(userId: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
    
    return tasks;
  }

  static async getTaskById(taskId: string): Promise<Task | null> {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
      }
    });
    
    return task;
  }

  static async createTask(userId: string, taskData: any): Promise<Task> {
    let newTask: Task | undefined;
    try {
      newTask = taskData as Task;
      newTask.id = ulid();
    } catch (error) {
      logger.error(error);
      throw new Error(ErrorType.BAD_REQUEST);
    }

    if (lastTaskOrderIndex === 0) {
      lastTaskOrderIndex = await this.getLastTaskOrderIndex();
    }
    lastTaskOrderIndex += 1000;

    const result = await prisma.task.create({
      data: {
        ...newTask,
        user_id: userId,
        order_index: lastTaskOrderIndex
      }
    });
    return result;
  }

  static async updateTask(taskId: string, updates: Partial<any>): Promise<Task | null> {
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updates
    });    
    return updatedTask;
  }

  static async deleteTask(taskId: string): Promise<boolean> {
    const result = await prisma.task.delete({
      where: {
        id: taskId
      }
    });
    
    return result !== null;
  }

  static async toggleTaskCompletion(taskId: string): Promise<Task | null> {
    return await prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirst({
        where: {
          id: taskId,
        }
      });
      
      if (!task) {
        throw new Error(ErrorType.NOT_FOUND);
      }
      
      if (task.task_type === TaskType.HABIT) {
        const habitResult = await HabitService.recordHabitCompletion(task);
        return habitResult.task;
      }
      
      if (task.task_type === TaskType.DAILY_TASK) {
        const targetDate = new Date();
        const dailyResult = await DailyTaskService.toggleDailyTaskCompletion(task, targetDate);
        return dailyResult.task;
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
          id: task.id
        },
        data: updateData
      });
      
      return updatedTask;
    });
  }

  static async getTaskStatistics(task: Task): Promise<any> {
    if (task.task_type === TaskType.HABIT) {
      return HabitService.getHabitStatistics(task);
    }
    if (task.task_type === TaskType.DAILY_TASK) {
      return DailyTaskService.getDailyTaskStatistics(task);
    }
    if (task.task_type === TaskType.LONG_TERM) {
      return MilestoneService.getLongTermTaskStatistics(task);
    }
  }

  private static async getLastTaskOrderIndex(): Promise<number> {
    const task = await prisma.task.findFirst({
        orderBy: { order_index: 'desc' },
        select: { order_index: true }
    });
    return task?.order_index ?? 0;
  }

  static async reorderTasks(taskId: string, prevOrderIndex: number | null, nextOrderIndex: number | null): Promise<void> {
    let orderIndex = 0;
    if (prevOrderIndex !== null && nextOrderIndex !== null) {
      orderIndex = (prevOrderIndex + nextOrderIndex) / 2;
    } else if (prevOrderIndex !== null) {
      orderIndex = prevOrderIndex + 1000;
      if (orderIndex > lastTaskOrderIndex) {
        lastTaskOrderIndex = orderIndex;
      }
    } else if (nextOrderIndex !== null) {
      orderIndex = nextOrderIndex / 2;
    } else {
      throw new Error(ErrorType.BAD_REQUEST);
    }

    if (orderIndex === prevOrderIndex || orderIndex === nextOrderIndex) {
      this.reorderAllTasks();
      return;
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { order_index: orderIndex }
    });
  }

  static async reorderAllTasks(): Promise<void> {
    const tasks = await prisma.task.findMany({
      orderBy: { order_index: 'asc' }
    });

    let orderIndex = 0;
    for (const task of tasks) {
      orderIndex += 1000;
      await prisma.task.update({
        where: { id: task.id },
        data: { order_index: orderIndex }
      });
    }
    
    lastTaskOrderIndex = orderIndex;
  }
}
