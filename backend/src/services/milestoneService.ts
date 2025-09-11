import { pool } from '../config/postgre';
import { LongTermTask, Milestone } from '../types';

export class MilestoneService {
  /**
   * 創建里程碑
   */
  static async createMilestone(
    taskId: string,
    userId: string,
    milestoneData: {
      title: string;
      description?: string;
      order_index: number;
    }
  ): Promise<Milestone> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 驗證用戶擁有該長期任務
      const taskResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND task_type = $3',
        [taskId, userId, 'LONG_TERM']
      );

      if (taskResult.rows.length === 0) {
        throw new Error('Long-term task not found');
      }

      // 創建里程碑
      const milestoneResult = await client.query(
        `INSERT INTO milestones (task_id, title, description, order_index)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [taskId, milestoneData.title, milestoneData.description || null, milestoneData.order_index]
      );

      const milestone = milestoneResult.rows[0];

      // 重新計算任務進度
      await this.recalculateTaskProgress(client, taskId);

      await client.query('COMMIT');
      
      return milestone;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 更新里程碑
   */
  static async updateMilestone(
    milestoneId: string,
    userId: string,
    updates: {
      title?: string;
      description?: string;
      order_index?: number;
    }
  ): Promise<Milestone | null> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 驗證用戶擁有該里程碑
      const milestoneResult = await client.query(
        `SELECT m.*, t.user_id 
         FROM milestones m
         JOIN tasks t ON m.task_id = t.id
         WHERE m.id = $1 AND t.user_id = $2`,
        [milestoneId, userId]
      );

      if (milestoneResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      // const milestone = milestoneResult.rows[0]; // Currently unused

      // 建立更新語句
      const validUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(validUpdates).length === 0) {
        await client.query('ROLLBACK');
        throw new Error('No valid updates provided');
      }

      const setClause = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(validUpdates)) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      values.push(milestoneId);

      const updateResult = await client.query(
        `UPDATE milestones 
         SET ${setClause.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );

      await client.query('COMMIT');
      
      return updateResult.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 切換里程碑完成狀態
   */
  static async toggleMilestoneCompletion(
    milestoneId: string,
    userId: string
  ): Promise<{
    milestone: Milestone;
    taskProgress: number;
    taskCompleted: boolean;
  }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 驗證用戶擁有該里程碑
      const milestoneResult = await client.query(
        `SELECT m.*, t.user_id 
         FROM milestones m
         JOIN tasks t ON m.task_id = t.id
         WHERE m.id = $1 AND t.user_id = $2`,
        [milestoneId, userId]
      );

      if (milestoneResult.rows.length === 0) {
        throw new Error('Milestone not found');
      }

      const milestone = milestoneResult.rows[0];
      const newCompletedStatus = !milestone.is_completed;

      // 更新里程碑狀態
      const updateResult = await client.query(
        `UPDATE milestones 
         SET is_completed = $1, 
             completion_date = $2
         WHERE id = $3
         RETURNING *`,
        [
          newCompletedStatus,
          newCompletedStatus ? new Date() : null,
          milestoneId
        ]
      );

      const updatedMilestone = updateResult.rows[0];

      // 重新計算任務進度
      const { progress, isCompleted } = await this.recalculateTaskProgress(client, milestone.task_id);

      await client.query('COMMIT');

      return {
        milestone: updatedMilestone,
        taskProgress: progress,
        taskCompleted: isCompleted
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 刪除里程碑
   */
  static async deleteMilestone(milestoneId: string, userId: string): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 獲取里程碑信息並驗證用戶權限
      const milestoneResult = await client.query(
        `SELECT m.task_id, t.user_id 
         FROM milestones m
         JOIN tasks t ON m.task_id = t.id
         WHERE m.id = $1 AND t.user_id = $2`,
        [milestoneId, userId]
      );

      if (milestoneResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const taskId = milestoneResult.rows[0].task_id;

      // 刪除里程碑
      const deleteResult = await client.query(
        'DELETE FROM milestones WHERE id = $1',
        [milestoneId]
      );

      if (deleteResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      // 重新計算任務進度
      await this.recalculateTaskProgress(client, taskId);

      await client.query('COMMIT');
      
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 獲取任務的所有里程碑
   */
  static async getTaskMilestones(taskId: string, userId: string): Promise<Milestone[]> {
    // 驗證用戶擁有該任務
    const taskResult = await pool.query(
      'SELECT 1 FROM tasks WHERE id = $1 AND user_id = $2 AND task_type = $3',
      [taskId, userId, 'LONG_TERM']
    );

    if (taskResult.rows.length === 0) {
      throw new Error('Long-term task not found');
    }

    // 獲取里程碑列表
    const milestonesResult = await pool.query(
      'SELECT * FROM milestones WHERE task_id = $1 ORDER BY order_index ASC, created_at ASC',
      [taskId]
    );

    return milestonesResult.rows;
  }

  /**
   * 重新計算任務進度
   */
  private static async recalculateTaskProgress(
    client: any,
    taskId: string
  ): Promise<{
    progress: number;
    isCompleted: boolean;
  }> {
    // 獲取所有里程碑
    const milestonesResult = await client.query(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN is_completed = true THEN 1 END) as completed FROM milestones WHERE task_id = $1',
      [taskId]
    );

    const { total, completed } = milestonesResult.rows[0];
    const totalCount = parseInt(total, 10);
    const completedCount = parseInt(completed, 10);

    // 計算進度百分比
    const progress = totalCount > 0 ? completedCount / totalCount : 0;
    const isCompleted = totalCount > 0 && completedCount === totalCount;

    // 更新任務進度
    await client.query(
      'UPDATE tasks SET progress = $1, is_completed = $2, updated_at = NOW() WHERE id = $3',
      [progress, isCompleted, taskId]
    );

    return {
      progress,
      isCompleted
    };
  }

  /**
   * 獲取長期任務統計
   */
  static async getLongTermTaskStatistics(taskId: string, userId: string): Promise<{
    totalMilestones: number;
    completedMilestones: number;
    progress: number;
    isOverdue: boolean;
    daysToTarget: number;
    milestonesByStatus: {
      completed: Milestone[];
      pending: Milestone[];
    };
  }> {
    // 驗證並獲取任務信息
    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND task_type = $3',
      [taskId, userId, 'LONG_TERM']
    );

    if (taskResult.rows.length === 0) {
      throw new Error('Long-term task not found');
    }

    const task = taskResult.rows[0] as LongTermTask;

    // 獲取里程碑統計
    const milestonesResult = await pool.query(
      'SELECT * FROM milestones WHERE task_id = $1 ORDER BY order_index ASC, created_at ASC',
      [taskId]
    );

    const milestones = milestonesResult.rows;
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.is_completed).length;
    const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    // 計算目標日期相關信息
    let isOverdue = false;
    let daysToTarget = 0;

    if (task.target_completion_date) {
      const targetDate = new Date(task.target_completion_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);

      const diffTime = targetDate.getTime() - today.getTime();
      daysToTarget = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isOverdue = daysToTarget < 0 && !task.is_completed;
    }

    // 按狀態分組里程碑
    const milestonesByStatus = {
      completed: milestones.filter(m => m.is_completed),
      pending: milestones.filter(m => !m.is_completed)
    };

    return {
      totalMilestones,
      completedMilestones,
      progress: Number(progress.toFixed(2)),
      isOverdue,
      daysToTarget,
      milestonesByStatus
    };
  }

  /**
   * 批量重新排序里程碑
   */
  static async reorderMilestones(
    taskId: string,
    userId: string,
    milestoneOrders: Array<{ id: string; order_index: number }>
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 驗證用戶擁有該任務
      const taskResult = await client.query(
        'SELECT 1 FROM tasks WHERE id = $1 AND user_id = $2 AND task_type = $3',
        [taskId, userId, 'LONG_TERM']
      );

      if (taskResult.rows.length === 0) {
        throw new Error('Long-term task not found');
      }

      // 批量更新里程碑順序
      for (const { id, order_index } of milestoneOrders) {
        await client.query(
          'UPDATE milestones SET order_index = $1 WHERE id = $2 AND task_id = $3',
          [order_index, id, taskId]
        );
      }

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
