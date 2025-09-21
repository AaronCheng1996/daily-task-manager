import moment from 'moment-timezone';
import { ulid } from 'ulid';
import { HabitType, Task, TimeRangeType } from '../generated/prisma';
import { ErrorType } from '../utils/messages.enum';
import { prisma } from '../utils/prisma';

interface HabitTask extends Task {
  habit_type: HabitType;
  threshold_count: number;
  time_range_value: number;
  time_range_type: TimeRangeType;
  last_completion_time: Date | null;
}

export class HabitService {
  /**
   * Record habit completion (cannot be undone)
   */
  static async recordHabitCompletion(task: Task): Promise<{
    task: HabitTask;
    completionCount: number;
    isSuccessful: boolean;
    daysSinceLastCompletion: number;
  }> {
    const habitTask = task as HabitTask;

    const completionId = ulid();
    await prisma.habitCompletion.create({
      data: { id: completionId, task_id: task.id }
    });

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: { last_completion_time: new Date() }
    });

    await this.cleanOldCompletions(task.id, habitTask);

    const completionCount = await this.getCompletionCountInTimeRange(
      task.id,
      habitTask.time_range_value,
      habitTask.time_range_type || TimeRangeType.DAYS
    );

    const isSuccessful = this.evaluateHabitSuccess(
      completionCount,
      habitTask.threshold_count,
      habitTask.habit_type
    );

    const daysSinceLastCompletion = await this.getDaysSinceLastCompletion(
      task.id
    );

    return {
      task: updatedTask as HabitTask,
      completionCount,
      isSuccessful,
      daysSinceLastCompletion
    };
  }

  /**
   * Clean old completion records that are out of time range
   */
  private static async cleanOldCompletions(
    taskId: string,
    habitTask: HabitTask
  ): Promise<void> {
    const timeRangeStart = this.calculateTimeRangeStart(
      habitTask.time_range_value,
      habitTask.time_range_type || TimeRangeType.DAYS
    );

    await prisma.habitCompletion.deleteMany({
      where: { task_id: taskId, completed_at: { lt: timeRangeStart } }
    });
  }

  /**
   * Calculate the start time of the time range
   */
  private static calculateTimeRangeStart(
    timeRangeValue: number,
    timeRangeType: TimeRangeType
  ): Date {
    const now = new Date();
    const startTime = new Date(now);

    switch (timeRangeType) {
      case TimeRangeType.DAYS:
        startTime.setDate(now.getDate() - timeRangeValue);
        break;
      case TimeRangeType.WEEKS:
        startTime.setDate(now.getDate() - (timeRangeValue * 7));
        break;
      case TimeRangeType.MONTHS:
        startTime.setMonth(now.getMonth() - timeRangeValue);
        break;
      default:
        throw new Error(ErrorType.BAD_REQUEST);
    }

    return startTime;
  }

  /**
   * Get the number of completions in the specified time range
   */
  private static async getCompletionCountInTimeRange(
    taskId: string,
    timeRangeValue: number,
    timeRangeType: TimeRangeType
  ): Promise<number> {
    const timeRangeStart = this.calculateTimeRangeStart(timeRangeValue, timeRangeType);

    const result = await prisma.habitCompletion.count({
      where: { task_id: taskId, completed_at: { gte: timeRangeStart } }
    });

    return result;
  }

  /**
   * Evaluate if the habit is successful
   */
  private static evaluateHabitSuccess(
    completionCount: number,
    thresholdCount: number,
    habitType: HabitType
  ): boolean {
    switch (habitType) {
      case HabitType.GOOD:
        return completionCount >= thresholdCount;
      case HabitType.BAD:
        return completionCount <= thresholdCount;
      default:
        return false;
    }
  }

  /**
   * Calculate the number of days since the last completion
   */
  private static async getDaysSinceLastCompletion(
    taskId: string
  ): Promise<number> {
    const result = await prisma.habitCompletion.findFirst({
      where: { task_id: taskId },
      orderBy: { completed_at: 'desc' }
    });

    if (result === null) {
      return -1; // Never completed
    }

    return moment(result.completed_at).diff(moment(), 'days');
  }

  /**
   * Get the habit statistics
   */
  static async getHabitStatistics(task: Task): Promise<{
    completionCount: number;
    completionRate: number;
    isSuccessful: boolean;
    daysSinceLastCompletion: number;
    completionHistory: Array<{ date: Date; count: number }>;
  }> {
    const habitTask = task as HabitTask;

    const completionCount = await this.getCompletionCountInTimeRange(
      task.id,
      habitTask.time_range_value,
      habitTask.time_range_type || TimeRangeType.DAYS
    );

    const completionRate = habitTask.threshold_count > 0 
      ? (completionCount / habitTask.threshold_count) * 100 
      : 0;

    const isSuccessful = this.evaluateHabitSuccess(
      completionCount,
      habitTask.threshold_count,
      habitTask.habit_type
    );

    const daysSinceLastCompletion = await this.getDaysSinceLastCompletion(
      task.id
    );

    const history = await prisma.habitCompletion.findMany({
      where: { task_id: task.id, completed_at: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) } },
      orderBy: { completed_at: 'desc' }
    });

    const completionMap = new Map();
    history.forEach((record: { completed_at: Date }) => {
      completionMap.set(record.completed_at, record.completed_at);
    });

    const completionHistory = history.map(record => ({
      date: record.completed_at,
      count: completionMap.get(record.completed_at) || 0
    }));

    return {
      completionCount,
      completionRate: Math.round(completionRate * 100) / 100,
      isSuccessful,
      daysSinceLastCompletion,
      completionHistory
    };
  }
}
