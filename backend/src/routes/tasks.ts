import express from 'express';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { TaskService } from '../services/taskService';
import { HabitService } from '../services/habitService';
import { DailyTaskService } from '../services/dailyTaskService';
import { MilestoneService } from '../services/milestoneService';
import { TodoService } from '../services/todoService';
import { TaskType, HabitType, RecurrenceType, TimeRangeType } from '../types';

const router = express.Router();

// Apply authentication to all task routes
router.use(authenticateToken);

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  task_type: z.nativeEnum(TaskType),
  importance: z.number().int().min(1).max(5).default(1),
  
  // HABIT fields
  habit_type: z.nativeEnum(HabitType).optional(),
  threshold_count: z.number().int().positive().optional(),
  time_range_value: z.number().int().positive().optional(),
  time_range_type: z.nativeEnum(TimeRangeType).optional(),
  
  // DAILY_TASK fields
  target_date: z.string().datetime().optional(),
  is_recurring: z.boolean().default(true),
  recurrence_type: z.nativeEnum(RecurrenceType).optional(),
  recurrence_interval: z.number().int().positive().optional(),
  recurrence_day_of_week: z.number().int().min(0).max(6).optional(),
  recurrence_day_of_month: z.number().int().min(-1).max(31).optional(),
  
  // TODO fields
  due_date: z.string().datetime().optional(),
  
  // LONG_TERM fields
  show_progress: z.boolean().default(true),
  target_completion_date: z.string().datetime().optional()
});

