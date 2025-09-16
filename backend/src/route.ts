import express from 'express';
import taskController from './controllers/taskController';
import userController from './controllers/userController';
import { authenticateToken } from './utils/auth';

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
router.get('/tasks/:id/statistics', authenticateToken, taskController.getTaskStatistics);
router.post('/tasks/:id/reorder', authenticateToken, taskController.reorderTasks);
router.post('/tasks/:id/reorder-milestones', authenticateToken, taskController.reorderMilestones);

export default router;
