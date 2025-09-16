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
import { ErrorType, SuccessMessage } from '../utils/messages.enum';

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
            const filter = req.query.filter as object;
            const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;
            const take = req.query.take ? parseInt(req.query.take as string) : 100;
            const tasks = await TaskService.getUserTasks(req.user!.id, filter, skip, take);
            res.json({ tasks });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    getTaskById: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const task = await TaskService.getTaskById(req.params.id, req.user!.id);
            res.json({ task });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    createTask: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const validatedData = createTaskSchema.parse(req.body);
            const task = await TaskService.createTask(req.user!.id, validatedData);
            res.status(201).json({ task });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    updateTask: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const updateSchema = createTaskSchema.partial();
            const updates = updateSchema.parse(req.body);
            const task = await TaskService.updateTask(req.params.id, req.user!.id, updates);
            res.json({ task });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    deleteTask: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            await TaskService.deleteTask(req.params.id, req.user!.id);
            res.json({ message: SuccessMessage.TASK_DELETED });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    toggleTaskCompletion: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const task = await TaskService.toggleTaskCompletion(req.params.id, req.user!.id);
            res.json({ task });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    getHabitStatistics: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const stats = await HabitService.getHabitStatistics(req.params.id);
            res.json({ stats });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    getHabitHistory: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const history = await HabitService.getHabitCompletionHistory(req.params.id, req.query.limit ? parseInt(req.query.limit as string) : 50);
            res.json({ history });
        } catch (error) {
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    getDailyTaskStatistics: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const stats = await DailyTaskService.getDailyTaskStatistics(req.params.id);
            res.json({ stats });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    processDailyReset: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const result = await DailyTaskService.processDailyReset();
            res.json({ message: SuccessMessage.DAILY_RESET_COMPLETED, ...result });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    getLongTermTaskStatistics: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const stats = await MilestoneService.getLongTermTaskStatistics(req.params.id);
            res.json({ stats });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    getTaskMilestones: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const milestones = await MilestoneService.getTaskMilestones(req.params.id);
            res.json({ milestones });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
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
            const milestone = await MilestoneService.createMilestone(req.params.id, validatedData);
            res.status(201).json({ milestone });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                  error: ErrorType.VALIDATION_ERROR, 
                  details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
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
            const milestone = await MilestoneService.updateMilestone(req.params.id, validatedData);
            res.json({ milestone });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    toggleMilestoneCompletion: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const result = await MilestoneService.toggleMilestoneCompletion(req.params.id);
            res.json({ result });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    deleteMilestone: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            await MilestoneService.deleteMilestone(req.params.id);
            res.json({ message: SuccessMessage.MILESTONE_DELETED });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
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
            await MilestoneService.reorderMilestones(req.params.id, validatedData.milestoneOrders);
            res.json({ message: SuccessMessage.MILESTONE_REORDERED });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    getOverdueTasks: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const tasks = await TodoService.getOverdueTasks(req.user!.id);
            res.json({ tasks });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    getUpcomingTasks: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const days = req.query.days ? parseInt(req.query.days as string) : 7;
            const tasks = await TodoService.getUpcomingTasks(req.user!.id, days);
            res.json({ tasks });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    updateOverdueTasks: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const result = await TodoService.updateOverdueTasks();
            res.json({
                message: SuccessMessage.OVERDUE_TASKS_UPDATED,
                ...result
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
              
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
              
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    }
}

export default taskController;