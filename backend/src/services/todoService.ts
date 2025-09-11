import { pool } from '../config/postgre';
import { TodoTask } from '../types/task';
import moment from 'moment';

export class TodoService {
  /**
   * Update the overdue status of all TODO tasks
   */
  static async updateOverdueTasks(): Promise<{
    updatedCount: number;
    overdueTaskIds: string[];
  }> {
    const client = await pool.connect();

    try {
      const updateResult = await client.query(
        `UPDATE tasks 
         SET is_overdue = true, updated_at = NOW() 
         WHERE task_type = 'TODO' 
           AND due_at < NOW() 
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
   * Get the TODO task statistics
   */
  static async getTodoTaskStatistics(taskId: string, userId: string): Promise<{
    isOverdue: boolean;
    daysOverdue: number;
    daysUntilDue: number;
    dueDateStatus: 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'future' | 'no_due_at';
    dueDateText: string;
  }> {
    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND task_type = $3',
      [taskId, userId, 'TODO']
    );

    if (taskResult.rows.length === 0) {
      throw new Error('TODO task not found');
    }

    const task = taskResult.rows[0] as TodoTask;

    if (!task.due_at) {
      return {
        isOverdue: false,
        daysOverdue: 0,
        daysUntilDue: 0,
        dueDateStatus: 'no_due_at',
        dueDateText: 'No due date'
      };
    }

    const now = new Date();
    const dueDate = new Date(task.due_at);
    
    now.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = moment(dueDate).diff(moment(now), 'days');

    let dueDateStatus: 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'future' | 'no_due_at';
    let dueDateText: string;

    if (diffDays < 0) {
      dueDateStatus = 'overdue';
      const overdueDays = Math.abs(diffDays);
      dueDateText = overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`;
    } else if (diffDays === 0) {
      dueDateStatus = 'today';
      dueDateText = 'Due today';
    } else if (diffDays === 1) {
      dueDateStatus = 'tomorrow';
      dueDateText = 'Due tomorrow';
    } else if (diffDays <= 7) {
      dueDateStatus = 'this_week';
      dueDateText = `Due in ${diffDays} days`;
    } else {
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
   * Get all overdue tasks of the user
   */
  static async getOverdueTasks(userId: string): Promise<TodoTask[]> {
    const result = await pool.query(
      `SELECT * FROM tasks 
       WHERE user_id = $1 
         AND task_type = 'TODO' 
         AND is_completed = false 
         AND (is_overdue = true OR due_at < NOW())
       ORDER BY due_at ASC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Get the upcoming tasks (within 7 days)
   */
  static async getUpcomingTasks(userId: string, days: number = 7): Promise<TodoTask[]> {
    const result = await pool.query(
      `SELECT * FROM tasks 
       WHERE user_id = $1 
         AND task_type = 'TODO' 
         AND is_completed = false 
         AND due_at IS NOT NULL
         AND due_at >= NOW()
         AND due_at <= NOW() + INTERVAL '${days} days'
       ORDER BY due_at ASC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Batch update the due date of the task
   */
  static async updateTaskDueDate(
    taskId: string,
    userId: string,
    dueDate: Date | null
  ): Promise<TodoTask | null> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const taskResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND task_type = $3',
        [taskId, userId, 'TODO']
      );

      if (taskResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const updateResult = await client.query(
        'UPDATE tasks SET due_at = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [dueDate, taskId]
      );

      const updatedTask = updateResult.rows[0];

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
   * Get the TODO task completion statistics
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
   * Clear the completed overdue task flags (optional feature)
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
