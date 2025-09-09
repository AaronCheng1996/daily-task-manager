import { pool } from '../config/database';
import { DailyTask, RecurrenceType } from '../types';

export class DailyTaskService {
  /**
   * 檢查每日任務是否應該在指定日期出現
   */
  static shouldTaskAppearOnDate(task: DailyTask, targetDate: Date): boolean {
    const taskDate = new Date(task.target_date);
    
    // 如果不是重複任務且目標日期已過，則不顯示
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
        const daysDiff = Math.floor((targetDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff % (task.recurrence_interval || 1) === 0;
        
      case RecurrenceType.EVERY_X_WEEKS:
        const weeksDiff = Math.floor((targetDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        return weeksDiff >= 0 && 
               weeksDiff % (task.recurrence_interval || 1) === 0 &&
               targetDate.getDay() === taskDate.getDay();
               
      case RecurrenceType.EVERY_X_MONTHS:
        const monthsDiff = (targetDate.getFullYear() - taskDate.getFullYear()) * 12 + 
                          (targetDate.getMonth() - taskDate.getMonth());
        return monthsDiff >= 0 && 
               monthsDiff % (task.recurrence_interval || 1) === 0 &&
               targetDate.getDate() === taskDate.getDate();
               
      case RecurrenceType.WEEKLY_ON_DAYS:
        // task.recurrence_day_of_week 作為位掩碼使用
        // 例如：週一=1, 週二=2, 週三=4... 可以組合：週一+週三=5
        const dayMask = Math.pow(2, targetDate.getDay());
        return Boolean((task.recurrence_day_of_week || 0) & dayMask);
        
      case RecurrenceType.MONTHLY_ON_DAYS:
        // task.recurrence_day_of_month 可以是 1-31 或 -1（月底）
        if (task.recurrence_day_of_month === -1) {
          // 月底
          const nextMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
          return targetDate.getDate() === nextMonth.getDate();
        } else {
          return targetDate.getDate() === task.recurrence_day_of_month;
        }
        
      default:
        return false;
    }
  }

  /**
   * 計算下次出現日期
   */
  static calculateNextOccurrence(task: DailyTask, fromDate: Date = new Date()): Date {
    const nextDate = new Date(fromDate);
    nextDate.setHours(0, 0, 0, 0);

    let maxIterations = 365; // 防止無限迴圈
    
    while (maxIterations > 0) {
      nextDate.setDate(nextDate.getDate() + 1);
      
      if (this.shouldTaskAppearOnDate(task, nextDate)) {
        return nextDate;
      }
      
      maxIterations--;
    }
    
    // 如果找不到下次出現時間，返回一年後
    const fallback = new Date(fromDate);
    fallback.setFullYear(fallback.getFullYear() + 1);
    return fallback;
  }

  /**
   * 完成或取消完成每日任務
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

      // 獲取任務信息
      const taskResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND task_type = $3',
        [taskId, userId, 'DAILY_TASK']
      );

      if (taskResult.rows.length === 0) {
        throw new Error('Daily task not found');
      }

      const task = taskResult.rows[0] as DailyTask;
      const today = targetDate.toISOString().split('T')[0];

      // 檢查今日是否應該出現此任務
      if (!this.shouldTaskAppearOnDate(task, targetDate)) {
        throw new Error('Task is not scheduled for this date');
      }

      // 檢查今日完成記錄
      const historyResult = await client.query(
        'SELECT * FROM completion_history WHERE task_id = $1 AND completion_date = $2',
        [taskId, today]
      );

      let wasCompleted = false;
      let newCompletionStatus = false;

      if (historyResult.rows.length > 0) {
        // 已有記錄，切換狀態
        wasCompleted = historyResult.rows[0].is_completed;
        newCompletionStatus = !wasCompleted;

        await client.query(
          `UPDATE completion_history 
           SET is_completed = $1, recorded_at = NOW() 
           WHERE task_id = $2 AND completion_date = $3`,
          [newCompletionStatus, taskId, today]
        );
      } else {
        // 新記錄，標記為完成
        newCompletionStatus = true;
        
        await client.query(
          `INSERT INTO completion_history (task_id, completion_date, is_completed) 
           VALUES ($1, $2, $3)`,
          [taskId, today, true]
        );
      }

      // 更新任務的完成狀態（主要用於UI顯示）
      await client.query(
        'UPDATE tasks SET is_completed = $1, updated_at = NOW() WHERE id = $2',
        [newCompletionStatus, taskId]
      );

      // 重新計算連續統計
      const consecutiveStats = await this.recalculateConsecutiveStats(client, task);

      // 更新任務的統計字段
      await client.query(
        `UPDATE tasks 
         SET current_consecutive_completed = $1,
             current_consecutive_missed = $2,
             max_consecutive_completed = $3,
             last_reset_date = $4
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

      // 返回更新後的任務
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
   * 重新計算連續完成/錯過統計
   */
  private static async recalculateConsecutiveStats(
    client: any,
    task: DailyTask
  ): Promise<{
    completed: number;
    missed: number;
    maxCompleted: number;
  }> {
    // 獲取最近 365 天的完成記錄
    const historyResult = await client.query(
      `SELECT completion_date, is_completed
       FROM completion_history 
       WHERE task_id = $1 
         AND completion_date >= CURRENT_DATE - INTERVAL '365 days'
       ORDER BY completion_date DESC`,
      [task.id]
    );

    const history = historyResult.rows;
    
    // 生成應該出現的日期列表
    const shouldAppearDates = this.generateExpectedDates(task, 365);
    
    // 建立完成記錄映射
    const completionMap = new Map();
    history.forEach((record: { completion_date: string; is_completed: boolean }) => {
      completionMap.set(record.completion_date, record.is_completed);
    });

    // 從最近日期開始計算連續統計
    let currentConsecutiveCompleted = 0;
    let currentConsecutiveMissed = 0;
    let maxConsecutiveCompleted = 0;
    let tempConsecutiveCompleted = 0;
    
    // 將日期按時間順序排序（最新的在前）
    const sortedDates = shouldAppearDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // 從最新日期開始，計算當前的連續狀態
    let foundFirstStatus = false;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    for (const dateStr of sortedDates) {
      const wasCompleted = completionMap.get(dateStr) || false;
      const isToday = dateStr === todayStr;
      
      // 如果是今天且沒有完成記錄，不算作錯過（可能還沒到截止時間）
      const shouldCountAsMissed = !wasCompleted && !isToday;
      
      if (!foundFirstStatus) {
        // 第一個找到的狀態決定當前的連續類型
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
        // 如果是今天且未完成，暫不計算連續狀態
      } else {
        // 檢查是否維持相同的連續狀態
        if (wasCompleted && currentConsecutiveCompleted > 0) {
          // 繼續完成連勝
          currentConsecutiveCompleted++;
          tempConsecutiveCompleted++;
        } else if (shouldCountAsMissed && currentConsecutiveMissed > 0) {
          // 繼續錯過連勝
          currentConsecutiveMissed++;
        } else if (wasCompleted && currentConsecutiveMissed > 0) {
          // 錯過連勝被打破，重新開始完成連勝
          currentConsecutiveCompleted = 1;
          currentConsecutiveMissed = 0;
          tempConsecutiveCompleted = 1;
        } else if (shouldCountAsMissed && currentConsecutiveCompleted > 0) {
          // 完成連勝被打破，重新開始錯過連勝
          currentConsecutiveMissed = 1;
          currentConsecutiveCompleted = 0;
          tempConsecutiveCompleted = 0;
        }
        // 如果是今天且未完成，不影響當前連續狀態
      }
      
      // 記錄最大連續完成次數
      maxConsecutiveCompleted = Math.max(maxConsecutiveCompleted, tempConsecutiveCompleted);
    }

    return {
      completed: currentConsecutiveCompleted,
      missed: currentConsecutiveMissed,
      maxCompleted: Math.max(maxConsecutiveCompleted, task.max_consecutive_completed || 0)
    };
  }

  /**
   * 生成指定天數內應該出現的日期列表
   */
  private static generateExpectedDates(task: DailyTask, days: number): string[] {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 獲取任務的有效開始日期（創建日期或目標日期中較晚的一個）
    const taskCreatedDate = new Date(task.created_at);
    taskCreatedDate.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(task.target_date);
    targetDate.setHours(0, 0, 0, 0);
    
    // 使用目標日期和創建日期中較晚的作為開始日期
    const effectiveStartDate = targetDate > taskCreatedDate ? targetDate : taskCreatedDate;

    for (let i = days - 1; i >= 0; i--) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);

      // 只計算任務有效開始日期之後的日期
      if (checkDate >= effectiveStartDate && this.shouldTaskAppearOnDate(task, checkDate)) {
        dates.push(checkDate.toISOString().split('T')[0]);
      }
    }

    return dates;
  }

  /**
   * 獲取每日任務統計
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
      // 獲取任務信息
      const taskResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND task_type = $3',
        [taskId, userId, 'DAILY_TASK']
      );

      if (taskResult.rows.length === 0) {
        throw new Error('Daily task not found');
      }

      const task = taskResult.rows[0] as DailyTask;

      // 獲取最近 30 天的完成記錄
      const historyResult = await client.query(
        `SELECT completion_date, is_completed
         FROM completion_history 
         WHERE task_id = $1 
           AND completion_date >= CURRENT_DATE - INTERVAL '30 days'
         ORDER BY completion_date DESC`,
        [taskId]
      );

      const history = historyResult.rows;
      const completionMap = new Map();
      history.forEach(record => {
        completionMap.set(record.completion_date, record.is_completed);
      });

      // 生成最近30天的預期日期
      const expectedDates = this.generateExpectedDates(task, 30);
      
      // 計算完成率
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

      // 計算下次出現時間
      const nextOccurrence = this.calculateNextOccurrence(task);

      return {
        completionRate: Math.round(completionRate * 100) / 100,
        currentStreak: task.current_consecutive_completed || 0,
        longestStreak: task.max_consecutive_completed || 0,
        missedStreak: task.current_consecutive_missed || 0,
        recentHistory: recentHistory.reverse(), // 最舊的在前
        nextOccurrence: nextOccurrence.toISOString().split('T')[0]
      };

    } finally {
      client.release();
    }
  }

  /**
   * 每日重置處理 - 檢查所有每日任務並處理跨週期的情況
   */
  static async processDailyReset(): Promise<{
    tasksProcessed: number;
    tasksReset: number;
  }> {
    const client = await pool.connect();
    let tasksProcessed = 0;
    let tasksReset = 0;

    try {
      // 獲取所有每日任務
      const tasksResult = await client.query(
        'SELECT * FROM tasks WHERE task_type = $1 AND is_recurring = true',
        ['DAILY_TASK']
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const taskData of tasksResult.rows) {
        const task = taskData as DailyTask;
        tasksProcessed++;

        // 檢查今天是否應該出現此任務
        const shouldAppear = this.shouldTaskAppearOnDate(task, today);

        if (shouldAppear) {
          // 如果任務今天應該出現，確保完成狀態是 false（重置狀態）
          const todayStr = today.toISOString().split('T')[0];
          
          // 檢查今天是否已有記錄
          const existingRecord = await client.query(
            'SELECT * FROM completion_history WHERE task_id = $1 AND completion_date = $2',
            [task.id, todayStr]
          );

          if (existingRecord.rows.length === 0) {
            // 沒有記錄，創建新記錄（預設為未完成）
            await client.query(
              'INSERT INTO completion_history (task_id, completion_date, is_completed) VALUES ($1, $2, $3)',
              [task.id, todayStr, false]
            );

            // 重置任務完成狀態
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
