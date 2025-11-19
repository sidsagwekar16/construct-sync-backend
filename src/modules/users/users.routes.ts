// Users routes

import express from 'express';
import { UsersController } from './users.controller';
import { authenticateToken } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validate-request';
import { createWorkerSchema, updateWorkerSchema } from './users.validator';

const router = express.Router();
const usersController = new UsersController();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/workers:
 *   get:
 *     tags:
 *       - Workers
 *     summary: List all workers
 *     description: Get a paginated list of workers for the company
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email, first name, or last name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [super_admin, company_admin, project_manager, site_supervisor, foreman, worker, subcontractor, viewer]
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of workers retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', usersController.listWorkers);

/**
 * @swagger
 * /api/workers/{id}:
 *   get:
 *     tags:
 *       - Workers
 *     summary: Get worker by ID
 *     description: Get details of a specific worker
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Worker ID
 *     responses:
 *       200:
 *         description: Worker retrieved successfully
 *       404:
 *         description: Worker not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', usersController.getWorkerById);

/**
 * @swagger
 * /api/workers:
 *   post:
 *     tags:
 *       - Workers
 *     summary: Create a new worker
 *     description: Add a new worker to the company
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [super_admin, company_admin, project_manager, site_supervisor, foreman, worker, subcontractor, viewer]
 *                 default: worker
 *     responses:
 *       201:
 *         description: Worker created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 *       401:
 *         description: Unauthorized
 */
router.post('/', validateRequest(createWorkerSchema), usersController.createWorker);

/**
 * @swagger
 * /api/workers/{id}:
 *   patch:
 *     tags:
 *       - Workers
 *     summary: Update a worker
 *     description: Update worker information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Worker ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [super_admin, company_admin, project_manager, site_supervisor, foreman, worker, subcontractor, viewer]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Worker updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Worker not found
 *       409:
 *         description: Email already exists
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id', validateRequest(updateWorkerSchema), usersController.updateWorker);

/**
 * @swagger
 * /api/workers/{id}:
 *   delete:
 *     tags:
 *       - Workers
 *     summary: Delete a worker
 *     description: Soft delete a worker
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Worker ID
 *     responses:
 *       200:
 *         description: Worker deleted successfully
 *       400:
 *         description: Cannot delete super admin users
 *       404:
 *         description: Worker not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', usersController.deleteWorker);

export default router;
