import { ulid } from 'ulid';
import { prisma } from '../utils/prisma';
import { DailyTask, RecurrenceType } from '../models/task';
import moment from 'moment';

export class DailyTaskService {
  /**
   * Check if the daily task should appear on the specified date
   */
  static shouldTaskAppearOnDate(task: DailyTask, targetDate: Date): boolean {
    const taskDate = new Date(task.started_at);
    
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
        const weekOfMonth = Math.ceil(targetDate.getDate() / 7);
        const isLastWeek = weekOfMonth === Math.ceil(new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate() / 7);
        const weekIndex = isLastWeek ? 0 : weekOfMonth; // 0 represents last week
        return task.recurrence_weeks_of_month?.includes(weekIndex) || false;
        
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

    let maxIterations = 365; // prevent infinite loop
    
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
    userId: string, 
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
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const taskResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND task_type = $3',
        [taskId, userId, 'DAILY_TASK']
      );

      if (taskResult.rows.length === 0) {
        throw new Error('Daily task not found');
      }

      const task = taskResult.rows[0] as DailyTask;
      const today = targetDate.toISOString().split('T')[0];

      if (!this.shouldTaskAppearOnDate(task, targetDate)) {
        throw new Error('Task is not scheduled for this date');
      }

      const historyResult = await client.query(
        'SELECT * FROM completion_history WHERE task_id = $1 AND completion_at = $2',
        [taskId, today]
      );

      let wasCompleted = false;
      let newCompletionStatus = false;

      if (historyResult.rows.length > 0) {
        wasCompleted = historyResult.rows[0].is_completed;
        newCompletionStatus = !wasCompleted;

        await client.query(
          `UPDATE completion_history 
           SET is_completed = $1, recorded_at = NOW() 
           WHERE task_id = $2 AND completion_at = $3`,
          [newCompletionStatus, taskId, today]
        );
      } else {
        newCompletionStatus = true;
        
        const completionId = ulid();
        await client.query(
          `INSERT INTO completion_history (id, task_id, completion_at, is_completed) 
           VALUES ($1, $2, $3, $4)`,
          [completionId, taskId, today, true]
        );
      }

      await client.query(
        'UPDATE tasks SET is_completed = $1, updated_at = NOW() WHERE id = $2',
        [newCompletionStatus, taskId]
      );

      const consecutiveStats = await this.recalculateConsecutiveStats(client, task);

      await client.query(
        `UPDATE tasks 
         SET current_consecutive_completed = $1,
             current_consecutive_missed = $2,
             max_consecutive_completed = $3,
             last_reset_at = $4
         WHERE id = $5`,
        [
          consecutiveStats.completed,
          consecutiveStats.missed,
          consecutiveStats.maxCompleted,
          new Date(),
          taskId
        ]
      );

      await client.query('COMMIT');

