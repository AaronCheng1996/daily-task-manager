import { pool } from '../config/database';
import { HabitTask, HabitType, TimeRangeType } from '../types';

export class HabitService {
  /**
   * 記錄習慣完成 (不可撤銷)
   */
  static async recordHabitCompletion(taskId: string, userId: string): Promise<{
    task: HabitTask;
    completionCount: number;
    isSuccessful: boolean;
    daysSinceLastCompletion: number;
  }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 獲取習慣任務詳細信息
      const taskResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND task_type = $3',
        [taskId, userId, 'HABIT']
      );

      if (taskResult.rows.length === 0) {
        throw new Error('Habit task not found');
      }

      const habitTask = taskResult.rows[0] as HabitTask;

      // 記錄完成
      await client.query(
        'INSERT INTO habit_completions (task_id) VALUES ($1)',
        [taskId]
      );

      // 更新最後完成時間
      await client.query(
        'UPDATE tasks SET last_completion_time = NOW() WHERE id = $1',
        [taskId]
      );

      // 清理舊記錄 (超出時間範圍的記錄)
      await this.cleanOldCompletions(client, taskId, habitTask);

      // 計算統計數據
      const completionCount = await this.getCompletionCountInTimeRange(
        client,
        taskId,
        habitTask.time_range_value,
        habitTask.time_range_type
      );

      const isSuccessful = this.evaluateHabitSuccess(
        completionCount,
        habitTask.threshold_count,
        habitTask.habit_type
      );

      const daysSinceLastCompletion = await this.getDaysSinceLastCompletion(
        client,
        taskId
      );

      await client.query('COMMIT');

      // 返回更新後的任務和統計
      const updatedTaskResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1',
        [taskId]
      );

      return {
        task: updatedTaskResult.rows[0],
        completionCount,
        isSuccessful,
        daysSinceLastCompletion
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 清理超出時間範圍的舊完成記錄
   */
  private static async cleanOldCompletions(
    client: any,
    taskId: string,
    habitTask: HabitTask
  ): Promise<void> {
    const timeRangeStart = this.calculateTimeRangeStart(
      habitTask.time_range_value,
      habitTask.time_range_type
    );

    await client.query(
      'DELETE FROM habit_completions WHERE task_id = $1 AND completed_at < $2',
      [taskId, timeRangeStart]
    );
  }

  /**
   * 計算時間範圍的開始時間
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
        throw new Error(`Unsupported time range type: ${timeRangeType}`);
    }

    return startTime;
  }

  /**
   * 獲取指定時間範圍內的完成次數
   */
  static async getCompletionCountInTimeRange(
    client: any,
    taskId: string,
    timeRangeValue: number,
    timeRangeType: TimeRangeType
  ): Promise<number> {
    const timeRangeStart = this.calculateTimeRangeStart(timeRangeValue, timeRangeType);

    const result = await client.query(
      'SELECT COUNT(*) FROM habit_completions WHERE task_id = $1 AND completed_at >= $2',
      [taskId, timeRangeStart]
    );

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * 評估習慣是否成功
   */
  private static evaluateHabitSuccess(
    completionCount: number,
    thresholdCount: number,
    habitType: HabitType
  ): boolean {
    switch (habitType) {
      case HabitType.GOOD:
        // 好習慣：完成次數 >= 目標次數
        return completionCount >= thresholdCount;
      case HabitType.BAD:
        // 壞習慣：完成次數 <= 目標次數
        return completionCount <= thresholdCount;
      default:
        return false;
    }
  }

  /**
   * 計算距離上次完成的天數
   */
  private static async getDaysSinceLastCompletion(
    client: any,
    taskId: string
  ): Promise<number> {
    const result = await client.query(
      `SELECT EXTRACT(EPOCH FROM NOW() - MAX(completed_at)) / 86400 as days
       FROM habit_completions 
       WHERE task_id = $1`,
      [taskId]
    );

    if (result.rows[0].days === null) {
      return -1; // 從未完成
    }

    return Math.floor(result.rows[0].days);
  }

  /**
   * 獲取習慣統計信息
   */
  static async getHabitStatistics(taskId: string, userId: string): Promise<{
    completionCount: number;
    completionRate: number;
    isSuccessful: boolean;
    daysSinceLastCompletion: number;
    completionHistory: Array<{ date: Date; count: number }>;
  }> {
    const client = await pool.connect();

    try {
      // 獲取習慣任務信息
      const taskResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND task_type = $3',
        [taskId, userId, 'HABIT']
      );

      if (taskResult.rows.length === 0) {
        throw new Error('Habit task not found');
      }

      const habitTask = taskResult.rows[0] as HabitTask;

      // 計算當前時間範圍內的完成次數
      const completionCount = await this.getCompletionCountInTimeRange(
        client,
        taskId,
        habitTask.time_range_value,
        habitTask.time_range_type
      );

      // 計算完成率
      const completionRate = habitTask.threshold_count > 0 
        ? (completionCount / habitTask.threshold_count) * 100 
        : 0;

      // 評估是否成功
      const isSuccessful = this.evaluateHabitSuccess(
        completionCount,
        habitTask.threshold_count,
        habitTask.habit_type
      );

      // 計算距離上次完成天數
      const daysSinceLastCompletion = await this.getDaysSinceLastCompletion(
        client,
        taskId
      );

      // 獲取最近30天的完成歷史 (按日統計)
      const historyResult = await client.query(
        `SELECT DATE(completed_at) as completion_date, COUNT(*) as count
         FROM habit_completions 
         WHERE task_id = $1 
           AND completed_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(completed_at)
         ORDER BY completion_date DESC`,
        [taskId]
      );

      const completionHistory = historyResult.rows.map(row => ({
        date: new Date(row.completion_date),
        count: parseInt(row.count, 10)
      }));

      return {
        completionCount,
        completionRate: Math.round(completionRate * 100) / 100,
        isSuccessful,
        daysSinceLastCompletion,
        completionHistory
      };

    } finally {
      client.release();
    }
  }

  /**
   * 獲取習慣的所有完成記錄 (用於管理頁面)
   */
  static async getHabitCompletionHistory(
    taskId: string, 
    userId: string,
    limit: number = 50
  ): Promise<Array<{ id: string; completed_at: Date }>> {
    // 驗證用戶擁有該任務
    const taskResult = await pool.query(
      'SELECT 1 FROM tasks WHERE id = $1 AND user_id = $2 AND task_type = $3',
      [taskId, userId, 'HABIT']
    );

    if (taskResult.rows.length === 0) {
      throw new Error('Habit task not found');
    }

    const result = await pool.query(
      `SELECT id, completed_at 
       FROM habit_completions 
       WHERE task_id = $1 
       ORDER BY completed_at DESC 
       LIMIT $2`,
      [taskId, limit]
    );

    return result.rows;
  }

  /**
   * 定期清理所有習慣任務的舊記錄 (可用於定時任務)
   */
  static async cleanAllOldHabitCompletions(): Promise<number> {
    const client = await pool.connect();

    try {
      // 獲取所有習慣任務
      const habitsResult = await client.query(
        'SELECT id, time_range_value, time_range_type FROM tasks WHERE task_type = $1',
        ['HABIT']
      );

      let totalCleaned = 0;

      for (const habit of habitsResult.rows) {
        const timeRangeStart = this.calculateTimeRangeStart(
          habit.time_range_value,
          habit.time_range_type
        );

        const deleteResult = await client.query(
          'DELETE FROM habit_completions WHERE task_id = $1 AND completed_at < $2',
          [habit.id, timeRangeStart]
        );

        totalCleaned += deleteResult.rowCount || 0;
      }

      return totalCleaned;

    } finally {
      client.release();
    }
  }
}
