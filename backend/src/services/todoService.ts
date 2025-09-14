import moment from 'moment';
import { Task } from '../generated/prisma';
import { prisma } from '../utils/prisma';

interface TodoTask extends Task {
  due_at: Date;
  is_completed: boolean;
  is_overdue: boolean;
}

export class TodoService {
  /**
   * Update the overdue status of all TODO tasks
   */
  static async updateOverdueTasks(): Promise<{
    updatedCount: number;
    overdueTaskIds: string[];
  }> {
    const result = await prisma.task.updateMany({
      where: {
        task_type: 'TODO',
        due_at: {
          lt: new Date()
        },
        is_completed: false,
        is_overdue: false
      },
      data: {
        is_overdue: true
      }
    });

    const overdueTasks = await prisma.task.findMany({
      where: {
        task_type: 'TODO',
        due_at: {
          lt: new Date()
        },
        is_completed: false,
        is_overdue: true
      },
      select: {
        id: true
      }
    });

    return {
      updatedCount: result.count,
      overdueTaskIds: overdueTasks.map(task => task.id)
    };
  }

  /**
   * Get all overdue tasks of the user
   */
  static async getOverdueTasks(userId: string): Promise<TodoTask[]> {
    const tasks = await prisma.task.findMany({
      where: {
        user_id: userId,
        task_type: 'TODO',
        is_completed: false,
        is_overdue: true
      }
    });

    return tasks as TodoTask[];
  }

  /**
   * Get the upcoming tasks (within 7 days)
   */
  static async getUpcomingTasks(userId: string, days: number = 7): Promise<TodoTask[]> {
    const tasks = await prisma.task.findMany({
      where: {
        user_id: userId,
        task_type: 'TODO',
        is_completed: false,
        due_at: {
          gte: new Date(),
          lte: moment().add(days, 'days').toDate()
        }
      }
    });

    return tasks as TodoTask[];
  }
}
