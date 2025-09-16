import express from 'express';
import taskController from './controllers/taskController';
import userController from './controllers/userController';
import { authenticateToken } from './utils/auth';

const router = express.Router();

router.post('/register',  userController.register);
router.post('/login', userController.login);
router.get('/profile', authenticateToken, userController.getProfile);
router.patch('/profile', authenticateToken, userController.updateProfile);

router.get('/tasks', authenticateToken, taskController.getTasks);
router.get('/tasks/:id', authenticateToken, taskController.getTaskById);
router.post('/tasks', authenticateToken, taskController.createTask);
router.patch('/tasks/:id', authenticateToken, taskController.updateTask);
router.delete('/tasks/:id', authenticateToken, taskController.deleteTask);
router.post('/tasks/:id/toggle', authenticateToken, taskController.toggleTaskCompletion);
router.get('/tasks/:id/habit-stats', authenticateToken, taskController.getHabitStatistics);
router.get('/tasks/:id/habit-history', authenticateToken, taskController.getHabitHistory);
router.get('/tasks/:id/daily-stats', authenticateToken, taskController.getDailyTaskStatistics);
router.post('/tasks/:id/daily-reset', authenticateToken, taskController.processDailyReset);
router.get('/tasks/:id/long-term-stats', authenticateToken, taskController.getLongTermTaskStatistics);
router.get('/tasks/:id/milestones', authenticateToken, taskController.getTaskMilestones);
router.post('/tasks/:id/milestones', authenticateToken, taskController.createMilestone);
router.patch('/tasks/:id/milestones/:milestoneId', authenticateToken, taskController.updateMilestone);
router.post('/tasks/:id/milestones/:milestoneId/toggle', authenticateToken, taskController.toggleMilestoneCompletion);
router.delete('/tasks/:id/milestones/:milestoneId', authenticateToken, taskController.deleteMilestone);
router.put('/tasks/:id/milestones/reorder', authenticateToken, taskController.reorderMilestones);
router.get('/tasks/overdue', authenticateToken, taskController.getOverdueTasks);
router.get('/tasks/upcoming', authenticateToken, taskController.getUpcomingTasks);
router.post('/tasks/update-overdue', authenticateToken, taskController.updateOverdueTasks);

export default router;
