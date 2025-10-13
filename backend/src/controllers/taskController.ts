import { Response } from 'express';
import { z } from 'zod';
import { HabitType, Milestone, RecurrenceType, Task, TaskType, TimeRangeType } from '../generated/prisma';
import { TaskService } from '../services/taskService';
import { DailyTaskService } from '../services/dailyTaskService';
import { AuthRequest } from '../utils/auth';
import logger from '../utils/logger';
import { ErrorType, SuccessMessage } from '../utils/messages.enum';
import { prisma } from '../utils/prisma';
import { MilestoneService } from '../services/milestoneService';

interface TaskWithStat extends Task {
    stat: any;
    milestones: Milestone[];
}

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

const dailyTaskRefreshCache = new Map<string, number>();
const REFRESH_COOLDOWN_MINUTES = 10;

const checkAndRefreshDailyTasks = async (userId: string): Promise<void> => {
    const now = Date.now();
    const lastRefresh = dailyTaskRefreshCache.get(userId) || 0;
    const cooldownMs = REFRESH_COOLDOWN_MINUTES * 60 * 1000;

    if (now - lastRefresh < cooldownMs) {
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { preference_setting: true }
        });

        if (user) {
            const preferenceSetting = user.preference_setting as { timezone?: string };
            const timezone = preferenceSetting?.timezone || 'UTC';
            await DailyTaskService.checkAndRefreshDailyTaskForUser(userId, timezone);
            dailyTaskRefreshCache.set(userId, now);
        }
    } catch (error) {
        logger.error('Error refreshing daily tasks:', error);
    }
};

const taskController = {
    getTasks: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            await checkAndRefreshDailyTasks(req.user!.id);
            const tasks = await TaskService.getUserTasks(req.user!.id) as TaskWithStat[];
            for (const task of tasks) {
                task.stat = await TaskService.getTaskStatistics(task);
                task.milestones = await MilestoneService.getTaskMilestones(task.id);
            }
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
            const task = await TaskService.getTaskById(req.params.id) as TaskWithStat;
            task.stat = await TaskService.getTaskStatistics(task);
            task.milestones = await MilestoneService.getTaskMilestones(task.id);
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
            const task = await TaskService.createTask(req.user!.id, validatedData) as TaskWithStat;
            task.stat = await TaskService.getTaskStatistics(task);
            task.milestones = await MilestoneService.getTaskMilestones(task.id);
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
            const task = await TaskService.updateTask(req.params.id, updates) as TaskWithStat;
            task.stat = await TaskService.getTaskStatistics(task);
            task.milestones = await MilestoneService.getTaskMilestones(task.id);
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
            await TaskService.deleteTask(req.params.id);
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
            const task = await TaskService.toggleTaskCompletion(req.params.id);
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
    getTaskStatistics: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const task = await TaskService.getTaskById(req.params.id);
            if (!task) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
            const stats = await TaskService.getTaskStatistics(task);
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
    reorderTasks: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const taskId = req.params.id;
            const prevOrderIndex = req.body.prevOrderIndex;
            const nextOrderIndex = req.body.nextOrderIndex;
            await TaskService.reorderTasks(taskId, prevOrderIndex, nextOrderIndex);
            res.json({ message: SuccessMessage.TASKS_REORDERED });
        } catch (error) {
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
}

export default taskController;