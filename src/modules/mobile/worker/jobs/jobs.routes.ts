// Worker Jobs Routes

import { Router } from 'express';
import { WorkerJobsController } from './jobs.controller';
import { authenticateToken } from '../../../../middlewares/auth';

const router = Router();
const jobsController = new WorkerJobsController();

// All routes require authentication (applied at worker router level)

/**
 * @swagger
 * /mobile/worker/jobs:
 *   get:
 *     tags:
 *       - Mobile Worker Jobs
 *     summary: List worker's assigned jobs
 *     description: Get all jobs assigned to the authenticated worker
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, planned, in_progress, on_hold, completed, cancelled, archived]
 *         description: Filter by job status
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by site ID
 *     responses:
 *       200:
 *         description: List of assigned jobs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - worker role required
 */
router.get('/', jobsController.listJobs);

/**
 * @swagger
 * /mobile/worker/jobs/{id}:
 *   get:
 *     tags:
 *       - Mobile Worker Jobs
 *     summary: Get job details
 *     description: Get details of a job (only if worker is assigned)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Job details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Job not found or not assigned
 */
router.get('/:id', jobsController.getJobById);

/**
 * @swagger
 * /mobile/worker/jobs/{id}/tasks:
 *   get:
 *     tags:
 *       - Mobile Worker Jobs
 *     summary: Get job tasks
 *     description: Get all tasks for a job (only if worker is assigned to job)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of tasks
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/:id/tasks', jobsController.getJobTasks);

/**
 * @swagger
 * /mobile/worker/jobs/{id}/tasks/{taskId}:
 *   patch:
 *     tags:
 *       - Mobile Worker Jobs
 *     summary: Update task status
 *     description: Update status of a task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled, blocked]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 */
router.patch('/:id/tasks/:taskId', jobsController.updateTaskStatus);

export default router;



