import moment from 'moment';
import { ulid } from 'ulid';
import { RecurrenceType, Task, TaskType } from '../generated/prisma';
import { ErrorType } from '../utils/messages.enum';
import { prisma } from '../utils/prisma';

interface DailyTask extends Task {
  started_at: Date | null;
  is_recurring: boolean;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  recurrence_days_of_week: number[];
}

export class DailyTaskService {
  /**
   * Check if the daily task should appear on the specified date
   */
  static shouldTaskAppearOnDate(task: DailyTask, targetDate: Date): boolean {
    const taskDate = new Date(task.started_at || task.created_at);
    
    if (!task.is_recurring && targetDate > taskDate) {
      return false;
    }

    switch (task.recurrence_type) {
      case RecurrenceType.DAILY:
        return true;
        
      case RecurrenceType.WEEKLY:
        return targetDate.getDay() === taskDate.getDay();
        
      case RecurrenceType.MONTHLY:
        return targetDate.getDate() === taskDate.getDate();
        
      case RecurrenceType.YEARLY:
        return targetDate.getMonth() === taskDate.getMonth() && 
               targetDate.getDate() === taskDate.getDate();
               
      case RecurrenceType.EVERY_X_DAYS:
        const daysDiff = moment(targetDate).diff(moment(taskDate), 'days');
        return daysDiff >= 0 && daysDiff % (task.recurrence_interval || 1) === 0;
        
      case RecurrenceType.EVERY_X_WEEKS:
        const weeksDiff = moment(targetDate).diff(moment(taskDate), 'weeks');
        return weeksDiff >= 0 && 
               weeksDiff % (task.recurrence_interval || 1) === 0 &&
               targetDate.getDay() === taskDate.getDay();
               
      case RecurrenceType.EVERY_X_MONTHS:
        const monthsDiff = moment(targetDate).diff(moment(taskDate), 'months');
        return monthsDiff >= 0 && 
               monthsDiff % (task.recurrence_interval || 1) === 0 &&
               targetDate.getDate() === taskDate.getDate();
               
      case RecurrenceType.WEEKLY_ON_DAYS:
        return task.recurrence_days_of_week?.includes(targetDate.getDay()) || false;
        
      case RecurrenceType.MONTHLY_ON_DAYS:
        if (task.recurrence_days_of_month?.includes(-1)) {
          const nextMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
          return targetDate.getDate() === nextMonth.getDate();
        } else {
          return task.recurrence_days_of_month?.includes(targetDate.getDate()) || false;
        }
        
      case RecurrenceType.WEEK_OF_MONTH_ON_DAYS:
        if (!task.recurrence_days_of_week?.includes(targetDate.getDay())) {
          return false;
        }
        // 以週日為起點計算當天是該月第幾週
        const firstDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const dayOfWeekOfFirst = firstDayOfMonth.getDay();
        const dayOfMonth = targetDate.getDate();
        const weekOfMonth = Math.ceil((dayOfMonth + dayOfWeekOfFirst - 1) / 7);
        if (!task.recurrence_weeks_of_month?.includes(weekOfMonth)) {
          return false;
        }
        return true;
        
      default:
        return false;
    }
  }

  /**
   * Calculate the next occurrence date
   */
  static calculateNextOccurrence(task: DailyTask, fromDate: Date = new Date()): Date {
    const nextDate = new Date(fromDate);
    nextDate.setHours(0, 0, 0, 0);

    let maxIterations = 365;
    
    while (maxIterations > 0) {
      nextDate.setDate(nextDate.getDate() + 1);
      
      if (this.shouldTaskAppearOnDate(task, nextDate)) {
        return nextDate;
      }
      
      maxIterations--;
    }
    
    const fallback = new Date(fromDate);
    fallback.setFullYear(fallback.getFullYear() + 1);
    return fallback;
  }

