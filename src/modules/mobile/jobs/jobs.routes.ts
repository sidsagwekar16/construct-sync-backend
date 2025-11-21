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
 * /mobile/jobs/{id}/tasks/{taskId}:
 *   patch:
 *     tags:
 *       - Mobile Jobs
 *     summary: Update task for job
 *     description: Update an existing task for a specific job
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
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Task updated successfully
 */
router.patch('/:id/tasks/:taskId', jobsController.updateTask);

/**
 * @swagger
 * /mobile/jobs/{id}/tasks/{taskId}:
 *   delete:
 *     tags:
 *       - Mobile Jobs
 *     summary: Delete task from job
 *     description: Delete a task from a specific job (soft delete)
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
 *     responses:
 *       200:
 *         description: Task deleted successfully
 */
router.delete('/:id/tasks/:taskId', jobsController.deleteTask);

/**
 * @swagger
 * /mobile/jobs/{id}/media/photos:
 *   post:
 *     tags:
 *       - Mobile Jobs
 *     summary: Upload photo for job
 *     description: Upload a photo to a job
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
 *               - photoUrl
 *             properties:
 *               photoUrl:
 *                 type: string
 *                 format: uri
 *               thumbnailUrl:
 *                 type: string
 *                 format: uri
 *               caption:
 *                 type: string
 *     responses:
 *       201:
 *         description: Photo uploaded successfully
 */
router.post('/:id/media/photos', jobsController.uploadPhoto);

/**
 * @swagger
 * /mobile/jobs/{id}/media/photos:
 *   get:
 *     tags:
 *       - Mobile Jobs
 *     summary: Get job photos
 *     description: Get all photos for a job
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
 *         description: Photos retrieved successfully
 */
router.get('/:id/media/photos', jobsController.getJobPhotos);

/**
 * @swagger
 * /mobile/jobs/{id}/media/photos/{photoId}:
 *   delete:
 *     tags:
 *       - Mobile Jobs
 *     summary: Delete job photo
 *     description: Delete a photo from a job
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
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Photo deleted successfully
 */
router.delete('/:id/media/photos/:photoId', jobsController.deletePhoto);

/**
 * @swagger
 * /mobile/jobs/{id}/media/documents:
 *   post:
 *     tags:
 *       - Mobile Jobs
 *     summary: Upload document for job
 *     description: Upload a document to a job
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
 *               - documentName
 *               - documentUrl
 *             properties:
 *               documentName:
 *                 type: string
 *               documentUrl:
 *                 type: string
 *                 format: uri
 *               documentType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 */
router.post('/:id/media/documents', jobsController.uploadDocument);

/**
 * @swagger
 * /mobile/jobs/{id}/media/documents:
 *   get:
 *     tags:
 *       - Mobile Jobs
 *     summary: Get job documents
 *     description: Get all documents for a job
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
 *         description: Documents retrieved successfully
 */
router.get('/:id/media/documents', jobsController.getJobDocuments);

/**
 * @swagger
 * /mobile/jobs/{id}/media/documents/{documentId}:
 *   delete:
 *     tags:
 *       - Mobile Jobs
 *     summary: Delete job document
 *     description: Delete a document from a job
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
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document deleted successfully
 */
router.delete('/:id/media/documents/:documentId', jobsController.deleteDocument);

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


