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
  private static shouldTaskAppearOnDate(task: DailyTask, targetDate: Date): boolean {
    const taskDate = new Date(task.started_at || task.created_at);
    
    if (!task.is_recurring && targetDate > taskDate) {
      return false;
    }

    const daysDiff = moment(targetDate).diff(moment(taskDate), 'days');
    const weeksDiff = moment(targetDate).diff(moment(taskDate), 'weeks');
    const monthsDiff = moment(targetDate).diff(moment(taskDate), 'months');

    const firstDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const dayOfWeekOfFirst = firstDayOfMonth.getDay();
    const dayOfMonth = targetDate.getDate();
    const weekOfMonth = Math.ceil((dayOfMonth + dayOfWeekOfFirst - 1) / 7);

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
        return daysDiff >= 0 && daysDiff % (task.recurrence_interval || 1) === 0;
        
      case RecurrenceType.EVERY_X_WEEKS:
        return weeksDiff >= 0 && 
               weeksDiff % (task.recurrence_interval || 1) === 0 &&
               targetDate.getDay() === taskDate.getDay();
               
      case RecurrenceType.EVERY_X_MONTHS:
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
   private static calculateNextOccurrence(task: DailyTask, fromDate: Date = new Date()): Date {
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
    task: Task, 
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
    const dailyTask = task as DailyTask;
    const startOfDay = moment(targetDate).startOf('day');
    const endOfDay = moment(targetDate).endOf('day');

    if (!this.shouldTaskAppearOnDate(dailyTask, targetDate)) {
      throw new Error(ErrorType.BAD_REQUEST);
    }

    const histories = await prisma.completionHistory.findMany({
      where: { 
        task_id: task.id, 
        completion_at: {
          gte: startOfDay.toDate(),
          lte: endOfDay.toDate()
        }
      }
    });

    let wasCompleted = false;
    let newCompletionStatus = false;

    if (histories.length > 0) {
      wasCompleted = histories[0].is_completed;
      newCompletionStatus = !wasCompleted;
      await prisma.completionHistory.update({
        where: { id: histories[0].id },
        data: { is_completed: newCompletionStatus, recorded_at: moment().toDate() }
      });
    } else {
      newCompletionStatus = true;
      await prisma.completionHistory.create({
        data: { id: ulid(), task_id: task.id, completion_at: startOfDay.toDate(), is_completed: newCompletionStatus, recorded_at: moment().toDate() }
      });
    }

    await prisma.task.update({
      where: { id: task.id },
      data: { is_completed: newCompletionStatus, updated_at: moment().toDate() }
    });

    const consecutiveStats = await this.recalculateConsecutiveStats(dailyTask);

    await prisma.task.update({
      where: { id: task.id },
      data: { current_consecutive_completed: consecutiveStats.completed, current_consecutive_missed: consecutiveStats.missed, max_consecutive_completed: consecutiveStats.maxCompleted, last_reset_at: moment().toDate() }
    });

    return {
      task: dailyTask,
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
      where: { task_id: task.id, completion_at: { gte: moment().subtract(365, 'days').toDate() } },
      orderBy: { completion_at: 'desc' }
    });

    const shouldAppearDates = this.generateExpectedDates(task, 365);
    const completionMap = this.buildCompletionMap(histories);
    const sortedDates = [...shouldAppearDates].sort((a, b) => b.getTime() - a.getTime());

    return this.calculateStreakStats(sortedDates, completionMap, task);
  }

  private static buildCompletionMap(histories: Array<{ completion_at: Date; is_completed: boolean }>): Map<Date, boolean> {
    const completionMap = new Map();
    histories.forEach((record) => {
      completionMap.set(record.completion_at, record.is_completed);
    });
    return completionMap;
  }

  private static calculateStreakStats(sortedDates: Date[], completionMap: Map<Date, boolean>, task: DailyTask): {
    completed: number;
    missed: number;
    maxCompleted: number;
  } {
    let currentConsecutiveCompleted = 0;
    let currentConsecutiveMissed = 0;
    let maxConsecutiveCompleted = 0;
    let tempConsecutiveCompleted = 0;
    let foundFirstStatus = false;
    const today = moment().toDate();

    for (const date of sortedDates) {
      const wasCompleted = completionMap.get(date) || false;
      const isToday = moment(date).isSame(moment(today), 'day');
      const shouldCountAsMissed = !wasCompleted && !isToday;

      const stats = this.updateStreakCounts(
        wasCompleted, shouldCountAsMissed, foundFirstStatus,
        currentConsecutiveCompleted, currentConsecutiveMissed, tempConsecutiveCompleted
      );

      foundFirstStatus = true;
      currentConsecutiveCompleted = stats.completed;
      currentConsecutiveMissed = stats.missed;
      tempConsecutiveCompleted = stats.tempCompleted;
      maxConsecutiveCompleted = Math.max(maxConsecutiveCompleted, tempConsecutiveCompleted);
    }

    return {
      completed: currentConsecutiveCompleted,
      missed: currentConsecutiveMissed,
      maxCompleted: Math.max(maxConsecutiveCompleted, task.max_consecutive_completed || 0)
    };
  }

  private static updateStreakCounts(
    wasCompleted: boolean, shouldCountAsMissed: boolean, foundFirstStatus: boolean,
    currentCompleted: number, currentMissed: number, tempCompleted: number
  ): { completed: number; missed: number; tempCompleted: number } {
    if (!foundFirstStatus) {
      if (wasCompleted) {
        return { completed: 1, missed: 0, tempCompleted: 1 };
      }
      if (shouldCountAsMissed) {
        return { completed: 0, missed: 1, tempCompleted: 0 };
      }
    } else if (wasCompleted && currentCompleted > 0) {
      return { completed: currentCompleted + 1, missed: currentMissed, tempCompleted: tempCompleted + 1 };
    } else if (shouldCountAsMissed && currentMissed > 0) {
      return { completed: currentCompleted, missed: currentMissed + 1, tempCompleted: tempCompleted };
    } else if (wasCompleted && currentMissed > 0) {
      return { completed: 1, missed: 0, tempCompleted: 1 };
    } else if (shouldCountAsMissed && currentCompleted > 0) {
      return { completed: 0, missed: 1, tempCompleted: 0 };
    }

    return { completed: currentCompleted, missed: currentMissed, tempCompleted: tempCompleted };
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
  static async getDailyTaskStatistics(task: Task): Promise<{
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
    missedStreak: number;
    recentHistory: Array<{ date: string; completed: boolean; expected: boolean }>;
    nextOccurrence: string;
  }> {
    const dailyTask = task as DailyTask;

    if (!task) {
      throw new Error(ErrorType.NOT_FOUND);
    }

    if (dailyTask.task_type !== TaskType.DAILY_TASK) {
      throw new Error(ErrorType.BAD_REQUEST);
    }

    const histories = await prisma.completionHistory.findMany({
      where: { task_id: task.id, completion_at: { gte: moment().subtract(30, 'days').toDate() } },
      orderBy: { completion_at: 'desc' }
    });

    const completionMap = new Map();
    histories.forEach((record: { completion_at: Date; is_completed: boolean }) => {
      completionMap.set(record.completion_at, record.is_completed);
    });

    const expectedDates = this.generateExpectedDates(dailyTask, 30);
    
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

    const nextOccurrence = this.calculateNextOccurrence(dailyTask);

    return {
      completionRate: Math.round(completionRate * 100) / 100,
      currentStreak: dailyTask.current_consecutive_completed || 0,
      longestStreak: dailyTask.max_consecutive_completed || 0,
      missedStreak: dailyTask.current_consecutive_missed || 0,
      recentHistory: recentHistory.reverse(),
      nextOccurrence: nextOccurrence.toISOString().split('T')[0]
    };
  }
}
