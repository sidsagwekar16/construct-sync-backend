// Tasks routes

import { Router } from 'express';
import { TasksController } from './tasks.controller';
import { validateRequest } from '../../middlewares/validate-request';
import { authenticateToken } from '../../middlewares/auth';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
  taskIdSchema,
} from './tasks.validator';

const router = Router();
const tasksController = new TasksController();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/tasks/statistics:
 *   get:
 *     tags:
 *       - Tasks
 *     summary: Get task statistics
 *     description: Get statistics of tasks by status for the authenticated user's company
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/statistics', tasksController.getTaskStatistics);

/**
 * @swagger
 * /api/tasks/by-user/{userId}:
 *   get:
 *     tags:
 *       - Tasks
 *     summary: Get tasks by user
 *     description: Get all tasks assigned to a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.get('/by-user/:userId', tasksController.getTasksByUser);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     tags:
 *       - Tasks
 *     summary: List all tasks
 *     description: Get a paginated list of tasks for the authenticated user's company
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for task title or description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled, blocked]
 *         description: Filter by task status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent, critical]
 *         description: Filter by priority level
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by assigned user ID
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by job ID
 *       - in: query
 *         name: jobUnitId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by job unit ID
 *     responses:
 *       200:
 *         description: List of tasks retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', tasksController.listTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     tags:
 *       - Tasks
 *     summary: Get task by ID
 *     description: Get details of a specific task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', tasksController.getTaskById);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     tags:
 *       - Tasks
 *     summary: Create a new task
 *     description: Create a new task for a job
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - title
 *             properties:
 *               jobId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174040
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: Install electrical wiring
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 example: Install all electrical wiring in the building
 *               jobUnitId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174050
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled, blocked]
 *                 default: pending
 *                 example: pending
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent, critical]
 *                 default: medium
 *                 example: high
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-12-31
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', validateRequest(createTaskSchema), tasksController.createTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     tags:
 *       - Tasks
 *     summary: Update a task
 *     description: Update task details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: Updated task title
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 example: Updated description
 *               jobUnitId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174050
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174002
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled, blocked]
 *                 example: in_progress
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent, critical]
 *                 example: urgent
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-12-15
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id', validateRequest(updateTaskSchema), tasksController.updateTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     tags:
 *       - Tasks
 *     summary: Delete a task
 *     description: Soft delete a task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', tasksController.deleteTask);

/**
 * @swagger
 * /api/tasks/{id}/restore:
 *   post:
 *     tags:
 *       - Tasks
 *     summary: Restore a deleted task
 *     description: Restore a soft-deleted task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task restored successfully
 *       404:
 *         description: Task not found or already active
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/restore', tasksController.restoreTask);

export default router;
