import express from 'express';
import userController from './controllers/userController';
import taskController from './controllers/taskController';

const router = express.Router();

router.post('/register',  userController.register);
router.post('/login', userController.login);
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);

router.get('/tasks', taskController.getTasks);
router.get('/tasks/:id', taskController.getTaskById);
router.post('/tasks', taskController.createTask);
router.patch('/tasks/:id', taskController.updateTask);
router.delete('/tasks/:id', taskController.deleteTask);
router.post('/tasks/:id/toggle', taskController.toggleTaskCompletion);
router.get('/tasks/:id/habit-stats', taskController.getHabitStatistics);
router.get('/tasks/:id/habit-history', taskController.getHabitHistory);
router.get('/tasks/:id/daily-stats', taskController.getDailyTaskStatistics);
router.post('/tasks/:id/daily-reset', taskController.processDailyReset);
router.get('/tasks/:id/long-term-stats', taskController.getLongTermTaskStatistics);
router.get('/tasks/:id/milestones', taskController.getTaskMilestones);
router.post('/tasks/:id/milestones', taskController.createMilestone);
router.patch('/tasks/:id/milestones/:milestoneId', taskController.updateMilestone);
router.post('/tasks/:id/milestones/:milestoneId/toggle', taskController.toggleMilestoneCompletion);
router.delete('/tasks/:id/milestones/:milestoneId', taskController.deleteMilestone);
router.put('/tasks/:id/milestones/reorder', taskController.reorderMilestones);
router.get('/tasks/overdue', taskController.getOverdueTasks);
router.get('/tasks/upcoming', taskController.getUpcomingTasks);
router.patch('/tasks/:id/due-date', taskController.updateTaskDueDate);
router.get('/tasks/todo-completion-stats', taskController.getTodoCompletionStats);
router.post('/tasks/update-overdue', taskController.updateOverdueTasks);

export default router;
