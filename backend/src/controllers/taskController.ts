import { Response } from 'express';
import { z } from 'zod';
import { HabitType, RecurrenceType, TaskType, TimeRangeType } from '../generated/prisma';
import { DailyTaskService } from '../services/dailyTaskService';
import { HabitService } from '../services/habitService';
import { MilestoneService } from '../services/milestoneService';
import { TaskService } from '../services/taskService';
import { TodoService } from '../services/todoService';
import { AuthRequest } from '../utils/auth';
import logger from '../utils/logger';

const createTaskSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    task_type: z.nativeEnum(TaskType),
    importance: z.number().int().min(1).max(5).default(1),
    
    habit_type: z.nativeEnum(HabitType).optional(),
    threshold_count: z.number().int().positive().optional(),
    time_range_value: z.number().int().positive().optional(),
    time_range_type: z.nativeEnum(TimeRangeType).optional(),
    
    started_at: z.string().datetime().optional(),
    is_recurring: z.boolean().default(true),
    recurrence_type: z.nativeEnum(RecurrenceType).optional(),
    recurrence_interval: z.number().int().positive().optional(),
    recurrence_days_of_week: z.array(z.number().int().min(0).max(6)).optional(),
    recurrence_days_of_month: z.array(z.number().int().min(-1).max(31)).optional(),
    recurrence_weeks_of_month: z.array(z.number().int().min(0).max(4)).optional(),
    
    due_at: z.string().datetime().optional(),
    
    show_progress: z.boolean().default(true),
    target_completion_at: z.string().datetime().optional()
});

const taskController = {
    getTasks: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const tasks = await TaskService.getUserTasks(req.user!.id);
            res.json({ tasks });
        } catch (error) {
            logger.error('Get tasks error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getTaskById: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const task = await TaskService.getTaskById(req.params.id, req.user!.id);
            res.json({ task });
        } catch (error) {
            logger.error('Get task error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    createTask: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const validatedData = createTaskSchema.parse(req.body);
            const task = await TaskService.createTask(req.user!.id, validatedData);
            res.status(201).json({ task });
        } catch (error) {
            logger.error('Create task error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    updateTask: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const updateSchema = createTaskSchema.partial();
            const updates = updateSchema.parse(req.body);
            const task = await TaskService.updateTask(req.params.id, req.user!.id, updates);
            res.json({ task });
        } catch (error) {
            logger.error('Update task error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    deleteTask: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            await TaskService.deleteTask(req.params.id, req.user!.id);
            res.json({ message: 'Task deleted successfully' });
        } catch (error) {
            logger.error('Delete task error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    toggleTaskCompletion: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const task = await TaskService.toggleTaskCompletion(req.params.id, req.user!.id);
            res.json({ task });
        } catch (error) {
            logger.error('Toggle task error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getHabitStatistics: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const stats = await HabitService.getHabitStatistics(req.params.id, req.user!.id);
            res.json({ stats });
        } catch (error) {
            logger.error('Get habit stats error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getHabitHistory: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const history = await HabitService.getHabitCompletionHistory(req.params.id, req.user!.id, req.query.limit ? parseInt(req.query.limit as string) : 50);
            res.json({ history });
        } catch (error) {
            logger.error('Get habit history error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getDailyTaskStatistics: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const stats = await DailyTaskService.getDailyTaskStatistics(req.params.id, req.user!.id);
            res.json({ stats });
        } catch (error) {
            logger.error('Get daily task stats error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    processDailyReset: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const result = await DailyTaskService.processDailyReset();
            res.json({ message: 'Daily reset completed', ...result });
        } catch (error) {
            logger.error('Daily reset error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getLongTermTaskStatistics: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const stats = await MilestoneService.getLongTermTaskStatistics(req.params.id, req.user!.id);
            res.json({ stats });
        } catch (error) {
            logger.error('Get long-term task stats error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getTaskMilestones: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const milestones = await MilestoneService.getTaskMilestones(req.params.id, req.user!.id);
            res.json({ milestones });
        } catch (error) {
            logger.error('Get milestones error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    createMilestone: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const createMilestoneSchema = z.object({
                title: z.string().min(1).max(255),
                description: z.string().optional(),
                order_index: z.number().int().min(0).default(0)
            });
            const validatedData = createMilestoneSchema.parse(req.body);
            const milestone = await MilestoneService.createMilestone(req.params.id, req.user!.id, validatedData);
            res.status(201).json({ milestone });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                  error: 'Validation failed', 
                  details: error.errors 
                });
            }
              
            if (error instanceof Error && error.message === 'Long-term task not found') {
                res.status(404).json({ error: 'Long-term task not found' });
            }
              
            logger.error('Create milestone error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    updateMilestone: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const updateMilestoneSchema = z.object({
                title: z.string().min(1).max(255).optional(),
                description: z.string().optional(),
                order_index: z.number().int().min(0).optional()
            });
            const validatedData = updateMilestoneSchema.parse(req.body);
            const milestone = await MilestoneService.updateMilestone(req.params.id, req.user!.id, validatedData);
            res.json({ milestone });
        } catch (error) {
            logger.error('Update milestone error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    toggleMilestoneCompletion: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const result = await MilestoneService.toggleMilestoneCompletion(req.params.id, req.user!.id);
            res.json({ result });
        } catch (error) {
            logger.error('Toggle milestone completion error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    deleteMilestone: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            await MilestoneService.deleteMilestone(req.params.id, req.user!.id);
            res.json({ message: 'Milestone deleted successfully' });
        } catch (error) {
            logger.error('Delete milestone error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    reorderMilestones: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const reorderSchema = z.object({
                milestoneOrders: z.array(z.object({
                    id: z.string(),
                    order_index: z.number().int().min(0)
                }))
            });
            const validatedData = reorderSchema.parse(req.body);
            await MilestoneService.reorderMilestones(req.params.id, req.user!.id, validatedData.milestoneOrders);
            res.json({ message: 'Milestones reordered successfully' });
        } catch (error) {
            logger.error('Reorder milestones error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getTodoTaskStatistics: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const stats = await TodoService.getTodoTaskStatistics(req.params.id, req.user!.id);
            res.json({ stats });
        } catch (error) {
            logger.error('Get TODO stats error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getOverdueTasks: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const tasks = await TodoService.getOverdueTasks(req.user!.id);
            res.json({ tasks });
        } catch (error) {
            logger.error('Get overdue tasks error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getUpcomingTasks: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const days = req.query.days ? parseInt(req.query.days as string) : 7;
            const tasks = await TodoService.getUpcomingTasks(req.user!.id, days);
            res.json({ tasks });
        } catch (error) {
            logger.error('Get upcoming tasks error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    updateTaskDueDate: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const dueDateSchema = z.object({
                due_at: z.string().datetime().nullable()
            });
            const validatedData = dueDateSchema.parse(req.body);
            const dueDate = validatedData.due_at ? new Date(validatedData.due_at) : null;
            const task = await TodoService.updateTaskDueDate(req.params.id, req.user!.id, dueDate);
            res.json({ task });
        } catch (error) {
            logger.error('Update task due date error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    getTodoCompletionStats: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const days = req.query.days ? parseInt(req.query.days as string) : 30;
            const stats = await TodoService.getTodoCompletionStats(req.user!.id, days);
            res.json({ stats });
        } catch (error) {
            logger.error('Get TODO completion stats error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    updateOverdueTasks: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const result = await TodoService.updateOverdueTasks();
            res.json({
                message: 'Overdue tasks updated',
                ...result
            });
        } catch (error) {
            logger.error('Update overdue tasks error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default taskController;