// Get all tasks for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const tasks = await TaskService.getUserTasks(req.user!.id);
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get task by id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const task = await TaskService.getTaskById(req.params.id, req.user!.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create task
router.post('/', async (req: AuthRequest, res) => {
  try {
    const validatedData = createTaskSchema.parse(req.body);
    const task = await TaskService.createTask(req.user!.id, validatedData);
    
    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const updateSchema = createTaskSchema.partial();
    const updates = updateSchema.parse(req.body);
    
    const task = await TaskService.updateTask(req.params.id, req.user!.id, updates);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete task
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const deleted = await TaskService.deleteTask(req.params.id, req.user!.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle task completion
router.post('/:id/toggle', async (req: AuthRequest, res) => {
  try {
    const task = await TaskService.toggleTaskCompletion(req.params.id, req.user!.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({
      message: 'Task completion toggled successfully',
      task
    });
  } catch (error) {
    console.error('Toggle task error:', error);
    
    // Handle specific habit task errors
    if (error instanceof Error && error.message === 'Habit completion cannot be undone') {
      return res.status(400).json({ error: 'Habit completion cannot be undone' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get habit statistics
router.get('/:id/habit-stats', async (req: AuthRequest, res) => {
  try {
    const stats = await HabitService.getHabitStatistics(req.params.id, req.user!.id);
    res.json({ stats });
  } catch (error) {
    console.error('Get habit stats error:', error);
    
    if (error instanceof Error && error.message === 'Habit task not found') {
      return res.status(404).json({ error: 'Habit task not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get habit completion history
router.get('/:id/habit-history', async (req: AuthRequest, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const history = await HabitService.getHabitCompletionHistory(
      req.params.id, 
      req.user!.id,
      limit
    );
    res.json({ history });
  } catch (error) {
    console.error('Get habit history error:', error);
    
    if (error instanceof Error && error.message === 'Habit task not found') {
      return res.status(404).json({ error: 'Habit task not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get daily task statistics
router.get('/:id/daily-stats', async (req: AuthRequest, res) => {
  try {
    const stats = await DailyTaskService.getDailyTaskStatistics(req.params.id, req.user!.id);
    res.json({ stats });
  } catch (error) {
    console.error('Get daily task stats error:', error);
    
    if (error instanceof Error && error.message === 'Daily task not found') {
      return res.status(404).json({ error: 'Daily task not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process daily reset (can be called by cron job)
router.post('/daily-reset', async (_req: AuthRequest, res) => {
  try {
    const result = await DailyTaskService.processDailyReset();
    res.json({
      message: 'Daily reset completed',
      ...result
    });
  } catch (error) {
    console.error('Daily reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get long-term task statistics
router.get('/:id/longterm-stats', async (req: AuthRequest, res) => {
  try {
    const stats = await MilestoneService.getLongTermTaskStatistics(req.params.id, req.user!.id);
    res.json({ stats });
  } catch (error) {
    console.error('Get long-term task stats error:', error);
    
    if (error instanceof Error && error.message === 'Long-term task not found') {
      return res.status(404).json({ error: 'Long-term task not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get task milestones
router.get('/:id/milestones', async (req: AuthRequest, res) => {
  try {
    const milestones = await MilestoneService.getTaskMilestones(req.params.id, req.user!.id);
    res.json({ milestones });
  } catch (error) {
    console.error('Get milestones error:', error);
    
    if (error instanceof Error && error.message === 'Long-term task not found') {
      return res.status(404).json({ error: 'Long-term task not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create milestone
router.post('/:id/milestones', async (req: AuthRequest, res) => {
  try {
    const createMilestoneSchema = z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      order_index: z.number().int().min(0).default(0)
    });

    const validatedData = createMilestoneSchema.parse(req.body);
    const milestone = await MilestoneService.createMilestone(
      req.params.id,
      req.user!.id,
      validatedData
    );
    
    res.status(201).json({
      message: 'Milestone created successfully',
      milestone
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    if (error instanceof Error && error.message === 'Long-term task not found') {
      return res.status(404).json({ error: 'Long-term task not found' });
    }
    
    console.error('Create milestone error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update milestone
router.patch('/milestones/:milestoneId', async (req: AuthRequest, res) => {
  try {
    const updateMilestoneSchema = z.object({
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      order_index: z.number().int().min(0).optional()
    });

    const validatedData = updateMilestoneSchema.parse(req.body);
    const milestone = await MilestoneService.updateMilestone(
      req.params.milestoneId,
      req.user!.id,
      validatedData
    );

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    
    res.json({
      message: 'Milestone updated successfully',
      milestone
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Update milestone error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle milestone completion
router.post('/milestones/:milestoneId/toggle', async (req: AuthRequest, res) => {
  try {
    const result = await MilestoneService.toggleMilestoneCompletion(
      req.params.milestoneId,
      req.user!.id
    );
    
    res.json({
      message: 'Milestone completion toggled successfully',
      ...result
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Milestone not found') {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    
    console.error('Toggle milestone error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete milestone
router.delete('/milestones/:milestoneId', async (req: AuthRequest, res) => {
  try {
    const deleted = await MilestoneService.deleteMilestone(
      req.params.milestoneId,
      req.user!.id
    );

    if (!deleted) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    
    res.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Delete milestone error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reorder milestones
router.put('/:id/milestones/reorder', async (req: AuthRequest, res) => {
  try {
    const reorderSchema = z.object({
      milestoneOrders: z.array(z.object({
        id: z.string(),
        order_index: z.number().int().min(0)
      }))
    });

    const { milestoneOrders } = reorderSchema.parse(req.body);
    
    await MilestoneService.reorderMilestones(
      req.params.id,
      req.user!.id,
      milestoneOrders
    );
    
    res.json({ message: 'Milestones reordered successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    if (error instanceof Error && error.message === 'Long-term task not found') {
      return res.status(404).json({ error: 'Long-term task not found' });
    }
    
    console.error('Reorder milestones error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get TODO task statistics
router.get('/:id/todo-stats', async (req: AuthRequest, res) => {
  try {
    const stats = await TodoService.getTodoTaskStatistics(req.params.id, req.user!.id);
    res.json({ stats });
  } catch (error) {
    console.error('Get TODO stats error:', error);
    
    if (error instanceof Error && error.message === 'TODO task not found') {
      return res.status(404).json({ error: 'TODO task not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get overdue tasks
router.get('/overdue', async (req: AuthRequest, res) => {
  try {
    const tasks = await TodoService.getOverdueTasks(req.user!.id);
    res.json({ tasks });
  } catch (error) {
    console.error('Get overdue tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get upcoming tasks
router.get('/upcoming', async (req: AuthRequest, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const tasks = await TodoService.getUpcomingTasks(req.user!.id, days);
    res.json({ tasks });
  } catch (error) {
    console.error('Get upcoming tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task due date
router.patch('/:id/due-date', async (req: AuthRequest, res) => {
  try {
    const dueDateSchema = z.object({
      due_date: z.string().datetime().nullable()
    });

    const { due_date } = dueDateSchema.parse(req.body);
    const dueDate = due_date ? new Date(due_date) : null;
    
    const task = await TodoService.updateTaskDueDate(req.params.id, req.user!.id, dueDate);
    
    if (!task) {
      return res.status(404).json({ error: 'TODO task not found' });
    }
    
    res.json({
      message: 'Due date updated successfully',
      task
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Update due date error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get TODO completion statistics
router.get('/todo-completion-stats', async (req: AuthRequest, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const stats = await TodoService.getTodoCompletionStats(req.user!.id, days);
    res.json({ stats });
  } catch (error) {
    console.error('Get TODO completion stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update overdue tasks (can be called by cron job)
router.post('/update-overdue', async (_req: AuthRequest, res) => {
  try {
    const result = await TodoService.updateOverdueTasks();
    res.json({
      message: 'Overdue tasks updated',
      ...result
    });
  } catch (error) {
    console.error('Update overdue tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