  /**
   * Complete or cancel the daily task
   */
  static async toggleDailyTaskCompletion(
    taskId: string, 
    targetDate: Date = new Date()
  ): Promise<{
    task: DailyTask;
    wasCompleted: boolean;
    consecutiveStats: {
      completed: number;
      missed: number;
      maxCompleted: number;
    }
  }> {
    const tasks = await prisma.task.findMany({
      where: { id: taskId }
    });

    if (tasks.length === 0) {
      throw new Error(ErrorType.NOT_FOUND);
    }

    const task = tasks[0] as DailyTask;
    const today = targetDate.toISOString().split('T')[0];

    if (!this.shouldTaskAppearOnDate(task, targetDate)) {
      throw new Error(ErrorType.BAD_REQUEST);
    }

    const histories = await prisma.completionHistory.findMany({
      where: { task_id: taskId, completion_at: today }
    });

    let wasCompleted = false;
    let newCompletionStatus = false;

    if (histories.length > 0) {
      wasCompleted = histories[0].is_completed;
      newCompletionStatus = !wasCompleted;
      await prisma.completionHistory.update({
        where: { id: histories[0].id },
        data: { is_completed: newCompletionStatus, recorded_at: new Date() }
      });
    } else {
      newCompletionStatus = true;
      await prisma.completionHistory.create({
        data: { id: ulid(), task_id: taskId, completion_at: today, is_completed: newCompletionStatus, recorded_at: new Date() }
      });
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { is_completed: newCompletionStatus, updated_at: new Date() }
    });

    const consecutiveStats = await this.recalculateConsecutiveStats(task);

    await prisma.task.update({
      where: { id: taskId },
      data: { current_consecutive_completed: consecutiveStats.completed, current_consecutive_missed: consecutiveStats.missed, max_consecutive_completed: consecutiveStats.maxCompleted, last_reset_at: new Date() }
    });

