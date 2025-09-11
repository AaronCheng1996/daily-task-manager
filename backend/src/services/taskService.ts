import { ulid } from 'ulid';
import { pool } from '../config/postgre';
import { Task, TaskType } from '../types/task';
import { HabitService } from './habitService';
import { DailyTaskService } from './dailyTaskService';
import { TodoService } from './todoService';

export class TaskService {
  private static generateTaskId(): string {
    return ulid();
  }

  static async getUserTasks(userId: string): Promise<Task[]> {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return result.rows;
  }

  static async getTaskById(taskId: string, userId: string): Promise<Task | null> {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );
    
    return result.rows[0] || null;
  }

  static async createTask(userId: string, taskData: any): Promise<Task> {
    const taskId = this.generateTaskId();
    
    // Base task fields
    const baseFields = [
      'id', 'user_id', 'title', 'description', 'task_type', 'importance', 'order_index'
    ];
    const baseValues = [
      taskId, userId, taskData.title, taskData.description || null, 
      taskData.task_type, taskData.importance || 1, taskData.order_index || 0
    ];
    
    // Dynamic fields based on task type
    const additionalFields: string[] = [];
    const additionalValues: any[] = [];
    
    switch (taskData.task_type) {
      case TaskType.HABIT:
        additionalFields.push('habit_type', 'threshold_count', 'time_range_value', 'time_range_type');
        additionalValues.push(
          taskData.habit_type, 
          taskData.threshold_count, 
          taskData.time_range_value, 
          taskData.time_range_type
        );
        break;
        
      case TaskType.DAILY_TASK:
        additionalFields.push(
          'started_at', 'is_recurring', 'recurrence_type', 'recurrence_interval',
          'recurrence_days_of_week', 'recurrence_days_of_month', 'recurrence_weeks_of_month'
        );
        additionalValues.push(
          taskData.started_at ? new Date(taskData.started_at) : new Date(),
          taskData.is_recurring !== undefined ? taskData.is_recurring : true,
          taskData.recurrence_type,
          taskData.recurrence_interval,
          taskData.recurrence_days_of_week ? JSON.stringify(taskData.recurrence_days_of_week) : null,
          taskData.recurrence_days_of_month ? JSON.stringify(taskData.recurrence_days_of_month) : null,
          taskData.recurrence_weeks_of_month ? JSON.stringify(taskData.recurrence_weeks_of_month) : null
        );
        break;
        
      case TaskType.TODO:
        additionalFields.push('due_at');
        additionalValues.push(taskData.due_at ? new Date(taskData.due_at) : null);
        break;
        
      case TaskType.LONG_TERM:
        additionalFields.push('show_progress', 'target_completion_at');
        additionalValues.push(
          taskData.show_progress !== undefined ? taskData.show_progress : true,
          taskData.target_completion_at ? new Date(taskData.target_completion_at) : null
        );
        break;
    }
    
    // Build query
    const allFields = [...baseFields, ...additionalFields];
    const allValues = [...baseValues, ...additionalValues];
    const placeholders = allFields.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `
      INSERT INTO tasks (${allFields.join(', ')}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;
    
    const result = await pool.query(query, allValues);
    return result.rows[0];
  }

  static async updateTask(taskId: string, userId: string, updates: Partial<any>): Promise<Task | null> {
    // Remove undefined values and prepare update fields
    const validUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(validUpdates).length === 0) {
      throw new Error('No valid updates provided');
    }
    
    const setClause = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(validUpdates)) {
      // Handle date fields (including new _at fields)
      if (key.includes('date') || key.includes('_date') || key.includes('_at')) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value ? new Date(value as string) : null);
      } 
      // Handle array fields for recurrence
      else if (key.includes('recurrence_days_of_week') || key.includes('recurrence_days_of_month') || key.includes('recurrence_weeks_of_month')) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value ? JSON.stringify(value) : null);
      } 
      else {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    }
    
    values.push(taskId, userId);
    
    const query = `
      UPDATE tasks 
      SET ${setClause.join(', ')}, updated_at = NOW() 
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async deleteTask(taskId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );
    
    return (result.rowCount || 0) > 0;
  }

  static async toggleTaskCompletion(taskId: string, userId: string): Promise<Task | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current task
      const taskResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
        [taskId, userId]
      );
      
      if (taskResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      
      const task = taskResult.rows[0];
      const newCompletedStatus = !task.is_completed;
      
      // Update completion status
      const updateResult = await client.query(
        'UPDATE tasks SET is_completed = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
        [newCompletedStatus, taskId, userId]
      );
      
      const updatedTask = updateResult.rows[0];
      
      // Handle task-specific completion logic
      if (updatedTask.task_type === TaskType.HABIT) {
        if (newCompletedStatus) {
          // 對於習慣任務，使用 HabitService 記錄完成（包含統計計算）
          await client.query('ROLLBACK');
          const habitResult = await HabitService.recordHabitCompletion(taskId, userId);
          return habitResult.task;
        } else {
          // 習慣任務的完成記錄不可撤銷，不允許取消完成
          await client.query('ROLLBACK');
          throw new Error('Habit completion cannot be undone');
        }
      }
      
      if (updatedTask.task_type === TaskType.DAILY_TASK) {
        // 對於每日任務，使用 DailyTaskService 處理複雜的重複邏輯
        await client.query('ROLLBACK');
        const targetDate = new Date(); // 使用當前日期作為目標日期
        const dailyResult = await DailyTaskService.toggleDailyTaskCompletion(taskId, userId, targetDate);
        return dailyResult.task;
      }
      
      if (updatedTask.task_type === TaskType.TODO && newCompletedStatus) {
        // Reset overdue status when completing TODO
        await client.query(
          'UPDATE tasks SET is_overdue = false WHERE id = $1',
          [taskId]
        );
      }
      
      await client.query('COMMIT');
      
      // Return updated task
      const finalResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
        [taskId, userId]
      );
      
      return finalResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateOverdueTasks(): Promise<void> {
    // 使用 TodoService 更新逾期任務
    await TodoService.updateOverdueTasks();
  }
}
