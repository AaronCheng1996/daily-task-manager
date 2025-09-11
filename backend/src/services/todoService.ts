import { pool } from '../config/postgre';
import { TodoTask } from '../types';

export class TodoService {
  /**
   * 更新所有 TODO 任務的逾期狀態
   */
  static async updateOverdueTasks(): Promise<{
    updatedCount: number;
    overdueTaskIds: string[];
  }> {
    const client = await pool.connect();

    try {
      // 將過期且未完成的任務標記為逾期
      const updateResult = await client.query(
        `UPDATE tasks 
         SET is_overdue = true, updated_at = NOW() 
         WHERE task_type = 'TODO' 
           AND due_date < NOW() 
           AND is_completed = false 
           AND is_overdue = false
         RETURNING id`,
      );

      const updatedCount = updateResult.rowCount || 0;
      const overdueTaskIds = updateResult.rows.map(row => row.id);

      return {
        updatedCount,
        overdueTaskIds
      };

    } finally {
      client.release();
    }
  }

  /**
   * 獲取 TODO 任務統計
   */
  static async getTodoTaskStatistics(taskId: string, userId: string): Promise<{
    isOverdue: boolean;
    daysOverdue: number;
    daysUntilDue: number;
    dueDateStatus: 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'future' | 'no_due_date';
    dueDateText: string;
  }> {
    // 驗證並獲取任務信息
    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND task_type = $3',
      [taskId, userId, 'TODO']
    );

    if (taskResult.rows.length === 0) {
      throw new Error('TODO task not found');
    }

    const task = taskResult.rows[0] as TodoTask;

    // 如果沒有截止日期
    if (!task.due_date) {
      return {
        isOverdue: false,
        daysOverdue: 0,
        daysUntilDue: 0,
        dueDateStatus: 'no_due_date',
        dueDateText: 'No due date'
      };
    }

    const now = new Date();
    const dueDate = new Date(task.due_date);
    
    // 設置時間為當天開始，避免時區問題
    now.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let dueDateStatus: 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'future' | 'no_due_date';
    let dueDateText: string;

