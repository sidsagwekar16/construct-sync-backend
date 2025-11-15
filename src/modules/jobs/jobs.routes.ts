// Jobs routes

import { Router } from 'express';
import { JobsController } from './jobs.controller';
import { validateRequest } from '../../middlewares/validate-request';
import { authenticateToken } from '../../middlewares/auth';
import {
  createJobSchema,
  updateJobSchema,
  listJobsQuerySchema,
  jobIdSchema,
} from './jobs.validator';

const router = Router();
const jobsController = new JobsController();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/jobs/statistics:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: Get job statistics
 *     description: Get statistics of jobs by status for the authenticated user's company
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/statistics', jobsController.getJobStatistics);

/**
 * @swagger
 * /api/jobs/by-site/{siteId}:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: Get jobs by site
 *     description: Get all jobs for a specific site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 *       404:
 *         description: Site not found
 *       401:
 *         description: Unauthorized
 */
router.get('/by-site/:siteId', jobsController.getJobsBySite);

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: List all jobs
 *     description: Get a paginated list of jobs for the authenticated user's company
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
 *         description: Search term for job name, description, or job number
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
 *         description: List of jobs retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', jobsController.listJobs);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: Get job by ID
 *     description: Get details of a specific job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job retrieved successfully
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', jobsController.getJobById);

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     tags:
 *       - Jobs
 *     summary: Create a new job
 *     description: Create a new job for the authenticated user's company
 *     security:
 *       - bearerAuth: []
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
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: New Construction Project
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 example: Building a new commercial complex
 *               jobNumber:
 *                 type: string
 *                 maxLength: 100
 *                 example: JOB-2024-001
 *               siteId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               status:
 *                 type: string
 *                 enum: [draft, planned, in_progress, on_hold, completed, cancelled, archived]
 *                 default: draft
 *                 example: draft
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-15
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-12-31
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', validateRequest(createJobSchema), jobsController.createJob);

/**
 * @swagger
 * /api/jobs/{id}:
 *   patch:
 *     tags:
 *       - Jobs
 *     summary: Update a job
 *     description: Update job details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: Updated Project Name
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 example: Updated description
 *               jobNumber:
 *                 type: string
 *                 maxLength: 100
 *                 example: JOB-2024-002
 *               siteId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               status:
 *                 type: string
 *                 enum: [draft, planned, in_progress, on_hold, completed, cancelled, archived]
 *                 example: in_progress
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-02-01
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: 2025-01-31
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id', validateRequest(updateJobSchema), jobsController.updateJob);

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     tags:
 *       - Jobs
 *     summary: Delete a job
 *     description: Soft delete a job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', jobsController.deleteJob);

export default router;
