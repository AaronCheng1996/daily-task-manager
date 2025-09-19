import express from 'express';
import taskController from './controllers/taskController';
import userController from './controllers/userController';
import { authenticateToken } from './utils/auth';
import milestoneController from './controllers/milestoneController';

const router = express.Router();

router.post('/register',  userController.register);
router.post('/login', userController.login);
router.get('/profile', authenticateToken, userController.getProfile);
router.patch('/profile', authenticateToken, userController.updateProfile);
router.post('/reset-password', authenticateToken, userController.resetPassword);

router.get('/tasks', authenticateToken, taskController.getTasks);
router.get('/tasks/:id', authenticateToken, taskController.getTaskById);
router.post('/tasks', authenticateToken, taskController.createTask);
router.patch('/tasks/:id', authenticateToken, taskController.updateTask);
router.delete('/tasks/:id', authenticateToken, taskController.deleteTask);
router.post('/tasks/:id/toggle', authenticateToken, taskController.toggleTaskCompletion);
router.get('/tasks/:id/stats', authenticateToken, taskController.getTaskStatistics);
router.post('/tasks/:id/reorder', authenticateToken, taskController.reorderTasks);

router.get('/tasks/:id/milestones', authenticateToken, milestoneController.getMilestones);
router.post('/tasks/:id/milestones', authenticateToken, milestoneController.createMilestone);
router.patch('/tasks/:id/milestones/:milestoneId', authenticateToken, milestoneController.updateMilestone);
router.delete('/tasks/:id/milestones/:milestoneId', authenticateToken, milestoneController.deleteMilestone);
router.post('/tasks/:id/milestones/:milestoneId/toggle', authenticateToken, milestoneController.toggleMilestoneCompletion);
router.post('/tasks/:id/milestones/:milestoneId/reorder', authenticateToken, milestoneController.reorderMilestones);

export default router;
