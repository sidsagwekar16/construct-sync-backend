// Mobile Jobs Routes

import { Router } from 'express';
import { MobileJobsController } from './jobs.controller';
import { authenticateToken } from '../../../middlewares/auth';

const router = Router();
const jobsController = new MobileJobsController();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /mobile/jobs:
 *   get:
 *     tags:
 *       - Mobile Jobs
 *     summary: List jobs with filters
 *     description: Get paginated list of jobs for mobile admin with filtering options
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, planned, in_progress, on_hold, completed, cancelled, archived]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent, critical]
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Jobs list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', jobsController.listJobs);

/**
 * @swagger
 * /mobile/jobs/{id}:
 *   get:
 *     tags:
 *       - Mobile Jobs
 *     summary: Get job details
 *     description: Get full details of a specific job
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
 *         description: Job details retrieved successfully
 *       404:
 *         description: Job not found
 */
router.get('/:id', jobsController.getJobById);

/**
 * @swagger
 * /mobile/jobs/{id}/tasks:
 *   get:
 *     tags:
 *       - Mobile Jobs
 *     summary: Get job tasks
 *     description: Get all tasks for a specific job
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
 *         description: Tasks retrieved successfully
 */
router.get('/:id/tasks', jobsController.getJobTasks);

/**
 * @swagger
 * /mobile/jobs/{id}/tasks:
 *   post:
 *     tags:
 *       - Mobile Jobs
 *     summary: Create task for job
 *     description: Create a new task for a specific job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled, blocked]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent, critical]
 *               type:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post('/:id/tasks', jobsController.createTask);

/**
 * @swagger
 * /mobile/jobs/{id}/workers:
 *   get:
 *     tags:
 *       - Mobile Jobs
 *     summary: Get job workers
 *     description: Get all workers assigned to a specific job
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
 *         description: Workers retrieved successfully
 */
router.get('/:id/workers', jobsController.getJobWorkers);

export default router;