      const updatedTaskResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1',
        [taskId]
      );

      return {
        task: updatedTaskResult.rows[0],
        wasCompleted,
        consecutiveStats
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Recalculate the consecutive completed/missed statistics
   */
  private static async recalculateConsecutiveStats(
    client: any,
    task: DailyTask
  ): Promise<{
    completed: number;
    missed: number;
    maxCompleted: number;
  }> {
    const historyResult = await client.query(
      `SELECT completion_at, is_completed
       FROM completion_history 
       WHERE task_id = $1 
         AND completion_at >= CURRENT_DATE - INTERVAL '365 days'
       ORDER BY completion_at DESC`,
      [task.id]
    );

    const history = historyResult.rows;
    
    const shouldAppearDates = this.generateExpectedDates(task, 365);
    
    const completionMap = new Map();
    history.forEach((record: { completion_at: string; is_completed: boolean }) => {
      completionMap.set(record.completion_at, record.is_completed);
    });

    let currentConsecutiveCompleted = 0;
    let currentConsecutiveMissed = 0;
    let maxConsecutiveCompleted = 0;
    let tempConsecutiveCompleted = 0;
    
    const sortedDates = shouldAppearDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let foundFirstStatus = false;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    for (const dateStr of sortedDates) {
      const wasCompleted = completionMap.get(dateStr) || false;
      const isToday = dateStr === todayStr;
      
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
  private static generateExpectedDates(task: DailyTask, days: number): string[] {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskCreatedDate = new Date(task.created_at);
    taskCreatedDate.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(task.started_at);
    targetDate.setHours(0, 0, 0, 0);
    
    const effectiveStartDate = targetDate > taskCreatedDate ? targetDate : taskCreatedDate;

    for (let i = days - 1; i >= 0; i--) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);

      if (checkDate >= effectiveStartDate && this.shouldTaskAppearOnDate(task, checkDate)) {
        dates.push(checkDate.toISOString().split('T')[0]);
      }
    }

    return dates;
  }

  /**
   * Get the daily task statistics
   */
  static async getDailyTaskStatistics(taskId: string, userId: string): Promise<{
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
    missedStreak: number;
    recentHistory: Array<{ date: string; completed: boolean; expected: boolean }>;
    nextOccurrence: string;
  }> {
    const client = await pool.connect();

    try {
      const taskResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND task_type = $3',
        [taskId, userId, 'DAILY_TASK']
      );

      if (taskResult.rows.length === 0) {
        throw new Error('Daily task not found');
      }

      const task = taskResult.rows[0] as DailyTask;

      const historyResult = await client.query(
        `SELECT completion_at, is_completed
         FROM completion_history 
         WHERE task_id = $1 
           AND completion_at >= CURRENT_DATE - INTERVAL '30 days'
         ORDER BY completion_at DESC`,
        [taskId]
      );

      const history = historyResult.rows;
      const completionMap = new Map();
      history.forEach(record => {
        completionMap.set(record.completion_at, record.is_completed);
      });

      const expectedDates = this.generateExpectedDates(task, 30);
      
      let completedCount = 0;
      const recentHistory = expectedDates.map(dateStr => {
        const wasCompleted = completionMap.get(dateStr) || false;
        if (wasCompleted) completedCount++;
        
        return {
          date: dateStr,
          completed: wasCompleted,
          expected: true
        };
      });

      const completionRate = expectedDates.length > 0 ? 
        (completedCount / expectedDates.length) * 100 : 0;

      const nextOccurrence = this.calculateNextOccurrence(task);

      return {
        completionRate: Math.round(completionRate * 100) / 100,
        currentStreak: task.current_consecutive_completed || 0,
        longestStreak: task.max_consecutive_completed || 0,
        missedStreak: task.current_consecutive_missed || 0,
        recentHistory: recentHistory.reverse(),
        nextOccurrence: nextOccurrence.toISOString().split('T')[0]
      };

    } finally {
      client.release();
    }
  }

  /**
   * Daily reset processing - check all daily tasks and handle cross-period situations
   */
  static async processDailyReset(): Promise<{
    tasksProcessed: number;
    tasksReset: number;
  }> {
    const client = await pool.connect();
    let tasksProcessed = 0;
    let tasksReset = 0;

    try {
      const tasksResult = await client.query(
        'SELECT * FROM tasks WHERE task_type = $1 AND is_recurring = true',
        ['DAILY_TASK']
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const taskData of tasksResult.rows) {
        const task = taskData as DailyTask;
        tasksProcessed++;

        const shouldAppear = this.shouldTaskAppearOnDate(task, today);

        if (shouldAppear) {
          const todayStr = today.toISOString().split('T')[0];
          
          const existingRecord = await client.query(
            'SELECT * FROM completion_history WHERE task_id = $1 AND completion_at = $2',
            [task.id, todayStr]
          );

          if (existingRecord.rows.length === 0) {
            const completionId = ulid();
            await client.query(
              'INSERT INTO completion_history (id, task_id, completion_at, is_completed) VALUES ($1, $2, $3, $4)',
              [completionId, task.id, todayStr, false]
            );

            await client.query(
              'UPDATE tasks SET is_completed = false, updated_at = NOW() WHERE id = $1',
              [task.id]
            );

            tasksReset++;
          }
        }
      }

      return {
        tasksProcessed,
        tasksReset
      };

    } finally {
      client.release();
    }
  }
}
