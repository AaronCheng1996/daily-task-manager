import moment from 'moment';
import { ulid } from 'ulid';
import { Milestone, TaskType } from '../generated/prisma';
import { ErrorType } from '../utils/messages.enum';
import { prisma } from '../utils/prisma';

export class MilestoneService {
  /**
   * Create a milestone
   */
  static async createMilestone(
    taskId: string,
    milestoneData: {
      title: string;
      description?: string;
      order_index: number;
    }
  ): Promise<Milestone> {
    const task = await prisma.task.findFirst({
      where: { id: taskId }
    })

    if (!task) {
      throw new Error(ErrorType.NOT_FOUND);
    }

    if (task.task_type !== TaskType.LONG_TERM) {
      throw new Error(ErrorType.BAD_REQUEST);
    }

    const milestone = await prisma.milestone.create({
      data: {
        id: ulid(),
        task_id: taskId,
        title: milestoneData.title,
        description: milestoneData.description || null,
        order_index: milestoneData.order_index
      }
    })  

    await this.recalculateTaskProgress(taskId);

    return milestone as Milestone;
  }

  /**
   * Get all milestones of the task
   */
  static async getTaskMilestones(taskId: string): Promise<Milestone[]> {
    const milestones = await prisma.milestone.findMany({
      where: { task_id: taskId },
      orderBy: { order_index: 'asc', created_at: 'asc' }
    });

    return milestones;
  }

  /**
   * Update a milestone
   */
  static async updateMilestone(
    milestoneId: string,
    updates: {
      title?: string;
      description?: string;
      order_index?: number;
    }
  ): Promise<Milestone | null> {
    try {
      const updatedMilestone = await prisma.milestone.update({
        where: { id: milestoneId },
        data: updates
      });
      return updatedMilestone as Milestone;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Toggle the milestone completion status
   */
  static async toggleMilestoneCompletion(
    milestoneId: string,
  ): Promise<{
    milestone: Milestone;
    taskProgress: number;
    taskCompleted: boolean;
  }> {

    const milestone = await prisma.milestone.findFirst({
      where: { id: milestoneId }
    });

    if (!milestone) {
      throw new Error(ErrorType.NOT_FOUND);
    }

    const newCompletedStatus = !milestone.is_completed;
    const updateData: any = {
      is_completed: newCompletedStatus
    };

    if (newCompletedStatus) {
      updateData.completion_at = new Date();
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: updateData
    });

    const { progress, isCompleted } = await this.recalculateTaskProgress(milestone.task_id);

    return {
      milestone: updatedMilestone as Milestone,
      taskProgress: progress,
      taskCompleted: isCompleted
    };
  }

  /**
   * Delete a milestone
   */
  static async deleteMilestone(milestoneId: string): Promise<boolean> {
    const milestone = await prisma.milestone.findFirst({
      where: { id: milestoneId }
    });

    if (!milestone) {
      throw new Error(ErrorType.NOT_FOUND);
    }

    const result = await prisma.milestone.delete({
      where: { id: milestoneId }
    });

    await this.recalculateTaskProgress(milestone.task_id);

    return result !== null;
  }

  

  /**
   * Recalculate the task progress
   */
  private static async recalculateTaskProgress(
    taskId: string
  ): Promise<{
    progress: number;
    isCompleted: boolean;
  }> {
    const milestones = await prisma.milestone.findMany({
      where: { task_id: taskId }
    });
    
    const totalCount = milestones.length;
    const completedCount = milestones.filter(m => m.is_completed).length;

    const progress = totalCount > 0 ? completedCount / totalCount : 0;
    const isCompleted = totalCount > 0 && completedCount === totalCount;

    await prisma.task.update({
      where: { id: taskId },
      data: { progress: progress, is_completed: isCompleted, updated_at: new Date() }
    });

    return {
      progress,
      isCompleted
    };
  }

  /**
   * Get the long-term task statistics
   */
  static async getLongTermTaskStatistics(taskId: string): Promise<{
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

    const task = await prisma.task.findFirst({
      where: { id: taskId, task_type: TaskType.LONG_TERM }
    });

    if (!task) {
      throw new Error(ErrorType.NOT_FOUND);
    }

    if (task.task_type !== TaskType.LONG_TERM) {
      throw new Error(ErrorType.BAD_REQUEST);
    }

    const milestones = await prisma.milestone.findMany({
      where: { task_id: taskId },
      orderBy: { order_index: 'asc', created_at: 'asc' }
    });

    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.is_completed).length;
    const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    let isOverdue = false;
    let daysToTarget = 0;

    if (task.target_completion_at) {
      const targetDate = new Date(task.target_completion_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);

      daysToTarget = moment(targetDate).diff(moment(today), 'days');
      isOverdue = daysToTarget < 0 && !task.is_completed;
    }

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
   * Batch reorder milestones
   */
  static async reorderMilestones(
    taskId: string,
    milestoneOrders: Array<{ id: string; order_index: number }>
  ): Promise<void> {
    const task = await prisma.task.findFirst({
      where: { id: taskId, task_type: TaskType.LONG_TERM }
    });

    if (!task) {
      throw new Error(ErrorType.NOT_FOUND);
    }

    for (const { id, order_index } of milestoneOrders) {
      await prisma.milestone.update({
        where: { id: id, task_id: taskId },
        data: { order_index: order_index }
      });
    }

    await this.recalculateTaskProgress(taskId);
  }
}