    if (diffDays < 0) {
      // 已逾期
      dueDateStatus = 'overdue';
      const overdueDays = Math.abs(diffDays);
      dueDateText = overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`;
    } else if (diffDays === 0) {
      // 今天到期
      dueDateStatus = 'today';
      dueDateText = 'Due today';
    } else if (diffDays === 1) {
      // 明天到期
      dueDateStatus = 'tomorrow';
      dueDateText = 'Due tomorrow';
    } else if (diffDays <= 7) {
      // 本週內到期
      dueDateStatus = 'this_week';
      dueDateText = `Due in ${diffDays} days`;
    } else {
      // 未來到期
      dueDateStatus = 'future';
      dueDateText = `Due in ${diffDays} days`;
    }

    return {
      isOverdue: task.is_overdue || diffDays < 0,
      daysOverdue: diffDays < 0 ? Math.abs(diffDays) : 0,
      daysUntilDue: diffDays > 0 ? diffDays : 0,
      dueDateStatus,
      dueDateText
    };
  }

  /**
   * 獲取用戶的所有逾期任務
   */
  static async getOverdueTasks(userId: string): Promise<TodoTask[]> {
    const result = await pool.query(
      `SELECT * FROM tasks 
       WHERE user_id = $1 
         AND task_type = 'TODO' 
         AND is_completed = false 
         AND (is_overdue = true OR due_date < NOW())
       ORDER BY due_date ASC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * 獲取即將到期的任務（未來7天內）
   */
  static async getUpcomingTasks(userId: string, days: number = 7): Promise<TodoTask[]> {
    const result = await pool.query(
      `SELECT * FROM tasks 
       WHERE user_id = $1 
         AND task_type = 'TODO' 
         AND is_completed = false 
         AND due_date IS NOT NULL
         AND due_date >= NOW()
         AND due_date <= NOW() + INTERVAL '${days} days'
       ORDER BY due_date ASC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * 批量更新任務的截止日期
   */
  static async updateTaskDueDate(
    taskId: string,
    userId: string,
    dueDate: Date | null
  ): Promise<TodoTask | null> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 驗證用戶擁有該任務
      const taskResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND task_type = $3',
        [taskId, userId, 'TODO']
      );

      if (taskResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      // 更新截止日期
      const updateResult = await client.query(
        'UPDATE tasks SET due_date = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [dueDate, taskId]
      );

      const updatedTask = updateResult.rows[0];

      // 重新計算逾期狀態
      if (dueDate && new Date(dueDate) < new Date() && !updatedTask.is_completed) {
        await client.query(
          'UPDATE tasks SET is_overdue = true WHERE id = $1',
          [taskId]
        );
        updatedTask.is_overdue = true;
      } else {
        await client.query(
          'UPDATE tasks SET is_overdue = false WHERE id = $1',
          [taskId]
        );
        updatedTask.is_overdue = false;
      }

      await client.query('COMMIT');

      return updatedTask;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 獲取 TODO 任務完成統計
   */
  static async getTodoCompletionStats(userId: string, days: number = 30): Promise<{
    totalCompleted: number;
    totalCreated: number;
    completionRate: number;
    overdueCompleted: number;
    recentCompletions: Array<{
      date: string;
      completed: number;
      created: number;
    }>;
  }> {
    const client = await pool.connect();

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 獲取期間內的完成統計
      const completedResult = await client.query(
        `SELECT COUNT(*) as count
         FROM tasks 
         WHERE user_id = $1 
           AND task_type = 'TODO' 
           AND is_completed = true 
           AND updated_at >= $2`,
        [userId, startDate]
      );

      const createdResult = await client.query(
        `SELECT COUNT(*) as count
         FROM tasks 
         WHERE user_id = $1 
           AND task_type = 'TODO' 
           AND created_at >= $2`,
        [userId, startDate]
      );

      const overdueCompletedResult = await client.query(
        `SELECT COUNT(*) as count
         FROM tasks 
         WHERE user_id = $1 
           AND task_type = 'TODO' 
           AND is_completed = true 
           AND is_overdue = true 
           AND updated_at >= $2`,
        [userId, startDate]
      );

      // 按日期統計
      const dailyStatsResult = await client.query(
        `SELECT 
           DATE(created_at) as date,
           COUNT(*) as created,
           COUNT(CASE WHEN is_completed = true THEN 1 END) as completed
         FROM tasks 
         WHERE user_id = $1 
           AND task_type = 'TODO' 
           AND created_at >= $2
         GROUP BY DATE(created_at)
         ORDER BY date DESC
         LIMIT 30`,
        [userId, startDate]
      );

      const totalCompleted = parseInt(completedResult.rows[0].count, 10);
      const totalCreated = parseInt(createdResult.rows[0].count, 10);
      const overdueCompleted = parseInt(overdueCompletedResult.rows[0].count, 10);
      
      const completionRate = totalCreated > 0 ? (totalCompleted / totalCreated) * 100 : 0;

      const recentCompletions = dailyStatsResult.rows.map(row => ({
        date: row.date,
        completed: parseInt(row.completed, 10),
        created: parseInt(row.created, 10)
      }));

      return {
        totalCompleted,
        totalCreated,
        completionRate: Math.round(completionRate * 100) / 100,
        overdueCompleted,
        recentCompletions
      };

    } finally {
      client.release();
    }
  }

  /**
   * 清理已完成的逾期任務標記 (可選功能)
   */
  static async clearCompletedOverdueFlags(): Promise<number> {
    const result = await pool.query(
      `UPDATE tasks 
       SET is_overdue = false, updated_at = NOW() 
       WHERE task_type = 'TODO' 
         AND is_completed = true 
         AND is_overdue = true
       RETURNING id`
    );

    return result.rowCount || 0;
  }
}
