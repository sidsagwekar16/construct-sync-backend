// Jobs routes

import { Router } from 'express';
import { JobsController } from './jobs.controller';
import { validateRequest } from '../../middlewares/validate-request';
import { authenticateToken } from '../../middlewares/auth';
import {
  createJobSchema,
  updateJobSchema,
  listJobsQuerySchema,
  assignWorkersSchema,
  assignManagersSchema,
} from './jobs.validator';
import mediaRoutes from './media/media.routes';
import { DiaryController } from './diary/diary.controller';
import { createDiarySchema } from './diary/diary.types';

const router = Router();
const jobsController = new JobsController();
const diaryController = new DiaryController();

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
 *         description: Search term for job name, description, job number, or job type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, planned, in_progress, on_hold, completed, cancelled, archived]
 *         description: Filter by job status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent, critical]
 *         description: Filter by priority level
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by site ID
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by assigned user ID
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *         description: Filter by job type
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
 *     description: Get details of a specific job with populated relationships
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
 *               jobType:
 *                 type: string
 *                 maxLength: 100
 *                 example: Commercial Construction
 *               siteId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               status:
 *                 type: string
 *                 enum: [draft, planned, in_progress, on_hold, completed, cancelled, archived]
 *                 default: draft
 *                 example: draft
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent, critical]
 *                 example: medium
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-01-15T08:00:00Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-12-31T17:00:00Z
 *               completedDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-12-31T17:00:00Z
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *                 description: Job manager/supervisor user ID
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *               workerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of worker user IDs to assign to the job (optional - jobs can be created without workers)
 *                 example: ["123e4567-e89b-12d3-a456-426614174002", "123e4567-e89b-12d3-a456-426614174003"]
 *               managerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of project manager user IDs to assign to the job
 *                 example: ["123e4567-e89b-12d3-a456-426614174004"]
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
 *               jobType:
 *                 type: string
 *                 maxLength: 100
 *                 example: Residential Construction
 *               siteId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               status:
 *                 type: string
 *                 enum: [draft, planned, in_progress, on_hold, completed, cancelled, archived]
 *                 example: in_progress
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent, critical]
 *                 example: high
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-02-01T08:00:00Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-01-31T17:00:00Z
 *               completedDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-01-31T17:00:00Z
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *                 description: Job manager/supervisor user ID
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *               workerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of worker user IDs (replaces existing workers - can be empty to remove all workers)
 *                 example: ["123e4567-e89b-12d3-a456-426614174002"]
 *               managerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of project manager user IDs (replaces existing managers)
 *                 example: ["123e4567-e89b-12d3-a456-426614174004"]
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

/**
 * @swagger
 * /api/jobs/{id}/workers:
 *   post:
 *     tags:
 *       - Jobs
 *     summary: Assign workers to a job
 *     description: Assign workers to an existing job (replaces existing worker assignments)
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
 *             required:
 *               - workerIds
 *             properties:
 *               workerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 description: Array of worker user IDs to assign to the job
 *                 example: ["123e4567-e89b-12d3-a456-426614174002", "123e4567-e89b-12d3-a456-426614174003"]
 *     responses:
 *       200:
 *         description: Workers assigned successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/workers', validateRequest(assignWorkersSchema), jobsController.assignWorkers);

/**
 * @swagger
 * /api/jobs/{id}/managers:
 *   post:
 *     tags:
 *       - Jobs
 *     summary: Assign managers to a job
 *     description: Assign managers to an existing job (replaces existing manager assignments)
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
 *             required:
 *               - managerIds
 *             properties:
 *               managerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 description: Array of manager user IDs to assign to the job
 *                 example: ["123e4567-e89b-12d3-a456-426614174004"]
 *     responses:
 *       200:
 *         description: Managers assigned successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/managers', validateRequest(assignManagersSchema), jobsController.assignManagers);

/**
 * @swagger
 * /api/jobs/{id}/archive:
 *   patch:
 *     tags:
 *       - Jobs
 *     summary: Archive a job
 *     description: Change job status to archived
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
 *         description: Job archived successfully
 *       400:
 *         description: Job is already archived
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id/archive', jobsController.archiveJob);

/**
 * @swagger
 * /api/jobs/{id}/unarchive:
 *   patch:
 *     tags:
 *       - Jobs
 *     summary: Unarchive a job
 *     description: Change archived job status back to draft
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
 *         description: Job unarchived successfully
 *       400:
 *         description: Job is not archived
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id/unarchive', jobsController.unarchiveJob);

// Diary routes
/**
 * @swagger
 * /api/jobs/{jobId}/diary:
 *   post:
 *     tags:
 *       - Jobs
 *     summary: Create a diary entry for a job
 *     description: Add a new diary entry to a job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
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
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *                 example: Completed foundation work today. Weather conditions were good.
 *     responses:
 *       201:
 *         description: Diary entry created successfully
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:jobId/diary', validateRequest(createDiarySchema), diaryController.createDiaryEntry);

/**
 * @swagger
 * /api/jobs/{jobId}/diary:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: Get all diary entries for a job
 *     description: Retrieve all diary entries for a specific job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Diary entries retrieved successfully
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:jobId/diary', diaryController.getDiaryEntries);

/**
 * @swagger
 * /api/jobs/{jobId}/diary/{diaryId}:
 *   delete:
 *     tags:
 *       - Jobs
 *     summary: Delete a diary entry
 *     description: Delete a specific diary entry (only by the creator)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Job ID
 *       - in: path
 *         name: diaryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Diary entry ID
 *     responses:
 *       200:
 *         description: Diary entry deleted successfully
 *       404:
 *         description: Diary entry not found
 *       403:
 *         description: Forbidden - can only delete own entries
 *       401:
 *         description: Unauthorized
 */
router.delete('/:jobId/diary/:diaryId', diaryController.deleteDiaryEntry);

// Mount media routes under /:jobId/media
router.use('/:jobId/media', mediaRoutes);

export default router;