    return {
      task: task,
      wasCompleted,
      consecutiveStats
    };
  }

  /**
   * Recalculate the consecutive completed/missed statistics
   */
  private static async recalculateConsecutiveStats(task: DailyTask): Promise<{
    completed: number;
    missed: number;
    maxCompleted: number;
  }> {
    const histories = await prisma.completionHistory.findMany({
      where: { task_id: task.id, completion_at: { gte: new Date(new Date().setDate(new Date().getDate() - 365)) } },
      orderBy: { completion_at: 'desc' }
    });

    const shouldAppearDates = this.generateExpectedDates(task, 365);
    
    const completionMap = new Map();
    histories.forEach((record: { completion_at: Date; is_completed: boolean }) => {
      completionMap.set(record.completion_at, record.is_completed);
    });

    let currentConsecutiveCompleted = 0;
    let currentConsecutiveMissed = 0;
    let maxConsecutiveCompleted = 0;
    let tempConsecutiveCompleted = 0;
    
    const sortedDates = shouldAppearDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let foundFirstStatus = false;
    const today = new Date();
    
    for (const date of sortedDates) {
      const wasCompleted = completionMap.get(date) || false;
      const isToday = date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
      
      const shouldCountAsMissed = !wasCompleted && !isToday;
      
      if (!foundFirstStatus) {
        foundFirstStatus = true;
        if (wasCompleted) {
          currentConsecutiveCompleted = 1;
          tempConsecutiveCompleted = 1;
          currentConsecutiveMissed = 0;
        } else if (shouldCountAsMissed) {
          currentConsecutiveMissed = 1;
          currentConsecutiveCompleted = 0;
          tempConsecutiveCompleted = 0;
        }
      } else {
        if (wasCompleted && currentConsecutiveCompleted > 0) {
          currentConsecutiveCompleted++;
          tempConsecutiveCompleted++;
        } else if (shouldCountAsMissed && currentConsecutiveMissed > 0) {
          currentConsecutiveMissed++;
        } else if (wasCompleted && currentConsecutiveMissed > 0) {
          currentConsecutiveCompleted = 1;
          currentConsecutiveMissed = 0;
          tempConsecutiveCompleted = 1;
        } else if (shouldCountAsMissed && currentConsecutiveCompleted > 0) {
          currentConsecutiveMissed = 1;
          currentConsecutiveCompleted = 0;
          tempConsecutiveCompleted = 0;
        }
      }
      
      maxConsecutiveCompleted = Math.max(maxConsecutiveCompleted, tempConsecutiveCompleted);
    }

    return {
      completed: currentConsecutiveCompleted,
      missed: currentConsecutiveMissed,
      maxCompleted: Math.max(maxConsecutiveCompleted, task.max_consecutive_completed || 0)
    };
  }

  /**
   * Generate the list of dates that should appear within the specified number of days
   */
  private static generateExpectedDates(task: DailyTask, days: number): Date[] {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskCreatedDate = new Date(task.created_at);
    taskCreatedDate.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(task.started_at || task.created_at);
    targetDate.setHours(0, 0, 0, 0);
    
    const effectiveStartDate = targetDate > taskCreatedDate ? targetDate : taskCreatedDate;

    for (let i = days - 1; i >= 0; i--) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);

      if (checkDate >= effectiveStartDate && this.shouldTaskAppearOnDate(task, checkDate)) {
        dates.push(checkDate);
      }
    }

    return dates;
  }

  /**
   * Get the daily task statistics
   */
  static async getDailyTaskStatistics(taskId: string): Promise<{
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
    missedStreak: number;
    recentHistory: Array<{ date: string; completed: boolean; expected: boolean }>;
    nextOccurrence: string;
  }> {
    const task = await prisma.task.findFirst({
      where: { id: taskId, task_type: TaskType.DAILY_TASK }
    });

    if (!task) {
      throw new Error(ErrorType.NOT_FOUND);
    }

    if (task.task_type !== TaskType.DAILY_TASK) {
      throw new Error(ErrorType.BAD_REQUEST);
    }

    const histories = await prisma.completionHistory.findMany({
      where: { task_id: taskId, completion_at: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) } },
      orderBy: { completion_at: 'desc' }
    });

    const completionMap = new Map();
    histories.forEach((record: { completion_at: Date; is_completed: boolean }) => {
      completionMap.set(record.completion_at, record.is_completed);
    });

    const expectedDates = this.generateExpectedDates(task as DailyTask, 30);
    
    let completedCount = 0;
    const recentHistory = expectedDates.map(date => {
      const wasCompleted = completionMap.get(date) || false;
      if (wasCompleted) completedCount++;
      
      return {
        date: date.toISOString().split('T')[0],
        completed: wasCompleted,
        expected: true
      };
    });

    const completionRate = expectedDates.length > 0 ? 
      (completedCount / expectedDates.length) * 100 : 0;

    const nextOccurrence = this.calculateNextOccurrence(task as DailyTask);

    return {
      completionRate: Math.round(completionRate * 100) / 100,
      currentStreak: task.current_consecutive_completed || 0,
      longestStreak: task.max_consecutive_completed || 0,
      missedStreak: task.current_consecutive_missed || 0,
      recentHistory: recentHistory.reverse(),
      nextOccurrence: nextOccurrence.toISOString().split('T')[0]
    };

  }

  /**
   * Daily reset processing - check all daily tasks and handle cross-period situations
   */
  static async processDailyReset(): Promise<{
    tasksProcessed: number;
    tasksReset: number;
  }> {
    let tasksProcessed = 0;
    let tasksReset = 0;

    const tasksResult = await prisma.task.findMany({
      where: { task_type: TaskType.DAILY_TASK, is_recurring: true }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const taskData of tasksResult) {
      const task = taskData as DailyTask;
      tasksProcessed++;

      const shouldAppear = this.shouldTaskAppearOnDate(task, today);

      if (shouldAppear) {
        const existingRecord = await prisma.completionHistory.findFirst({
          where: { task_id: task.id, completion_at: today }
        });

        if (existingRecord === null) {
          const completionId = ulid();
          await prisma.completionHistory.create({
            data: { id: completionId, task_id: task.id, completion_at: today, is_completed: false }
          });

          await prisma.task.update({
            where: { id: task.id },
            data: { is_completed: false, updated_at: new Date() }
          });

          tasksReset++;
        }
      }
    }

    return {
      tasksProcessed,
      tasksReset
    };
  }
}
